import { v4 as uuidv4 } from 'uuid';
import { ChessClient, ChessClientRequest, ChessClientRole, ChessClientSide, ChessClientStatus, ChessServerResponse } from './chess-client.js';
import { ChessServer } from './chess-server.js';
import Debug from './debug.js';
// Do not import Chess here, it's handled by the constructor injection now

const debug = Debug('badma:local-chess-server');

type ChessInstance = InstanceType<typeof ChessClient>;

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

export class LocalChessServer extends ChessServer {
    private _games: Record<string, GameState> = {};
    private _users: Record<string, boolean> = {};
    private _joins: JoinRecord[] = [];
    private _clients: Record<string, ChessInstance> = {}; // Store registered clients by clientId
    private _joinCounter: number = 0; // Counter for sequential join IDs

    constructor(ChessLogicClass: typeof ChessClient = ChessClient) {
        super(ChessLogicClass as any);
        debug('LocalChessServer initialized');
    }

    // --- Implementation of abstract methods --- //
    // --- THESE METHODS SHOULD ONLY CALL __ HELPERS FOR STATE ACCESS --- //

    protected async _create(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('_create processing', request);
        // User handling (simulated registration)
        if (request.userId && !this.__checkUser(request.userId)) {
            this.__addUser(request.userId);
        }

        const gameId = request.gameId || uuidv4();
        if (this.__gameExists(gameId)) {
            debug(`Error: Game ${gameId} already exists.`);
            return { error: `gameId=${gameId} already exists` };
        }

        // Create initial GameState (without client)
        const tempClientForDefaults = new this._ChessLogicClass();
        const newGameData = {
            hostUserId: request.userId!,
            fen: tempClientForDefaults.fen,
            status: 'await' as ChessClientStatus, // Ensure type safety
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
        };
        this.__createGame(gameId, newGameData);

        let joinId = request.joinId;
        let responseData: ChessServerResponse['data'];

        if (request.side !== undefined && request.role !== undefined) {
            joinId = joinId || uuidv4();
            const clientForJoin = this.__registerClient(request.clientId);
            clientForJoin.userId = request.userId!;
            clientForJoin.gameId = gameId;

            // Initial client state comes from the new game data
            this.__updateClientState(clientForJoin, {
                fen: newGameData.fen,
                status: newGameData.status,
                updatedAt: newGameData.updatedAt,
                createdAt: newGameData.createdAt,
            });

            // Simulate the join action for this specific client
            const clientJoinResponse = await clientForJoin.asyncJoin(request.side, request.role);

            if (clientJoinResponse.error || !clientJoinResponse.data) {
                 debug('Error simulating initial join via client.asyncJoin:', clientJoinResponse.error);
                 this.__deleteGame(gameId); // Clean up game if initial join fails
                 return { error: clientJoinResponse.error || 'Initial client join simulation failed' };
            }
            joinId = clientJoinResponse.data.joinId!;

            this.__addJoinRecord({
                gameId: gameId, userId: request.userId!, side: request.side, role: request.role,
                joinId: joinId, clientId: clientForJoin.clientId,
                createdAt: request.createdAt, updatedAt: request.updatedAt,
            });

             const gamePlayerJoins = this.__getGamePlayerJoins(gameId);
             if (gamePlayerJoins.length >= 2) {
                 this.__updateGame(gameId, { status: 'ready', updatedAt: Date.now() });
                  debug(`Server Game ${gameId} status updated to 'ready'.`);
             }

             // Prepare response data from the successful join simulation result
             responseData = { ...clientJoinResponse.data, gameId: gameId };

        } else {
            // Directly use server game state if no initial join
            const createdGame = this.__getGame(gameId)!; // Should exist now
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
        if (!this.__checkUser(request.userId)) return { error: '!user' };

        const gameId = request.gameId!;
        const game = this.__getGame(gameId);
        if (!game) {
             debug(`Error: Game ${gameId} not found.`);
            return { error: '!game' };
        }

        // Server-side validation checks
        const existingPlayerJoin = this.__findActivePlayerJoinByUser(gameId, request.userId!);
        if (existingPlayerJoin) { return { error: 'User already active as player (based on latest record)' }; }
        const existingSideJoin = this.__findActivePlayerJoinBySide(gameId, request.side!);
        if (request.side !== 0 && existingSideJoin) { return { error: `Side ${request.side} already taken by an active player (based on latest record)` }; }

        // Create a NEW client instance for THIS join
        const clientForThisJoin = this.__registerClient(request.clientId);
        clientForThisJoin.userId = request.userId!;
        clientForThisJoin.gameId = gameId;
        this.__updateClientState(clientForThisJoin, {
             fen: game.fen, status: game.status,
             createdAt: game.createdAt, updatedAt: game.updatedAt,
        });

        // Allow non-players to join started games, but not players
        if (request.role === ChessClientRole.Player && game.status !== 'await') {
            debug(`Error: Player cannot join game ${gameId} because status is ${game.status}`);
            return { error: `Game not awaiting players (status: ${game.status})` };
        }

        // Call client's asyncJoin to simulate action
        const clientJoinResponse = await clientForThisJoin.asyncJoin(request.side!, request.role!); // Assume side/role are valid

        if (clientJoinResponse.error || !clientJoinResponse.data) {
             debug('Error from internal client.asyncJoin simulation:', clientJoinResponse.error);
             return { error: clientJoinResponse.error || 'Internal client join simulation failed' };
        }
        const joinId = clientJoinResponse.data.joinId!;

        // Add the server-side join record
        this.__addJoinRecord({
            gameId: gameId, userId: request.userId!, side: request.side!, role: request.role!,
            joinId: joinId, clientId: clientForThisJoin.clientId,
            createdAt: request.createdAt, updatedAt: request.updatedAt,
        });

        // Recalculate server game status
        const gamePlayerJoins = this.__getGamePlayerJoins(gameId);
        let serverUpdatedAt = game.updatedAt; // Capture current time
        let serverStatus = game.status;     // Capture current status

        if (game.status === 'await' && gamePlayerJoins.length >= 2) {
            serverStatus = 'ready';
            serverUpdatedAt = Date.now();
            this.__updateGame(gameId, { status: serverStatus, updatedAt: serverUpdatedAt });
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
         console.log('[Server _join] Returning Response Data:', JSON.stringify(responseData));
         return { data: responseData };
    }

    protected async _leave(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('_leave processing', request);
        if (!this.__checkUser(request.userId)) return { error: '!user' };

        const gameId = request.gameId!;
        const joinIdToLeave = request.joinId!; // This is the joinId of the connection being left

        const game = this.__getGame(gameId);
        if (!game) {
             debug(`Error: Game ${gameId} not found.`);
            return { error: '!game' };
        }

        // Find the specific join record with the client reference
        const leavingJoin = this.__findJoinByJoinIdAndClient(gameId, request.userId!, joinIdToLeave);

        if (!leavingJoin || !leavingJoin.clientId) {
            debug(`Error: Specific *active* Join record ${joinIdToLeave} (with client) not found for user ${request.userId} in game ${gameId}.`);
            return { error: 'Join record not found for this leave operation' };
        }
        const clientIdToLeave = leavingJoin.clientId;

        // Find the associated client instance
        const clientToLeave = this.__getClient(clientIdToLeave);
        if (!clientToLeave) {
            debug(`Error: Found join record ${joinIdToLeave} pointing to client ${clientIdToLeave}, but client not registered.`);
            return { error: 'Internal server error: Inconsistent state, leaving client not found' };
        }
        if (clientToLeave.clientId !== request.clientId) {
             debug(`Warning: Client ID mismatch during leave. Request clientId: ${request.clientId}, Found client's clientId: ${clientToLeave.clientId} via joinId ${joinIdToLeave}. Proceeding with found client.`);
        }

        // Simulate client leave action
        const clientLeaveResponse = await clientToLeave.asyncLeave(leavingJoin.side);

        if (clientLeaveResponse.error || !clientLeaveResponse.data) {
             debug('Error from internal client.asyncLeave simulation:', clientLeaveResponse.error);
             return { error: clientLeaveResponse.error || 'Internal client leave simulation failed' };
        }

        // Create NEW JoinRecord for the LEAVE event
        const leaveEventJoinId = uuidv4();
        const currentTime = Date.now();
        this.__addJoinRecord({
            gameId: gameId, userId: request.userId!, side: request.side!, role: request.role!,
            joinId: leaveEventJoinId,
            // clientId is undefined for leave events
            createdAt: currentTime, updatedAt: currentTime,
        });

        // Clear the clientId reference from the original join record
        this.__clearJoinClientReference(leavingJoin.joinId);
        debug(`Cleared clientId reference from original join record ${leavingJoin.joinId}`);

        // Update Server Game State
        let serverStatus = game.status;
        let serverFen = game.fen;
        const serverUpdatedAt = currentTime;

        if (leavingJoin.role === ChessClientRole.Player) {
            if (game.status === 'continue') {
                 serverStatus = leavingJoin.side === 1 ? 'white_surrender' : 'black_surrender';
                 debug(`Player ${request.userId} (side ${leavingJoin.side}) left/surrendered game ${gameId}. Server status changed to ${serverStatus}`);
            } else if (game.status === 'ready') {
                 serverStatus = 'await';
                 debug(`Player ${request.userId} (side ${leavingJoin.side}) left before game start. Server status reverted to ${serverStatus}`);
            } else {
                 debug(`Player ${request.userId} (side ${leavingJoin.side}) left game ${gameId} from state ${game.status}. Status unchanged.`);
            }
        } else {
            debug(`Non-player ${request.userId} (role ${leavingJoin.role}) left game ${gameId}. Leave JoinRecord added.`);
        }

        // Sync FEN from client simulation? Leave shouldn't normally change FEN.
        serverFen = clientLeaveResponse.data.fen; // Use FEN from client response

        // Apply updates to the game state
        this.__updateGame(gameId, { fen: serverFen, status: serverStatus, updatedAt: serverUpdatedAt });

        debug(`Server game ${gameId} state updated. Status: ${serverStatus}`);

        // Prepare Response
         const responseData: ChessServerResponse['data'] = {
            clientId: request.clientId,
            gameId: gameId,
            joinId: leaveEventJoinId,
            side: request.side,
            role: request.role,
            fen: serverFen,
            status: serverStatus,
            updatedAt: serverUpdatedAt,
            createdAt: game.createdAt,
         };

         debug('_leave successful response data:', responseData);
        return { data: responseData };
    }

    protected async _move(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('_move processing', request);
        if (!this.__checkUser(request.userId)) return { error: '!user' };

        const gameId = request.gameId!;
        const game = this.__getGame(gameId);
        if (!game) { return { error: '!game' }; }

        if (game.status !== 'ready' && game.status !== 'continue') {
            return { error: `Game not playable (status: ${game.status})` };
        }

        // Find the player's specific active join record
        const joinRecord = this.__findJoinByJoinIdAndClient(gameId, request.userId!, request.joinId!);

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

        // Get the client instance
        const clientToMove = this.__getClient(clientIdToMove);
        if (!clientToMove) {
            debug(`Error: Client instance not found for clientId ${clientIdToMove} referenced by join record ${joinRecord.joinId}`);
            return { error: 'Internal server error: Client instance for move not found' };
        }
        if (clientToMove.clientId !== request.clientId) {
            debug(`Warning: Client ID mismatch during move. Request clientId: ${request.clientId}, Found client's clientId: ${clientToMove.clientId} via joinId ${request.joinId}. Proceeding with found client.`);
        }

        // Sync client state FROM game state BEFORE simulating move
        clientToMove.clientId = request.clientId;
        clientToMove.gameId = gameId;
        clientToMove.joinId = request.joinId;
        clientToMove.side = request.side!;
        clientToMove.role = request.role!;
        clientToMove.fen = game.fen;
        clientToMove.status = game.status;

        // Simulate move on the client
        const clientMoveResponse = await clientToMove.asyncMove(request.move!); // Assume move is valid

        if (clientMoveResponse.error || !clientMoveResponse.data) {
            debug(`Move failed via client simulation (${joinRecord.joinId}): ${clientMoveResponse.error}`);
            const responseDataOnError: ChessServerResponse['data'] = {
                clientId: request.clientId, gameId: gameId, joinId: request.joinId,
                side: request.side, role: request.role,
                fen: game.fen, status: game.status,
                updatedAt: game.updatedAt, createdAt: game.createdAt,
            };
            return { error: clientMoveResponse.error || 'Internal client move failed', data: responseDataOnError };
        }

        // Update the SHARED GameState FROM the successful client simulation result
        const updatedFen = clientMoveResponse.data.fen;
        const updatedStatus = clientMoveResponse.data.status;
        const updatedTime = clientMoveResponse.data.updatedAt;

        this.__updateGame(gameId, { fen: updatedFen, status: updatedStatus, updatedAt: updatedTime });
        debug(`SHARED Game state synced after successful client move simulation (${joinRecord.joinId}). New FEN: ${updatedFen}, New Status: ${updatedStatus}`);

        // Return data from client simulation result
        const responseData: ChessServerResponse['data'] = {
            ...clientMoveResponse.data,
            gameId: gameId,
            status: updatedStatus, // Use status from client simulation
            updatedAt: updatedTime // Use time from client simulation
        };
         debug('_move successful response data:', responseData);
        return { data: responseData };
    }

    // --- Helper methods for internal state management --- //
    // --- THESE METHODS ARE ALLOWED TO ACCESS _games, _users, _joins, _clients --- //

    private __registerClient(clientId: string): ChessInstance {
        if (this._clients[clientId]) {
            debug(`Client ${clientId} already registered. Returning existing instance.`);
            return this._clients[clientId];
        }
        const newClient = new this._ChessLogicClass();
        newClient.clientId = clientId;
        this._clients[clientId] = newClient;
        debug(`Registered new client ${clientId}`);
        return newClient;
    }

    private __getClient(clientId: string): ChessInstance | undefined {
        const client = this._clients[clientId];
        if (!client) {
            debug(`__getClient Error: Client with ID ${clientId} not found in registered clients.`);
        }
        return client;
    }

    private __checkUser(userId: string | undefined): boolean {
        if (!userId || !this._users[userId]) {
             debug(`Error: User check failed for userId: ${userId}`);
            return false;
        }
        return true;
    }

    private __addUser(userId: string): void {
        this._users[userId] = true;
        debug(`User ${userId} added to users list.`);
    }

    private __gameExists(gameId: string): boolean {
        return !!this._games[gameId];
    }

    private __getGame(gameId: string): GameState | undefined {
        return this._games[gameId];
    }

    private __createGame(gameId: string, gameData: GameState): void {
        this._games[gameId] = gameData;
        debug(`Game ${gameId} created. State:`, {
            hostUserId: gameData.hostUserId, fen: gameData.fen, status: gameData.status,
            createdAt: gameData.createdAt, updatedAt: gameData.updatedAt,
        });
    }

    private __deleteGame(gameId: string): void {
        delete this._games[gameId];
        // Optionally remove associated joins? Or keep for history?
        // this._joins = this._joins.filter(j => j.gameId !== gameId);
        debug(`Game ${gameId} deleted.`);
    }

    private __updateGame(gameId: string, updates: Partial<GameState>): void {
        const game = this._games[gameId];
        if (game) {
            this._games[gameId] = { ...game, ...updates };
            debug(`Game ${gameId} updated:`, updates);
        } else {
            debug(`Error: Cannot update non-existent game ${gameId}`);
        }
    }

    private __addJoinRecord(recordData: Omit<JoinRecord, 'joinCounterId'>): JoinRecord {
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

    private __updateClientState(client: ChessInstance, state: Partial<Pick<GameState, 'fen' | 'status' | 'createdAt' | 'updatedAt'>>) {
        if (state.fen !== undefined) client.fen = state.fen;
        if (state.status !== undefined) client.status = state.status;
        if (state.createdAt !== undefined) client.createdAt = state.createdAt;
        if (state.updatedAt !== undefined) client.updatedAt = state.updatedAt;
        debug(`Updated client ${client.clientId} state:`, { fen: client.fen, status: client.status, createdAt: client.createdAt, updatedAt: client.updatedAt });
    }

    private __getAllJoinsForGame(gameId: string): JoinRecord[] {
        return this._joins.filter(j => j.gameId === gameId);
    }

    // More specific join finding helpers
    private __findJoinByJoinIdAndClient(gameId: string, userId: string, joinId: string): JoinRecord | undefined {
         // Finds a join record for a specific user in a game by its unique joinId, requiring clientId to be present
         return this._joins.find(j => j.joinId === joinId && j.gameId === gameId && j.userId === userId && j.clientId);
     }

    private __findActivePlayerJoinByUser(gameId: string, userId: string): JoinRecord | undefined {
        // Finds the latest active player join for a user in a game (assumes append-only)
        const userJoins = this._joins.filter(j => j.gameId === gameId && j.userId === userId && j.role === ChessClientRole.Player && j.clientId);
        return userJoins.sort((a, b) => b.joinCounterId - a.joinCounterId)[0]; // Get latest
    }

    private __findActivePlayerJoinBySide(gameId: string, side: ChessClientSide): JoinRecord | undefined {
        // Finds the latest active player join for a specific side in a game (assumes append-only)
        const sideJoins = this._joins.filter(j => j.gameId === gameId && j.side === side && j.role === ChessClientRole.Player && j.clientId);
        return sideJoins.sort((a, b) => b.joinCounterId - a.joinCounterId)[0]; // Get latest
    }

    private __getGamePlayerJoins(gameId: string): JoinRecord[] {
        // Gets all current *active* player joins for a game
        // Find latest join for each user who is a player and has a client attached
        const allGameJoins = this._joins.filter(j => j.gameId === gameId && j.clientId);
        const latestJoinsByUser: Record<string, JoinRecord> = {};
        allGameJoins.sort((a, b) => a.joinCounterId - b.joinCounterId).forEach(j => {
            latestJoinsByUser[j.userId] = j; // Keep overwriting with later joins
        });
        // Filter down to only players
        return Object.values(latestJoinsByUser).filter(j => j.role === ChessClientRole.Player);
    }

    private __clearJoinClientReference(joinId: string): void {
        const joinIndex = this._joins.findIndex(j => j.joinId === joinId && j.clientId);
        if (joinIndex !== -1) {
            this._joins[joinIndex].clientId = undefined;
            debug(`Cleared clientId for join record ${joinId}`);
        } else {
            debug(`Could not find active join record ${joinId} to clear client reference.`);
        }
    }

     // --- Public methods for testing or inspection --- //
     // --- THESE ARE ALLOWED TO ACCESS STATE FOR TEST PURPOSES --- //
     public getGameState(gameId: string): GameState | undefined {
         return this._games[gameId];
     }
     public getUserJoins(userId: string): Omit<JoinRecord, 'clientId'>[] {
          const joins = this._joins.filter(j => j.userId === userId);
          return joins.map(({ clientId, ...rest }) => rest);
     }
     public getGameJoins(gameId: string, includeClientRef: boolean = false): (JoinRecord | Omit<JoinRecord, 'clientId'>)[] {
         const joins = this.__getAllJoinsForGame(gameId);
         return includeClientRef ? joins : joins.map(({ clientId, ...rest }) => rest);
     }
     public reset(): void {
         this._games = {};
         this._users = {};
         this._joins = [];
         this._clients = {};
         this._joinCounter = 0;
         debug('LocalChessServer state reset.');
     }
}
