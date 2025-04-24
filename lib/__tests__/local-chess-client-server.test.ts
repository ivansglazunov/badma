import { LocalChessServer } from '../local-chess-server';
import { LocalChessClient } from '../local-chess-client';
import { ChessClient, ChessClientRole, ChessClientStatus } from '../chess-client'; // Import base class for server constructor
import { v4 as uuidv4 } from 'uuid';
import Debug from '../debug';

const debug = Debug('test:local-chess-client');

describe('LocalChessClient <-> LocalChessServer Interaction', () => {

    it('should handle a full game cycle (Fools Mate)', async () => {
        debug('Starting Fool\'s Mate test');

        // 1. Setup Server and Clients
        const server = new LocalChessServer(ChessClient); // Pass LocalChessClient constructor

        // ---> ADD USERS TO SERVER BEFORE CLIENT OPERATIONS <---
        const userId1 = await server.__addUser();
        const userId2 = await server.__addUser();

        const whiteClient = new LocalChessClient(server);
        whiteClient.clientId = uuidv4();
        whiteClient.userId = userId1;

        const blackClient = new LocalChessClient(server);
        blackClient.clientId = uuidv4();
        blackClient.userId = userId2;

        debug(`White Client ID: ${whiteClient.clientId}, User ID: ${whiteClient.userId}`);
        debug(`Black Client ID: ${blackClient.clientId}, User ID: ${blackClient.userId}`);

        // 2. Black creates and joins the game
        debug('Black creating game...');
        const createResponse = await blackClient.asyncCreate(1);
        expect(createResponse.error).toBeUndefined();
        expect(createResponse.data).toBeDefined();
        const gameId = createResponse.data!.gameId!;
        debug(`Game created by Black. Game ID: ${gameId}, Black Join ID: ${blackClient.joinId}`);
        expect(blackClient.gameId).toBe(gameId);
        expect(blackClient.side).toBe(0);
        expect(blackClient.role).toBe(ChessClientRole.Anonymous);
        expect(blackClient.status).toBe('await'); // Still waiting for White

        // 3. Black joins the game
        debug('White black joining game...');
        const joinResponseBlack = await blackClient.asyncJoin(2, ChessClientRole.Player);
        expect(joinResponseBlack.error).toBeUndefined();
        expect(joinResponseBlack.data).toBeDefined();
        debug(`Black joined game. Black Join ID: ${blackClient.joinId}`);
        expect(blackClient.gameId).toBe(gameId);
        expect(blackClient.side).toBe(2);
        expect(blackClient.role).toBe(ChessClientRole.Player);
        expect(blackClient.status).toBe('await');

        // 3. White joins the game
        debug('White white joining game...');
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
        // const serverGameState = await server.__getGameState(gameId);
        // expect(serverGameState?.status).toBe('ready');
        // blackClient.status = serverGameState!.status;
        const syncResponseBlack = await blackClient.asyncSync(); // Use asyncSync instead of manual update
        expect(syncResponseBlack.error).toBeUndefined();
        expect(blackClient.status).toBe('ready');

        // 4. Play Fool's Mate
        // Move 1: White f2-f3
        debug('Move 1: White f2-f3');
        let moveResponse = await whiteClient.asyncMove({ from: 'f2', to: 'f3' });
        expect(moveResponse.error).toBeUndefined();
        expect(moveResponse.data?.status).toBe('continue');
        // Update clients based on response FEN/status - REMOVED MANUAL SYNC
        // whiteClient.fen = moveResponse.data!.fen;
        // whiteClient.status = moveResponse.data!.status;
        // blackClient.fen = moveResponse.data!.fen;
        // blackClient.status = moveResponse.data!.status;
        // Sync black client after white's move
        await blackClient.asyncSync();
        expect(blackClient.status).toBe('continue');
        expect(blackClient.fen).toBe(whiteClient.fen); // White client updated internally

        // Move 1: Black e7-e5
        debug('Move 1: Black e7-e5');
        moveResponse = await blackClient.asyncMove({ from: 'e7', to: 'e5' });
        expect(moveResponse.error).toBeUndefined();
        expect(moveResponse.data?.status).toBe('continue');
        // REMOVED MANUAL SYNC
        // whiteClient.fen = moveResponse.data!.fen;
        // whiteClient.status = moveResponse.data!.status;
        // blackClient.fen = moveResponse.data!.fen;
        // blackClient.status = moveResponse.data!.status;
        // Sync white client after black's move
        await whiteClient.asyncSync();
        expect(whiteClient.status).toBe('continue');
        expect(whiteClient.fen).toBe(blackClient.fen);

        // Move 2: White g2-g4
        debug('Move 2: White g2-g4');
        moveResponse = await whiteClient.asyncMove({ from: 'g2', to: 'g4' });
        expect(moveResponse.error).toBeUndefined();
        expect(moveResponse.data?.status).toBe('continue');
        // REMOVED MANUAL SYNC
        // whiteClient.fen = moveResponse.data!.fen;
        // whiteClient.status = moveResponse.data!.status;
        // blackClient.fen = moveResponse.data!.fen;
        // blackClient.status = moveResponse.data!.status;
        // Sync black client after white's move
        await blackClient.asyncSync();
        expect(blackClient.status).toBe('continue');
        expect(blackClient.fen).toBe(whiteClient.fen);

        // Move 2: Black d8-h4# (Checkmate)
        debug('Move 2: Black d8-h4#');
        moveResponse = await blackClient.asyncMove({ from: 'd8', to: 'h4' });
        expect(moveResponse.error).toBeUndefined();
        expect(moveResponse.data?.status).toBe('checkmate');
        // REMOVED MANUAL SYNC
        // whiteClient.fen = moveResponse.data!.fen;
        // whiteClient.status = moveResponse.data!.status;
        // blackClient.fen = moveResponse.data!.fen;
        // blackClient.status = moveResponse.data!.status;
        // Sync white client after black's move
        await whiteClient.asyncSync();
        expect(whiteClient.status).toBe('checkmate');
        expect(whiteClient.fen).toBe(blackClient.fen);

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
        const server = new LocalChessServer(ChessClient); // Pass LocalChessClient constructor
        const userId1 = await server.__addUser();
        const userId2 = await server.__addUser();

        const leavingClient = new LocalChessClient(server);
        leavingClient.clientId = uuidv4();
        leavingClient.userId = userId1;

        const opponentClient = new LocalChessClient(server);
        opponentClient.clientId = uuidv4();
        opponentClient.userId = userId2;

        // Leaver creates and joins as White
        const createRes = await leavingClient.asyncCreate(1);
        expect(createRes.error).toBeUndefined();
        const gameId = createRes.data!.gameId!;
        expect(gameId).toBeDefined();
        expect(leavingClient.side).toBe(0);
        expect(leavingClient.role).toBe(0);
        expect(leavingClient.status).toBe('await');

        // User joins as White
        const joinRes = await leavingClient.asyncJoin(1, ChessClientRole.Player);
        const initialJoinId = leavingClient.joinId;
        expect(initialJoinId).toBeDefined();
        expect(joinRes.error).toBeUndefined();
        expect(joinRes.data).toBeDefined();
        expect(leavingClient.side).toBe(1);
        expect(leavingClient.role).toBe(ChessClientRole.Player);
        expect(leavingClient.status).toBe('await');

        // Opponent joins as Black
        opponentClient.gameId = gameId;
        await opponentClient.asyncJoin(2, ChessClientRole.Player);
        // Manually sync status after opponent joins for leaver
        // leavingClient.status = (await server.__getGameState(gameId))!.status;
        await leavingClient.asyncSync(); // Sync leaver after opponent joins
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
