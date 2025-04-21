import { LocalChessServer } from '../local-chess-server.js';
import { LocalChessClient } from '../local-chess-client.js';
import { ChessClient, ChessClientRole, ChessClientStatus } from '../chess-client.js'; // Import base class for server constructor
import { v4 as uuidv4 } from 'uuid';
import Debug from '../debug.js';

const debug = Debug('badma:test:local-client');

describe('LocalChessClient <-> LocalChessServer Interaction', () => {

    it('should handle a full game cycle (Fools Mate)', async () => {
        debug('Starting Fool\'s Mate test');

        // 1. Setup Server and Clients
        const server = new LocalChessServer(ChessClient); // Use base ChessClient for server logic

        // ---> ADD USERS TO SERVER BEFORE CLIENT OPERATIONS <---
        await server.__addUser('user-white-fools');
        await server.__addUser('user-black-fools');

        const whiteClient = new LocalChessClient(server);
        whiteClient.clientId = uuidv4();
        whiteClient.userId = 'user-white-fools';

        const blackClient = new LocalChessClient(server);
        blackClient.clientId = uuidv4();
        blackClient.userId = 'user-black-fools';

        debug(`White Client ID: ${whiteClient.clientId}, User ID: ${whiteClient.userId}`);
        debug(`Black Client ID: ${blackClient.clientId}, User ID: ${blackClient.userId}`);

        // 2. Black creates and joins the game
        debug('Black creating game...');
        const createResponse = await blackClient.asyncCreate(2, ChessClientRole.Player); // Black is side 2
        expect(createResponse.error).toBeUndefined();
        expect(createResponse.data).toBeDefined();
        const gameId = createResponse.data!.gameId!;
        debug(`Game created by Black. Game ID: ${gameId}, Black Join ID: ${blackClient.joinId}`);
        expect(blackClient.gameId).toBe(gameId);
        expect(blackClient.side).toBe(2);
        expect(blackClient.role).toBe(ChessClientRole.Player);
        expect(blackClient.status).toBe('await'); // Still waiting for White

        // 3. White joins the game
        debug('White joining game...');
        whiteClient.gameId = gameId; // Manually set gameId for white client
        const joinResponse = await whiteClient.asyncJoin(1, ChessClientRole.Player); // White is side 1
        expect(joinResponse.error).toBeUndefined();
        expect(joinResponse.data).toBeDefined();
        debug(`White joined game. White Join ID: ${whiteClient.joinId}`);
        expect(whiteClient.gameId).toBe(gameId);
        expect(whiteClient.side).toBe(1);
        expect(whiteClient.role).toBe(ChessClientRole.Player);
        // Status should now be ready for both players after server processes join
        expect(whiteClient.status).toBe('ready');
        // We also need to update black's status, normally this happens via events/sync,
        // but for this test, let's manually sync it based on server state
        const serverGameState = await server.__getGameState(gameId);
        expect(serverGameState?.status).toBe('ready');
        blackClient.status = serverGameState!.status;
        expect(blackClient.status).toBe('ready');

        // 4. Play Fool's Mate
        // Move 1: White f2-f3
        debug('Move 1: White f2-f3');
        let moveResponse = await whiteClient.asyncMove({ from: 'f2', to: 'f3' });
        expect(moveResponse.error).toBeUndefined();
        expect(moveResponse.data?.status).toBe('continue');
        // Update clients based on response FEN/status
        whiteClient.fen = moveResponse.data!.fen;
        whiteClient.status = moveResponse.data!.status;
        blackClient.fen = moveResponse.data!.fen;
        blackClient.status = moveResponse.data!.status;

        // Move 1: Black e7-e5
        debug('Move 1: Black e7-e5');
        moveResponse = await blackClient.asyncMove({ from: 'e7', to: 'e5' });
        expect(moveResponse.error).toBeUndefined();
        expect(moveResponse.data?.status).toBe('continue');
        whiteClient.fen = moveResponse.data!.fen;
        whiteClient.status = moveResponse.data!.status;
        blackClient.fen = moveResponse.data!.fen;
        blackClient.status = moveResponse.data!.status;

        // Move 2: White g2-g4
        debug('Move 2: White g2-g4');
        moveResponse = await whiteClient.asyncMove({ from: 'g2', to: 'g4' });
        expect(moveResponse.error).toBeUndefined();
        expect(moveResponse.data?.status).toBe('continue');
        whiteClient.fen = moveResponse.data!.fen;
        whiteClient.status = moveResponse.data!.status;
        blackClient.fen = moveResponse.data!.fen;
        blackClient.status = moveResponse.data!.status;

        // Move 2: Black d8-h4# (Checkmate)
        debug('Move 2: Black d8-h4#');
        moveResponse = await blackClient.asyncMove({ from: 'd8', to: 'h4' });
        expect(moveResponse.error).toBeUndefined();
        expect(moveResponse.data?.status).toBe('checkmate');
        whiteClient.fen = moveResponse.data!.fen;
        whiteClient.status = moveResponse.data!.status;
        blackClient.fen = moveResponse.data!.fen;
        blackClient.status = moveResponse.data!.status;

        // 5. Verify Final State
        debug('Verifying final state...');
        const finalFen = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'; // Expected FEN after Qh4#

        expect(whiteClient.status).toBe('checkmate');
        expect(blackClient.status).toBe('checkmate');

        expect(whiteClient.fen).toBe(finalFen);
        expect(blackClient.fen).toBe(finalFen);

        // Check server state as well
        const finalServerState = await server.__getGameState(gameId);
        expect(finalServerState?.status).toBe('checkmate');
        expect(finalServerState?.fen).toBe(finalFen);

        debug('Fool\'s Mate test completed successfully!');
    });

    it('should update client state correctly after leave/surrender', async () => {
        debug('Starting client state after leave test');
        const server = new LocalChessServer(ChessClient);
        await server.__addUser('user-leaver');
        await server.__addUser('user-opponent');

        const leavingClient = new LocalChessClient(server);
        leavingClient.clientId = uuidv4();
        leavingClient.userId = 'user-leaver';

        const opponentClient = new LocalChessClient(server);
        opponentClient.clientId = uuidv4();
        opponentClient.userId = 'user-opponent';

        // Leaver creates and joins as White
        const createRes = await leavingClient.asyncCreate(1, ChessClientRole.Player);
        const gameId = createRes.data!.gameId!;
        const initialJoinId = leavingClient.joinId;
        expect(initialJoinId).toBeDefined();
        expect(leavingClient.side).toBe(1);
        expect(leavingClient.role).toBe(ChessClientRole.Player);
        expect(leavingClient.status).toBe('await');

        // Opponent joins as Black
        opponentClient.gameId = gameId;
        await opponentClient.asyncJoin(2, ChessClientRole.Player);
        // Manually sync status after opponent joins for leaver
        leavingClient.status = (await server.__getGameState(gameId))!.status;
        expect(leavingClient.status).toBe('ready');

        // Leaver leaves/surrenders
        debug(`Leaver (Side ${leavingClient.side}) leaving with joinId ${leavingClient.joinId}...`);
        const leaveResponse = await leavingClient.asyncLeave(1); // Pass the side that is leaving

        debug('Leave response received:', leaveResponse);
        expect(leaveResponse.error).toBeUndefined();
        expect(leaveResponse.data).toBeDefined();

        // Verify client state after successful leave
        expect(leavingClient.side).toBe(0); // Should become Anonymous spectator
        expect(leavingClient.role).toBe(ChessClientRole.Anonymous);
        // JoinId should be updated to the ID of the leave event
        expect(leavingClient.joinId).toBe(leaveResponse.data!.joinId);
        expect(leavingClient.joinId).not.toBe(initialJoinId); // Ensure it changed
        expect(leavingClient.status).toBe('white_surrender'); // Status reflects surrender

        // Verify server state as well (optional but good)
        const finalServerState = await server.__getGameState(gameId);
        expect(finalServerState?.status).toBe('white_surrender');

        debug('Client state after leave test completed successfully!');
    });
});
