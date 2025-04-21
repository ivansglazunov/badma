import { Chess } from '../chess.js';
import { go } from '../go.js';
import Debug from '../debug.js';

const debug = Debug('badma:test:go-chess-js');

describe('Integration Test: Go vs Chess.js', () => {
  it('should play 10 moves using js-chess-engine against Chess.js', () => {
    const chess = new Chess();
    const maxMoves = 10;

    debug(`🚀 Starting test: Playing ${maxMoves} moves.`);
    debug(`🏁 Initial FEN: ${chess.fen}`);

    for (let i = 0; i < maxMoves; i++) {
      const currentFen = chess.fen;
      const turn = chess.turn === 1 ? 'White' : 'Black';
      debug(`[Move ${i + 1}/${maxMoves}] Turn: ${turn}, Current FEN: ${currentFen}`);

      if (chess.isGameOver) {
        debug(`[Move ${i + 1}/${maxMoves}] 🏁 Game is over (${chess.status}). Stopping test.`);
        break;
      }

      // Call the 'go' function to get the AI move
      const level = 2;
      const aiMove = go(currentFen, level);
      debug(`[Move ${i + 1}/${maxMoves}] 🤔 AI (${turn}) suggests move: ${JSON.stringify(aiMove)}`);

      // Apply the move using the Chess class
      const result = chess.move(aiMove);

      if (!result.success) {
        debug(`[Move ${i + 1}/${maxMoves}] ❌ Move failed! Error: ${result.error}`);
        // Fail the test if a move fails unexpectedly
        // We might expect errors if 'go' suggests an illegal move under strict rules
        // For now, let's assert true to see if basic moves work.
        expect(result.success).toBe(true); 
        break;
      }

      const afterMoveFen = chess.fen;
      debug(`[Move ${i + 1}/${maxMoves}] ✅ Move successful. FEN after move: ${afterMoveFen}`);
    }

    debug(`🎉 Test finished with fen ${chess.fen}`);
    // Optional: Add a final assertion, e.g., expect the game not to be in the initial state
    expect(chess.fen).not.toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });
});
