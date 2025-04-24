import { Chess, ChessMove } from '../chess-engine';

describe('Chess Engine', () => {
  let chess: Chess;

  beforeEach(() => {
    chess = new Chess();
  });

  it('should initialize with a default starting position', () => {
    expect(chess.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(chess.turn).toBe(1); // White's turn
  });

  it('should reset the game state', () => {
    // Make a move first
    chess.move({ from: 'e2', to: 'e4' });
    
    // Then reset
    chess.reset();
    
    // Check if the game is back to the starting position
    expect(chess.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(chess.turn).toBe(1);
  });

  it('should convert different side notations to standard Side type', () => {
    expect(Chess.normalizeSide('w')).toBe(1);
    expect(Chess.normalizeSide('white')).toBe(1);
    expect(Chess.normalizeSide(1)).toBe(1);
    
    expect(Chess.normalizeSide('b')).toBe(2);
    expect(Chess.normalizeSide('black')).toBe(2);
    expect(Chess.normalizeSide(2)).toBe(2);
  });

  it('should get or set the FEN notation', () => {
    // Get default FEN
    expect(chess.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    
    // Set a custom FEN
    const customFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    chess.fen = customFen;
    
    // Get the updated FEN
    expect(chess.fen).toBe(customFen);
    expect(chess.turn).toBe(2); // Black's turn
  });

  describe('move validation', () => {
    it('should validate a legal move', () => {
      const result = chess.move({ from: 'e2', to: 'e4' });
      expect(result.success).toBe(true);
      expect(result.error).toBe('');
      expect(chess.turn).toBe(2); // Black's turn after white moves
    });

    it('should reject an illegal move', () => {
      const result = chess.move({ from: 'e2', to: 'e5' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid move');
    });

    it('should reject a move when it is not the player\'s turn', () => {
      // First white's move
      chess.move({ from: 'e2', to: 'e4' });
      
      // Try to make another white move
      const result = chess.move({ from: 'd2', to: 'd4', side: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('It\'s black\'s turn to move');
    });

    it('should require both from and to properties', () => {
      const result = chess.move({ from: 'e2', to: '' } as ChessMove);
      expect(result.success).toBe(false);
      expect(result.error).toContain('must include \'from\' and \'to\'');
    });
  });

  describe('applying multiple moves', () => {
    it('should apply an array of valid moves', () => {
      const moves: ChessMove[] = [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
        { from: 'b8', to: 'c6' }
      ];
      
      const result = chess.moves(moves);
      expect(result.success).toBe(true);
      expect(result.error).toBe('');
      
      // Verify the position after these moves
      expect(chess.fen).toContain('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R');
    });

    it('should stop and return an error on the first invalid move', () => {
      const moves: ChessMove[] = [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'h3' }, // Valid knight move
        { from: 'b8', to: 'a6' }, // Valid knight move
        { from: 'h3', to: 'g6' }  // Invalid knight move
      ];
      
      const result = chess.moves(moves);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid move');
      
      // Verify the position after the last valid move
      expect(chess.fen).toContain('r1bqkbnr/pppp1ppp/n7/4p3/4P3/7N/PPPP1PPP/RNBQKB1R');
    });
  });

  describe('game completion', () => {
    it('should detect checkmate and reject further moves', () => {
      // Scholar's mate sequence
      const mateSequence: ChessMove[] = [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'f1', to: 'c4' },
        { from: 'b8', to: 'c6' },
        { from: 'd1', to: 'h5' },
        { from: 'g8', to: 'f6' },
        { from: 'h5', to: 'f7' } // Checkmate
      ];
      
      const result = chess.moves(mateSequence);
      expect(result.success).toBe(true);
      
      // Verify checkmate
      expect(chess.isCheckmate).toBe(true);
      expect(chess.isGameOver).toBe(true);
      
      // Try to make another move
      const moveAfterMate = chess.move({ from: 'e8', to: 'f7' });
      expect(moveAfterMate.success).toBe(false);
      expect(moveAfterMate.error).toContain('Game is already over');
    });

    it('should detect stalemate', () => {
      // Set up a stalemate position
      chess.fen = 'k7/8/1Q6/8/8/8/8/7K b - - 0 1';
      
      // Verify stalemate
      expect(chess.isStalemate).toBe(true);
      expect(chess.isGameOver).toBe(true);
      
      // Try to make a move
      const moveAfterStalemate = chess.move({ from: 'a8', to: 'a7' });
      expect(moveAfterStalemate.success).toBe(false);
      expect(moveAfterStalemate.error).toContain('Game is already over');
    });
  });

  describe('promotion', () => {
    it('should handle pawn promotion', () => {
      // Setup position with pawn about to promote
      chess.fen = 'rnbqkbnr/ppppppP1/8/8/8/8/PPPPPPP1/RNBQKBNR w KQkq - 0 1';
      
      // Promote to queen
      const result = chess.move({ from: 'g7', to: 'h8', promotion: 'q' });
      expect(result.success).toBe(true);
      
      // Check that promotion happened
      const fen = chess.fen;
      expect(fen).toContain('rnbqkbnQ/pppppp2/8/8/8/8/PPPPPPP1/RNBQKBNR');
    });
  });
}); 