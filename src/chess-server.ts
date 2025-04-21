import { ChessClientRequest, ChessServerResponse, ChessClientSide, ChessClientRole, ChessClient } from './chess-client.js';
import Debug from './debug.js';
import { v4 as uuidv4 } from 'uuid';

const debug = Debug('badma:chess-server');

export abstract class ChessServer<T extends ChessClient> {
    public _ChessLogicClass: new (server: ChessServer<T>) => T;

    constructor(ChessLogicClass: new (server: ChessServer<T>) => T) {
        this._ChessLogicClass = ChessLogicClass;
        debug('ChessServer initialized with ChessLogicClass:', ChessLogicClass.name);
    }

    // --- Abstract methods for implementation by subclasses ---

    protected abstract _create(request: ChessClientRequest): Promise<ChessServerResponse>;
    protected abstract _join(request: ChessClientRequest): Promise<ChessServerResponse>;
    protected abstract _leave(request: ChessClientRequest): Promise<ChessServerResponse>;
    protected abstract _move(request: ChessClientRequest): Promise<ChessServerResponse>;
    protected abstract _sync(request: ChessClientRequest): Promise<ChessServerResponse>;

    // --- Public API methods with validation ---

    async create(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('API: create request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        // gameId is optional
        // joinId is optional
        // side is optional
        // role is optional
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };
        if (request.side !== undefined && typeof request.side !== 'number') return { error: 'side must be a number (0, 1, or 2)'};
        if (request.role !== undefined && typeof request.role !== 'number') return { error: 'role must be a number (ChessClientRole)'};


        try {
            const response = await this._create(request);
            debug('API: create response', response);
            return response;
        } catch (error: any) {
            debug('API: create error', error);
            return { error: error.message || 'An unexpected error occurred during create' };
        }
    }

    async join(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('API: join request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        if (!request.gameId) return { error: 'gameId is required for join' };
        // joinId is optional (server might assign)
        if (request.side === undefined) return { error: 'side is required for join' };
        if (request.role === undefined) return { error: 'role is required for join' };
        if (typeof request.side !== 'number' || ![0, 1, 2].includes(request.side)) return { error: 'side must be a number (0, 1, or 2)' };
        if (typeof request.role !== 'number') return { error: 'role must be a number (ChessClientRole)'};
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };

        try {
            const response = await this._join(request);
            debug('API: join response', response);
            return response;
        } catch (error: any) {
            debug('API: join error', error);
            return { error: error.message || 'An unexpected error occurred during join' };
        }
    }

    async leave(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('API: leave request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        if (!request.gameId) return { error: 'gameId is required for leave' };
        if (!request.joinId) return { error: 'joinId is required for leave' }; // Need to identify which player is leaving
        if (request.side === undefined) return { error: 'side is required for leave (should reflect state *after* leaving, usually 0)' };
        if (request.role === undefined) return { error: 'role is required for leave (should reflect state *after* leaving, usually Anonymous)' };
        if (typeof request.side !== 'number' || ![0, 1, 2].includes(request.side)) return { error: 'side must be a number (0, 1, or 2)' };
        if (typeof request.role !== 'number') return { error: 'role must be a number (ChessClientRole)'};
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };

        try {
            const response = await this._leave(request);
            debug('API: leave response', response);
            return response;
        } catch (error: any) {
            debug('API: leave error', error);
            return { error: error.message || 'An unexpected error occurred during leave' };
        }
    }

    async move(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('API: move request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        if (!request.gameId) return { error: 'gameId is required for move' };
        if (!request.joinId) return { error: 'joinId is required for move' }; // Need to know who is moving
        if (request.side === undefined) return { error: 'side is required for move' };
        if (request.role === undefined) return { error: 'role is required for move' };
        if (!request.move) return { error: 'move data {from, to, promotion?} is required for move' };
        if (typeof request.move.from !== 'string' || !request.move.from) return { error: 'move.from (string) is required' };
        if (typeof request.move.to !== 'string' || !request.move.to) return { error: 'move.to (string) is required' };
        if (request.move.promotion !== undefined && request.move.promotion !== null && typeof request.move.promotion !== 'string') return { error: 'move.promotion must be a string or null/undefined' };
        if (typeof request.side !== 'number' || ![1, 2].includes(request.side)) return { error: 'side must be 1 or 2 for move' }; // Can't be 0
        if (typeof request.role !== 'number') return { error: 'role must be a number (ChessClientRole)'};
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };


        try {
            const response = await this._move(request);
            debug('API: move response', response);
            return response;
        } catch (error: any) {
            debug('API: move error', error);
            return { error: error.message || 'An unexpected error occurred during move' };
        }
    }

    // --- New Sync Method --- //
    async sync(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('API: sync request received', request);
        // Validation
        if (!request.clientId) return { error: 'clientId is required' };
        if (!request.userId) return { error: 'userId is required' };
        if (!request.gameId) return { error: 'gameId is required for sync' };
        if (!request.updatedAt || typeof request.updatedAt !== 'number') return { error: 'updatedAt (number) is required' };
        if (!request.createdAt || typeof request.createdAt !== 'number') return { error: 'createdAt (number) is required' };
        // Note: joinId is not required for sync request itself

        try {
            const response = await this._sync(request);
            debug('API: sync response', response);
            return response;
        } catch (error: any) {
            debug('API: sync error', error);
            return { error: error.message || 'An unexpected error occurred during sync' };
        }
    }

    // --- Abstract methods for database/state interaction (must be implemented by subclasses) ---

    public abstract __registerClient(clientId: string): Promise<any>; // Return type depends on implementation (e.g., ChessInstance)
    public abstract __getClient(clientId: string): Promise<any | undefined>;
    public abstract __checkUser(userId: string | undefined): Promise<boolean>;
    public abstract __addUser(userId: string): Promise<void>;
    public abstract __gameExists(gameId: string): Promise<boolean>;
    public abstract __getGame(gameId: string): Promise<any | undefined>; // Return type GameState or similar
    public abstract __createGame(gameId: string, gameData: any): Promise<void>; // gameData type GameState or similar
    public abstract __deleteGame(gameId: string): Promise<void>;
    public abstract __updateGame(gameId: string, updates: Partial<any>): Promise<void>; // updates type GameState or similar
    public abstract __addJoinRecord(recordData: Omit<any, 'joinCounterId'>): Promise<any>; // recordData/return JoinRecord or similar
    public abstract __updateClientState(client: any, state: Partial<any>): Promise<void>; // client/state types based on implementation
    public abstract __getAllJoinsForGame(gameId: string): Promise<any[]>; // Return JoinRecord[] or similar
    public abstract __findJoinByJoinIdAndClient(gameId: string, userId: string, joinId: string): Promise<any | undefined>; // Return JoinRecord or similar
    public abstract __findActivePlayerJoinByUser(gameId: string, userId: string): Promise<any | undefined>; // Return JoinRecord or similar
    public abstract __findActivePlayerJoinBySide(gameId: string, side: ChessClientSide): Promise<any | undefined>; // Return JoinRecord or similar
    public abstract __getGamePlayerJoins(gameId: string): Promise<any[]>; // Return JoinRecord[] or similar
    public abstract __clearJoinClientReference(joinId: string): Promise<void>;

    // --- Abstract methods for testing/inspection (must be implemented by subclasses) ---
    public abstract __getGameState(gameId: string): Promise<any | undefined>; // Return type GameState or similar
    public abstract __getUserJoins(userId: string): Promise<Omit<any, 'clientId'>[]>; // Return Omit<JoinRecord, 'clientId'>[] or similar
    public abstract __getGameJoins(gameId: string, includeClientRef?: boolean): Promise<(any | Omit<any, 'clientId'>)[]>; // Return JoinRecord[] or similar
    public abstract __reset(): Promise<void>;
}
