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
  set joinId(joinId: string | undefined) {
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
    if (this.side === 0) return { error: 'side === 0 (Anonymous cannot leave/surrender)' };
    if (this.role == ChessClientRole.Anonymous) return { error: 'role==Anonymous (Anonymous cannot leave/surrender)' };
    if (this.status !== 'await' && this.status !== 'ready' && this.status !== 'continue') return { error: `status(${this.status}) not await|ready|continue` };
    
    // Determine surrender status
    const surrenderStatus: ChessClientStatus = this.side === 1 ? 'white_surrender' : 'black_surrender';

    // <before async>
    this.status = surrenderStatus; // Set game status to surrender
    this.updatedAt = Date.now();
    
    // State after leaving/surrendering: become anonymous spectator
    const finalSide: ChessClientSide = 0;
    const finalRole: ChessClientRole = ChessClientRole.Anonymous;
    const finalJoinId = undefined; // Or keep it? Needs clarification for server logic. Assuming clear for now.
    // </before async>
    
    const request: ChessClientRequest = {
      operation: 'leave', // Operation could also be 'surrender' depending on server API
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId, // Send the current joinId for identification
      side: finalSide, // Sending the state AFTER leaving
      role: finalRole,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };

    this._leave(request).then(response => {
      if (response.error) {
        // Should we revert status on error? Or keep surrender status?
        // Keeping surrender status for now.
        debug('syncLeave:error', response);
        this._error(request, response);
      } else if (response.data) {
        // Update local state based on successful server response
        this.side = response.data.side ?? finalSide;
        this.role = response.data.role ?? finalRole;
        this.joinId = response.data.joinId; // Server might return null/undefined or keep it
        this.status = response.data.status ?? this.status; // Use server status if provided, else keep surrender
        this.fen = response.data.fen ?? this.fen;
        this.updatedAt = response.data.updatedAt ?? this.updatedAt;
        debug('syncLeave:success', response.data);
      }
    }).catch(error => {
      // Similar decision: keep surrender status on catch?
      debug('syncLeave:catch', error);
      this._error(request, { ...error, recommend: 'retry' });
    });

    // Immediately update local state to reflect surrender & becoming anonymous
    this.side = finalSide;
    this.role = finalRole;
    this.joinId = finalJoinId;
    // Status already set to surrenderStatus

    const response: ChessClientResponse = { data: {
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId, // Send final joinId state
      side: this.side,     // Send final side state
      role: this.role,     // Send final role state
      fen: this.fen,       // FEN doesn't change on surrender
      status: this.status, // Send surrender status
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    } };
    debug('syncLeave:response', response);
    return response;
  }
  async asyncLeave(side: ChessClientSide): Promise<ChessClientResponse> {
    debug('asyncLeave', side);
    if (!this.clientId) return { error: '!this.clientId' };
    if (!this.userId) return { error: '!this.userId' };
    if (!this.gameId) return { error: '!this.gameId' };
    if (this.side === 0) return { error: 'side === 0 (Anonymous cannot leave/surrender)' };
    if (this.role == ChessClientRole.Anonymous) return { error: 'role==Anonymous (Anonymous cannot leave/surrender)' };
    if (this.status !== 'await' && this.status !== 'ready' && this.status !== 'continue') return { error: `status(${this.status}) not await|ready|continue` };
    
    // Determine surrender status based on provided side argument
    const surrenderStatus: ChessClientStatus = side === 1 ? 'white_surrender' : 'black_surrender';

    // <before async>
    this.status = surrenderStatus;
    this.updatedAt = Date.now();
    
    // State after leaving/surrendering: become anonymous spectator
    const finalSide: ChessClientSide = 0;
    const finalRole: ChessClientRole = ChessClientRole.Anonymous;
    const finalJoinId = undefined; // Assuming clear for now.
    // </before async>
    
    const request: ChessClientRequest = {
      operation: 'leave', // Or 'surrender'
      clientId: this.clientId,
      userId: this.userId,
      gameId: this.gameId,
      joinId: this.joinId, // Send current joinId
      side: finalSide, // Sending final state
      role: finalRole,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };

    // Call the actual _leave method
    const response = await this._leave(request);
    
    // Update state based on response, falling back to optimistic update
    if (response.error) {
      debug('asyncLeave:error', response);
      // Keep optimistic surrender status on error?
      this._error(request, response);
    } else if (response.data) {
      debug('asyncLeave:success', response.data);
      this.side = response.data.side ?? finalSide;
      this.role = response.data.role ?? finalRole;
      this.joinId = response.data.joinId; // Server might return null/undefined
      this.status = response.data.status ?? this.status; // Use server status or keep surrender
      this.fen = response.data.fen ?? this.fen;
      this.updatedAt = response.data.updatedAt ?? this.updatedAt;
    } else {
      // No error, no data? Fallback to optimistic update
      this.side = finalSide;
      this.role = finalRole;
      this.joinId = finalJoinId;
      // Status already set to surrenderStatus
    }

    // Result reflects the state AFTER the operation attempted/completed
    const result: ChessClientResponse = { 
      error: response.error, // Propagate error from server
      data: {
        clientId: this.clientId,
        userId: this.userId,
        gameId: this.gameId,
        joinId: this.joinId, // Current (potentially cleared) joinId
        side: this.side,     // Current (likely 0) side
        role: this.role,     // Current (likely Anonymous) role
        fen: this.fen,       // Current fen
        status: this.status, // Current status (surrender or from server)
        updatedAt: this.updatedAt,
        createdAt: this.createdAt,
      } 
    };
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
    if (!this.side) return { error: '!this.side client side not set' };
    if (!this.role) return { error: '!this.role client role not set' };
    if (this.status !== 'ready' && this.status !== 'continue') return { error: `status(${this.status})!=ready|continue` };
    this.updatedAt = Date.now();
    
    // Check if game is already over based on current client state/chess instance
    if (this.chess.isGameOver) {
      const reason = this.chess.status;
      this.status = reason; // Update client status if game was already over
      debug(`syncMove: game already over (${reason}), updated status`);
      return { error: `Game is already over: ${reason}` };
    }

    const moved = this.chess.move(move);
    if (moved.error) {
      debug('syncMove:invalid move:', moved.error);
      // Check if the error was due to the game ending (e.g., stalemate/draw detection during move)
      if (this.chess.isGameOver) {
        this.status = this.chess.status; // Update status if move resulted in game over
        debug(`syncMove: move resulted in game over (${this.status}), updated status`);
      }
      return { error: moved.error };
    }
    // Update status only if the move was successful and didn't end the game immediately
    this.status = this.chess.status;
    debug('syncMove:success, new status:', this.status, 'new fen:', this.fen);
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
    const response: ChessClientResponse = {
      data: {
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
      }
    };
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