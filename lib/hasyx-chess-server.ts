import { ChessClient, ChessClientRequest, ChessClientRole, ChessClientSide, ChessClientStatus, ChessServerResponse } from './chess-client';
import { ChessServer } from './chess-server';
import { ChessPerks, ChessPerkApplication } from './chess-perks';
import Debug from './debug';
import { Hasyx, GenerateOptions, GenerateResult } from 'hasyx'; // Assuming 'hasyx' package and 'Client', 'GenerateOptions' export
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs
import { HasyxChessClient } from './hasyx-chess-client';

const debug = Debug('hasyx-server');

export class HasyxChessServer extends ChessServer<ChessClient> {
  public _hasyx: Hasyx;
  public _clients: Record<string, ChessClient> = {};
  public _joinCounter: number = 0; // Might not be strictly necessary if DB handles ordering

  constructor(
    hasyx: Hasyx,
    ChessClass = ChessClient,
  ) {
    super(ChessClass as any); // Call base constructor
    this._hasyx = hasyx;
    // Bind getApplied method to existing _perks instance (don't create new one!)
    this._perks.getApplied = this.getApplied.bind(this);
    debug('HasyxChessServer initialized (Stateful Client Management)');
  }

  public async __checkUser(userId: string | undefined) {
    // Hasyx client's select method might return the raw response object or the extracted array.
    // We need to handle both possibilities robustly.
    const result = await this._hasyx.select({ table: 'users', where: { id: { _eq: userId } }, limit: 1 });
    debug('User check raw result:', JSON.stringify(result, null, 2));

    let userArray: any[] | undefined;

    // Check if the result itself is the array (extracted by hasyx client)
    if (Array.isArray(result)) {
      userArray = result;
    } 
    // Check if the result is an object containing a 'users' property (raw hasura response)
    else if (result && typeof result === 'object' && Array.isArray((result as any).users)) {
      userArray = (result as any).users;
    } 
    // Otherwise, assume no user found or unexpected format
    else {
      userArray = undefined;
    }
    
    debug('User check extracted array:', JSON.stringify(userArray, null, 2));

    // Check if the array exists and has at least one element
    return !!(userArray && userArray[0]);
  }
  public async __addUser(): Promise<string> {
    const userId = uuidv4();
    const user = await this._hasyx.insert({ table: 'users', object: {
      id: userId,
      name: userId,
      email: `${userId}@example.com`,
      created_at: Date.now(),
      updated_at: Date.now(),
    } });
    debug('__addUser', user);
    return (user as any)?.id;
  }
  public async __gameExists(gameId: string): Promise<boolean> {
    return !!(await this.__getGame(gameId));
  }
  public async __getGame(gameId: string): Promise<any | undefined> {
    const games = await this._hasyx.select({
      table: 'badma_games',
      where: { id: { _eq: gameId } },
      limit: 1,
      returning: ['id', 'user_id', 'sides', 'side', 'mode', 'fen', 'status', 'created_at', 'updated_at'],
    });
    const rawGame = (games as any)?.[0];
    debug('__getGame', rawGame);
    return HasyxChessServer.deserializeGame(rawGame);
  }
  public async __createGame(gameId: string, gameData: any): Promise<void> {
    const serializedGame = HasyxChessServer.serializeGame({ id: gameId, ...gameData });
    debug('__createGame serialized', serializedGame);
    const result = await this._hasyx.insert({ table: 'badma_games', object: serializedGame });
    debug('__createGame result', result);
  }
  public async __updateGame(gameId: string, updates: Partial<any>): Promise<void> {
    const serializedUpdates = HasyxChessServer.serializeGame(updates);
    if (serializedUpdates.id) delete serializedUpdates.id;
    if (Object.keys(serializedUpdates).length === 0) {
        debug('__updateGame - no valid fields to update after serialization');
        return;
    }
    await this._hasyx.update({ table: 'badma_games', where: { id: { _eq: gameId } }, _set: serializedUpdates });
    debug('__updateGame serialized', gameId, serializedUpdates);
  }
  public async __addJoinRecord(recordData: any): Promise<void> {
    const serializedJoin = HasyxChessServer.serializeJoin(recordData);
    if (!serializedJoin.id) serializedJoin.id = uuidv4();
    const now = Date.now();
    if (!serializedJoin.created_at) serializedJoin.created_at = now;

    await this._hasyx.insert({ 
      table: 'badma_joins',
      object: serializedJoin,
    });
    debug('__addJoinRecord serialized', serializedJoin);
  }
  public async __getAllJoinsForGame(gameId: string): Promise<any[]> {
    const joinsResult = await this._hasyx.select({
      table: 'badma_joins',
      where: { game_id: { _eq: gameId } },
      order_by: { created_at: 'desc' },
      returning: ['id', 'user_id', 'game_id', 'side', 'role', 'client_id', 'created_at']
    });
    const rawJoins = (joinsResult as any) || [];
    return rawJoins.map(HasyxChessServer.deserializeJoin).filter(Boolean);
  }
  public async __findJoinByJoinIdAndClient(gameId: string, userId: string, joinId: string): Promise<any | undefined> {
    const joinsResult = await this._hasyx.select({
      table: 'badma_joins',
      where: { id: { _eq: joinId }, game_id: { _eq: gameId }, user_id: { _eq: userId }, client_id: { _is_null: false } },
      limit: 1,
      returning: ['id', 'user_id', 'game_id', 'side', 'role', 'client_id', 'created_at']
    });
    const rawJoin = (joinsResult as any)?.[0];
    return HasyxChessServer.deserializeJoin(rawJoin);
  }
  public async __findActivePlayerJoinByUser(gameId: string, userId: string): Promise<any | undefined> {
    const joinsResult = await this._hasyx.select({
      table: 'badma_joins',
      where: { game_id: { _eq: gameId }, user_id: { _eq: userId }, role: { _eq: ChessClientRole.Player }, client_id: { _is_null: false } },
      order_by: { created_at: 'desc' },
      limit: 1,
      returning: ['id', 'user_id', 'game_id', 'side', 'role', 'client_id', 'created_at'],
    });
    const rawJoin = (joinsResult as any)?.[0];
    return HasyxChessServer.deserializeJoin(rawJoin);
  }
  public async __findActivePlayerJoinBySide(gameId: string, side: ChessClientSide): Promise<any | undefined> {
    const joinsResult = await this._hasyx.select({
        table: 'badma_joins',
        where: { game_id: { _eq: gameId }, side: { _eq: side }, role: { _eq: ChessClientRole.Player }, client_id: { _is_null: false } },
        order_by: { created_at: 'desc' },
        limit: 1,
        returning: ['id', 'user_id', 'game_id', 'side', 'role', 'client_id', 'created_at'],
    });
    const rawJoin = (joinsResult as any)?.[0];
    return HasyxChessServer.deserializeJoin(rawJoin);
  }
  public async __getGamePlayerJoins(gameId: string): Promise<any[]> {
    const joinsResult = await this._hasyx.select({
      table: 'badma_joins',
      where: { game_id: { _eq: gameId }, role: { _eq: ChessClientRole.Player }, client_id: { _is_null: false } },
      order_by: { created_at: 'asc' },
      returning: ['id', 'user_id', 'game_id', 'side', 'role', 'client_id', 'created_at']
    });
    const rawJoins = (joinsResult as any) || [];
    const deserializedJoins = rawJoins.map(HasyxChessServer.deserializeJoin).filter(Boolean);

    const latestJoinsByUser: Record<string, any> = {};
    deserializedJoins.forEach((j: any) => {
        latestJoinsByUser[j.userId] = j;
    });
    const finalPlayerJoins = Object.values(latestJoinsByUser);
    return finalPlayerJoins;
  }
  public async __clearJoinClientReference(joinId: string): Promise<void> {
      await this._hasyx.update({
        table: 'badma_joins',
        where: { id: { _eq: joinId } },
        _set: { client_id: null, updated_at: Date.now() }
      });
      debug(`__clearJoinClientReference executed for joinId: ${joinId}`);
  }
  public async __getGameState(gameId: string): Promise<any | undefined> {
      return await this.__getGame(gameId);
  }
  public async __getGameJoins(gameId: string, includeClientRef?: boolean): Promise<any[]> {
    const joinsResult = await this._hasyx.select({
      table: 'badma_joins',
      where: { game_id: { _eq: gameId } },
      order_by: { created_at: 'desc' },
      returning: ['id', 'user_id', 'game_id', 'side', 'role', 'client_id', 'created_at']
    });
    const rawJoins = (joinsResult as any) || [];
    const deserializedJoins = rawJoins.map(HasyxChessServer.deserializeJoin);

    if (!includeClientRef) {
      return deserializedJoins.map(({ clientId, ...rest }: { clientId?: string, [key: string]: any }) => rest);
    }
    return deserializedJoins;
  }
  public async __reset() {
    throw new Error('Not implemented on hasyx version - requires DB cleanup');
  }
  public async __findActiveJoinByClientId(gameId: string, clientId: string): Promise<any | undefined> {
    const joinsResult = await this._hasyx.select({
      table: 'badma_joins',
      where: { game_id: { _eq: gameId }, client_id: { _eq: clientId } },
      order_by: { created_at: 'desc' },
      limit: 1,
      returning: ['id', 'user_id', 'game_id', 'side', 'role', 'client_id', 'created_at']
    });
    const rawJoin = (joinsResult as any)?.[0];
    return HasyxChessServer.deserializeJoin(rawJoin);
  }

  // --- Error Logging Method ---
  private async _logDbError(details: { 
      userId?: string, 
      gameId?: string, 
      context: string, 
      requestPayload?: any, 
      responsePayload?: any, 
      errorMessage: string 
  }): Promise<void> {
      debug(`Logging error: context=${details.context}, msg='${details.errorMessage}'`, details.requestPayload, details.responsePayload);
      try {
          await this._hasyx.insert({
              table: 'badma_errors',
              object: {
                  user_id: details.userId,
                  game_id: details.gameId,
                  context: details.context,
                  request_payload: details.requestPayload,
                  response_payload: details.responsePayload,
                  error_message: details.errorMessage,
              }
          });
          debug(`Successfully logged error to badma.errors: ${details.context}`);
      } catch (logError: any) {
          debug(`CRITICAL: Failed to log error to badma.errors table: ${logError.message}`, { originalError: details, loggingError: logError });
      }
  }

  // --- Serialization/Deserialization Methods ---

  static serializeGame(game: any): any {
    const result: any = {};
    if (game.id !== undefined) result.id = game.id;
    if (game.userId !== undefined) result.user_id = game.userId; // Renamed field
    if (game.fen !== undefined) result.fen = game.fen;
    if (game.status !== undefined) result.status = game.status;
    if (game.side !== undefined) result.side = game.side;
    if (game.createdAt !== undefined) result.created_at = game.createdAt;
    if (game.updatedAt !== undefined) result.updated_at = game.updatedAt;
    return result;
  }

  static deserializeGame(game: any): any {
    if (!game) return undefined;
    const result: any = {};
    if (game.id !== undefined) result.id = game.id;
    if (game.user_id !== undefined) result.userId = game.user_id; // Renamed field
    if (game.fen !== undefined) result.fen = game.fen;
    if (game.status !== undefined) result.status = game.status;
    if (game.side !== undefined) result.side = game.side;
    if (game.created_at !== undefined) result.createdAt = game.created_at;
    if (game.updated_at !== undefined) result.updatedAt = game.updated_at;
    return result;
  }

  static serializeJoin(join: any): any {
    const result: any = {};
    if (join.joinId !== undefined) result.id = join.joinId;
    if (join.userId !== undefined) result.user_id = join.userId;
    if (join.gameId !== undefined) result.game_id = join.gameId;
    if (join.side !== undefined) result.side = join.side;
    if (join.role !== undefined) result.role = join.role;
    if (join.clientId !== undefined) result.client_id = join.clientId; // Can be null/undefined
    if (join.createdAt !== undefined) result.created_at = join.createdAt;
    return result;
  }

  static deserializeJoin(join: any): any {
    if (!join) return undefined;
    const result: any = {};
    if (join.id !== undefined) result.joinId = join.id;
    if (join.user_id !== undefined) result.userId = join.user_id;
    if (join.game_id !== undefined) result.gameId = join.game_id;
    if (join.side !== undefined) result.side = join.side;
    if (join.role !== undefined) result.role = join.role;
    if (join.client_id !== undefined) result.clientId = join.client_id; // Can be null/undefined
    if (join.created_at !== undefined) result.createdAt = join.created_at;
    return result;
  }

  // --- Public Request Handler ---

  public async request(requestData: ChessClientRequest): Promise<ChessServerResponse> {
    debug('HasyxChessServer received request:', requestData);
    // Basic validation: Ensure operation exists
    if (!requestData.operation) {
      return { error: 'Operation field is missing' };
    }

    // Note: userId in requestData should be trusted ONLY if it comes from a verified source (like a token)
    // The API route handler is responsible for injecting the correct userId.
    // Adding a hasyx.debug here to see the initial request to the server
    this._hasyx.debug({ 
        route: 'HasyxChessServer:request',
        gameId: requestData.gameId,
        userId: requestData.userId,
        clientId: requestData.clientId,
        message: 'HasyxChessServer main request entry point',
        requestOperation: requestData.operation,
        requestPayload: requestData
    });

    try {
      switch (requestData.operation) {
        case 'create':
          // Validation specific to create might be added here or inside 'create'
          return await this.create(requestData);
        case 'join':
          return await this.join(requestData);
        case 'leave':
          return await this.leave(requestData);
        case 'move':
          return await this.move(requestData);
        case 'sync':
          return await this.sync(requestData);
        // Add cases for other potential operations like 'surrender' if distinct from 'leave'
        default:
          debug(`Unsupported operation requested: ${requestData.operation}`);
          return { error: `Unsupported operation: ${requestData.operation}` };
      }
    } catch (error: any) {
      debug('Error processing request in HasyxChessServer:', error);
      return { error: error.message || 'An internal server error occurred' };
    }
  }

  protected async _sync(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
    debug('_sync processing for clientId:', request.clientId);
    this._hasyx.debug({
        route: 'HasyxChessServer:_sync',
        gameId: request.gameId,
        userId: request.userId,
        clientId: request.clientId,
        message: 'Entered _sync method',
        requestData: request
    });
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

    // <<< START DEBUG LOGGING >>>
    // debug(`_sync: Determining response state for client ${request.clientId} in game ${gameId}`);
    // debug(`_sync: Server game state: fen=${game.fen}, status=${game.status}, updatedAt=${game.updatedAt}, createdAt=${game.createdAt}`);
    // debug(`_sync: Determined client state: side=${clientSide}, role=${clientRole}, joinId=${clientJoinId}`);
    // <<< END DEBUG LOGGING >>>

    // Construct the response with current game state and client-specific details
    const responseData: ChessServerResponse['data'] = {
        clientId: request.clientId, gameId: gameId,
        fen: game.fen, status: game.status,
        updatedAt: game.updatedAt, createdAt: game.createdAt,
        side: clientSide, role: clientRole, joinId: clientJoinId,
    };

    // debug('_sync successful response data:', responseData);
    return { data: responseData };
  }

  protected async _move(request: Omit<ChessClientRequest, 'operation'>): Promise<ChessServerResponse> {
    debug('_move processing (using BASE asyncMove logic via .call)', request);
    this._hasyx.debug({ // Use this._hasyx.debug
        route: 'HasyxChessServer:_move',
        gameId: request.gameId,
        userId: request.userId,
        joinId: request.joinId,
        message: 'Entered _move method',
        requestData: request 
    });

    if (!(await this.__checkUser(request.userId))) {
      const errorMsg = '!user';
      await this._logDbError({ userId: request.userId, gameId: request.gameId, context: '_move:user_check_failed', requestPayload: request, errorMessage: errorMsg });
      this._hasyx.debug({ route: 'HasyxChessServer:_move', gameId: request.gameId, userId: request.userId, message: 'User check failed', error: errorMsg });
      return { error: errorMsg };
    }

    const gameId = request.gameId!;
    const game = await this.__getGame(gameId);
    this._hasyx.debug({ route: 'HasyxChessServer:_move', gameId: gameId, userId: request.userId, message: 'Fetched game state', data: game });
    if (!game) {
      const errorMsg = '!game';
      await this._logDbError({ userId: request.userId, gameId: gameId, context: '_move:game_not_found', requestPayload: request, errorMessage: errorMsg });
      this._hasyx.debug({ route: 'HasyxChessServer:_move', gameId: gameId, userId: request.userId, message: 'Game not found', error: errorMsg });
      return { error: errorMsg };
    }

    if (game.status !== 'ready' && game.status !== 'continue') {
        const errorMsg = `Game not playable (status: ${game.status})`;
        await this._logDbError({ userId: request.userId, gameId: gameId, context: '_move:game_not_playable', requestPayload: request, responsePayload: { currentStatus: game.status }, errorMessage: errorMsg });
        this._hasyx.debug({ route: 'HasyxChessServer:_move', gameId: gameId, userId: request.userId, message: 'Game not playable', error: errorMsg, gameStatus: game.status });
        return { error: errorMsg };
    }

    const joinRecord = await this.__findJoinByJoinIdAndClient(gameId, request.userId!, request.joinId!); 
    this._hasyx.debug({
        route: 'HasyxChessServer:_move',
        gameId: gameId,
        userId: request.userId,
        joinId: request.joinId,
        message: 'Fetched joinRecord by joinId and client',
        data: joinRecord
    });

    if (!joinRecord || !joinRecord.clientId) {
        const errorMsg = 'Active player join record not found for this move';
        await this._logDbError({ userId: request.userId, gameId: gameId, context: '_move:join_record_not_found', requestPayload: request, errorMessage: errorMsg });
        this._hasyx.debug({ route: 'HasyxChessServer:_move', gameId: gameId, userId: request.userId, joinId: request.joinId, message: 'Active player join record not found', error: errorMsg });
        debug(`Error: Active Player join record not found for joinId ${request.joinId} in game ${gameId}`);
        return { error: errorMsg };
    }
    const clientIdToMove = joinRecord.clientId;

    if (joinRecord.side !== request.side || joinRecord.role !== request.role) {
        const errorMsg = 'Request side/role mismatch with server state';
        await this._logDbError({ 
            userId: request.userId, gameId: gameId, context: '_move:side_role_mismatch', 
            requestPayload: request, 
            responsePayload: { serverSide: joinRecord.side, serverRole: joinRecord.role }, 
            errorMessage: errorMsg 
        });
        debug(`Error: Request side/role (${request.side}/${request.role}) mismatch with server state (${joinRecord.side}/${joinRecord.role}) for join ${request.joinId}`);
        return { error: errorMsg };
    }
    if (joinRecord.role !== ChessClientRole.Player) {
        const errorMsg = 'Only players can move';
        await this._logDbError({ userId: request.userId, gameId: gameId, context: '_move:not_a_player', requestPayload: request, responsePayload: { role: joinRecord.role }, errorMessage: errorMsg });
        return { error: errorMsg };
    }

    const clientToMove = await this.__defineClient(clientIdToMove); 
    if (!clientToMove) {
        const errorMsg = 'Internal server error: Client instance for move not found';
        await this._logDbError({ userId: request.userId, gameId: gameId, context: '_move:client_instance_not_found', requestPayload: { clientIdToMove }, errorMessage: errorMsg });
        debug(`Error: Client instance not found for clientId ${clientIdToMove} referenced by join record ${joinRecord.joinId}`);
        return { error: errorMsg };
    }
    if (clientToMove.clientId !== request.clientId) {
        debug(`Warning: Client ID mismatch during move. Request clientId: ${request.clientId}, Found client's clientId: ${clientToMove.clientId} via joinId ${request.joinId}. Proceeding with found client.`);
        // Force update the client ID in the instance to match the request (in case of reconnects etc.)
        clientToMove.clientId = request.clientId; 
    }
    this._hasyx.debug({
        route: 'HasyxChessServer:_move',
        gameId: gameId,
        userId: request.userId,
        clientId: clientToMove.clientId,
        message: 'Client instance defined/resolved for move',
        data: { clientId: clientToMove.clientId, initialRequestClientId: request.clientId }
    });

    // Sync client state FROM CURRENT SERVER game state BEFORE simulating move
    clientToMove.userId = request.userId!; // Ensure user ID is set
    clientToMove.gameId = gameId;
    clientToMove.joinId = request.joinId; // Set the specific join ID for this move context
    clientToMove.side = request.side!;
    clientToMove.role = request.role!;
    clientToMove.fen = game.fen; // <<< Load CURRENT FEN from server
    clientToMove.status = game.status; // <<< Load CURRENT status from server
    clientToMove.createdAt = game.createdAt; // Sync createdAt for consistency in potential base client logic
    clientToMove.updatedAt = game.updatedAt; // Sync updatedAt

    debug(`Synchronized client ${clientToMove.clientId} state before move simulation:`, { fen: clientToMove.fen, status: clientToMove.status });
    this._hasyx.debug({
        route: 'HasyxChessServer:_move',
        gameId: gameId,
        userId: request.userId,
        clientId: clientToMove.clientId,
        message: 'Client state synchronized, attempting ChessClient.prototype.asyncMove.call',
        data: { fen: clientToMove.fen, status: clientToMove.status, moveRequest: request.move }
    });

    // <<< Call BASE asyncMove logic on the ChessClient instance >>>
    // This simulates the move using the client's internal chess engine
    let clientMoveResponse;
    try {
        clientMoveResponse = await ChessClient.prototype.asyncMove.call(clientToMove, request.move!); 
        this._hasyx.debug({
            route: 'HasyxChessServer:_move',
            gameId: gameId,
            userId: request.userId,
            clientId: clientToMove.clientId,
            message: 'ChessClient.prototype.asyncMove.call response',
            data: clientMoveResponse
        });
    } catch (asyncMoveError: any) {
        this._hasyx.debug({
            route: 'HasyxChessServer:_move',
            gameId: gameId,
            userId: request.userId,
            clientId: clientToMove.clientId,
            message: 'Error during ChessClient.prototype.asyncMove.call',
            error: asyncMoveError.message,
            stack: asyncMoveError.stack,
            requestMove: request.move
        });
        // Re-throw to allow existing error handling to take over (which includes _logDbError)
        throw asyncMoveError;
    }

    // --- Server trusts the BASE client simulation result --- 
    if (clientMoveResponse.error || !clientMoveResponse.data) {
        const errorMsg = clientMoveResponse.error || 'Base client move logic failed';
        await this._logDbError({
            userId: request.userId, gameId: gameId, context: '_move:base_client_simulation_failed',
            requestPayload: request.move, 
            responsePayload: { clientMoveResponseError: clientMoveResponse.error, currentServerFen: game.fen, currentServerStatus: game.status },
            errorMessage: errorMsg
        });
        this._hasyx.debug({ 
            route: 'HasyxChessServer:_move',
            gameId: gameId,
            userId: request.userId,
            clientId: clientToMove.clientId, // Assuming clientToMove is defined, might need to use request.clientId if not
            message: 'Base client move logic failed after asyncMove.call',
            error: errorMsg,
            clientResponse: clientMoveResponse
        });
        debug(`Move failed via BASE client simulation logic (${joinRecord.joinId}): ${errorMsg}`);
        const responseDataOnError: ChessServerResponse['data'] = {
            clientId: request.clientId, gameId: gameId, joinId: request.joinId,
            side: request.side, role: request.role, 
            fen: game.fen, // Current server FEN
            status: game.status, // Current server status
            updatedAt: game.updatedAt, createdAt: game.createdAt,
        };
        // Return the error reported by the BASE client's simulation logic
        return { error: errorMsg, data: responseDataOnError };
    }

    // --- MOVE SIMULATION SUCCEEDED (according to base client logic) --- 
    // Update the SHARED Server GameState FROM the BASE client simulation result
    let updatedFen = clientMoveResponse.data.fen;     // FEN from client after its internal move
    const updatedStatus = clientMoveResponse.data.status; // Status from client after its internal move
    const updatedTime = Date.now();                   // Use server time for update

    // --- PROCESS MOVE THROUGH PERKS SYSTEM ---
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
        
    } catch (perkError: any) {
        debug('_move: error in perks processing:', perkError);
        await this._logDbError({
            userId: request.userId, gameId: gameId, context: '_move:perks_processing_failed',
            requestPayload: request, errorMessage: perkError.message || 'Perks processing failed'
        });
        return { error: 'Perks processing failed' };
    }

    await this.__updateGame(gameId, { 
        fen: updatedFen, 
        status: updatedStatus, 
        updatedAt: updatedTime 
    });
    this._hasyx.debug({
        route: 'HasyxChessServer:_move',
        gameId: gameId,
        userId: request.userId,
        message: 'Server game state updated after successful client simulation',
        data: { updatedFen, updatedStatus, gameId }
    });

    // ---> ДОБАВЛЕНА ЗАПИСЬ ХОДА В badma_moves <---
    try {
        // Используем request.move!, так как он валидируется раньше в _move
        await this._hasyx.insert({
            table: 'badma_moves',
            object: {
                from: request.move!.from,
                to: request.move!.to,
                promotion: request.move!.promotion, // Включаем promotion, если есть
                side: request.side, // Чей был ход
                user_id: request.userId,
                game_id: gameId,
                created_at: updatedTime // Используем время обновления сервера
            }
        });
        this._hasyx.debug({
            route: 'HasyxChessServer:_move',
            gameId: gameId,
            userId: request.userId,
            message: 'Successfully inserted move record into badma_moves',
            moveData: request.move
        });
        debug(`Successfully inserted move record into badma_moves for game ${gameId}`);
    } catch (insertError: any) {
        const errorMsg = `Failed to record move: ${insertError.message || 'Unknown DB error'}`;
        await this._logDbError({
            userId: request.userId, gameId: gameId, context: '_move:db_insert_move_failed',
            requestPayload: request.move,
            responsePayload: { dbError: insertError.message || insertError },
            errorMessage: errorMsg
        });
        this._hasyx.debug({ 
            route: 'HasyxChessServer:_move',
            gameId: gameId,
            userId: request.userId,
            message: 'Error inserting move record into badma_moves',
            error: errorMsg,
            dbError: insertError.message || insertError
        });
        debug(`Error inserting move record into badma_moves: ${insertError.message || insertError}`);
        // Decide if this error should halt the entire move process or just be logged
        // For now, logging the error but not returning it, allowing the response below.
        // Consider returning an error if recording the move is critical:
        // return { error: errorMsg };
    }
    // ---> КОНЕЦ ДОБАВЛЕННОЙ ЛОГИКИ <---

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
     this._hasyx.debug({
        route: 'HasyxChessServer:_move',
        gameId: gameId,
        userId: request.userId,
        joinId: request.joinId,
        message: '_move successful, returning final response data',
        data: responseData
    });
    return { data: responseData };
  }

  /**
   * Get applied perks for a game from database
   * This method is bound to ChessPerks instance to provide database access
   */
  async getApplied(gameId: string): Promise<ChessPerkApplication[]> {
    debug(`Getting applied perks for game ${gameId}`);
    
    try {
      // For now, return empty array as we haven't created the perks table yet
      // In Phase 2, this will query the badma_perks table
      debug(`No perks table yet, returning empty array for game ${gameId}`);
      return [];
      
      // TODO: Phase 2 implementation will be:
      // const result = await this._hasyx.select({
      //   table: 'badma_perks',
      //   where: { game_id: { _eq: gameId } },
      //   returning: ['type', 'game_id', 'client_id', 'data', 'created_at', 'updated_at']
      // });
      // return Array.isArray(result) ? result : [];
    } catch (error: any) {
      debug(`Error getting applied perks for game ${gameId}:`, error);
      return [];
    }
  }
} 