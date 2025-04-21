import { v4 as uuidv4 } from 'uuid';
import { ChessClient, ChessClientRequest, ChessClientRole, ChessClientSide, ChessClientStatus, ChessServerResponse } from './chess-client.js';
import { ChessServer } from './chess-server.js';
import Debug from './debug.js';
// No Chess import needed here

const debug = Debug('badma:local-chess-server');

// Define the specific type for the client instance used by this server
type ChessInstance = ChessClient; // <<< REVERTED to ChessClient

interface GameState {
    hostUserId: string;
    fen: string;
    status: ChessClientStatus;
    createdAt: number;
    updatedAt: number;
}

interface JoinRecord {
    gameId: string;
    userId: string;
    side: ChessClientSide;
    role: ChessClientRole;
    joinId: string; // Unique ID for the specific join/leave event instance
    joinCounterId: number; // Sequential ID for ordering events
    clientId?: string; // Reference to the registered client ID
    createdAt: number;
    updatedAt: number;
}

// <<< REVERTED generic type to ChessClient >>>
export class LocalChessServer extends ChessServer<ChessClient> {
    private _games: Record<string, GameState> = {};
    private _users: Record<string, boolean> = {};
    private _joins: JoinRecord[] = [];
    // <<< REVERTED client map type to ChessClient >>>
    private _clients: Record<string, ChessInstance> = {};
    private _joinCounter: number = 0; // Counter for sequential join IDs

    // <<< REVERTED Constructor signature to ChessClient >>>
    constructor(ChessClass: typeof ChessClient) {
        super(ChessClass as any);
        debug('LocalChessServer initialized (managing ChessClient)');
    }

    // --- Methods like _create, _join, _leave, _sync remain as they were before the BASE client attempt --- //
    // ... (Keep _create, _join, _leave, _sync implementations that use client simulation where appropriate,
    //      as they don't suffer from the same recursion as _move) ...
    // Example: _create still uses clientForJoin.asyncJoin
    // Example: _join still uses clientForThisJoin.asyncJoin
    // Example: _leave still uses clientToLeave.asyncLeave

    protected async _create(request: ChessClientRequest): Promise<ChessServerResponse> {
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
            hostUserId: request.userId!,
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
                 await this.__deleteGame(gameId); // Clean up game if initial join fails
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
            // Directly use server game state if no initial join
            const createdGame = await this.__getGame(gameId); // Should exist now
            if (!createdGame) { // Add a check in case __getGame fails unexpectedly
                debug(`Error: Game ${gameId} not found immediately after creation.`);
                return { error: 'Internal server error: Game creation failed silently' };
            }
            responseData = {
                 clientId: request.clientId,
                 gameId: gameId,
                 joinId: undefined,
                 side: undefined,
                 role: undefined,
                 fen: createdGame.fen,
                 status: createdGame.status,
                 updatedAt: createdGame.updatedAt,
                 createdAt: createdGame.createdAt,
             };
        }

        debug('_create successful response data:', responseData);
        return { data: responseData };
    }

    protected async _join(request: ChessClientRequest): Promise<ChessServerResponse> {
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
             fen: game.fen, status: game.status,
             createdAt: game.createdAt, updatedAt: game.updatedAt,
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

        // Construct response using server state
        const responseData: ChessServerResponse['data'] = {
            clientId: request.clientId,
            gameId: gameId,
            joinId: joinId,
            side: request.side!,
            role: request.role!,
            fen: game.fen, // Use current server FEN
            status: serverStatus, // Use updated server status
            updatedAt: serverUpdatedAt, // Use updated server timestamp
            createdAt: game.createdAt,
        };

         debug(`_join RETURNING responseData with status: ${responseData.status} (Server game status is: ${serverStatus})`);
         return { data: responseData };
    }

    protected async _leave(request: ChessClientRequest): Promise<ChessServerResponse> {
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
        const clientToLeave = await this.__getClient(clientIdToLeave);
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
    protected async _move(request: ChessClientRequest): Promise<ChessServerResponse> {
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
        const clientToMove = await this.__getClient(clientIdToMove); // Returns ChessClient
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
        const updatedFen = clientMoveResponse.data.fen;     // FEN from client after its internal move
        const updatedStatus = clientMoveResponse.data.status; // Status from client after its internal move
        const updatedTime = Date.now();                   // Use server time for update

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
    protected override async _sync(request: ChessClientRequest): Promise<ChessServerResponse> {
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

    // --- Helper methods --- //

    // <<< REVERTED return type to ChessClient >>>
    public async __registerClient(clientId: string): Promise<ChessInstance> {
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

    // <<< REVERTED return type to ChessClient >>>
    public async __getClient(clientId: string): Promise<ChessInstance | undefined> {
        const client = this._clients[clientId];
        if (!client) {
            debug(`__getClient Error: Client with ID ${clientId} not found in registered clients.`);
        }
        return client; // Returns ChessClient | undefined
    }

    // <<< ADDING public async back >>>
    public async __checkUser(userId: string | undefined): Promise<boolean> {
        if (!userId || !this._users[userId]) {
             debug(`Error: User check failed for userId: ${userId}`);
            return false;
        }
        return true;
    }

    // <<< ADDING public async back >>>
    public async __addUser(userId: string): Promise<void> {
        this._users[userId] = true;
        debug(`User ${userId} added to users list.`);
    }

    // <<< ADDING public async back >>>
    public async __gameExists(gameId: string): Promise<boolean> {
        return !!this._games[gameId];
    }

    // <<< ADDING public async back >>>
    public async __getGame(gameId: string): Promise<GameState | undefined> {
        return this._games[gameId];
    }

    // <<< ADDING public async back >>>
    public async __createGame(gameId: string, gameData: GameState): Promise<void> {
        this._games[gameId] = gameData;
        debug(`Game ${gameId} created. State:`, {
            hostUserId: gameData.hostUserId, fen: gameData.fen, status: gameData.status,
            createdAt: gameData.createdAt, updatedAt: gameData.updatedAt,
        });
    }

     // <<< ADDING public async back >>>
    public async __deleteGame(gameId: string): Promise<void> {
        delete this._games[gameId];
        debug(`Game ${gameId} deleted.`);
    }

    // <<< ADDING public async back >>>
    public async __updateGame(gameId: string, updates: Partial<GameState>): Promise<void> {
        const game = this._games[gameId];
        if (game) {
            this._games[gameId] = { ...game, ...updates };
            debug(`Game ${gameId} updated:`, updates);
        } else {
            debug(`Error: Cannot update non-existent game ${gameId}`);
        }
    }

    // <<< ADDING public async back >>>
    public async __addJoinRecord(recordData: Omit<JoinRecord, 'joinCounterId'>): Promise<JoinRecord> {
        const joinCounterId = ++this._joinCounter;
        const newRecord: JoinRecord = {
            ...recordData,
            joinCounterId: joinCounterId,
        };
        this._joins.push(newRecord);
        debug(`Added join record (CounterID: ${joinCounterId}):`, {
             gameId: newRecord.gameId, userId: newRecord.userId, side: newRecord.side, role: newRecord.role,
             joinId: newRecord.joinId, clientId: newRecord.clientId, createdAt: newRecord.createdAt, updatedAt: newRecord.updatedAt
        });
        return newRecord;
    }

    // <<< This now updates the state of a base ChessClient instance >>> // <<< Incorrect comment, it updates ChessClient
    public async __updateClientState(client: ChessInstance, state: Partial<Pick<GameState, 'fen' | 'status' | 'createdAt' | 'updatedAt'>>): Promise<void> { // Already public async
        if (state.fen !== undefined) client.fen = state.fen;
        if (state.status !== undefined) client.status = state.status;
        if (state.createdAt !== undefined) client.createdAt = state.createdAt;
        if (state.updatedAt !== undefined) client.updatedAt = state.updatedAt;
        debug(`Updated client ${client.clientId} state:`, { fen: client.fen, status: client.status, createdAt: client.createdAt, updatedAt: client.updatedAt });
    }

    // <<< ADDING public async back >>>
    public async __getAllJoinsForGame(gameId: string): Promise<JoinRecord[]> {
        return this._joins.filter(j => j.gameId === gameId);
    }

    // <<< ADDING public async back >>>
    public async __findJoinByJoinIdAndClient(gameId: string, userId: string, joinId: string): Promise<JoinRecord | undefined> {
         return this._joins.find(j => j.joinId === joinId && j.gameId === gameId && j.userId === userId && j.clientId);
     }

    // <<< ADDING public async back >>>
    public async __findActivePlayerJoinByUser(gameId: string, userId: string): Promise<JoinRecord | undefined> {
        const userJoins = this._joins.filter(j => j.gameId === gameId && j.userId === userId && j.role === ChessClientRole.Player && j.clientId);
        return userJoins.sort((a, b) => b.joinCounterId - a.joinCounterId)[0]; // Get latest
    }

    // <<< ADDING public async back >>>
    public async __findActivePlayerJoinBySide(gameId: string, side: ChessClientSide): Promise<JoinRecord | undefined> {
        const sideJoins = this._joins.filter(j => j.gameId === gameId && j.side === side && j.role === ChessClientRole.Player && j.clientId);
        return sideJoins.sort((a, b) => b.joinCounterId - a.joinCounterId)[0]; // Get latest
    }

    // <<< ADDING public async back >>>
    public async __getGamePlayerJoins(gameId: string): Promise<JoinRecord[]> {
        const allGameJoins = this._joins.filter(j => j.gameId === gameId && j.clientId);
        const latestJoinsByUser: Record<string, JoinRecord> = {};
        allGameJoins.sort((a, b) => a.joinCounterId - b.joinCounterId).forEach(j => {
            latestJoinsByUser[j.userId] = j;
        });
        return Object.values(latestJoinsByUser).filter(j => j.role === ChessClientRole.Player);
    }

    // <<< ADDING public async back >>>
    public async __clearJoinClientReference(joinId: string): Promise<void> {
        const joinIndex = this._joins.findIndex(j => j.joinId === joinId && j.clientId);
        if (joinIndex !== -1) {
            this._joins[joinIndex].clientId = undefined;
            debug(`Cleared clientId for join record ${joinId}`);
        } else {
            debug(`Could not find active join record ${joinId} to clear client reference.`);
        }
    }

     // --- Public methods for testing or inspection --- //
     // <<< ADDING public async back >>>
     public async __getGameState(gameId: string): Promise<GameState | undefined> {
         return this._games[gameId];
     }
     // <<< ADDING public async back >>>
     public async __getUserJoins(userId: string): Promise<Omit<JoinRecord, 'clientId'>[]> {
          const joins = this._joins.filter(j => j.userId === userId);
          return joins.map(({ clientId, ...rest }) => rest);
     }
     // <<< ADDING public async back >>>
     public async __getGameJoins(gameId: string, includeClientRef: boolean = false): Promise<(JoinRecord | Omit<JoinRecord, 'clientId'>)[]> {
         const joins = await this.__getAllJoinsForGame(gameId);
         return includeClientRef ? joins : joins.map(({ clientId, ...rest }) => rest);
     }
     // <<< ADDING public async back >>>
     public async __reset(): Promise<void> {
         this._games = {};
         this._users = {};
         this._joins = [];
         this._clients = {};
         this._joinCounter = 0;
         debug('LocalChessServer state reset.');
     }

    // <<< ADDING public async back >>>
    public async __findActiveJoinByClientId(gameId: string, clientId: string): Promise<JoinRecord | undefined> {
        const clientJoins = this._joins.filter(j => j.gameId === gameId && j.clientId === clientId);
        return clientJoins.sort((a, b) => b.joinCounterId - a.joinCounterId)[0];
    }
}
