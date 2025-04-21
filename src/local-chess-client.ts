import { ChessClient, ChessClientRequest, ChessServerResponse } from './chess-client.js';
import { ChessServer } from './chess-server.js';
import Debug from './debug.js';

const debug = Debug('badma:local-client');

export class LocalChessClient extends ChessClient {
    private _server: ChessServer;

    constructor(server: ChessServer) {
        super(); // Call the base class constructor
        this._server = server;
        debug('LocalChessClient initialized with server:', server.constructor.name);
    }

    // Override protected methods to delegate to the server's public API

    protected override async _create(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('LocalChessClient _create sending request to server:', request);
        try {
            const response = await this._server.create(request);
            debug('LocalChessClient _create received response from server:', response);
            return response;
        } catch (error: any) {
            debug('LocalChessClient _create error calling server:', error);
            return { error: error.message || 'Server communication error during create' };
        }
    }

    protected override async _join(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('LocalChessClient _join sending request to server:', request);
        try {
            const response = await this._server.join(request);
            debug('LocalChessClient _join received response from server:', response);
            return response;
        } catch (error: any) {
            debug('LocalChessClient _join error calling server:', error);
            return { error: error.message || 'Server communication error during join' };
        }
    }

    protected override async _leave(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('LocalChessClient _leave sending request to server:', request);
        try {
            const response = await this._server.leave(request);
            debug('LocalChessClient _leave received response from server:', response);
            return response;
        } catch (error: any) {
            debug('LocalChessClient _leave error calling server:', error);
            return { error: error.message || 'Server communication error during leave' };
        }
    }

    protected override async _move(request: ChessClientRequest): Promise<ChessServerResponse> {
        debug('LocalChessClient _move sending request to server:', request);
        try {
            const response = await this._server.move(request);
            debug('LocalChessClient _move received response from server:', response);
            return response;
        } catch (error: any) {
            debug('LocalChessClient _move error calling server:', error);
            return { error: error.message || 'Server communication error during move' };
        }
    }
}
