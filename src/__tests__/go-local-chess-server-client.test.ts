import { LocalChessServer } from '../local-chess-server.js';
import { LocalChessClient } from '../local-chess-client.js';
import { ChessClient, ChessClientRole, ChessClientStatus } from '../chess-client.js';
import { v4 as uuidv4 } from 'uuid';
import Debug from '../debug.js';
import { go } from '../go.js'; // Import the go function

const debug = Debug('badma:test:go-local-server-client');
const goLevel = 1; // AI difficulty level for the test

describe('Go AI vs Go AI via Local Server/Client', () => {
    it('should play a full game between two AI clients until game over', async () => {
        debug(`🚀 Starting Go vs Go test with AI level ${goLevel}`);

        // 1. Setup Server and Users
        const server = new LocalChessServer(ChessClient);
        const whiteUserId = uuidv4();
        const blackUserId = uuidv4();
        await server.__addUser(whiteUserId);
        await server.__addUser(blackUserId);
        debug(`Server created. Users added: White=${whiteUserId}, Black=${blackUserId}`);

        // 2. Setup Clients
        const whiteClient = new LocalChessClient(server);
        whiteClient.clientId = uuidv4();
        whiteClient.userId = whiteUserId;

        const blackClient = new LocalChessClient(server);
        blackClient.clientId = uuidv4();
        blackClient.userId = blackUserId;
        debug(`Clients created: White=${whiteClient.clientId}, Black=${blackClient.clientId}`);

        // 3. White Creates Game
        debug('White creating game...');
        const createResponse = await whiteClient.asyncCreate(1, ChessClientRole.Player); // White is side 1
        expect(createResponse.error).toBeUndefined();
        expect(createResponse.data).toBeDefined();
        const gameId = createResponse.data!.gameId!;
        debug(`Game created by White. Game ID: ${gameId}, White Join ID: ${whiteClient.joinId}`);
        expect(whiteClient.gameId).toBe(gameId);
        expect(whiteClient.side).toBe(1);
        expect(whiteClient.status).toBe('await');

        // 4. Black Joins Game
        debug('Black joining game...');
        blackClient.gameId = gameId; // Manually set gameId for black client
        const joinResponse = await blackClient.asyncJoin(2, ChessClientRole.Player); // Black is side 2
        expect(joinResponse.error).toBeUndefined();
        expect(joinResponse.data).toBeDefined();
        debug(`Black joined game. Black Join ID: ${blackClient.joinId}`);
        expect(blackClient.gameId).toBe(gameId);
        expect(blackClient.side).toBe(2);
        // Server should set status to 'ready' now
        expect(joinResponse.data?.status).toBe('ready');
        blackClient.status = joinResponse.data!.status; // Update black client status

        // Manually sync white client status from server state
        const serverGameState = await server.__getGameState(gameId);
        expect(serverGameState?.status).toBe('ready');
        whiteClient.status = serverGameState!.status;
        whiteClient.fen = serverGameState!.fen; // Sync FEN too
        blackClient.fen = serverGameState!.fen; // Sync FEN for black client too

        debug(`Game ready! White FEN: ${whiteClient.fen}, Black FEN: ${blackClient.fen}`);

        // 5. Game Loop
        let moveCount = 0;
        const maxMoves = 1000; // Safety break for total successful moves
        let currentStatus = whiteClient.status;
        let currentTurnRetries = 0; // Retries for the current player's turn
        const maxRetriesPerTurn = 3;

        while (currentStatus === 'ready' || currentStatus === 'continue') {
            const turn = whiteClient.turn; // Get turn from one of the clients
            const activeClient = turn === 1 ? whiteClient : blackClient;
            const opponentClient = turn === 1 ? blackClient : whiteClient;
            const turnColor = turn === 1 ? 'White' : 'Black';

            // Safety break for infinite loops on a single turn
            if (currentTurnRetries >= maxRetriesPerTurn) {
                 debug(`🚨 Max retries (${maxRetriesPerTurn}) reached for ${turnColor}. AI failed to make a valid move. Stopping game.`);
                 // Consider failing the test here if AI reliability is critical
                 // expect(currentTurnRetries).toBeLessThan(maxRetriesPerTurn);
                 break;
             }

            // Safety break for overall game length
            if (moveCount >= maxMoves) {
                debug(`🚨 Max successful moves (${maxMoves}) reached. Stopping game.`);
                break;
            }

            debug(`[Move ${moveCount + 1}, Attempt ${currentTurnRetries + 1}] Turn: ${turnColor} (${activeClient.userId})`);
            debug(`[Move ${moveCount + 1}, Attempt ${currentTurnRetries + 1}] Current FEN: ${activeClient.fen}`);

            // Get AI move
            const currentFen = activeClient.fen;
            const aiMoveRaw = go(currentFen, goLevel);
            const aiMove = { ...aiMoveRaw, promotion: aiMoveRaw.promotion ?? undefined };
            debug(`[Move ${moveCount + 1}, Attempt ${currentTurnRetries + 1}] 🤔 AI (${turnColor}) suggests move: ${JSON.stringify(aiMove)}`);

            // Make the move
            const moveResponse = await activeClient.asyncMove(aiMove);
            debug(`[Move ${moveCount + 1}, Attempt ${currentTurnRetries + 1}] Move Response:`, moveResponse);

            if (moveResponse.error) {
                debug(`[Move ${moveCount + 1}, Attempt ${currentTurnRetries + 1}] ❌ Move failed! Error: ${moveResponse.error}`);
                const finalState = await server.__getGameState(gameId);
                // Check if the error actually ended the game server-side
                if (finalState?.status !== 'continue' && finalState?.status !== 'ready') {
                    currentStatus = finalState!.status;
                    whiteClient.status = currentStatus;
                    blackClient.status = currentStatus;
                    whiteClient.fen = finalState!.fen;
                    blackClient.fen = finalState!.fen;
                    debug(`[Move ${moveCount + 1}] Game ended due to move error resulting in status: ${currentStatus}`);
                    break; // Exit loop, game ended
                } else {
                     // Game did NOT end, likely an illegal move suggested by AI.
                     currentTurnRetries++;
                     debug(`[Move ${moveCount + 1}] Illegal move by AI (${turnColor}). Retrying turn (Attempt ${currentTurnRetries}/${maxRetriesPerTurn}).`);
                     continue; // Skip state updates and try the same turn again
                }
            }

            // Move was successful!
            moveCount++; // Increment successful move count
            currentTurnRetries = 0; // Reset retries for the next turn

            // Update state for both clients from response
            expect(moveResponse.data).toBeDefined();
            currentStatus = moveResponse.data!.status;
            const updatedFen = moveResponse.data!.fen;

            activeClient.fen = updatedFen;
            activeClient.status = currentStatus;
            opponentClient.fen = updatedFen; // Sync opponent
            opponentClient.status = currentStatus; // Sync opponent

            debug(`[Move ${moveCount}] ✅ Move successful. New Status: ${currentStatus}, New FEN: ${updatedFen}`);
        }

        // 6. Verify Final State
        debug(`🏁 Game finished after ${moveCount} moves. Final Status: ${currentStatus}`);
        const finalFen = whiteClient.fen; // Both clients should have the same final FEN

        // Check that the game ended
        expect(['checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender']).toContain(currentStatus);

        // Check both clients are synced
        expect(blackClient.status).toBe(currentStatus);
        expect(blackClient.fen).toBe(finalFen);

        // Check server state matches
        const finalServerState = await server.__getGameState(gameId);
        expect(finalServerState?.status).toBe(currentStatus);
        expect(finalServerState?.fen).toBe(finalFen);

        debug('🎉 Go vs Go test completed successfully!');
    });
});
