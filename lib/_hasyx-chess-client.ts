import { ChessClient, ChessClientRequest, ChessClientRole, ChessClientSide, ChessClientStatus, ChessServerResponse } from './chess-client.js';
import Debug from './debug.js';
import { Client as HasyxClient, GenerateOptions } from 'hasyx';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid'; // Needed for generating IDs if not provided

const debug = Debug('hasyx-client');

// Removed unused GraphQL mutation strings

export class HasyxChessClient extends ChessClient {
    private hasyx: HasyxClient;
    private apolloClient: ApolloClient<NormalizedCacheObject>; // Keep reference if needed

    constructor(apolloClient: ApolloClient<NormalizedCacheObject>) {
        super(null as any); // Base ChessClient expects a ChessServer, Hasyx client talks to API. Keep workaround.
        this.apolloClient = apolloClient;
        this.hasyx = new HasyxClient(apolloClient);
        debug('HasyxChessClient initialized 🚀');
    }

    // --- Override protected methods to interact with Hasura via HasyxClient --- //

    protected override async _create(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('HasyxChessClient _create using hasyxClient.insert', request);
        try {
            const gameId = request.gameId || uuidv4();
            const joinId = request.joinId || uuidv4(); // Generate joinId if needed for initial player

            // Add role if provided in request or context, otherwise default role applies
            const gameInsertResult = await this.hasyx.insert<any>({
                table: 'badma_games',
                object: {
                    id: gameId,
                    user_id: request.userId,
                    fen: this.fen, // Initial FEN from client instance
                    status: 'await', // Initial status
                    created_at: new Date(request.createdAt).toISOString(),
                    updated_at: new Date(request.updatedAt).toISOString(),
                },
                returning: ['id', 'fen', 'status', 'created_at', 'updated_at']
            });
            const createdGame = gameInsertResult?.insert_games_one;

            if (!createdGame) {
                throw new Error('Game creation failed, no data returned.');
            }

            let createdJoin: any = null;
            // 2. Insert the join record if side/role are provided
            if (request.side !== undefined && request.role !== undefined && request.userId) {
                // Add role if provided in request or context
                const joinInsertResult = await this.hasyx.insert<any>({
                    table: 'badma_joins',
                    object: {
                        id: joinId,
                        game_id: gameId,
                        user_id: request.userId,
                        side: request.side,
                        role: request.role,
                        client_id: request.clientId, // Store clientId? Schema dependent. Assuming yes for now.
                        created_at: new Date(request.createdAt).toISOString(),
                        updated_at: new Date(request.updatedAt).toISOString(),
                    },
                    returning: ['id', 'side', 'role']
                });
                createdJoin = joinInsertResult?.insert_joins_one;
                if (!createdJoin) {
                    // TODO: Handle potential inconsistency - game created but join failed. Rollback?
                    debug('Warning: Game created but initial join failed for user', request.userId);
                }
            }

            // 3. Check if game should become ready (mimicking server logic, maybe should be a trigger?)
            let finalStatus = createdGame.status;
            let finalUpdatedAt = new Date(createdGame.updated_at).getTime();
            if (createdJoin && createdJoin.role === ChessClientRole.Player) {
                const players = await this.hasyx.select<any>({
                    table: 'badma_joins_aggregate',
                    where: { game_id: { _eq: gameId }, role: { _eq: ChessClientRole.Player } },
                    returning: { aggregate: ['count'] }
                });

                if (players?.joins_aggregate?.aggregate?.count >= 2) {
                    finalStatus = 'ready';
                    finalUpdatedAt = Date.now();
                    await this.hasyx.update<any>({
                        table: 'badma_games',
                        pk_columns: { id: gameId },
                        _set: { status: finalStatus, updated_at: new Date(finalUpdatedAt).toISOString() }
                    });
                }
            }

            // 4. Construct response
            const responseData: ChessServerResponse['data'] = {
                clientId: request.clientId,
                gameId: createdGame.id,
                joinId: createdJoin?.id, // Use returned joinId if created
                side: createdJoin?.side, // Use returned side if created
                role: createdJoin?.role, // Use returned role if created
                fen: createdGame.fen,
                status: finalStatus,
                updatedAt: finalUpdatedAt,
                createdAt: new Date(createdGame.created_at).getTime(),
            };
            debug('HasyxChessClient _create successful response:', responseData);
            return { data: responseData };

        } catch (error: any) {
            debug('HasyxChessClient _create error:', error);
            const errorMessage = error.message || 'Hasyx communication error during create';
            return { error: errorMessage };
        }
    }

    protected override async _join(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('HasyxChessClient _join using hasyxClient.insert', request);
        if (!request.gameId) return { error: '!gameId' };
        if (request.side === undefined) return { error: '!side' };
        if (request.role === undefined) return { error: '!role' };
        if (!request.userId) return { error: '!userId' };

        try {
            const gameId = request.gameId;
            const joinId = request.joinId || uuidv4();

            // 1. Check current game state (especially status)
            const gameQueryResult = await this.hasyx.select<any>({
                table: 'badma_games',
                pk_columns: { id: gameId },
                returning: ['id', 'fen', 'status', 'created_at', 'updated_at']
            });
            const currentGame = gameQueryResult?.games_by_pk;

            if (!currentGame) {
                return { error: 'Game not found' };
            }
            if (request.role === ChessClientRole.Player && currentGame.status !== 'await') {
                return { error: `Game not awaiting players (status: ${currentGame.status})` };
            }
            // TODO: Add checks for existing user/side joins if needed (requires more queries)

            // 2. Insert the join record
            const joinInsertResult = await this.hasyx.insert<any>({
                table: 'badma_joins',
                object: {
                    id: joinId,
                    game_id: gameId,
                    user_id: request.userId,
                    side: request.side,
                    role: request.role,
                    client_id: request.clientId, // Store clientId?
                    created_at: new Date(request.createdAt).toISOString(),
                    updated_at: new Date(request.updatedAt).toISOString(),
                },
                returning: ['id', 'side', 'role']
                // Consider on_conflict for retries?
            });
            const createdJoin = joinInsertResult?.insert_joins_one;

            if (!createdJoin) {
                throw new Error('Join insertion failed, no data returned.');
            }

            // 3. Check if game should become ready (mimicking server logic)
            let finalStatus = currentGame.status;
            let finalUpdatedAt = new Date(currentGame.updated_at).getTime();
            if (finalStatus === 'await' && request.role === ChessClientRole.Player) {
                const players = await this.hasyx.select<any>({
                    table: 'badma_joins_aggregate',
                    where: { game_id: { _eq: gameId }, role: { _eq: ChessClientRole.Player } },
                    returning: { aggregate: ['count'] }
                });

                if (players?.joins_aggregate?.aggregate?.count >= 2) {
                    finalStatus = 'ready';
                    finalUpdatedAt = Date.now();
                    await this.hasyx.update<any>({
                        table: 'badma_games',
                        pk_columns: { id: gameId },
                        _set: { status: finalStatus, updated_at: new Date(finalUpdatedAt).toISOString() }
                    });
                }
            }

            // 4. Construct response
            const responseData: ChessServerResponse['data'] = {
                clientId: request.clientId,
                gameId: gameId,
                joinId: createdJoin.id,
                side: createdJoin.side,
                role: createdJoin.role,
                fen: currentGame.fen, // Return current game FEN
                status: finalStatus, // Return potentially updated status
                updatedAt: finalUpdatedAt, // Return potentially updated timestamp
                createdAt: new Date(currentGame.created_at).getTime(),
            };
            debug('HasyxChessClient _join successful response:', responseData);
            return { data: responseData };

        } catch (error: any) {
            debug('HasyxChessClient _join error:', error);
            const errorMessage = error.message || 'Hasyx communication error during join';
            return { error: errorMessage };
        }
    }

    protected override async _leave(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('HasyxChessClient _leave using hasyxClient.update/insert', request);
        if (!request.gameId) return { error: '!gameId' };
        if (!request.joinId) return { error: '!joinId (original join)' };
        if (!request.userId) return { error: '!userId' };
        if (request.side === undefined) return { error: '!side (should be final state, e.g., 0)' };
        if (request.role === undefined) return { error: '!role (should be final state, e.g., Anonymous)' };

        try {
            const gameId = request.gameId;
            const originalJoinId = request.joinId; // ID of the join record being left
            const leaveEventJoinId = uuidv4(); // ID for the new "leave event" record
            const currentTime = new Date(request.updatedAt).toISOString();

            // 1. Find the original join record to determine side/role being left
            const originalJoinResult = await this.hasyx.select<any>({
                table: 'badma_joins',
                pk_columns: { id: originalJoinId }, // Assuming joinId is PK
                // where: { id: { _eq: originalJoinId }, user_id: { _eq: request.userId } }, // Alt if not PK
                returning: ['id', 'side', 'role', 'client_id'] // Need side/role to determine surrender status
            });
            const originalJoin = originalJoinResult?.joins_by_pk; // Adjust based on select type

            if (!originalJoin) {
                return { error: 'Original join record not found for leave', recommend: 'sync' };
            }

            // 2. Determine surrender status based on the side that left
            let surrenderStatus: ChessClientStatus | null = null;
            if (originalJoin.role === ChessClientRole.Player && originalJoin.side !== 0) {
                surrenderStatus = originalJoin.side === 1 ? 'white_surrender' : 'black_surrender';
            }

            // 3. Update game status if surrender occurred
            let finalStatus: ChessClientStatus = 'unknown'; // Will be fetched or updated
            let finalFen: string = '';
            let finalUpdatedAt = request.updatedAt;
            let finalCreatedAt = request.createdAt;

            if (surrenderStatus) {
                const gameUpdateResult = await this.hasyx.update<any>({
                    table: 'badma_games',
                    pk_columns: { id: gameId },
                    _set: { status: surrenderStatus, updated_at: currentTime },
                    returning: ['fen', 'status', 'created_at', 'updated_at']
                });
                const updatedGame = gameUpdateResult?.update_games_by_pk;
                if (!updatedGame) throw new Error('Failed to update game status on leave');
                finalStatus = updatedGame.status;
                finalFen = updatedGame.fen;
                finalUpdatedAt = new Date(updatedGame.updated_at).getTime();
                finalCreatedAt = new Date(updatedGame.created_at).getTime();
            } else {
                // If not surrender, just fetch current game state
                const gameQueryResult = await this.hasyx.select<any>({
                    table: 'badma_games',
                    pk_columns: { id: gameId },
                    returning: ['fen', 'status', 'created_at', 'updated_at']
                });
                const currentGame = gameQueryResult?.games_by_pk;
                if (!currentGame) throw new Error('Failed to fetch game state on leave');
                finalStatus = currentGame.status;
                finalFen = currentGame.fen;
                finalUpdatedAt = new Date(currentGame.updated_at).getTime();
                finalCreatedAt = new Date(currentGame.created_at).getTime();
            }

            // 4. Add a "leave event" join record (optional, mimics server)
            const leaveJoinInsertResult = await this.hasyx.insert<any>({
                table: 'badma_joins',
                object: {
                    id: leaveEventJoinId,
                    game_id: gameId,
                    user_id: request.userId,
                    side: request.side, // Final side (e.g., 0)
                    role: request.role, // Final role (e.g., Anonymous)
                    // clientId: undefined, // No client associated with the leave event itself
                    created_at: currentTime,
                    updated_at: currentTime,
                },
                returning: ['id']
            });
            const leaveJoin = leaveJoinInsertResult?.insert_joins_one;


            // 5. Clear client_id from original join record (if schema supports/requires it)
            // Note: HasyxChessServer has this as no-op. Let's assume client_id isn't critical here or handled differently.
            // If needed:
            // if (originalJoin.client_id) {
            //     await this._hasyxClient.update<any>({
            //         table: 'badma_joins', pk_columns: { id: originalJoinId },
            //         _set: { client_id: null }
            //     });
            // }

            // 6. Construct response reflecting state AFTER leave
            const responseData: ChessServerResponse['data'] = {
                clientId: request.clientId,
                gameId: gameId,
                joinId: leaveEventJoinId, // Return ID of the leave event record
                side: request.side, // Final side
                role: request.role, // Final role
                fen: finalFen, // FEN at the time of leaving
                status: finalStatus, // Final status (possibly surrender)
                updatedAt: finalUpdatedAt,
                createdAt: finalCreatedAt,
            };
            debug('HasyxChessClient _leave successful response:', responseData);
            return { data: responseData };

        } catch (error: any) {
            debug('HasyxChessClient _leave error:', error);
            const errorMessage = error.message || 'Hasyx communication error during leave';
            return { error: errorMessage };
        }
    }


    protected override async _move(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('HasyxChessClient _move using hasyxClient.update', request);
        if (!request.gameId) return { error: '!gameId' };
        if (!request.userId) return { error: '!userId' };
        if (!request.joinId) return { error: '!joinId' };
        if (!request.move) return { error: '!move' };

        try {
            // Note: The client's internal chess state (this.fen, this.status)
            // should have ALREADY been updated by the calling method (asyncMove)
            // BEFORE _move is called. We trust that state here.
            const gameId = request.gameId;
            const updatedFen = this.fen; // FEN after client-side move simulation
            const updatedStatus = this.status; // Status after client-side move simulation
            const currentTime = new Date(request.updatedAt).toISOString();

            // 1. Update the game record in the database
            const gameUpdateOptions: Partial<GenerateOptions> = {
                table: 'badma_games',
                pk_columns: { id: gameId },
                // where: { id: { _eq: gameId } }, // Alternative if id not PK
                _set: {
                    fen: updatedFen,
                    status: updatedStatus,
                    updated_at: currentTime,
                },
                returning: ['fen', 'status', 'created_at', 'updated_at'] // Return updated values
            };
            const gameUpdateResult = await this.hasyx.update<any>(gameUpdateOptions as GenerateOptions);
            const updatedGame = gameUpdateResult?.update_games_by_pk; // Adjust based on update type

            if (!updatedGame) {
                // This could happen if the game doesn't exist or permissions fail
                throw new Error('Game update failed, no data returned. Game might not exist or permissions issue.');
            }

            // 2. Construct response using the state returned from the DB update
            const responseData: ChessServerResponse['data'] = {
                clientId: request.clientId,
                gameId: gameId,
                joinId: request.joinId, // Pass through joinId
                side: request.side, // Pass through side
                role: request.role, // Pass through role
                fen: updatedGame.fen, // Use FEN from DB update result
                status: updatedGame.status, // Use status from DB update result
                updatedAt: new Date(updatedGame.updated_at).getTime(),
                createdAt: new Date(updatedGame.created_at).getTime(),
            };
            debug('HasyxChessClient _move successful response:', responseData);
            return { data: responseData };

        } catch (error: any) {
            debug('HasyxChessClient _move error:', error);
            // Consider reverting client state if DB update fails?
            const errorMessage = error.message || 'Hasyx communication error during move';
            return { error: errorMessage };
        }
    }

    // --- Sync Implementation (using HasyxClient -unchanged from previous version) --- //
    protected override async _sync(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('HasyxChessClient _sync using hasyxClient.select', request);
        if (!request.gameId) { return { error: 'gameId is required for sync' }; }
        if (!request.userId) { return { error: 'userId is required for sync' }; }

        try {
            // Query game state and the user's relevant join state
            const queryOptions: Partial<GenerateOptions> = {
                table: 'badma_games',
                pk_columns: { id: request.gameId },
                returning: [
                    'id', 'fen', 'status', 'created_at', 'updated_at',
                    {
                        // Use relationship or separate query to find user's join
                        // Assuming a relationship 'joins' with filter arg is possible:
                        joins: { // This relationship name must exist in Hasura schema
                            where: {
                                user_id: { _eq: request.userId },
                                // Maybe add filter for active client_id if stored/relevant?
                                // client_id: { _eq: request.clientId }
                            },
                            limit: 1,
                            order_by: { created_at: 'desc' }, // Get the latest join for this user
                            returning: ['id', 'side', 'role']
                        }
                        // Alternative: Query joins table separately if no relationship/filter support
                    }
                ]
            };

            const response = await this.hasyx.select<any>(queryOptions as GenerateOptions);
            const gameData = response?.games_by_pk;

            if (!gameData) {
                return { error: 'Game not found for sync', recommend: 'create' };
            }

            // Note: Accessing joins depends on the actual structure returned by hasyxClient + Hasura
            // Adjust the path '.joins?.[0]' based on your Hasura schema and relationships.
            const userJoin = gameData.joins?.[0];
            if (!userJoin) {
                debug(`Sync: No active join found for user ${request.userId} in game ${request.gameId}. Returning spectator state.`);
            }

            const responseData: ChessServerResponse['data'] = {
                clientId: request.clientId,
                gameId: gameData.id,
                joinId: userJoin?.id,
                side: userJoin?.side ?? 0, // Default to spectator if no join found
                role: userJoin?.role ?? ChessClientRole.Anonymous, // Default to anonymous
                fen: gameData.fen,
                status: gameData.status,
                updatedAt: new Date(gameData.updated_at).getTime(),
                createdAt: new Date(gameData.created_at).getTime(),
            };

            debug('HasyxChessClient _sync successful response from Hasura query', responseData);
            return { data: responseData };

        } catch (error: any) {
            debug('HasyxChessClient _sync error:', error);
            const errorMessage = error.message || 'Hasyx communication error during sync';
            return { error: errorMessage };
        }
    }
} 