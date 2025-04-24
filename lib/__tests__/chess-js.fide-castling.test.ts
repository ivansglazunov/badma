import { Chess } from '../chess';

describe('Chess FIDE Castling Validation', () => {
  let chess: Chess;

  beforeEach(() => {
    chess = new Chess();
  });

  describe('Castling Move Detection', () => {
    it('should detect kingside castling moves', () => {
      // White kingside castling
      expect(chess.isCastlingMove({ from: 'e1', to: 'g1' })).toBe(true);
      
      // Black kingside castling
      expect(chess.isCastlingMove({ from: 'e8', to: 'g8' })).toBe(true);
    });

    it('should detect queenside castling moves', () => {
      // White queenside castling
      expect(chess.isCastlingMove({ from: 'e1', to: 'c1' })).toBe(true);
      
      // Black queenside castling
      expect(chess.isCastlingMove({ from: 'e8', to: 'c8' })).toBe(true);
    });

    it('should not identify non-castling moves as castling', () => {
      // Regular king moves
      expect(chess.isCastlingMove({ from: 'e1', to: 'f1' })).toBe(false);
      expect(chess.isCastlingMove({ from: 'e1', to: 'd1' })).toBe(false);
      
      // Non-king moves
      expect(chess.isCastlingMove({ from: 'd1', to: 'd8' })).toBe(false);
      expect(chess.isCastlingMove({ from: 'a1', to: 'a8' })).toBe(false);
    });
  });

  describe('Castling Path Clearance', () => {
    it('should identify a clear kingside path', () => {
      chess.load('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
      // f1 and g1 are empty
      expect(chess.isCastlingPathClear(true, 1)).toBe(true);
    });

    it('should identify a blocked kingside path', () => {
      chess.load('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3KBNR w KQkq - 0 1'); // Knight on g1
      // f1 is occupied by a knight - Note: FEN has N on g1, but test says f1 is occupied.
      // Let's assume the intent is that the path is blocked by G1 Knight.
      expect(chess.isCastlingPathClear(true, 1)).toBe(false);
    });

    it('should identify a clear queenside path', () => {
      chess.load('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
      // b1, c1, and d1 are empty
      expect(chess.isCastlingPathClear(false, 1)).toBe(true);
    });

    it('should identify a blocked queenside path', () => {
      chess.load('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/RN2K2R w KQkq - 0 1'); // Knight on b1
      // b1 is occupied by a Knight
      expect(chess.isCastlingPathClear(false, 1)).toBe(false);
    });
  });

  describe('Castling Path Safety', () => {
    // Note: e1/e8 safety is implicitly checked by isKingInCheck in higher-level functions,
    // but isCastlingPathSafe checks e, f, g (K-side) or e, d, c (Q-side).

    it('should identify a safe kingside path', () => {
      // Use the standard starting FEN for castling rights, but empty ranks 2-7 for clarity
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
      // With no attackers, the path e1, f1, g1 should be safe.
      expect(chess.isCastlingPathSafe(true, 1)).toBe(true);
    });

    it('should correctly report unsafe castling path square (f1)', () => {
      // Scenario 1: Attack on f1 is BLOCKED
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Clear board FEN
      chess.put({ type: 'r', color: 'b' }, 'f8'); // Add attacker
      chess.put({ type: 'p', color: 'w' }, 'f2'); // Add blocker
      // Since path f8-f1 is blocked by pw@f2, f1 is NOT attacked
      expect(chess.isSquareAttacked('f1', 2)).toBe(false);
      // Path is SAFE because f1 is not attacked (e1, g1 also assumed safe here)
      expect(chess.isCastlingPathSafe(true, 1)).toBe(true);

      // Scenario 2: Actual attack on f1 (CLEAR PATH)
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Clear board FEN
      chess.put({ type: 'r', color: 'b' }, 'f8'); // Add attacker
      expect(chess.isSquareAttacked('f1', 2)).toBe(true);
      // Path is now UNSAFE because f1 is attacked
      expect(chess.isCastlingPathSafe(true, 1)).toBe(false);
    });

    it('should correctly report unsafe castling destination square (g1)', () => {
      // Scenario 1: Attack on g1 is BLOCKED
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Clear board FEN
      chess.put({ type: 'r', color: 'b' }, 'g8'); // Add attacker
      chess.put({ type: 'p', color: 'w' }, 'g2'); // Add blocker
      // Since path g8-g1 is blocked by pw@g2, g1 is NOT attacked
      expect(chess.isSquareAttacked('g1', 2)).toBe(false);
      // Path is SAFE because g1 is not attacked (e1, f1 also assumed safe here)
      expect(chess.isCastlingPathSafe(true, 1)).toBe(true);

      // Scenario 2: Actual attack on g1 (CLEAR PATH)
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Clear board FEN
      chess.put({ type: 'r', color: 'b' }, 'g8'); // Add attacker
      expect(chess.isSquareAttacked('g1', 2)).toBe(true);
      // Path is UNSAFE because g1 is attacked
      expect(chess.isCastlingPathSafe(true, 1)).toBe(false);
    });

    it('should identify a safe queenside path', () => {
       // Use the standard starting FEN for castling rights, but empty ranks 2-7 for clarity
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
      // With no attackers, the path e1, d1, c1 should be safe.
      expect(chess.isCastlingPathSafe(false, 1)).toBe(true);
    });

    it('should correctly report unsafe castling path square (d1)', () => {
      // Scenario 1: Attack on d1 is BLOCKED
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Clear board FEN
      chess.put({ type: 'r', color: 'b' }, 'd8'); // Add attacker
      chess.put({ type: 'p', color: 'w' }, 'd2'); // Add blocker
      // Since path d8-d1 is blocked by pw@d2, d1 is NOT attacked
      expect(chess.isSquareAttacked('d1', 2)).toBe(false);
      // Path is SAFE because d1 is not attacked (e1, c1 also assumed safe here)
      expect(chess.isCastlingPathSafe(false, 1)).toBe(true);

      // Scenario 2: Actual attack on d1 (CLEAR PATH)
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Clear board FEN
      chess.put({ type: 'r', color: 'b' }, 'd8'); // Add attacker
      expect(chess.isSquareAttacked('d1', 2)).toBe(true);
      // Path is UNSAFE because d1 is attacked
      expect(chess.isCastlingPathSafe(false, 1)).toBe(false);
    });

    it('should correctly report unsafe castling destination square (c1)', () => {
      // Scenario 1: Attack on c1 is BLOCKED
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Clear board FEN
      chess.put({ type: 'r', color: 'b' }, 'c8'); // Add attacker
      chess.put({ type: 'p', color: 'w' }, 'c2'); // Add blocker
      // Since path c8-c1 is blocked by pw@c2, c1 is NOT attacked
      expect(chess.isSquareAttacked('c1', 2)).toBe(false);
      // Path is SAFE because c1 is not attacked (e1, d1 also assumed safe here)
      expect(chess.isCastlingPathSafe(false, 1)).toBe(true);

      // Scenario 2: Actual attack on c1 (CLEAR PATH)
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Clear board FEN
      chess.put({ type: 'r', color: 'b' }, 'c8'); // Add attacker
      expect(chess.isSquareAttacked('c1', 2)).toBe(true);
      // Path is UNSAFE because c1 is attacked
      expect(chess.isCastlingPathSafe(false, 1)).toBe(false);
    });
  });

  describe('Square Attack Detection', () => {
    beforeEach(() => {
      chess = new Chess();
      chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('should detect pawn attacks', () => {
      // Initial position tests
      expect(chess.isSquareAttacked('d3', 1)).toBe(true); // Attacked by white pawn c2
      expect(chess.isSquareAttacked('e3', 1)).toBe(true); // Attacked by white pawn d2/f2
      expect(chess.isSquareAttacked('d6', 2)).toBe(true); // Attacked by black pawn c7/e7
      expect(chess.isSquareAttacked('f6', 2)).toBe(true); // Attacked by black pawn e7/g7

      // Clear board except for pawns for clarity
      chess.load('8/8/8/8/8/8/4P3/8 w - - 0 1'); // White pawn e2
      expect(chess.isSquareAttacked('d3', 1)).toBe(true);
      expect(chess.isSquareAttacked('f3', 1)).toBe(true);
      expect(chess.isSquareAttacked('e3', 1)).toBe(false); // Can't attack straight

      chess.load('8/3p4/8/8/8/8/8/8 b - - 0 1'); // Black pawn d7
      expect(chess.isSquareAttacked('c6', 2)).toBe(true);
      expect(chess.isSquareAttacked('e6', 2)).toBe(true);
      expect(chess.isSquareAttacked('d6', 2)).toBe(false); // Can't attack straight
    });

    it('should detect knight attacks', () => {
      // Initial position
      expect(chess.isSquareAttacked('c3', 1)).toBe(true); // Attacked by white N@b1
      expect(chess.isSquareAttacked('a3', 1)).toBe(true); // Attacked by white N@b1
      expect(chess.isSquareAttacked('f3', 1)).toBe(true); // Attacked by white N@g1
      expect(chess.isSquareAttacked('h3', 1)).toBe(true); // Attacked by white N@g1

      expect(chess.isSquareAttacked('c6', 2)).toBe(true); // Attacked by black N@b8
      expect(chess.isSquareAttacked('a6', 2)).toBe(true); // Attacked by black N@b8
      expect(chess.isSquareAttacked('f6', 2)).toBe(true); // Attacked by black N@g8
      expect(chess.isSquareAttacked('h6', 2)).toBe(true); // Attacked by black N@g8
    });

    it('should detect king attacks', () => {
      // Setup position with a king on an empty board part
      chess.load('8/8/8/8/8/4K3/8/8 w - - 0 1'); // White king on e3

      // White king on e3 attacks surrounding squares
      expect(chess.isSquareAttacked('d2', 1)).toBe(true); // Attacked BY white K@e3
      expect(chess.isSquareAttacked('e2', 1)).toBe(true); // Attacked BY white K@e3
      expect(chess.isSquareAttacked('f2', 1)).toBe(true); // Attacked BY white K@e3
      expect(chess.isSquareAttacked('d3', 1)).toBe(true); // Attacked BY white K@e3
      expect(chess.isSquareAttacked('f3', 1)).toBe(true); // Attacked BY white K@e3
      expect(chess.isSquareAttacked('d4', 1)).toBe(true); // Attacked BY white K@e3
      expect(chess.isSquareAttacked('e4', 1)).toBe(true); // Attacked BY white K@e3
      expect(chess.isSquareAttacked('f4', 1)).toBe(true); // Attacked BY white K@e3

      // But doesn't attack squares beyond its reach
      expect(chess.isSquareAttacked('c3', 1)).toBe(false); // Not attacked BY white K@e3
      expect(chess.isSquareAttacked('g3', 1)).toBe(false); // Not attacked BY white K@e3
      expect(chess.isSquareAttacked('e5', 1)).toBe(false); // Not attacked BY white K@e3
    });

    it('should detect bishop attacks', () => {
      // Setup position with bishops
      chess.load('8/8/3b4/8/3B4/8/8/8 w - - 0 1'); // White Bishop d4, Black Bishop d6

      // White Bishop on d4 attacks along diagonals
      expect(chess.isSquareAttacked('c3', 1)).toBe(true);
      expect(chess.isSquareAttacked('b2', 1)).toBe(true);
      expect(chess.isSquareAttacked('a1', 1)).toBe(true);
      expect(chess.isSquareAttacked('e5', 1)).toBe(true);
      expect(chess.isSquareAttacked('f6', 1)).toBe(true);
      expect(chess.isSquareAttacked('g7', 1)).toBe(true);
      expect(chess.isSquareAttacked('h8', 1)).toBe(true);
      expect(chess.isSquareAttacked('c5', 1)).toBe(true);
      expect(chess.isSquareAttacked('b6', 1)).toBe(true);
      expect(chess.isSquareAttacked('a7', 1)).toBe(true);
      expect(chess.isSquareAttacked('e3', 1)).toBe(true);
      expect(chess.isSquareAttacked('f2', 1)).toBe(true);
      expect(chess.isSquareAttacked('g1', 1)).toBe(true);

      // Black Bishop on d6 attacks along diagonals
      expect(chess.isSquareAttacked('c5', 2)).toBe(true);
      expect(chess.isSquareAttacked('b4', 2)).toBe(true);
      expect(chess.isSquareAttacked('a3', 2)).toBe(true);
      expect(chess.isSquareAttacked('e7', 2)).toBe(true);
      expect(chess.isSquareAttacked('f8', 2)).toBe(true);
      expect(chess.isSquareAttacked('c7', 2)).toBe(true);
      expect(chess.isSquareAttacked('b8', 2)).toBe(true);
      expect(chess.isSquareAttacked('e5', 2)).toBe(true);
      expect(chess.isSquareAttacked('f4', 2)).toBe(true);
      expect(chess.isSquareAttacked('g3', 2)).toBe(true);
      expect(chess.isSquareAttacked('h2', 2)).toBe(true);

      // Check non-attacked squares
      expect(chess.isSquareAttacked('d4', 2)).toBe(false); // Occupied by white bishop
      expect(chess.isSquareAttacked('d6', 1)).toBe(false); // Occupied by black bishop
      expect(chess.isSquareAttacked('d5', 1)).toBe(false);
      expect(chess.isSquareAttacked('d5', 2)).toBe(false);
      expect(chess.isSquareAttacked('c6', 1)).toBe(false);
      expect(chess.isSquareAttacked('c6', 2)).toBe(false);
    });

    it('should detect rook attacks', () => {
      // Setup position with rooks
      chess.load('8/8/8/8/3R4/8/r7/8 w - - 0 1'); // White Rook d4, Black Rook a2

      // White Rook on d4 attacks along rank and file
      expect(chess.isSquareAttacked('d1', 1)).toBe(true);
      expect(chess.isSquareAttacked('d2', 1)).toBe(true);
      expect(chess.isSquareAttacked('d3', 1)).toBe(true);
      expect(chess.isSquareAttacked('d5', 1)).toBe(true);
      expect(chess.isSquareAttacked('d6', 1)).toBe(true);
      expect(chess.isSquareAttacked('d7', 1)).toBe(true);
      expect(chess.isSquareAttacked('d8', 1)).toBe(true);
      expect(chess.isSquareAttacked('a4', 1)).toBe(true);
      expect(chess.isSquareAttacked('b4', 1)).toBe(true);
      expect(chess.isSquareAttacked('c4', 1)).toBe(true);
      expect(chess.isSquareAttacked('e4', 1)).toBe(true);
      expect(chess.isSquareAttacked('f4', 1)).toBe(true);
      expect(chess.isSquareAttacked('g4', 1)).toBe(true);
      expect(chess.isSquareAttacked('h4', 1)).toBe(true);

      // Black Rook on a2 attacks along rank and file
      expect(chess.isSquareAttacked('a1', 2)).toBe(true);
      expect(chess.isSquareAttacked('a3', 2)).toBe(true);
      expect(chess.isSquareAttacked('a4', 2)).toBe(true);
      expect(chess.isSquareAttacked('a5', 2)).toBe(true);
      expect(chess.isSquareAttacked('a6', 2)).toBe(true);
      expect(chess.isSquareAttacked('a7', 2)).toBe(true);
      expect(chess.isSquareAttacked('a8', 2)).toBe(true);
      expect(chess.isSquareAttacked('b2', 2)).toBe(true);
      expect(chess.isSquareAttacked('c2', 2)).toBe(true);
      expect(chess.isSquareAttacked('d2', 2)).toBe(true);
      expect(chess.isSquareAttacked('e2', 2)).toBe(true);
      expect(chess.isSquareAttacked('f2', 2)).toBe(true);
      expect(chess.isSquareAttacked('g2', 2)).toBe(true);
      expect(chess.isSquareAttacked('h2', 2)).toBe(true);

      // Check non-attacked squares
      expect(chess.isSquareAttacked('c3', 1)).toBe(false);
      expect(chess.isSquareAttacked('c3', 2)).toBe(false);
      expect(chess.isSquareAttacked('e5', 1)).toBe(false);
      expect(chess.isSquareAttacked('e5', 2)).toBe(false);
    });

    it('should respect blocking pieces', () => {
      // Setup position with pieces blocking attacks
      chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); 

      // White Bishop f1 is blocked by pawn e2. Let's test a square it *would* attack if free.
      expect(chess.isSquareAttacked('a6', 1)).toBe(false); // Blocked by b2/c3/d4/e5

      // White Queen d1 blocked by pawn d2 from attacking d3/d4 etc.
      expect(chess.isSquareAttacked('d3', 1)).toBe(true); // Queen d1 blocked by d2, but Pawns c2, e2 attack
      expect(chess.isSquareAttacked('d4', 1)).toBe(false); // Queen d1 blocked by d2

      // Black Rook a8 blocked by pawn a7 from attacking a6/a5 etc.
      expect(chess.isSquareAttacked('a6', 2)).toBe(true); // Attacked by Nb8 and Pb7
      // Check a square further down the file that *is* blocked
      expect(chess.isSquareAttacked('a5', 2)).toBe(false); // Attacked by Nb8 - CORRECTED EXPECTATION
      expect(chess.isSquareAttacked('a4', 2)).toBe(false); // Blocked by a7

      // Black Bishop c8 blocked by pawn d7 from attacking e6/f5 etc.
      expect(chess.isSquareAttacked('e6', 2)).toBe(true); // Attacked by Pe7 and Pf7
      // Check a square further down the diagonal that *is* blocked
      expect(chess.isSquareAttacked('f5', 2)).toBe(false); // Blocked by d7
      expect(chess.isSquareAttacked('g4', 2)).toBe(false); // Blocked by d7
    });
  });

  describe('King Check Detection', () => {
    it('should detect direct check by queen', () => {
      chess.load('4k3/8/8/8/8/8/8/Q3K3 w - - 0 1'); // White Q on a1, K on e1; Black K on e8
      expect(chess.isKingInCheck(1)).toBe(false);
      expect(chess.isKingInCheck(2)).toBe(false);

      chess.put({ type: 'q', color: 'b' }, 'e4'); // Black Q checks white K
      expect(chess.isKingInCheck(1)).toBe(true);
      expect(chess.isKingInCheck(2)).toBe(false);

      // Remove the attacking black queen before placing the white one
      chess.remove('e4'); 
      chess.put({ type: 'q', color: 'w' }, 'e5'); // White Q checks black K
      expect(chess.isKingInCheck(1)).toBe(false); // Black Q removed implicitly by put - NOW EXPLICITLY REMOVED
      expect(chess.isKingInCheck(2)).toBe(true);
    });

    it('should detect direct check by bishop', () => {
      chess.load('4k3/8/8/8/8/8/8/B3K3 w - - 0 1'); // White B on a1, K on e1; Black K on e8
      chess.put({ type: 'b', color: 'b' }, 'c3'); // Black B checks white K
      expect(chess.isKingInCheck(1)).toBe(true);
      expect(chess.isKingInCheck(2)).toBe(false);
    });

    it('should detect direct check by rook', () => {
      chess.load('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'); // White R on a1, K on e1; Black K on e8
      chess.load('4k3/8/8/8/8/8/4r3/R3K3 b Q - 0 1'); // Black R on e2 checks white K
      expect(chess.isKingInCheck(1)).toBe(true);
      expect(chess.isKingInCheck(2)).toBe(false);
    });

    it('should detect direct check by pawn', () => {
      chess.load('4k3/8/8/8/8/3p4/8/4K3 b - - 0 1'); // Black pawn d3, white K e1
      expect(chess.isKingInCheck(1)).toBe(false); // Pawn on d3 doesn't check e1
      chess.put({ type: 'p', color: 'b'}, 'd2'); // Black pawn d2 checks white K e1
      expect(chess.isKingInCheck(1)).toBe(true);
      expect(chess.isKingInCheck(2)).toBe(false);
    });

    it('should not report check if path is blocked', () => {
      chess.load('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1'); // Complex position
      // Black Queen e7 targets white King e1, but blocked by pawn e2
      expect(chess.isKingInCheck(1)).toBe(false);
      // White Rook h1 targets black King e8, but blocked by pawn h3
      expect(chess.isKingInCheck(2)).toBe(false);
    });
  });

  describe('Comprehensive Castling Legality', () => {
    it('should allow castling when all conditions met', () => {
      // Use clear board FEN for simplicity
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
      const kingsideWhite = chess.isCastlingLegal(true, 1);
      expect(kingsideWhite.legal).toBe(true);

      // No need to reload, state is unchanged
      const queensideWhite = chess.isCastlingLegal(false, 1);
      expect(queensideWhite.legal).toBe(true);
    });

    it('should invalidate castling if king is in check', () => {
      // Use clear board FEN
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
      chess.put({ type: 'b', color: 'b' }, 'b4'); // Black bishop attacks e1
      expect(chess.isKingInCheck(1)).toBe(true);
      const kingside = chess.isCastlingLegal(true, 1);
      expect(kingside.legal).toBe(false);
      expect(kingside.reason).toBe('King is in check');
      const queenside = chess.isCastlingLegal(false, 1);
      expect(queenside.legal).toBe(false);
      expect(queenside.reason).toBe('King is in check');
    });

    it('should invalidate castling if path is not clear', () => {
      // Kingside blocked
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
      chess.put({ type: 'n', color: 'w' }, 'g1'); // Put knight on g1
      const kingside = chess.isCastlingLegal(true, 1);
      expect(kingside.legal).toBe(false);
      expect(kingside.reason).toBe('Path not clear');

      // Queenside blocked
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
      chess.put({ type: 'n', color: 'w' }, 'b1'); // Put knight on b1
      const queenside = chess.isCastlingLegal(false, 1);
      expect(queenside.legal).toBe(false);
      expect(queenside.reason).toBe('Path not clear');
    });

    it('should invalidate castling if path is not safe', () => {
      // Kingside path unsafe (f1 attacked)
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Clear board FEN
      chess.put({ type: 'r', color: 'b' }, 'f8'); // Black rook attacks f1
      const kingside = chess.isCastlingLegal(true, 1);
      expect(kingside.legal).toBe(false);
      expect(kingside.reason).toBe('King passes through or lands on attacked square');

      // Queenside path unsafe (d1 attacked)
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Clear board FEN
      chess.put({ type: 'r', color: 'b' }, 'd8'); // Black rook attacks d1
      const queenside = chess.isCastlingLegal(false, 1);
      expect(queenside.legal).toBe(false);
      expect(queenside.reason).toBe('King passes through or lands on attacked square');
    });

    it('should invalidate castling if rights are missing', () => {
      // White missing kingside (K)
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w Qq - 0 1'); // Use clear FEN, modify rights
      const kingside1 = chess.isCastlingLegal(true, 1);
      expect(kingside1.legal).toBe(false);
      expect(kingside1.reason).toBe('No castling rights');
      const queenside1 = chess.isCastlingLegal(false, 1);
      expect(queenside1.legal).toBe(true);

      // White missing queenside (Q)
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w Kq - 0 1'); // Use clear FEN, modify rights
      const kingside2 = chess.isCastlingLegal(true, 1);
      expect(kingside2.legal).toBe(true);
      const queenside2 = chess.isCastlingLegal(false, 1);
      expect(queenside2.legal).toBe(false);
      expect(queenside2.reason).toBe('No castling rights');

      // Black missing kingside (k)
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R b KQq - 0 1'); // Use clear FEN, black's turn, modify rights
      const kingside3 = chess.isCastlingLegal(true, 2);
      expect(kingside3.legal).toBe(false);
      expect(kingside3.reason).toBe('No castling rights');
      const queenside3 = chess.isCastlingLegal(false, 2);
      expect(queenside3.legal).toBe(true);

      // Black missing queenside (q)
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R b KQk - 0 1'); // Use clear FEN, black's turn, modify rights
      const kingside4 = chess.isCastlingLegal(true, 2);
      expect(kingside4.legal).toBe(true);
      const queenside4 = chess.isCastlingLegal(false, 2);
      expect(queenside4.legal).toBe(false);
      expect(queenside4.reason).toBe('No castling rights');
    });
  });

  describe('Combined Castling Convenience Methods', () => {
    it('should handle combined conditions correctly', () => {
      // Path clear, safe, king not in check, rights exist = legal
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
      expect({ kingside: chess.canCastleKingside(1), queenside: chess.canCastleQueenside(1) }).toEqual({ kingside: true, queenside: true });
      expect({ kingside: chess.canCastleKingside(2), queenside: chess.canCastleQueenside(2) }).toEqual({ kingside: true, queenside: true });

      // King in check = illegal
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Reset position
      // Place the bishop where it actually checks the king
      chess.put({ type: 'b', color: 'b' }, 'b4'); // Check white king from b4
      expect({ kingside: chess.canCastleKingside(1), queenside: chess.canCastleQueenside(1) }).toEqual({ kingside: false, queenside: false });
      expect({ kingside: chess.canCastleKingside(2), queenside: chess.canCastleQueenside(2) }).toEqual({ kingside: true, queenside: true }); // Black unaffected

      // Path blocked = illegal
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Reset position
      chess.put({ type: 'n', color: 'w' }, 'f1'); // Block white kingside
      expect({ kingside: chess.canCastleKingside(1), queenside: chess.canCastleQueenside(1) }).toEqual({ kingside: false, queenside: true });

      chess.load('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1'); // Reset position, black's turn
      chess.put({ type: 'n', color: 'b' }, 'c8'); // Block black queenside
      // Note: canCastleKingside/Queenside checks for the *current* turn by default if side not provided
      // Since it's black's turn, we check black (side 2)
      expect({ kingside: chess.canCastleKingside(2), queenside: chess.canCastleQueenside(2) }).toEqual({ kingside: true, queenside: false });
      // White's castling ability is irrelevant here as it's not white's turn.

      // Path unsafe = illegal
      chess.load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Reset position
      chess.put({ type: 'r', color: 'b' }, 'd1'); // Attack white d1 (path square for Q-side castling) // ERROR in original test, d1 IS a destination square, not just path. Correcting attacker pos.
      chess.remove('d1'); // Ensure attacker is placed correctly
      chess.put({ type: 'r', color: 'b' }, 'd2'); // Attacking d1 from d2 now.
      expect({ kingside: chess.canCastleKingside(1), queenside: chess.canCastleQueenside(1) }).toEqual({ kingside: true, queenside: false }); // d1 attacked -> Q false

      chess.load('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1'); // Reset position, black's turn
      chess.put({ type: 'r', color: 'w' }, 'f8'); // Attack black f8 (path square for K-side castling) // ERROR in original test, f8 IS a destination square, not just path. Correcting attacker pos.
      chess.remove('f8'); // Ensure attacker is placed correctly
      chess.put({ type: 'r', color: 'w' }, 'f7'); // Attacking f8 from f7 now.
      // Check black's castling (side 2)
      expect({ kingside: chess.canCastleKingside(2), queenside: chess.canCastleQueenside(2) }).toEqual({ kingside: false, queenside: true }); // f8 attacked -> K false
    });
  });
}); 