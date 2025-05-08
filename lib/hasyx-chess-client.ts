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
          userId: request.userId,
          fen: this.fen,
          status: 'await',
          updatedAt: request.updatedAt,
          createdAt: request.createdAt,
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
          created_at: new Date(request.createdAt).toISOString(),
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
        updatedAt: new Date(request.createdAt).valueOf(),
        createdAt: new Date(request.createdAt).valueOf(),
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
          created_at: new Date(request.createdAt).toISOString(),
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
        updatedAt: new Date(request.createdAt).valueOf(),
        createdAt: new Date(request.createdAt).valueOf(),
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
      const response: ChessServerResponse = {
        error: undefined,
        recommend: undefined,
        data: undefined,
      };
      const moves = await this._hasyx.insert({
        table: 'badma_moves',
        object: {
          from: request.move.from,
          to: request.move.to,
          promotion: request.move.promotion,
          user_id: request.userId,
          game_id: request.gameId,
          created_at: new Date(request.createdAt).toISOString(),
        },
      });
      response.data = {
        clientId: request.clientId,
        gameId: request.gameId as string,
        // joinId: undefined,
        // side: request.side,
        // role: 0,
        fen: this.fen,
        status: this.status,
        updatedAt: request.updatedAt,
        createdAt: request.createdAt,
      };
      debug('HasyxChessClient _move received response from server:', response);
      return response;
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
      const games = await this._hasyx.select({
        table: 'badma_games',
        where: {
          id: request.gameId,
          game_id: request.gameId,
          returning: {
            joins: {
              order_by: { created_at: 'desc' },
              distinct_on: ['side'],
            },
          },
        },
      });
      const game = games[0];
      const join = game?.joins?.filter((join: any) => join.userId === request.userId)[0];
      response.data = {
        clientId: request.clientId,
        gameId: request.gameId as string,
        joinId: join?.id,
        side: join?.side,
        role: join?.role,
        fen: game?.fen,
        status: game?.status,
        updatedAt: game?.updatedAt,
        createdAt: game?.createdAt,
      };
      debug('HasyxChessClient _sync received response from server:', response);
      return response;
    } catch (error: any) {
      debug('HasyxChessClient _sync error calling server:', error);
      return { error: error.message || 'Server communication error during sync' };
    }
  }
} 