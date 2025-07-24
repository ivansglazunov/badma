import { ChessClientRequest, ChessServerResponse, ChessClientSide, ChessClientRole, ChessClient, ChessClientStatus } from './chess-client';
import Debug from './debug';
import { v4 as uuidv4 } from 'uuid';
import { GameState } from './local-chess-server';
import { ChessPerks } from './chess-perks';

const debug = Debug('chess-server');

export abstract class ChessServer<T extends ChessClient> {
    public _clients: Record<string, T> = {};
    public _ChessLogicClass: new (server: ChessServer<T>) => T;
    public _perks: ChessPerks;

    constructor(ChessLogicClass: new (server: ChessServer<T>) => T) {
        this._ChessLogicClass = ChessLogicClass;
        this._perks = new ChessPerks('server');
        debug('ChessServer initialized with ChessLogicClass:', ChessLogicClass.name);
    }

    protected async _create(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('_create processing', request);
        // User handling: Ensure user exists before proceeding
        if (request.userId && !(await this.__checkUser(request.userId))) {
             debug(`Error: User ${request.userId} does not exist for create operation.`);
            return { error: '!user' };
        }

        const gameId = request.gameId || uuidv4();
        if (await this.__gameExists(gameId)) {
            debug(`Error: Game ${gameId} already exists.`);
            return { error: `gameId=${gameId} already exists` };
        }

        // Create initial GameState (using the provided ChessClient class)
        const tempClientForDefaults = new this._ChessLogicClass(this);
        const newGameData = {
            userId: request.userId!,
            fen: tempClientForDefaults.fen,
            status: 'await' as ChessClientStatus, // Ensure type safety
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
        };
        await this.__createGame(gameId, newGameData);

        let joinId = request.joinId;
        let responseData: ChessServerResponse['data'];

        if (request.side !== undefined && request.role !== undefined) {
            joinId = joinId || uuidv4();
            // Registering the client uses __registerClient (creates ChessClient)
            const clientForJoin = await this.__registerClient(request.clientId);
            clientForJoin.userId = request.userId!;
            clientForJoin.gameId = gameId;
            clientForJoin.joinId = joinId;

            // Initial client state comes from the new game data
            await this.__updateClientState(clientForJoin, {
                fen: newGameData.fen,
                status: newGameData.status,
                updatedAt: newGameData.updatedAt,
                createdAt: newGameData.createdAt,
            });

            // Simulate the join action for this specific client
            // This uses ChessClient.asyncJoin -> ChessClient._join -> server.join
            const clientJoinResponse = await clientForJoin.asyncJoin(request.side, request.role);

            if (clientJoinResponse.error || !clientJoinResponse.data) {
                 debug('Error simulating initial join via client.asyncJoin:', clientJoinResponse.error);
                 return { error: clientJoinResponse.error || 'Initial client join simulation failed' };
            }

            await this.__addJoinRecord({
                gameId: gameId, userId: request.userId!, side: request.side, role: request.role,
                joinId: joinId,
                clientId: clientForJoin.clientId,
                createdAt: request.createdAt, updatedAt: request.updatedAt,
            });

             const gamePlayerJoins = await this.__getGamePlayerJoins(gameId);
             if (gamePlayerJoins.length >= 2) {
                 await this.__updateGame(gameId, { status: 'ready', updatedAt: Date.now() });
                  debug(`Server Game ${gameId} status updated to 'ready'.`);
             }

             // Prepare response data from the successful join simulation result
             responseData = { ...clientJoinResponse.data, gameId: gameId, joinId: joinId };

        } else {
            // <<< REVERTING TO ORIGINAL LOGIC >>>
            // Try to get the game state from DB after creation
            const createdGame = await this.__getGame(gameId); // Should exist now
            if (!createdGame) { // Add a check in case __getGame fails unexpectedly
                debug(`Error: Game ${gameId} not found immediately after creation.`);
                // Return error but include gameId and clientId if possible
                return { 
                    error: 'Internal server error: Game creation failed or fetch failed', 
                    data: { // Provide minimal data for context
                        clientId: request.clientId, 
                        gameId: gameId, 
                        updatedAt: request.updatedAt, 
                        createdAt: request.createdAt,
                        fen: newGameData.fen, // Fallback to pre-insert data
                        status: newGameData.status // Fallback to pre-insert data
                    }
                 };
            }
            // Construct response from the fetched game data
            responseData = {
                 clientId: request.clientId,
                 gameId: gameId,
                 joinId: undefined,
                 side: undefined,
                 role: undefined,
                 fen: createdGame.fen, // Use fetched fen
                 status: createdGame.status, // Use fetched status
                 updatedAt: createdGame.updatedAt, // Use fetched updatedAt
                 createdAt: createdGame.createdAt, // Use fetched createdAt
             };
             debug('_create response using fetched game data (no initial join)');
        }

        debug('_create successful response data:', responseData);
        return { data: responseData };
    }

    protected async _join(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('_join processing', request);
        if (!(await this.__checkUser(request.userId))) return { error: '!user' };

        const gameId = request.gameId!;
        const game = await this.__getGame(gameId);
        if (!game) {
             debug(`Error: Game ${gameId} not found.`);
            return { error: '!game' };
        }

        // Server-side validation checks
        const existingPlayerJoin = await this.__findActivePlayerJoinByUser(gameId, request.userId!);
        if (existingPlayerJoin) { return { error: 'User already active as player (based on latest record)' }; }
        const existingSideJoin = await this.__findActivePlayerJoinBySide(gameId, request.side!);
        if (request.side !== 0 && existingSideJoin) { return { error: `Side ${request.side} already taken by an active player (based on latest record)` }; }

        // Create a NEW ChessClient instance for THIS join
        const clientForThisJoin = await this.__registerClient(request.clientId);
        clientForThisJoin.userId = request.userId!;
        clientForThisJoin.gameId = gameId;
        await this.__updateClientState(clientForThisJoin, {
             fen: game.fen,
             status: game.status,
             createdAt: game.createdAt,
             updatedAt: game.updatedAt,
        });

        // Allow non-players to join started games, but not players
        if (request.role === ChessClientRole.Player && game.status !== 'await') {
            debug(`Error: Player cannot join game ${gameId} because status is ${game.status}`);
            return { error: `Game not awaiting players (status: ${game.status})` };
        }

        // Call ChessClient's asyncJoin to simulate action
        clientForThisJoin.joinId = request.joinId!;
        const clientJoinResponse = await clientForThisJoin.asyncJoin(request.side!, request.role!); // Assume side/role are valid

        if (clientJoinResponse.error || !clientJoinResponse.data) {
             debug('Error from internal client.asyncJoin simulation:', clientJoinResponse.error);
             return { error: clientJoinResponse.error || 'Internal client join simulation failed' };
        }
        const joinId = request.joinId!; // USE the joinId from the original request

        // Add the server-side join record
        await this.__addJoinRecord({
            gameId: gameId, userId: request.userId!, side: request.side!, role: request.role!,
            joinId: joinId, clientId: clientForThisJoin.clientId,
            createdAt: request.createdAt, updatedAt: request.updatedAt,
        });

        // Recalculate server game status
        const gamePlayerJoins = await this.__getGamePlayerJoins(gameId);
        let serverUpdatedAt = game.updatedAt; // Capture current time
        let serverStatus = game.status;     // Capture current status

        if (game.status === 'await' && gamePlayerJoins.length >= 2) {
            serverStatus = 'ready';
            serverUpdatedAt = Date.now();
            await this.__updateGame(gameId, { status: serverStatus, updatedAt: serverUpdatedAt });
            debug(`Server Game ${gameId} status updated to 'ready' at ${serverUpdatedAt}.`);
        } else if (game.status === 'await' && gamePlayerJoins.length === 1) {
            debug(`Server Game ${gameId} still awaiting second player.`);
        } else {
            debug(`Server Game ${gameId} status remains ${game.status}. Players: ${gamePlayerJoins.length}`);
        }

        // --- NEW: Fetch updated game state AFTER potential update ---
        const finalGame = await this.__getGame(gameId);
        if (!finalGame) {
            // This shouldn't happen, but handle defensively
            debug(`Error: Game ${gameId} not found after attempting update.`);
            return { error: 'Internal server error: Game state lost after update' };
        }
        // --- END NEW ---

        // Construct response using the FINAL server state
        const responseData: ChessServerResponse['data'] = {
            clientId: request.clientId,
            gameId: gameId,
            joinId: joinId,
            side: request.side!,
            role: request.role!,
            fen: finalGame.fen,         // <<< Use finalGame.fen
            status: finalGame.status,   // <<< Use finalGame.status
            updatedAt: finalGame.updatedAt, // <<< Use finalGame.updatedAt
            createdAt: finalGame.createdAt, // <<< Use finalGame.createdAt
        };

         debug(`_join RETURNING responseData with status: ${responseData.status}`);
         return { data: responseData };
    }

    protected async _leave(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('_leave processing', request);
        if (!(await this.__checkUser(request.userId))) return { error: '!user' };

        const gameId = request.gameId!;
        const joinIdToLeave = request.joinId!; // This is the joinId of the connection being left

        const game = await this.__getGame(gameId);
        if (!game) {
             debug(`Error: Game ${gameId} not found.`);
            return { error: '!game' };
        }

        // Find the specific join record with the client reference
        const leavingJoin = await this.__findJoinByJoinIdAndClient(gameId, request.userId!, joinIdToLeave);

        if (!leavingJoin || !leavingJoin.clientId) {
            debug(`Error: Specific *active* Join record ${joinIdToLeave} (with client) not found for user ${request.userId} in game ${gameId}.`);
            return { error: 'Join record not found for this leave operation' };
        }
        const clientIdToLeave = leavingJoin.clientId;

        // Find the associated ChessClient instance
        const clientToLeave = await this.__defineClient(clientIdToLeave);
        if (!clientToLeave) {
            debug(`Error: Found join record ${joinIdToLeave} pointing to client ${clientIdToLeave}, but client not registered.`);
            return { error: 'Internal server error: Inconsistent state, leaving client not found' };
        }
        if (clientToLeave.clientId !== request.clientId) {
             debug(`Warning: Client ID mismatch during leave. Request clientId: ${request.clientId}, Found client's clientId: ${clientToLeave.clientId} via joinId ${joinIdToLeave}. Proceeding with found client.`);
        }

        // Simulate client leave action using ChessClient.asyncLeave
        const clientLeaveResponse = await clientToLeave.asyncLeave(leavingJoin.side);

        if (clientLeaveResponse.error || !clientLeaveResponse.data) {
             debug('Error from internal client.asyncLeave simulation:', clientLeaveResponse.error);
             // Proceed with server logic even if simulation fails?
        }

        // Create NEW JoinRecord for the LEAVE event
        const leaveEventJoinId = uuidv4();
        const currentTime = Date.now();
        await this.__addJoinRecord({
            gameId: gameId, userId: request.userId!, side: request.side!, role: request.role!,
            joinId: leaveEventJoinId,
            // clientId is undefined for leave events
            createdAt: currentTime, updatedAt: currentTime,
        });

        // Clear the clientId reference from the original join record
        await this.__clearJoinClientReference(leavingJoin.joinId);
        debug(`Cleared clientId reference from original join record ${leavingJoin.joinId}`);

        // Update Server Game State
        let serverStatus = game.status;
        let serverFen = game.fen; // FEN should not change on leave
        const serverUpdatedAt = currentTime;

        // Player leaving determines status change
        if (leavingJoin.role === ChessClientRole.Player && leavingJoin.side !== 0) {
            if (game.status === 'continue' || game.status === 'ready') {
                 serverStatus = leavingJoin.side === 1 ? 'white_surrender' : 'black_surrender';
                 debug(`Player ${request.userId} (side ${leavingJoin.side}) left/surrendered game ${gameId}. Server status changed to ${serverStatus}`);
            } else {
                 debug(`Player ${request.userId} (side ${leavingJoin.side}) left game ${gameId} from state ${game.status}. Status unchanged.`);
            }
        } else {
            debug(`Non-player ${request.userId} (role ${leavingJoin.role}) left game ${gameId}. Leave JoinRecord added.`);
        }

        // Apply updates to the game state
        await this.__updateGame(gameId, { status: serverStatus, updatedAt: serverUpdatedAt });

        debug(`Server game ${gameId} state updated. Status: ${serverStatus}`);

        // Prepare Response
         const responseData: ChessServerResponse['data'] = {
            clientId: request.clientId,
            gameId: gameId,
            joinId: leaveEventJoinId,
            side: request.side, // State AFTER leaving
            role: request.role, // State AFTER leaving
            fen: serverFen, // FEN before leaving
            status: serverStatus,
            updatedAt: serverUpdatedAt,
            createdAt: game.createdAt,
         };

         debug('_leave successful response data:', responseData);
        return { data: responseData };
    }


    // <<< MODIFIED _move >>>
    protected async _move(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('_move processing (using BASE asyncMove logic via .call)', request);
        if (!(await this.__checkUser(request.userId))) return { error: '!user' };

        const gameId = request.gameId!;
        const game = await this.__getGame(gameId);
        if (!game) { return { error: '!game' }; }

        if (game.status !== 'ready' && game.status !== 'continue') {
            return { error: `Game not playable (status: ${game.status})` };
        }

        // Find the player's specific active join record
        const joinRecord = await this.__findJoinByJoinIdAndClient(gameId, request.userId!, request.joinId!);

        if (!joinRecord || !joinRecord.clientId) {
            debug(`Error: Active Player join record not found for joinId ${request.joinId} in game ${gameId}`);
            return { error: 'Active player join record not found for this move' };
        }
        const clientIdToMove = joinRecord.clientId;

        // Validate request details against the found join record
        if (joinRecord.side !== request.side || joinRecord.role !== request.role) {
            return { error: 'Request side/role mismatch with server state' };
        }
        if (joinRecord.role !== ChessClientRole.Player) {
            return { error: 'Only players can move' };
        }

        // Get the ChessClient instance
        const clientToMove = await this.__defineClient(clientIdToMove); // Returns ChessClient
        if (!clientToMove) {
            debug(`Error: Client instance not found for clientId ${clientIdToMove} referenced by join record ${joinRecord.joinId}`);
            return { error: 'Internal server error: Client instance for move not found' };
        }
        if (clientToMove.clientId !== request.clientId) {
            debug(`Warning: Client ID mismatch during move. Request clientId: ${request.clientId}, Found client's clientId: ${clientToMove.clientId} via joinId ${request.joinId}. Proceeding with found client.`);
            // Proceeding anyway, as we found the correct client via joinId
        }

        // Sync client state FROM CURRENT SERVER game state BEFORE simulating move
        clientToMove.clientId = request.clientId; // Ensure client has IDs
        clientToMove.userId = request.userId!; // <<< ADD non-null assertion here
        clientToMove.gameId = gameId;
        clientToMove.joinId = request.joinId;
        clientToMove.side = request.side!;
        clientToMove.role = request.role!;
        clientToMove.fen = game.fen; // <<< Load CURRENT FEN from server
        clientToMove.status = game.status; // <<< Load CURRENT status from server

        // <<< Call BASE asyncMove logic on the ChessClient instance >>>
        // This avoids the ChessClient._move override that calls back to the server
        const clientMoveResponse = await ChessClient.prototype.asyncMove.call(clientToMove, request.move!);

        // --- Server trusts the BASE client simulation result ---
        if (clientMoveResponse.error || !clientMoveResponse.data) {
            debug(`Move failed via BASE client simulation logic (${joinRecord.joinId}): ${clientMoveResponse.error}`);
            // Even on error from base client logic, return current *server* state
            const responseDataOnError: ChessServerResponse['data'] = {
                clientId: request.clientId, gameId: gameId, joinId: request.joinId,
                side: request.side, role: request.role,
                fen: game.fen, // Current server FEN
                status: game.status, // Current server status
                updatedAt: game.updatedAt, createdAt: game.createdAt,
            };
            // Return the error reported by the BASE client's simulation logic
            return { error: clientMoveResponse.error || 'Base client move logic failed', data: responseDataOnError };
        }

        // --- MOVE SIMULATION SUCCEEDED (according to base client logic) ---
        // Update the SHARED Server GameState FROM the BASE client simulation result
        let updatedFen = clientMoveResponse.data.fen;     // FEN from client after its internal move
        const updatedStatus = clientMoveResponse.data.status; // Status from client after its internal move
        const updatedTime = Date.now();                   // Use server time for update

        // Process move through perks on server side using two-phase approach
        let perkBeforeData: Map<string, Record<string, any>> | null = null;
        try {
            // Phase 1: Handle move BEFORE (using original FEN before move)
            perkBeforeData = await this._perks.handleMoveBefore(
                gameId,
                request.clientId,
                request.move!,
                game.fen // Use original FEN before move
            );
            if (perkBeforeData === null) {
                debug('_move: move cancelled by perks in BEFORE phase');
                return { error: 'Move cancelled by perks' };
            }
            debug('_move: perks BEFORE phase completed, data:', Array.from(perkBeforeData.entries()));
            
            // Phase 2: Handle move AFTER (using FEN after move simulation)
            const perkModifiedFen = await this._perks.handleMoveAfter(
                gameId,
                request.clientId,
                request.move!,
                updatedFen, // FEN after client simulation
                perkBeforeData
            );
            if (perkModifiedFen === null) {
                debug('_move: move cancelled by perks in AFTER phase');
                return { error: 'Move cancelled by perks' };
            }
            if (perkModifiedFen !== updatedFen) {
                debug('_move: perks AFTER phase modified FEN:', perkModifiedFen);
                updatedFen = perkModifiedFen;
            }
        } catch (error: any) {
            debug('_move: perks error:', error);
            // Continue with original FEN if perks fail
        }

        await this.__updateGame(gameId, { fen: updatedFen, status: updatedStatus, updatedAt: updatedTime });
        debug(`Server game state updated based on BASE client simulation logic (${joinRecord.joinId}). New FEN: ${updatedFen}, New Status: ${updatedStatus}`);

        // Return data reflecting the state AFTER the update based on client sim
        const responseData: ChessServerResponse['data'] = {
            clientId: request.clientId,
            gameId: gameId,
            joinId: request.joinId,
            side: request.side,
            role: request.role,
            fen: updatedFen,     // Send the FEN resulting from client sim
            status: updatedStatus, // Send the status resulting from client sim
            updatedAt: updatedTime, // Send the server update time
            createdAt: game.createdAt,
        };
         debug('_move successful response data (based on base client sim):', responseData);
        return { data: responseData };
    }

    // --- Sync Implementation (remains the same) --- //
    protected async _sync(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('_sync processing for clientId:', request.clientId);
        if (!(await this.__checkUser(request.userId))) return { error: '!user' };

        const gameId = request.gameId!;
        const game = await this.__getGame(gameId);
        if (!game) {
            debug(`Error: Game ${gameId} not found for sync.`);
            return { error: '!game' };
        }

        // Find the latest active join record for the requesting client
        const activeJoin = await this.__findActiveJoinByClientId(gameId, request.clientId);

        let clientSide: ChessClientSide = 0;
        let clientRole: ChessClientRole = ChessClientRole.Anonymous;
        let clientJoinId: string | undefined = undefined;

        if (activeJoin) {
            debug(`Active join found for client ${request.clientId}: joinId=${activeJoin.joinId}, side=${activeJoin.side}, role=${activeJoin.role}`);
            clientSide = activeJoin.side;
            clientRole = activeJoin.role;
            clientJoinId = activeJoin.joinId;
        } else {
            debug(`No active join found for client ${request.clientId} in game ${gameId}. Returning spectator state.`);
        }

        // Construct the response with current game state and client-specific details
        const responseData: ChessServerResponse['data'] = {
            clientId: request.clientId, gameId: gameId,
            fen: game.fen, status: game.status,
            updatedAt: game.updatedAt, createdAt: game.createdAt,
            side: clientSide, role: clientRole, joinId: clientJoinId,
        };

        debug('_sync successful response data:', responseData);
        return { data: responseData };
    }

    // --- Public API methods with validation ---

    async create(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('API: create request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        // gameId is optional
        // joinId is optional
        // side is optional
        // role is optional
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };
        if (typeof request.side == 'number' && request.side != 1 && request.side != 2) return { error: 'side must be a number (1, or 2)'};


        try {
            const response = await this._create({ ...request, side: request.side || 1 });
            debug('API: create response', response);
            return response;
        } catch (error: any) {
            debug('API: create error', error);
            return { error: error.message || 'An unexpected error occurred during create' };
        }
    }

    async join(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('API: join request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        if (!request.gameId) return { error: 'gameId is required for join' };
        // joinId is optional (server might assign)
        if (request.side === undefined) return { error: 'side is required for join' };
        if (request.role === undefined) return { error: 'role is required for join' };
        if (typeof request.side !== 'number' || ![0, 1, 2].includes(request.side)) return { error: 'side must be a number (0, 1, or 2)' };
        if (typeof request.role !== 'number') return { error: 'role must be a number (ChessClientRole)'};
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };

        try {
            const response = await this._join({ ...request, joinId: request.joinId || uuidv4() });
            debug('API: join response', response);
            return response;
        } catch (error: any) {
            debug('API: join error', error);
            return { error: error.message || 'An unexpected error occurred during join' };
        }
    }

    async leave(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('API: leave request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        if (!request.gameId) return { error: 'gameId is required for leave' };
        if (!request.joinId) return { error: 'joinId is required for leave' }; // Need to identify which player is leaving
        if (request.side === undefined) return { error: 'side is required for leave (should reflect state *after* leaving, usually 0)' };
        if (request.role === undefined) return { error: 'role is required for leave (should reflect state *after* leaving, usually Anonymous)' };
        if (typeof request.side !== 'number' || ![0, 1, 2].includes(request.side)) return { error: 'side must be a number (0, 1, or 2)' };
        if (typeof request.role !== 'number') return { error: 'role must be a number (ChessClientRole)'};
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };

        try {
            const response = await this._leave(request);
            debug('API: leave response', response);
            return response;
        } catch (error: any) {
            debug('API: leave error', error);
            return { error: error.message || 'An unexpected error occurred during leave' };
        }
    }

    async move(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('API: move request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        if (!request.gameId) return { error: 'gameId is required for move' };
        if (!request.joinId) return { error: 'joinId is required for move' }; // Need to know who is moving
        if (request.side === undefined) return { error: 'side is required for move' };
        if (request.role === undefined) return { error: 'role is required for move' };
        if (!request.move) return { error: 'move data {from, to, promotion?} is required for move' };
        if (typeof request.move.from !== 'string' || !request.move.from) return { error: 'move.from (string) is required' };
        if (typeof request.move.to !== 'string' || !request.move.to) return { error: 'move.to (string) is required' };
        if (request.move.promotion !== undefined && request.move.promotion !== null && typeof request.move.promotion !== 'string') return { error: 'move.promotion must be a string or null/undefined' };
        if (typeof request.side !== 'number' || ![1, 2].includes(request.side)) return { error: 'side must be 1 or 2 for move' }; // Can't be 0
        if (typeof request.role !== 'number') return { error: 'role must be a number (ChessClientRole)'};
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };


        try {
            const response = await this._move(request);
            debug('API: move response', response);
            return response;
        } catch (error: any) {
            debug('API: move error', error);
            return { error: error.message || 'An unexpected error occurred during move' };
        }
    }

    async sync(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('API: sync request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        if (!request.gameId) return { error: 'gameId is required for sync' };
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };
        // Note: joinId is not required for sync request itself

        try {
            const response = await this._sync(request);
            debug('API: sync response', response);
            return response;
        } catch (error: any) {
            debug('API: sync error', error);
            return { error: error.message || 'An unexpected error occurred during sync' };
        }
    }

    protected async _perk(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('_perk processing', request);
        if (!request.clientId) return { error: '!clientId' };
        if (!request.userId) return { error: '!userId' };
        if (!request.gameId) return { error: '!gameId' };
        if (!request.perk) return { error: '!perk' };

        // Get the client
        const client = await this.__registerClient(request.clientId);
        if (!client) return { error: 'Client not found' };

        // Apply perk on server side
        try {
            await this._perks.applyPerk(
                request.perk.type,
                request.gameId,
                request.clientId,
                request.perk.data || {}
            );
        } catch (error: any) {
            debug('_perk: perk application failed', error);
            return { error: `Perk application failed: ${error.message}` };
        }

        // Get current game state
        const gameData = await this.__getGame(request.gameId);
        if (!gameData) return { error: 'Game not found' };

        return {
            data: {
                clientId: request.clientId,
                gameId: request.gameId,
                joinId: client.joinId,
                side: client.side,
                role: client.role,
                fen: gameData.fen,
                status: gameData.status,
                updatedAt: gameData.updatedAt,
                createdAt: gameData.createdAt,
            }
        };
    }

    async perk(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
        debug('API: perk request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        if (!request.gameId) return { error: 'gameId is required' };
        if (!request.perk) return { error: 'perk is required' };
        if (!request.perk.type) return { error: 'perk.type is required' };
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };

        try {
            const response = await this._perk(request);
            debug('API: perk response', response);
            return response;
        } catch (error: any) {
            debug('API: perk error', error);
            return { error: error.message || 'An unexpected error occurred during perk application' };
        }
    }

    // --- Abstract methods for database/state interaction (must be implemented by subclasses) ---

    

    public async __registerClient(clientId: string): Promise<T> { // Return type depends on implementation (e.g., ChessInstance)
        if (this._clients[clientId]) {
            debug(`Client ${clientId} already registered. Returning existing instance.`);
            return this._clients[clientId];
        }
        // <<< Instantiate using the provided ChessClient constructor >>>
        const newClient = new this._ChessLogicClass(this);
        newClient.clientId = clientId;
        this._clients[clientId] = newClient;
        debug(`Registered new ChessClient ${clientId}`);
        return newClient;
    }

    public async __defineClient(clientId: string): Promise<T | undefined> {
        const client = this._clients[clientId];
        if (!client) {
            debug(`__defineClient Info: Client with ID ${clientId} not found in registered clients. Attempting to register...`);
            // If client doesn't exist, register it (which creates and stores it)
            return await this.__registerClient(clientId);
        }
        return client; // Returns ChessClient | undefined (or the newly registered one)
    }

    public abstract __checkUser(userId: string | undefined): Promise<boolean>;
    public abstract __addUser(): Promise<string>;
    public abstract __gameExists(gameId: string): Promise<boolean>;
    public abstract __getGame(gameId: string): Promise<any | undefined>; // Return type GameState or similar
    public abstract __createGame(gameId: string, gameData: any): Promise<void>; // gameData type GameState or similar
    public abstract __updateGame(gameId: string, updates: Partial<any>): Promise<void>; // updates type GameState or similar
    public abstract __addJoinRecord(recordData: Omit<any, 'joinCounterId'>): Promise<any>; // recordData/return JoinRecord or similar

     // client/state types based on implementation
    public async __updateClientState(client: T, state: Partial<Pick<GameState, 'fen' | 'status' | 'createdAt' | 'updatedAt'>>): Promise<void> { // Already public async
        if (state.fen !== undefined) client.fen = state.fen;
        if (state.status !== undefined) client.status = state.status;
        if (state.createdAt !== undefined) client.createdAt = state.createdAt;
        if (state.updatedAt !== undefined) client.updatedAt = state.updatedAt;
        debug(`Updated client ${client.clientId} state:`, { fen: client.fen, status: client.status, createdAt: client.createdAt, updatedAt: client.updatedAt });
    }

    public abstract __getAllJoinsForGame(gameId: string): Promise<any[]>; // Return JoinRecord[] or similar
    public abstract __getGameJoins(gameId: string, includeClientRef?: boolean): Promise<(any | Omit<any, 'clientId'>)[]>; // Return JoinRecord[] or similar
    public abstract __findJoinByJoinIdAndClient(gameId: string, userId: string, joinId: string): Promise<any | undefined>; // Return JoinRecord or similar
    public abstract __findActivePlayerJoinByUser(gameId: string, userId: string): Promise<any | undefined>; // Return JoinRecord or similar
    public abstract __findActivePlayerJoinBySide(gameId: string, side: ChessClientSide): Promise<any | undefined>; // Return JoinRecord or similar
    public abstract __getGamePlayerJoins(gameId: string): Promise<any[]>; // Return JoinRecord[] or similar
    public abstract __clearJoinClientReference(joinId: string): Promise<void>;

    // --- Abstract methods for testing/inspection (must be implemented by subclasses) ---
    public abstract __getGameState(gameId: string): Promise<any | undefined>; // Return type GameState or similar
    public async __reset(): Promise<void> {
        this._clients = {};
        debug('ChessServer state reset.');
    };
    public abstract __findActiveJoinByClientId(gameId: string, clientId: string): Promise<any | undefined>; // Return JoinRecord or similar
}
