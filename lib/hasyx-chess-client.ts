import { ChessClient, ChessClientRequest, ChessClientRole, ChessClientSide, ChessClientStatus, ChessServerResponse } from './chess-client';
import Debug from './debug';
import { Hasyx, GenerateOptions } from 'hasyx';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid'; // Needed for generating IDs if not provided

const debug = Debug('hasyx-client');

// Removed unused GraphQL mutation strings

export class HasyxChessClient extends ChessClient {
  private _hasyx: Hasyx;

  constructor(hasyx: Hasyx) {
    super(null as any); // Base ChessClient expects a ChessServer, Hasyx client talks to API. Keep workaround.
    this._hasyx = hasyx;
    debug('HasyxChessClient initialized 🚀');
  }

  protected override async _create(request: ChessClientRequest): Promise<ChessServerResponse> {
    debug('HasyxChessClient _create sending request to server:', request);
    try {
      let response: ChessServerResponse = {
        error: undefined,
        recommend: undefined,
        data: undefined,
      };
      const gameId = request.gameId || uuidv4();
      let joinId;
      const game = await this._hasyx.insert({
        table: 'badma_games',
        object: {
          id: gameId,
          user_id: request.userId,
          fen: this.fen,
          status: 'await',
          updated_at: typeof request.updatedAt === 'number' ? new Date(request.updatedAt).toISOString() : request.updatedAt,
          created_at: typeof request.createdAt === 'number' ? new Date(request.createdAt).toISOString() : request.createdAt,
        }
      });
      if (game.error) {
        response.error = game.error;
        return response;
      }
      response.data = {
        clientId: request.clientId,
        gameId: gameId,
        fen: this.fen,
        status: 'await',
        updatedAt: request.updatedAt,
        createdAt: request.createdAt,
      };
      if (!request.side || !request.role) {
        debug('HasyxChessClient _create received response from server:', response);
        return response;
      }
      response =await this._join({
        ...request,
        joinId: request.joinId || uuidv4(),
      });
      debug('HasyxChessClient _create+_join received response from server:', response);
      return response;
    } catch (error: any) {
      debug('HasyxChessClient _create error calling server:', error);
      return { error: error.message || 'Server communication error during create' };
    }
  }

  protected override async _join(request: ChessClientRequest): Promise<ChessServerResponse> {
    debug('HasyxChessClient _join sending request to server:', request);
    try {
      const response: ChessServerResponse = {
        error: undefined,
        recommend: undefined,
        data: undefined,
      };
      const joinId = request.joinId || uuidv4();
      const join = await this._hasyx.insert({
        table: 'badma_joins',
        object: {
          id: joinId,
          user_id: request.userId,
          game_id: request.gameId,
          side: request.side,
          role: request.role,
          client_id: request.clientId,
          created_at: typeof request.createdAt === 'number' ? new Date(request.createdAt).toISOString() : request.createdAt,
        },
      });
      if (join.error) {
        response.error = join.error;
        return response;
      }
      response.data = {
        clientId: request.clientId,
        gameId: request.gameId as string,
        joinId: joinId,
        side: request.side,
        role: request.role,
        fen: this.fen,
        status: 'await',
        updatedAt: request.createdAt,
        createdAt: request.createdAt,
      };
      debug('HasyxChessClient _join received response from server:', response);
      return response;
    } catch (error: any) {
      debug('HasyxChessClient _join error calling server:', error);
      return { error: error.message || 'Server communication error during join' };
    }
  }

  protected override async _leave(request: ChessClientRequest): Promise<ChessServerResponse> {
    debug('HasyxChessClient _leave sending request to server:', request);
    try {
      const response: ChessServerResponse = {
        error: undefined,
        recommend: undefined,
        data: undefined,
      };
      const joinId = request.joinId || uuidv4();
      const join = await this._hasyx.insert({
        table: 'badma_joins',
        object: {
          id: joinId,
          user_id: request.userId,
          game_id: request.gameId,
          side: request.side,
          role: 0,
          client_id: request.clientId,
          created_at: typeof request.createdAt === 'number' ? new Date(request.createdAt).toISOString() : request.createdAt,
        },
      });
      if (join.error) {
        response.error = join.error;
        return response;
      }
      response.data = {
        clientId: request.clientId,
        gameId: request.gameId as string,
        joinId: joinId,
        side: request.side,
        role: 0,
        fen: this.fen,
        status: 'await',
        updatedAt: request.createdAt,
        createdAt: request.createdAt,
      };
      debug('HasyxChessClient _leave received response from server:', response);
      return response;
    } catch (error: any) {
      debug('HasyxChessClient _leave error calling server:', error);
      return { error: error.message || 'Server communication error during leave' };
    }
  }

  protected override async _move(request: ChessClientRequest): Promise<ChessServerResponse> {
    debug('HasyxChessClient _move sending request to server:', request);
    if (!request.move) return { error: '!move' };
    try {
      // The client's internal state (this.fen, this.status) should have been
      // updated by this.chess.move() in the calling asyncMove method BEFORE _move is called.

      // 1. Update badma_games table with the new FEN and status from the client's state
      const updatedGameTime = typeof request.updatedAt === 'number' ? new Date(request.updatedAt).toISOString() : request.updatedAt;
      const gameUpdateResult = await this._hasyx.update({
        table: 'badma_games',
        where: { id: { _eq: request.gameId } },
        _set: {
          fen: this.fen,       // Use FEN from client's internal state
          status: this.status, // Use status from client's internal state
          updated_at: updatedGameTime
        }
      });

      if (gameUpdateResult.error) {
        debug('HasyxChessClient _move error during badma_games update:', gameUpdateResult.error);
        // Return error but try to include current client state if possible for context
        return { 
          error: `Failed to update game state: ${gameUpdateResult.error}`,
          data: {
            clientId: request.clientId,
            gameId: request.gameId as string,
            joinId: request.joinId,
            side: request.side,
            role: request.role,
            fen: this.fen, // current client FEN
            status: this.status, // current client status
            updatedAt: request.updatedAt,
            createdAt: request.createdAt,
          }
        };
      }
      debug('HasyxChessClient _move successfully updated badma_games.');

      // 2. Insert into badma_moves table
      const moveInsertResult = await this._hasyx.insert({
        table: 'badma_moves',
        object: {
          from: request.move.from,
          to: request.move.to,
          promotion: request.move.promotion,
          user_id: request.userId,
          game_id: request.gameId,
          ...(request.side !== undefined && { side: request.side }),
          created_at: typeof request.createdAt === 'number' ? new Date(request.createdAt).toISOString() : request.createdAt,
        },
      });

      if (moveInsertResult.error) {
        debug('HasyxChessClient _move error during badma_moves insert:', moveInsertResult.error);
        // Even if move insert fails, the game state might have been updated.
        // Consider how to handle this inconsistency. For now, return the error.
        return { 
          error: `Failed to record move: ${moveInsertResult.error}`,
          data: { // Return client state which reflects the game state that *was* updated
            clientId: request.clientId,
            gameId: request.gameId as string,
            joinId: request.joinId,
            side: request.side,
            role: request.role,
            fen: this.fen,
            status: this.status,
            updatedAt: request.updatedAt,
            createdAt: request.createdAt,
          }
        };
      }
      debug('HasyxChessClient _move successfully inserted into badma_moves.');

      // 3. Prepare response
      const responseData: ChessServerResponse['data'] = {
        clientId: request.clientId,
        gameId: request.gameId as string,
        joinId: request.joinId, // Include joinId if present in request/client state
        side: request.side,     // Include side if present
        role: request.role,     // Include role if present
        fen: this.fen,          // FEN from client's internal state (reflects successful move)
        status: this.status,      // Status from client's internal state
        updatedAt: request.updatedAt, // Timestamp of the move operation
        createdAt: request.createdAt, // Original game creation timestamp
      };
      debug('HasyxChessClient _move received response from server:', { data: responseData });
      return { data: responseData };
    } catch (error: any) {
      debug('HasyxChessClient _move error calling server:', error);
      return { error: error.message || 'Server communication error during move' };
    }
  }

  protected override async _sync(request: ChessClientRequest): Promise<ChessServerResponse> {
    debug('HasyxChessClient _sync sending request to server:', request);
    try {
      const response: ChessServerResponse = {
        error: undefined,
        recommend: undefined,
        data: undefined,
      };
      const gamesArray = await this._hasyx.select<any[]>({
        table: 'badma_games',
        where: {
          id: { _eq: request.gameId },
        },
        limit: 1,
        returning: ['id', 'fen', 'status', 'side', 'created_at', 'updated_at']
      });

      const game = gamesArray?.[0];

      if (!game) {
        debug('HasyxChessClient _sync: Game not found', request.gameId);
        return { error: 'Game not found' };
      }

      let join: any = null;
      if (request.userId) {
        const joinsArray = await this._hasyx.select<any[]>({
          table: 'badma_joins',
          where: {
            game_id: { _eq: request.gameId },
            user_id: { _eq: request.userId }
          },
          order_by: { created_at: 'desc' },
          limit: 1,
          returning: ['id', 'side', 'role', 'created_at']
        });
        join = joinsArray?.[0];
      }
      
      response.data = {
        clientId: request.clientId,
        gameId: request.gameId as string,
        joinId: join?.id, 
        side: join?.side,
        role: join?.role,
        fen: game.fen,
        status: game.status,
        updatedAt: new Date(game.updated_at).getTime(),
        createdAt: new Date(game.created_at).getTime(),
      };
      debug('HasyxChessClient _sync received response from server:', response);
      return response;
    } catch (error: any) {
      debug('HasyxChessClient _sync error calling server:', error);
      return { error: error.message || 'Server communication error during sync' };
    }
  }
} 