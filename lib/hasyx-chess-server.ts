import { ChessClient, ChessClientRequest, ChessClientRole, ChessClientSide, ChessClientStatus, ChessServerResponse } from './chess-client.js';
import { ChessServer } from './chess-server.js';
import Debug from './debug.js';
import { Hasyx, GenerateOptions, GenerateResult } from 'hasyx'; // Assuming 'hasyx' package and 'Client', 'GenerateOptions' export
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs
import { HasyxChessClient } from './hasyx-chess-client.js';

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
      created_at: new Date(Date.now()).toISOString(),
      updated_at: new Date(Date.now()).toISOString(),
    } });
    debug('__addUser', user);
    return (user as any)?.id;
  }
  public async __gameExists(gameId: string): Promise<boolean> {
    return !!(await this.__getGame(gameId));
  }
  public async __getGame(gameId: string): Promise<any | undefined> {
    const games = await this._hasyx.select({ table: 'badma_games', where: { id: { _eq: gameId } }, limit: 1, returning: ['id', 'user_id', 'sides', 'side', 'mode', 'fen', 'status', 'created_at', 'updated_at'] });
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
    const now = new Date().toISOString();
    if (!serializedJoin.created_at) serializedJoin.created_at = now;

    await this._hasyx.insert({ 
      table: 'badma_joins',
      object: serializedJoin,
    });
    debug('__addJoinRecord serialized', serializedJoin);
  }
  public async __getAllJoinsForGame(gameId: string): Promise<any[]> {
    const joinsResult = await this._hasyx.select({ table: 'badma_joins', where: { game_id: { _eq: gameId } } });
    const rawJoins = (joinsResult as any) || [];
    return rawJoins.map(HasyxChessServer.deserializeJoin).filter(Boolean);
  }
  public async __findJoinByJoinIdAndClient(gameId: string, userId: string, joinId: string): Promise<any | undefined> {
    const joinsResult = await this._hasyx.select({
      table: 'badma_joins',
      where: { id: { _eq: joinId }, game_id: { _eq: gameId }, user_id: { _eq: userId }, client_id: { _is_null: false } },
      limit: 1
    });
    const rawJoin = (joinsResult as any)?.[0];
    return HasyxChessServer.deserializeJoin(rawJoin);
  }
  public async __findActivePlayerJoinByUser(gameId: string, userId: string): Promise<any | undefined> {
    const joinsResult = await this._hasyx.select({
      table: 'badma_joins',
      where: { game_id: { _eq: gameId }, user_id: { _eq: userId }, role: { _eq: ChessClientRole.Player }, client_id: { _is_null: false } },
      order_by: { created_at: 'desc' },
      limit: 1
    });
    const rawJoin = (joinsResult as any)?.[0];
    return HasyxChessServer.deserializeJoin(rawJoin);
  }
  public async __findActivePlayerJoinBySide(gameId: string, side: ChessClientSide): Promise<any | undefined> {
    const joinsResult = await this._hasyx.select({
        table: 'badma_joins',
        where: { game_id: { _eq: gameId }, side: { _eq: side }, role: { _eq: ChessClientRole.Player }, client_id: { _is_null: false } },
        order_by: { created_at: 'desc' },
        limit: 1
    });
    const rawJoin = (joinsResult as any)?.[0];
    return HasyxChessServer.deserializeJoin(rawJoin);
  }
  public async __getGamePlayerJoins(gameId: string): Promise<any[]> {
    const joinsResult = await this._hasyx.select({
      table: 'badma_joins',
      where: { game_id: { _eq: gameId }, role: { _eq: ChessClientRole.Player }, client_id: { _is_null: false } },
      order_by: { created_at: 'asc' },
    });
    const rawJoins = (joinsResult as any) || [];
    const deserializedJoins = rawJoins.map(HasyxChessServer.deserializeJoin).filter(Boolean);

    const latestJoinsByUser: Record<string, any> = {};
    deserializedJoins.forEach((j: any) => {
        latestJoinsByUser[j.userId] = j;
    });
    return Object.values(latestJoinsByUser);
  }
  public async __clearJoinClientReference(joinId: string): Promise<void> {
      await this._hasyx.update({
        table: 'badma_joins',
        where: { id: { _eq: joinId } },
        _set: { client_id: null, updated_at: new Date().toISOString() }
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
    });
    const rawJoin = (joinsResult as any)?.[0];
    return HasyxChessServer.deserializeJoin(rawJoin);
  }

  // --- Serialization/Deserialization Methods ---

  static serializeGame(game: any): any {
    const result: any = {};
    if (game.id !== undefined) result.id = game.id;
    if (game.userId !== undefined) result.user_id = game.userId; // Renamed field
    if (game.fen !== undefined) result.fen = game.fen;
    if (game.status !== undefined) result.status = game.status;
    if (game.createdAt !== undefined) result.created_at = new Date(game.createdAt).toISOString();
    if (game.updatedAt !== undefined) result.updated_at = new Date(game.updatedAt).toISOString();
    return result;
  }

  static deserializeGame(game: any): any {
    if (!game) return undefined;
    const result: any = {};
    if (game.id !== undefined) result.id = game.id;
    if (game.user_id !== undefined) result.userId = game.user_id; // Renamed field
    if (game.fen !== undefined) result.fen = game.fen;
    if (game.status !== undefined) result.status = game.status;
    if (game.created_at !== undefined) result.createdAt = new Date(game.created_at).getTime();
    if (game.updated_at !== undefined) result.updatedAt = new Date(game.updated_at).getTime();
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
    if (join.createdAt !== undefined) result.created_at = new Date(join.createdAt).toISOString();
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
    if (join.created_at !== undefined) result.createdAt = new Date(join.created_at).getTime();
    return result;
  }
} 