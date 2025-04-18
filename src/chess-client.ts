import assert from 'assert';
import { Chess, ChessPossibleSide, ChessSide, ChessStatus } from './chess.js';
import Debug from './debug.js';
import { v4 as uuidv4 } from 'uuid';
const debug = Debug('badma:client');

export type ChessClientSide = 0 | 1 | 2;

export type ChessClientStatus = 'unknown' | 'await' | 'ready' | 'continue' | 'checkmate' | 'stalemate' | 'draw' | 'white_surrender' | 'black_surrender' | 'error';

export type ChessClientMove = {
  from: string;
  to: string;
  promotion?: string;
}

export enum ChessClientRole {
  Anonymous = 0,
  Player = 1,
  Voter = 2,
}

export type ChessClientResponse = {
  error?: string;
  recommend?: string;
  data?: {
    clientId: string;
    userId: string;
    gameId?: string;
    joinId?: string;
    side?: ChessClientSide;
    role?: ChessClientRole;
    fen: string;
    status: ChessClientStatus;
    updatedAt: number;
    createdAt: number;
  };
};

export type ChessServerResponse = {
  error?: string;
  recommend?: string;
  data?: {
    clientId: string;
    gameId: string;
    joinId?: string;
    side?: ChessClientSide;
    role?: ChessClientRole;
    fen: string;
    status: ChessClientStatus;
    updatedAt: number;
    createdAt: number;
  }
};

export type ChessClientRequest = {
  operation: 'create' | 'join' | 'leave' | 'move' | 'sync' | 'side' | 'surrender'
  clientId: string; // !all
  userId?: string; // ?
  gameId?: string; // ?create !other
  joinId?: string; // !sync*
  side?: ChessClientSide; // !join ?create
  role?: ChessClientRole; // !join ?create
  move?: ChessClientMove; // !move
  updatedAt: number; // !
  createdAt: number; // !
}

export class ChessClient {
  _chess: Chess;
  constructor() {
    this._chess = new Chess();
  }
  get chess() {
    return this._chess;
  }
  set chess(chess: Chess) {
    this._chess = chess;
  }
  get turn(): ChessClientSide {
    return this._chess.turn;
  }
  set turn(turn: ChessPossibleSide) {
    this._chess.turn = turn;
  }
  get fen(): string {
    return this._chess.fen;
  }
  set fen(fen: string) {
    this._chess.fen = fen;
  }
  _clientId?: string;
  get clientId(): string | undefined {
    return this._clientId;
  }
  set clientId(clientId: string) {
    this._clientId = clientId;
  }
  _userId?: string;
  get userId(): string | undefined {
    return this._userId;
  }
  set userId(userId: string) {
    this._userId = userId;
  }
  _gameId?: string;
  get gameId(): string | undefined {
    return this._gameId;
  }
  set gameId(gameId: string) {
    this._gameId = gameId;
  }
  _joinId?: string;
  get joinId(): string | undefined {
    return this._joinId;
  }
  set joinId(joinId: string) {
    this._joinId = joinId;
  }
  _side?: ChessClientSide;
  get side(): ChessClientSide | undefined {
    return this._side;
  }
  set side(side: ChessClientSide) {
    this._side = side;
  }
  _role: ChessClientRole = ChessClientRole.Anonymous;
  get role(): ChessClientRole {
    return this._role;
  }
  set role(role: ChessClientRole) {
    this._role = role;
  }

  _status: ChessClientStatus = 'unknown';
  get status(): ChessClientStatus {
    return this._status;
  }
  set status(status: ChessClientStatus) {
    this._status = status;
  }

  _updatedAt: number = Date.now();
  get updatedAt(): number {
    return this._updatedAt;
  }
  set updatedAt(updatedAt: number) {
    this._updatedAt = updatedAt;
  }
  _createdAt: number = Date.now();
  get createdAt(): number {
    return this._createdAt;
  }
  set createdAt(createdAt: number) {
    this._createdAt = createdAt;
  }

  _error(request: ChessClientRequest, response: ChessServerResponse): void {
    debug('error', request, response);
  }

  syncCreate(side?: ChessClientSide, role: ChessClientRole = ChessClientRole.Player): ChessClientResponse {
    debug('syncCreate', side, role);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (side !== undefined) this.side = side;
    if (role !== undefined) this.role = role;
    this.status = 'await';
    this.updatedAt = Date.now()
    this.createdAt = this.updatedAt
    // <before async>
    this.gameId = uuidv4();
    this.joinId = uuidv4();
    // </before async>
    const request: ChessClientRequest = {
      operation: 'create',
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
    this._create(request).then(response => {
      if (response.error) {
        this.status = 'error';
        debug('syncCreate:error', response);
        this._error(request, response);
      } else if (response.data) {
        // <after async>
        if (response.data.gameId != this.gameId) this._error(request, { ...response, error: 'gameId!=this.gameId' });
        if (response.data.joinId != this.joinId) this._error(request, { ...response, error: 'joinId!=this.joinId' });
        if (response.data.side != this.side) this._error(request, { ...response, error: 'side!=this.side' });
        if (response.data.role != this.role) this._error(request, { ...response, error: 'role!=this.role' });
        if (response.data.status != this.status) this._error(request, { ...response, error: 'status!=this.status' });
        // </after async>
      }
    }).catch(error => {
      this.status = 'error';
      debug('syncCreate:catch', error);
      this._error(request, { ...error, recommend: 'retry' });
    });
    const response: ChessClientResponse = { data: {
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      fen: this.fen,
      status: this.status,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    } };
    debug('syncCreate:response', response);
    return response;
  }
  async asyncCreate(side?: ChessClientSide, role: ChessClientRole = ChessClientRole.Player): Promise<ChessClientResponse> {
    debug('asyncCreate', side, role);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (side !== undefined) this.side = side;
    if (role !== undefined) this.role = role;
    this.status = 'await';
    this.updatedAt = Date.now()
    this.createdAt = this.updatedAt
    const request: ChessClientRequest = {
      operation: 'create',
      clientId: this.clientId,
      userId: this.userId,
      side: this.side,
      role: this.role,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
    const response = await this._create(request);
    if (response.error) {
      this.status = 'error';
      debug('asyncCreate:error', response);
      this._error(request, response);
    } else if (response.data) {
      if (response.data.gameId) this.gameId = response.data.gameId; // after async
      if (response.data.joinId) this.joinId = response.data.joinId;
      if (response.data.side) this.side = response.data.side;
      if (response.data.role) this.role = response.data.role;
      if (response.data.status) this.status = response.data.status;
    }
    const result: ChessClientResponse = { data: {
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      fen: this.fen,
      status: this.status,
      updatedAt: this.updatedAt = Date.now(),
      createdAt: this.createdAt = this.updatedAt,
    } };
    debug('asyncCreate:response', result);
    return result;
  }
  private async _create(request: ChessClientRequest): Promise<ChessServerResponse> {
    debug('_create:fake', request);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    const result: ChessServerResponse = {
      data: {
        clientId: this.clientId, // from start
        gameId: this.gameId || uuidv4(), // fake
        joinId: (request.side && request.role) ? this.joinId = uuidv4() : undefined, // fake
        side: request.side || 0, // fake just trust request
        role: request.role || 0, // fake just trust request
        fen: this.fen, // fake already
        status: this.status, // fake already
        updatedAt: request.updatedAt, // fake already
        createdAt: request.createdAt, // fake already
      }
    };
    debug('_create:fake:result', result);
    return result;
  }
  syncJoin(side: ChessClientSide, role: ChessClientRole = ChessClientRole.Player): ChessClientResponse {
    debug('syncJoin', side, role);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (!this.gameId) return { error: '!this.gameId' };
    if (!!this.joinId) return { error: '!!this.joinId' };
    if (this.side !== undefined) return { error: 'side!=undefined' };
    if (this.status !== 'await') return { error: 'status!=await' };
    // <before async>
    this.joinId = uuidv4();
    this.side = side;
    this.role = role;
    this.updatedAt = Date.now();
    // </before async>
    const request: ChessClientRequest = {
      operation: 'join',
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
    this._join(request).then(response => {
      if (response.error) {
        this.status = 'error';
        debug('syncJoin:error', response);
        this._error(request, response);
      } else if (response.data) {
        // <after async>
        if (response.data.joinId) this.joinId = response.data.joinId;
        if (response.data.side != this.side) this._error(request, { ...response, error: 'side!=this.side' });
        if (response.data.role != this.role) this._error(request, { ...response, error: 'role!=this.role' });
        if (response.data.status != this.status) this._error(request, { ...response, error: 'status!=this.status' });
        // </after async>
      }
    }).catch(error => {
      this.status = 'error';
      debug('syncJoin:catch', error);
      this._error(request, { ...error, recommend: 'retry' });
    });
    const response: ChessClientResponse = { data: {
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      fen: this.fen,
      status: this.status,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    } };
    debug('syncJoin:response', response);
    return response;
  }
  async asyncJoin(side: ChessClientSide, role: ChessClientRole = ChessClientRole.Player): Promise<ChessClientResponse> {
    debug('asyncJoin', side, role);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (!this.gameId) return { error: '!this.gameId' };
    if (!!this.joinId) return { error: '!!this.joinId' };
    if (this.side !== undefined) return { error: 'side!=undefined' };
    if (this.status !== 'await') return { error: 'status!=await' };
    // <before async>
    this.side = side;
    this.role = role;
    this.updatedAt = Date.now();
    // </before async>
    const request: ChessClientRequest = {
      operation: 'join',
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      side: this.side,
      role: this.role,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
    const response = await this._join(request);
    if (response.data) {
      if (response.data.joinId) this.joinId = response.data.joinId; // after async
      if (response.data.side) this.side = response.data.side;
      if (response.data.role) this.role = response.data.role;
      if (response.data.fen) this.fen = response.data.fen;
      if (response.data.status) this.status = response.data.status;
    }
    const result: ChessClientResponse = { data: {
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      fen: this.fen,
      status: this.status,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    } };
    debug('asyncJoin:response', result);
    return result;
  }
  private async _join(request: ChessClientRequest): Promise<ChessServerResponse> {
    debug('_join:fake', request);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (!this.gameId) return { error: '!this.gameId' };
    if (request.side == undefined) return { error: '!side' };
    const result: ChessServerResponse = {
      data: {
        clientId: this.clientId, // from start
        gameId: this.gameId, // already
        joinId: request.joinId || uuidv4(), // fake
        side: request.side, // fake just trust request
        role: request.role, // fake just trust request
        fen: this.fen, // fake already
        status: this.status, // fake already
        updatedAt: request.updatedAt, // fake already
        createdAt: request.createdAt, // fake already
      }
    };
    debug('_join:fake:result', result);
    return result;
  }
  syncLeave(side: ChessClientSide): ChessClientResponse {
    debug('syncLeave', side);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (!this.gameId) return { error: '!this.gameId' };
    if (!this.joinId) return { error: '!this.joinId' };
    if (this.side !== undefined) return { error: 'side!=undefined' };
    if (this.role == ChessClientRole.Anonymous) return { error: 'role==Anonymous' };
    if (this.status !== 'await' && this.status !== 'ready' && this.status !== 'continue') return { error: 'status!=await|ready|continue' };
    // <before async>
    this.joinId = uuidv4();
    this.side = 0;
    this.role = ChessClientRole.Anonymous;
    this.updatedAt = Date.now();
    // </before async>
    const request: ChessClientRequest = {
      operation: 'leave',
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
    this._leave(request).then(response => {
      if (response.error) {
        this.status = 'error';
        debug('syncLeave:error', response);
        this._error(request, response);
      } else if (response.data) {
        // <after async>
        if (response.data.joinId) this.joinId = response.data.joinId;
        if (response.data.side != this.side) this._error(request, { ...response, error: 'side!=this.side' });
        if (response.data.role != this.role) this._error(request, { ...response, error: 'role!=this.role' });
        if (response.data.status != this.status) this._error(request, { ...response, error: 'status!=this.status' });
        // </after async>
      }
    }).catch(error => {
      this.status = 'error';
      debug('syncLeave:catch', error);
      this._error(request, { ...error, recommend: 'retry' });
    });
    const response: ChessClientResponse = { data: {
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      fen: this.fen,
      status: this.status,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    } };
    debug('syncJoin:response', response);
    return response;
  }
  async asyncLeave(side: ChessClientSide): Promise<ChessClientResponse> {
    debug('asyncLeave', side);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (!this.gameId) return { error: '!this.gameId' };
    if (!!this.joinId) return { error: '!!this.joinId' };
    if (this.side == undefined) return { error: 'side==undefined' };
    if (this.role == ChessClientRole.Anonymous) return { error: 'role==Anonymous' };
    if (this.status !== 'await' && this.status !== 'ready' && this.status !== 'continue') return { error: 'status!=await|ready|continue' };
    // <before async>
    this.side = 0;
    this.role = ChessClientRole.Anonymous;
    this.updatedAt = Date.now();
    // </before async>
    const request: ChessClientRequest = {
      operation: 'leave',
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      side: this.side,
      role: this.role,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
    const response = await this._join(request);
    if (response.data) {
      if (response.data.joinId) this.joinId = response.data.joinId; // after async
      if (response.data.side) this.side = response.data.side;
      if (response.data.role) this.role = response.data.role;
      if (response.data.fen) this.fen = response.data.fen;
      if (response.data.status) this.status = response.data.status;
    }
    const result: ChessClientResponse = { data: {
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      fen: this.fen,
      status: this.status,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    } };
    debug('asyncLeave:response', result);
    return result;
  }
  private async _leave(request: ChessClientRequest): Promise<ChessServerResponse> {
    debug('_leave:fake', request);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (!this.gameId) return { error: '!this.gameId' };
    if (request.side == undefined) return { error: '!side' };
    if (request.role == undefined) return { error: '!role' };
    const result: ChessServerResponse = {
      data: {
        clientId: this.clientId, // from start
        gameId: this.gameId, // already
        joinId: request.joinId || uuidv4(), // fake
        side: request.side, // fake just trust request
        role: request.role, // fake just trust request
        fen: this.fen, // fake already
        status: this.status, // fake already
        updatedAt: request.updatedAt, // fake already
        createdAt: request.createdAt, // fake already
      }
    };
    debug('_leave:fake:result', result);
    return result;
  }
  syncMove(move: ChessClientMove): ChessClientResponse {
    debug('syncMove', move);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (!this.gameId) return { error: '!this.gameId' };
    if (!this.joinId) return { error: '!this.joinId' };
    if (!this.side) return { error: '!side' };
    if (!this.role) return { error: '!role' };
    if (this.status !== 'ready' && this.status !== 'continue') return { error: 'status!=ready|continue' };
    // <before async>
    this.joinId = uuidv4();
    this.side = 0;
    this.role = ChessClientRole.Anonymous;
    this.updatedAt = Date.now();
    const moved = this.chess.move({ ...move, side: this.side as ChessSide });
    if (moved.error) return { error: moved.error };
    if (!moved.success) return { error: '!moved.success' };
    if (this.chess.isGameOver) this.status = this.chess.status;
    // </before async>
    const request: ChessClientRequest = {
      operation: 'move',
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      move: move,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
    this._move(request).then(response => {
      if (response.error) {
        this.status = 'error';
        debug('syncMove:error', response);
        this._error(request, response);
      } else if (response.data) {
        // <after async>
        if (response.data.fen != this.fen) {
          this.fen = response.data.fen;
          this._error(request, { ...response, error: 'fen!=this.fen' });
        }
        if (response.data.status != this.status) {
          this.status = response.data.status;
          this._error(request, { ...response, error: 'status!=this.status' });
        }
        // </after async>
      }
    }).catch(error => {
      this.status = 'error';
      debug('syncMove:catch', error);
      this._error(request, { ...error, recommend: 'retry' });
    });
    const response: ChessClientResponse = { data: {
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId,
      side: this.side,
      role: this.role,
      fen: this.fen,
      status: this.status,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    } };
    debug('syncMove:response', response);
    return response;
  }
  private async _move(request: ChessClientRequest): Promise<ChessServerResponse> {
    debug('_move:fake', request);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (!this.gameId) return { error: '!this.gameId' };
    if (!request.side) return { error: '!side' };
    if (!request.role) return { error: '!role' };
    if (!request.move) return { error: '!move' };
    const result: ChessServerResponse = {
      data: {
        clientId: this.clientId, // from start
        gameId: this.gameId, // already
        joinId: this.joinId, // already
        side: this.side, // already
        role: this.role, // already
        fen: this.fen, // already
        status: this.status, // already
        updatedAt: this.updatedAt, // already
        createdAt: this.createdAt, // already
      }
    };
    debug('_move:fake:result', result);
    return result;
  }
}