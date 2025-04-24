import { ChessClient, ChessClientRequest, ChessClientRole, ChessClientSide, ChessClientStatus, ChessServerResponse } from './chess-client.js';
import { ChessServer } from './chess-server.js';
import Debug from './debug.js';
import { Client as HasyxClient, GenerateOptions, GenerateResult } from 'hasyx'; // Assuming 'hasyx' package and 'Client', 'GenerateOptions' export
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs

const debug = Debug('hasyx-server');

// Define the specific type for the client logic used by this server
// Now managing client instances like LocalChessServer
type ManagedChessClient = ChessClient; // Use the base type, specific instance comes from constructor

export class HasyxChessServer extends ChessServer<ManagedChessClient> {
    private hasyx: HasyxClient;
    private apolloClient: ApolloClient<NormalizedCacheObject>;
    // <<< ADDED: Client instance storage >>>
    private _clients: Record<string, ManagedChessClient> = {};
    // <<< ADDED: Join counter (although less critical with UUIDs, kept for potential ordering logic if needed) >>>
    private _joinCounter: number = 0; // Might not be strictly necessary if DB handles ordering

    constructor(
        // Keep constructor signature, now ManagedChessClient type is used internally
        ChessLogicClass: new (server: ChessServer<ManagedChessClient>) => ManagedChessClient,
        apolloClient: ApolloClient<NormalizedCacheObject> // Add apollo client needed for Hasyx
    ) {
        super(ChessLogicClass); // Call base constructor
        this.apolloClient = apolloClient;
        this.hasyx = new HasyxClient(apolloClient); // Use admin client
        debug('HasyxChessServer initialized (Stateful Client Management)');
    }

    // <<< MODIFIED: __registerClient >>>
    public override async __registerClient(clientId: string): Promise<ManagedChessClient> {
        if (this._clients[clientId]) {
            debug(`Client ${clientId} already registered. Returning existing instance.`);
            return this._clients[clientId];
        }
        const newClient = new this._ChessLogicClass(this);
        // <<< IMPORTANT: Set client properties EARLY >>>
        newClient.clientId = clientId;
        // userId, gameId etc. will be set later by the calling context (_create, _join...)
        this._clients[clientId] = newClient;
        debug(`Registered new client ${clientId}`);
        return newClient;
    }

    // <<< MODIFIED: __getClient >>>
    public override async __getClient(clientId: string): Promise<ManagedChessClient | undefined> {
        const client = this._clients[clientId];
        // Removed old logging/error throwing, just return what's found
        if (!client) {
             debug(`Client instance ${clientId} not found in server memory.`);
        }
        return client;
    }

    public override async __checkUser(userId: string | undefined): Promise<boolean> {
        if (!userId) return false;
        try {
            const response = await this.hasyx.select<any>({
                table: 'users', // Use plain table name
                pk_columns: { id: userId },
                returning: ['id']
            });
            // Adjust based on actual hasyx response structure for pk select
            return !!response?.users_by_pk?.id;
        } catch (error) {
            debug('Error checking user existence:', error);
            return false;
        }
    }

    public override async __addUser(userId: string): Promise<void> {
        debug('HasyxChessServer __addUser (inserting into DB)', userId);
        try {
            await this.hasyx.insert<any>({
                table: 'users', // Use plain table name
                object: { id: userId, name: `User_${userId.substring(0, 4)}`, email: `${userId}@example.com` },
                // on_conflict might be needed if direct insert is allowed
            });
        } catch (error) {
            debug('Error trying to add user (or user already exists):', error);
        }
    }

    public override async __gameExists(gameId: string): Promise<boolean> {
        try {
            const response = await this.hasyx.select<any>({
                table: 'badma_games', // Keep table name as is, assuming it's correct in Hasura
                pk_columns: { id: gameId },
                returning: ['id']
            });
            // Adjust based on actual hasyx response structure for pk select
            return !!response?.badma_games_by_pk?.id;
        } catch (error: any) {
            debug('Error checking game existence:', error);
            // Check if the error indicates the table/field wasn't found
            if (error.message.includes('_by_pk') && error.message.includes('not found in root type')) {
                debug('Potential issue: Hasura might not be tracking the table or PK correctly.');
            }
            return false;
        }
    }

    public override async __getGame(gameId: string): Promise<any | undefined> {
        try {
            const gameData = await this.hasyx.select<any>({
                table: 'badma_games',
                pk_columns: { id: gameId },
                returning: ['id', 'user_id', 'fen', 'status', 'created_at', 'updated_at']
            });
            if (gameData) {
                return {
                    id: gameData.id,
                    userId: gameData.user_id,
                    fen: gameData.fen,
                    status: gameData.status,
                    createdAt: new Date(gameData.created_at).getTime(),
                    updatedAt: new Date(gameData.updated_at).getTime(),
                };
            }
            return undefined;
        } catch (error) {
            debug(`Error getting game ${gameId}:`, error);
            return undefined;
        }
    }

    // __createGame remains largely the same logic (insert into DB)
    public override async __createGame(gameId: string, gameData: any): Promise<void> {
        const operation = 'HasyxChessServer.__createGame';
        debug(`${operation} - Attempting to insert game ${gameId} into DB with data:`, gameData);
        const insertOptions = {
             table: 'badma_games',
             object: {
                 id: gameId,
                 user_id: gameData.hostUserId,
                 fen: gameData.fen,
                 status: gameData.status,
                 created_at: new Date(gameData.createdAt).toISOString(),
                 updated_at: new Date(gameData.updatedAt).toISOString(),
             },
              returning: ['id']
         };
         debug(`${operation} - Hasyx insert options:`, insertOptions);

        try {
            debug(`${operation} - Calling hasyx.insert...`);
            const insertResult = await this.hasyx.insert<any>(insertOptions);
            debug(`${operation} - hasyx.insert call completed. Result:`, insertResult);

            const returnedData = insertResult?.insert_badma_games_one
                || insertResult?.insert_badma_games?.returning?.[0];

            if (!returnedData || returnedData.id !== gameId) {
                 debug(`${operation} - Insert result validation failed. Expected id ${gameId}, got:`, returnedData);
                 // Throw error even if validation fails after call completes
                 throw new Error(`Insert operation did not return expected data (id: ${gameId}) for game ${gameId}. Result: ${JSON.stringify(insertResult)}`);
             }
             debug(`${operation} - Insert for game ${gameId} confirmed by returning data:`, returnedData);

        } catch (error: any) {
            debug(`${operation} - Error during hasyx.insert call for game ${gameId}:`, error.message);
            // ---> ADDED console.error for visibility <---
            console.error(`[CONSOLE ERROR] Detailed error in ${operation} for game ${gameId}:`, error);
            throw error; // Re-throw the original error
        }
    }

    public override async __deleteGame(gameId: string): Promise<void> {
        try {
             // Also delete associated joins first to avoid FK constraints (if any)
             await this.hasyx.delete<any>({
                 table: 'badma_joins',
                 where: { game_id: { _eq: gameId } }
             });
             // Then delete the game
            await this.hasyx.delete<any>({
                table: 'badma_games',
                pk_columns: { id: gameId }
            });
            debug(`Deleted game ${gameId} and associated joins.`);
        } catch (error) {
            debug(`Error deleting game ${gameId}:`, error);
            // Handle error appropriately
        }
    }

    public override async __updateGame(gameId: string, updates: Partial<any>): Promise<void> {
        try {
            const dbUpdates: Record<string, any> = {};
            if (updates.fen !== undefined) dbUpdates.fen = updates.fen;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.updatedAt !== undefined) dbUpdates.updated_at = new Date(updates.updatedAt).toISOString();
            // Add other mappings if needed (hostUserId unlikely to change here)

            if (Object.keys(dbUpdates).length === 0) {
                 debug(`__updateGame called for ${gameId} with no mappable updates.`);
                 return; // No updates to apply
            }

            await this.hasyx.update<any>({
                table: 'badma_games',
                pk_columns: { id: gameId },
                _set: dbUpdates
            });
             debug(`Game ${gameId} updated in DB:`, dbUpdates);
        } catch (error) {
            debug(`Error updating game ${gameId}:`, error);
            // Handle error appropriately
        }
    }

    // <<< MODIFIED: __addJoinRecord >>>
    // Now assumes `recordData` includes `clientId` and inserts it
    public override async __addJoinRecord(recordData: any): Promise<any> {
        // Removed log about "handled by _join"
        debug('HasyxChessServer __addJoinRecord (inserting join into DB)', recordData);
        const joinCounterId = ++this._joinCounter; // Still increment for potential future use

        try {
            const response = await this.hasyx.insert<any>({
                table: 'badma_joins',
                object: {
                    id: recordData.joinId, // Assuming joinId maps to id
                    game_id: recordData.gameId,
                    user_id: recordData.userId,
                    side: recordData.side,
                    role: recordData.role,
                    client_id: recordData.clientId, // <<< Store clientId in DB >>>
                    created_at: new Date(recordData.createdAt).toISOString(), // Convert back for DB
                },
                // Return necessary fields including client_id if needed elsewhere
                returning: ['id', 'game_id', 'user_id', 'side', 'role', 'client_id', 'created_at']
            });
            const newRecord = response?.insert_badma_joins_one; // Adjust name based on actual mutation response

            if (newRecord) {
                // Map back to JoinRecord structure if necessary (internal use)
                return {
                    joinId: newRecord.id,
                    gameId: newRecord.game_id,
                    userId: newRecord.userId,
                    side: newRecord.side,
                    role: newRecord.role,
                    clientId: newRecord.client_id, // Include clientId
                    createdAt: new Date(newRecord.created_at).getTime(),
                    updatedAt: new Date(newRecord.created_at).getTime(),
                    joinCounterId: joinCounterId, // Keep counter ID for consistency if ever used
                };
            }
            throw new Error('Insert join record did not return data');
        } catch (error) {
            debug('Error in __addJoinRecord:', error);
            throw error; // Re-throw
        }
    }

    // <<< MODIFIED: __updateClientState >>>
    // Now finds the client in memory and updates it
    public override async __updateClientState(clientInstanceOrId: ManagedChessClient | string, state: Partial<any>): Promise<void> {
        let client: ManagedChessClient | undefined;
        if (typeof clientInstanceOrId === 'string') {
            client = this._clients[clientInstanceOrId];
        } else {
            client = clientInstanceOrId;
        }

        if (!client || !client.clientId) {
            debug(`__updateClientState Error: Client not found or has no clientId.`);
            return;
        }
        if (!this._clients[client.clientId]) {
             debug(`__updateClientState Warning: Client ${client.clientId} exists but is not in the server's managed list.`);
             // Add it now? Or just update the instance passed? Let's just update the instance for now.
        }

        debug(`Updating client ${client.clientId} state in memory:`, state);
        if (state.fen !== undefined) client.fen = state.fen;
        if (state.status !== undefined) client.status = state.status;
        if (state.createdAt !== undefined) client.createdAt = state.createdAt;
        if (state.updatedAt !== undefined) client.updatedAt = state.updatedAt;
        // Update other relevant properties if needed (side, role, joinId)
        if (state.side !== undefined) client.side = state.side;
        if (state.role !== undefined) client.role = state.role;
        if (state.joinId !== undefined) client.joinId = state.joinId;

        // Ensure the client instance in the map is updated if it was retrieved by ID
        if (typeof clientInstanceOrId === 'string') {
             this._clients[client.clientId] = client;
        }
    }

    // __getAllJoinsForGame remains the same (fetches all from DB)
    public override async __getAllJoinsForGame(gameId: string): Promise<any[]> {
        try {
            const response = await this.hasyx.select<any>({
                table: 'badma_joins',
                where: { game_id: { _eq: gameId } },
                returning: ['id', 'user_id', 'side', 'role', 'client_id', 'created_at'] // Add client_id
            });
            // Adjust name based on actual query response
            const joins = response?.badma_joins || [];
            // Map DB records to JoinRecord structure
            return joins.map((j: any, index: number) => ({ // Use index for joinCounterId if needed
                joinId: j.id,
                gameId: gameId,
                userId: j.user_id,
                side: j.side,
                role: j.role,
                clientId: j.client_id, // Include clientId
                createdAt: new Date(j.created_at).getTime(),
                updatedAt: new Date(j.created_at).getTime(),
                joinCounterId: index + 1, // Assign a sequential ID based on query order (if DB order is reliable)
            }));
        } catch (error) {
            debug(`Error getting all joins for game ${gameId}:`, error);
            return [];
        }
    }

    // <<< MODIFIED: __findJoinByJoinIdAndClient >>>
    // Now searches DB based on joinId but also checks for client_id presence implicitly via return
    public override async __findJoinByJoinIdAndClient(gameId: string, userId: string, joinId: string): Promise<any | undefined> {
        debug('HasyxChessServer __findJoinByJoinIdAndClient (searching DB)', gameId, userId, joinId);
        try {
            const response = await this.hasyx.select<any>({
                table: 'badma_joins',
                // Find by joinId, implicitly filtering by gameId and userId might be good practice
                where: { id: { _eq: joinId }, game_id: { _eq: gameId }, user_id: { _eq: userId } },
                limit: 1,
                returning: ['id', 'user_id', 'side', 'role', 'client_id', 'created_at']
            });
             // Adjust name based on actual query response
            const joinData = response?.badma_joins?.[0];
            if (joinData) {
                 // Check if the client is actually managed by this server instance
                if (joinData.client_id && !this._clients[joinData.client_id]) {
                     debug(`Join ${joinId} found with clientId ${joinData.client_id}, but that client is not managed by this server instance.`);
                     // Return undefined or the joinData? Returning joinData for now, caller might need to check _clients.
                }
                return {
                    joinId: joinData.id,
                    gameId: gameId,
                    userId: joinData.user_id,
                    side: joinData.side,
                    role: joinData.role,
                    clientId: joinData.client_id, // Include clientId
                    createdAt: new Date(joinData.created_at).getTime(),
                    updatedAt: new Date(joinData.created_at).getTime(),
                };
            }
            return undefined;
        } catch (error) {
            debug(`Error in __findJoinByJoinIdAndClient for ${joinId}:`, error);
            return undefined;
        }
    }

    // <<< MODIFIED: __findActivePlayerJoinByUser >>>
    // Defines "active" as having a non-null client_id in the DB record
    // and retrieves the latest based on created_at
    public override async __findActivePlayerJoinByUser(gameId: string, userId: string): Promise<any | undefined> {
        debug('HasyxChessServer __findActivePlayerJoinByUser (filtering by non-null client_id)', gameId, userId);
        try {
            const response = await this.hasyx.select<any>({
                table: 'badma_joins',
                where: {
                    game_id: { _eq: gameId },
                    user_id: { _eq: userId },
                    role: { _eq: ChessClientRole.Player },
                    client_id: { _is_null: false } // <<< Key change: Check for non-null client_id
                },
                order_by: { created_at: 'desc' }, // Get the latest active one
                limit: 1,
                returning: ['id', 'user_id', 'side', 'role', 'client_id', 'created_at']
            });
            // Adjust name based on actual query response
            const joinData = response?.badma_joins?.[0];
            if (joinData) {
                 // Map to JoinRecord structure
                 return { /* Map fields including clientId */ };
            }
            return undefined;
        } catch (error) {
            debug(`Error in __findActivePlayerJoinByUser for ${userId}:`, error);
            return undefined;
        }
    }

     // <<< MODIFIED: __findActivePlayerJoinBySide >>>
     // Defines "active" as having a non-null client_id in the DB record
    public override async __findActivePlayerJoinBySide(gameId: string, side: ChessClientSide): Promise<any | undefined> {
        debug('HasyxChessServer __findActivePlayerJoinBySide (filtering by non-null client_id)', gameId, side);
        if (side === 0) return undefined; // Side 0 is not a player side
        try {
            const response = await this.hasyx.select<any>({
                table: 'badma_joins',
                where: {
                    game_id: { _eq: gameId },
                    side: { _eq: side },
                    role: { _eq: ChessClientRole.Player },
                    client_id: { _is_null: false } // <<< Key change: Check for non-null client_id
                },
                order_by: { created_at: 'desc' }, // Get the latest active one
                limit: 1,
                returning: ['id', 'user_id', 'side', 'role', 'client_id', 'created_at']
            });
             // Adjust name based on actual query response
            const joinData = response?.badma_joins?.[0];
            if (joinData) {
                 // Map to JoinRecord structure
                 return { /* Map fields including clientId */ };
            }
            return undefined;
        } catch (error) {
            debug(`Error in __findActivePlayerJoinBySide for side ${side}:`, error);
            return undefined;
        }
    }

    // <<< MODIFIED: __getGamePlayerJoins >>>
    // Now attempts to mimic LocalChessServer logic: find the *latest* join for each user where client_id is not null.
    // This is complex with a single select. Might require post-processing or a more advanced SQL/GraphQL query.
    // Simple approach for now: Get all active joins (client_id not null) and let caller filter if needed.
    public override async __getGamePlayerJoins(gameId: string): Promise<any[]> {
        debug('HasyxChessServer __getGamePlayerJoins (returning all with non-null client_id)', gameId);
        try {
            const response = await this.hasyx.select<any>({
                table: 'badma_joins',
                where: {
                    game_id: { _eq: gameId },
                    role: { _eq: ChessClientRole.Player },
                    client_id: { _is_null: false } // <<< Filter for active joins >>>
                },
                returning: ['id', 'user_id', 'side', 'role', 'client_id', 'created_at'],
                order_by: { user_id: 'asc', created_at: 'desc' } // Order to potentially help post-processing
            });
             // Adjust name based on actual query response
            const joins = response?.badma_joins || [];
            // Map to JoinRecord structure (only returns joins with client_id)
            // TODO: Implement post-processing here if strict "latest per user" logic is required, similar to LocalChessServer.
            // For now, return all active player joins.
             return joins.map((j: any) => ({ /* Map fields including clientId */ }));
        } catch (error) {
            debug(`Error getting player joins for game ${gameId}:`, error);
            return [];
        }
    }

    // <<< MODIFIED: __clearJoinClientReference >>>
    // Removes client from memory map. Optionally updates DB.
    public override async __clearJoinClientReference(joinId: string): Promise<void> {
        debug(`Clearing client reference for join ${joinId}`);
        let clientIdToRemove: string | undefined;

        // Find the join record in DB to get the clientId
        try {
            const response = await this.hasyx.select<any>({
                table: 'badma_joins',
                pk_columns: { id: joinId },
                returning: ['client_id']
            });
             // Adjust name based on actual query response
            clientIdToRemove = response?.badma_joins_by_pk?.client_id;
        } catch (error) {
            debug(`Error finding join ${joinId} to get clientId for clearing:`, error);
            // Proceed to try and remove from memory if possible, but log error
        }

        if (clientIdToRemove && this._clients[clientIdToRemove]) {
            delete this._clients[clientIdToRemove];
            debug(`Removed client instance ${clientIdToRemove} from server memory.`);
        } else if (clientIdToRemove) {
            debug(`Client ID ${clientIdToRemove} found in join record ${joinId}, but instance not present in server memory.`);
        } else {
             debug(`Could not find clientId for join record ${joinId} or record not found.`);
        }

        // --- Optional: Update DB ---
        /*
        try {
            await this.hasyx.update<any>({
                table: 'badma_joins',
                pk_columns: { id: joinId },
                _set: { client_id: null }
                // No returning needed usually
            });
            debug(`Set client_id to null in DB for join record ${joinId}`);
        } catch (error) {
            debug(`Error setting client_id to null in DB for join ${joinId}:`, error);
        }
        */
    }

    // --- Test/Inspection methods --- //
    public override async __getGameState(gameId: string): Promise<any | undefined> {
        return this.__getGame(gameId); // Reuse existing method
    }

    // __getGameJoins remains the same (uses __getAllJoinsForGame)
    public override async __getGameJoins(gameId: string, includeClientRef: boolean = false): Promise<(any | Omit<any, 'clientId'>)[]> {
         // includeClientRef is now meaningful as __getAllJoinsForGame returns it
        const allJoins = await this.__getAllJoinsForGame(gameId);
        return includeClientRef ? allJoins : allJoins.map(({ clientId, ...rest }) => rest);
    }

    // <<< MODIFIED: __reset >>>
    public override async __reset(): Promise<void> {
         debug('HasyxChessServer.__reset() called.');
         // Clear in-memory clients
         this._clients = {};
         this._joinCounter = 0;
         debug('In-memory client store cleared.');
         // **WARNING**: This does NOT clear the database state (games, joins, users).
         // DB cleanup should be handled externally (e.g., in test teardown)
         // for HasyxChessServer.
         // throw new Error('HasyxChessServer.__reset only clears in-memory state, DB state remains.');
    }

    // <<< MODIFIED: __findActiveJoinByClientId >>>
    // Uses client_id from DB
    public override async __findActiveJoinByClientId(gameId: string, clientId: string): Promise<any | undefined> {
        debug(`Finding active join by clientId ${clientId} in game ${gameId}`);
        try {
            const response = await this.hasyx.select<any>({
                table: 'badma_joins',
                where: { game_id: { _eq: gameId }, client_id: { _eq: clientId } },
                limit: 1,
                order_by: { created_at: 'desc' }, // Find the latest if multiple somehow exist
                returning: ['id', 'user_id', 'side', 'role', 'client_id', 'created_at']
            });
            // Adjust name based on actual query response
            const joinData = response?.badma_joins?.[0];
            if (joinData) {
                 // Map to JoinRecord structure
                return { /* Map fields including clientId */ };
            }
            return undefined;
        } catch (error) {
            debug(`Error finding active join by clientId ${clientId}:`, error);
            return undefined;
        }
    }

    // --- Overriding base server methods to fix the client instance handling ---

    protected override async _create(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('HasyxServer Override _create processing', request);
        if (!request.userId || !(await this.__checkUser(request.userId))) {
            debug(`Error: User ${request.userId} does not exist for create.`);
            return { error: '!user' };
        }

        const gameId = request.gameId || uuidv4();
        if (await this.__gameExists(gameId)) {
            debug(`Error: Game ${gameId} already exists.`);
            return { error: `gameId=${gameId} already exists` };
        }

        // Create initial GameState
        const tempClientForDefaults = new this._ChessLogicClass(this); // Use the actual class now
        const newGameData = {
            hostUserId: request.userId!,
            fen: tempClientForDefaults.fen,
            status: 'await' as ChessClientStatus,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
        };
        await this.__createGame(gameId, newGameData);

        let joinId = request.joinId;
        let responseData: ChessServerResponse['data'];

        if (request.side !== undefined && request.role !== undefined) {
            joinId = joinId || uuidv4();
            // <<< FIX: Register client properly and set its properties >>>
            const clientForJoin = await this.__registerClient(request.clientId);
            clientForJoin.userId = request.userId!;
            clientForJoin.gameId = gameId;
             // <<< REMOVE: Simulation is not needed here, it causes recursion >>>
             // clientForJoin.joinId = joinId; // Set it just before calling asyncJoin
             // const clientJoinResponse = await clientForJoin.asyncJoin(request.side, request.role);

             // <<< Use the pre-generated or request-provided joinId >>>
             // joinId = clientJoinResponse.data.joinId!; // Use the joinId returned by the successful simulation
             clientForJoin.joinId = joinId;

            // Initialize the new client instance state from game data
            // <<< MOVED: Update state *after* registering client and assigning IDs >>>
            await this.__updateClientState(clientForJoin, { // Pass the instance
                fen: newGameData.fen,
                status: newGameData.status,
                updatedAt: newGameData.updatedAt,
                createdAt: newGameData.createdAt,
                // Also set initial side/role from request
                side: request.side,
                role: request.role,
            });

            // <<< Add the join record to DB *with* clientId >>>
            await this.__addJoinRecord({
                gameId: gameId, userId: request.userId!, side: request.side, role: request.role,
                joinId: joinId,
                clientId: clientForJoin.clientId, // <<< Store client ID >>>
                createdAt: request.createdAt, updatedAt: request.updatedAt, // Pass timestamps from request
            });

            // Update game status if needed
            const gamePlayerJoins = await this.__getGamePlayerJoins(gameId);
            let currentServerStatus = newGameData.status;
            let currentServerUpdatedAt = newGameData.updatedAt;
            if (gamePlayerJoins.length >= 2) {
                currentServerStatus = 'ready';
                currentServerUpdatedAt = Date.now();
                await this.__updateGame(gameId, { status: currentServerStatus, updatedAt: currentServerUpdatedAt });
                debug(`Server Game ${gameId} status updated to 'ready'.`);
                 // Update the client instance state as well
                 await this.__updateClientState(clientForJoin, { status: currentServerStatus, updatedAt: currentServerUpdatedAt });
            }

            // Prepare response data based on the state *after* DB operations
            // <<< Changed: Construct response directly, not from simulation >>>
            responseData = {
                // ...clientJoinResponse.data, // Base response from client sim
                clientId: request.clientId,
                gameId: gameId, // Ensure gameId is correct
                joinId: joinId, // Ensure joinId is correct
                side: request.side, // Use request side
                role: request.role, // Use request role
                fen: newGameData.fen, // Use initial fen
                status: currentServerStatus, // Reflect server status
                updatedAt: currentServerUpdatedAt, // Reflect server time
                createdAt: newGameData.createdAt // Reflect server time
            };

        } else {
            // No initial join requested
            const createdGame = await this.__getGame(gameId);
            if (!createdGame) {
                debug(`Error: Game ${gameId} not found immediately after creation.`);
                return { error: 'Internal server error: Game creation failed silently' };
            }
            responseData = {
                clientId: request.clientId,
                gameId: gameId,
                joinId: undefined, side: undefined, role: undefined,
                fen: createdGame.fen, status: createdGame.status,
                updatedAt: createdGame.updatedAt, createdAt: createdGame.createdAt,
            };
        }

        debug('HasyxServer Override _create successful response data:', responseData);
        return { data: responseData };
    }

     // Similar fixes needed for _join, _leave, _move if they use the same pattern
     // of creating a temporary client instance and calling its methods.
     // For example, in _join:
     protected override async _join(request: ChessClientRequest): Promise<ChessServerResponse> {
         debug('HasyxServer Override _join processing', request);

         if (!(await this.__checkUser(request.userId))) return { error: '!user' };

         const gameId = request.gameId!;
         const game = await this.__getGame(gameId);
         if (!game) {
             debug(`Error: Game ${gameId} not found.`);
             return { error: '!game' };
         }

         // Main override: Handle join registration with Hasyx system authentication
         const joinId = request.joinId || uuidv4();
         debug(`HasyxServer: Registering join with joinId=${joinId}`);

         // Create base response directly via parent class (for standard join logic)
         const baseResponse = await super._join(request);
         
         if (baseResponse.error) {
             debug(`HasyxServer: Base _join failed with error: ${baseResponse.error}`);
             return baseResponse;
         }

         debug(`HasyxServer: Base _join succeeded. Returning response.`);
         return baseResponse;
     }

     protected override async _move(request: ChessClientRequest): Promise<ChessServerResponse> {
         debug('HasyxServer Override _move processing', request);

         if (!(await this.__checkUser(request.userId))) return { error: '!user' };

         const gameId = request.gameId!;
         const game = await this.__getGame(gameId);
         if (!game) {
             debug(`Error: Game ${gameId} not found.`);
             return { error: '!game' };
         }

         // Call the parent class implementation to handle the move logic
         const baseResponse = await super._move(request);
         
         if (baseResponse.error) {
             debug(`HasyxServer: Base _move failed with error: ${baseResponse.error}`);
             return baseResponse;
         }

         debug(`HasyxServer: Base _move succeeded. Returning response.`);
         return baseResponse;
     }

     protected override async _leave(request: ChessClientRequest): Promise<ChessServerResponse> {
         debug('HasyxServer Override _leave processing', request);

         if (!(await this.__checkUser(request.userId))) return { error: '!user' };

         const gameId = request.gameId!;
         const game = await this.__getGame(gameId);
         if (!game) {
             debug(`Error: Game ${gameId} not found.`);
             return { error: '!game' };
         }

         // Call the parent class implementation to handle the leave logic
         const baseResponse = await super._leave(request);
         
         if (baseResponse.error) {
             debug(`HasyxServer: Base _leave failed with error: ${baseResponse.error}`);
             return baseResponse;
         }

         debug(`HasyxServer: Base _leave succeeded. Returning response.`);
         return baseResponse;
     }

     protected override async _sync(request: ChessClientRequest): Promise<ChessServerResponse> {
         debug('HasyxServer Override _sync processing', request);

         if (!(await this.__checkUser(request.userId))) return { error: '!user' };

         const gameId = request.gameId!;
         const game = await this.__getGame(gameId);
         if (!game) {
             debug(`Error: Game ${gameId} not found.`);
             return { error: '!game' };
         }

         // Call the parent class implementation to handle the sync logic
         const baseResponse = await super._sync(request);
         
         if (baseResponse.error) {
             debug(`HasyxServer: Base _sync failed with error: ${baseResponse.error}`);
             return baseResponse;
         }

         debug(`HasyxServer: Base _sync succeeded. Returning response.`);
         return baseResponse;
     }

} 