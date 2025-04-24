import { v4 as uuidv4 } from 'uuid';
import { ChessClient, ChessClientRequest, ChessClientRole, ChessClientSide, ChessClientStatus, ChessServerResponse } from './chess-client.js';
import { ChessServer } from './chess-server.js';
import Debug from './debug.js';
// No Chess import needed here

const debug = Debug('local-chess-server');

type ChessInstance = ChessClient;

export interface GameState {
    userId: string;
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

export class LocalChessServer extends ChessServer<ChessClient> {
    public _games: Record<string, GameState> = {};
    public _users: Record<string, boolean> = {};
    public _joins: JoinRecord[] = [];
    public _joinCounter: number = 0;

    constructor(ChessClass = ChessClient) {
        super(ChessClass as any);
        debug('LocalChessServer initialized (managing ChessClient)');
    }

    public async __checkUser(userId: string | undefined): Promise<boolean> {
        if (!userId || !this._users[userId]) {
             debug(`Error: User check failed for userId: ${userId}`);
            return false;
        }
        return true;
    }

    public async __addUser(): Promise<string> {
        const userId = uuidv4();
        this._users[userId] = true;
        return userId;
    }

    public async __gameExists(gameId: string): Promise<boolean> {
        return !!this._games[gameId];
    }

    public async __getGame(gameId: string): Promise<GameState | undefined> {
        return this._games[gameId];
    }

    public async __createGame(gameId: string, gameData: GameState): Promise<void> {
        this._games[gameId] = gameData;
        debug(`__createGame`, { id: gameId, ...gameData });
    }

    public async __updateGame(gameId: string, updates: Partial<GameState>): Promise<void> {
        const game = this._games[gameId];
        if (game) {
            this._games[gameId] = { ...game, ...updates };
            debug(`Game ${gameId} updated:`, updates);
        } else {
            debug(`Error: Cannot update non-existent game ${gameId}`);
        }
    }

    public async __addJoinRecord(recordData: Omit<JoinRecord, 'joinCounterId'>): Promise<JoinRecord> {
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

    public async __getAllJoinsForGame(gameId: string): Promise<JoinRecord[]> {
        return this._joins.filter(j => j.gameId === gameId);
    }
    public async __getGameJoins(gameId: string, includeClientRef: boolean = false): Promise<(JoinRecord | Omit<JoinRecord, 'clientId'>)[]> {
        const joins = await this.__getAllJoinsForGame(gameId);
        return includeClientRef ? joins : joins.map(({ clientId, ...rest }) => rest);
    }

    public async __findJoinByJoinIdAndClient(gameId: string, userId: string, joinId: string): Promise<JoinRecord | undefined> {
         return this._joins.find(j => j.joinId === joinId && j.gameId === gameId && j.userId === userId && j.clientId);
     }

    public async __findActivePlayerJoinByUser(gameId: string, userId: string): Promise<JoinRecord | undefined> {
        const userJoins = this._joins.filter(j => j.gameId === gameId && j.userId === userId && j.role === ChessClientRole.Player && j.clientId);
        return userJoins.sort((a, b) => b.joinCounterId - a.joinCounterId)[0]; // Get latest
    }

    public async __findActivePlayerJoinBySide(gameId: string, side: ChessClientSide): Promise<JoinRecord | undefined> {
        const sideJoins = this._joins.filter(j => j.gameId === gameId && j.side === side && j.role === ChessClientRole.Player && j.clientId);
        return sideJoins.sort((a, b) => b.joinCounterId - a.joinCounterId)[0]; // Get latest
    }

    public async __getGamePlayerJoins(gameId: string): Promise<JoinRecord[]> {
        const allGameJoins = this._joins.filter(j => j.gameId === gameId && j.clientId);
        const latestJoinsByUser: Record<string, JoinRecord> = {};
        allGameJoins.sort((a, b) => a.joinCounterId - b.joinCounterId).forEach(j => {
            latestJoinsByUser[j.userId] = j;
        });
        return Object.values(latestJoinsByUser).filter(j => j.role === ChessClientRole.Player);
    }

    public async __clearJoinClientReference(joinId: string): Promise<void> {
        const joinIndex = this._joins.findIndex(j => j.joinId === joinId && j.clientId);
        if (joinIndex !== -1) {
            this._joins[joinIndex].clientId = undefined;
            debug(`Cleared clientId for join record ${joinId}`);
        } else {
            debug(`Could not find active join record ${joinId} to clear client reference.`);
        }
    }

     public async __getGameState(gameId: string): Promise<GameState | undefined> {
         return this._games[gameId];
     }

     public async __reset(): Promise<void> {
         this._games = {};
         this._users = {};
         this._joins = [];
         this._joinCounter = 0;
         super.__reset();
         debug('LocalChessServer state reset.');
     }

    public async __findActiveJoinByClientId(gameId: string, clientId: string): Promise<JoinRecord | undefined> {
        const clientJoins = this._joins.filter(j => j.gameId === gameId && j.clientId === clientId);
        return clientJoins.sort((a, b) => b.joinCounterId - a.joinCounterId)[0];
    }
}
