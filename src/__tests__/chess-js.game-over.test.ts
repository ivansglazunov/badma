import { Chess } from '../chess.js';

describe('Chess Game Over Tests', () => {
  let chess: Chess;

  beforeEach(() => {
    chess = new Chess();
  });

  test('detects checkmate', () => {
    // Fool's mate - quickest checkmate possible
    chess.reset();
    chess.move({ from: 'f2', to: 'f3' });
    chess.move({ from: 'e7', to: 'e5' });
    chess.move({ from: 'g2', to: 'g4' });
    
    // Final move to checkmate
    const result = chess.move({ from: 'd8', to: 'h4' });
    
    // Check the move succeeded
    expect(result.success).toBe(true);
    
    // Game should be over
    expect(chess.isGameOver).toBe(true);
    
    // Should detect checkmate
    expect(chess.isCheckmate).toBe(true);
    
    // Should return checkmate as the game over reason
    expect(chess.status).toBe('checkmate');
  });

  test('detects stalemate', () => {
    // Stalemate position: black king on h8, white queen on g6
    chess.load('7k/8/6Q1/8/8/8/8/K7 b - - 0 1');
    
    // Game is now over with stalemate
    expect(chess.isGameOver).toBe(true);
    expect(chess.isStalemate).toBe(true);
    expect(chess.status).toBe('stalemate');
  });

  test('detects draw', () => {
    // Position where 50-move rule would apply with more material
    // Set up a position with the 50-move rule flag set and sufficient material
    chess.load('r1bqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w KQkq - 100 150');
    
    expect(chess.isDraw).toBe(true);
    expect(chess.isGameOver).toBe(true);
    
    // Should return 'draw' as the game over reason when it's a draw
    // but not threefold repetition or insufficient material
    expect(chess.status).toBe('draw');
  });

  test('returns continue when game is ongoing', () => {
    // Starting position
    chess.reset();
    
    // Game should not be over
    expect(chess.isGameOver).toBe(false);
    
    // Should return 'continue' when the game is ongoing
    expect(chess.status).toBe('continue');
  });
}); 