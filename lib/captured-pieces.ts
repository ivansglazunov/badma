import { Chess } from './chess';

/**
 * Captured Pieces Utility
 * 
 * This module provides functionality to calculate and analyze captured pieces
 * in a chess game. It can determine which pieces have been captured by each side,
 * calculate material advantage, and provide sorted lists for UI visualization.
 * 
 * Key features:
 * - Calculate captured pieces for any client/side
 * - Sort captured pieces by value (weakest to strongest)
 * - Calculate material advantage between players
 * - Provide Unicode symbols for piece visualization
 * - Support for both individual client analysis and complete game analysis
 * 
 * Usage examples:
 * ```typescript
 * import { Chess } from './chess';
 * import { getCapturedPiecesForClient, getAllCapturedPieces } from './captured-pieces';
 * 
 * const chess = new Chess();
 * // ... play some moves ...
 * 
 * // Get captured pieces for white player (client 1)
 * const whiteCaptured = getCapturedPiecesForClient(chess, 1);
 * console.log('White captured:', whiteCaptured.pieces); // sorted by value
 * 
 * // Get complete analysis
 * const analysis = getAllCapturedPieces(chess);
 * console.log('Material advantage:', analysis.materialAdvantage);
 * ```
 */

/**
 * Standard chess piece values according to traditional chess theory
 */
export const PIECE_VALUES = {
  p: 1, // pawn
  n: 3, // knight
  b: 3, // bishop
  r: 5, // rook
  q: 9, // queen
  k: 0, // king (invaluable, cannot be captured)
} as const;

/**
 * Initial piece counts for each side at the start of a chess game
 */
export const INITIAL_PIECE_COUNTS = {
  p: 8, // pawns
  n: 2, // knights
  b: 2, // bishops
  r: 2, // rooks
  q: 1, // queen
  k: 1, // king
} as const;

/**
 * Represents a chess piece with its type and color
 */
export interface ChessPiece {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
}

/**
 * Represents captured pieces for one side
 */
export interface CapturedPieces {
  pieces: ChessPiece[];
  totalValue: number;
}

/**
 * Represents captured pieces for both sides
 */
export interface CapturedPiecesResult {
  white: CapturedPieces;
  black: CapturedPieces;
  materialAdvantage: {
    side: 'white' | 'black' | 'equal';
    value: number;
  };
}

/**
 * Counts pieces currently on the board for each side
 * @param board - 8x8 chess board from chess.js
 * @returns Object with piece counts for white and black
 */
function countPiecesOnBoard(board: (ChessPiece | null)[][]): {
  white: Record<string, number>;
  black: Record<string, number>;
} {
  const whiteCounts: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  const blackCounts: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        if (piece.color === 'w') {
          whiteCounts[piece.type]++;
        } else {
          blackCounts[piece.type]++;
        }
      }
    }
  }

  return { white: whiteCounts, black: blackCounts };
}

/**
 * Sorts pieces by their value (ascending order - from weakest to strongest)
 * @param pieces - Array of chess pieces
 * @returns Sorted array of pieces
 */
function sortPiecesByValue(pieces: ChessPiece[]): ChessPiece[] {
  return pieces.sort((a, b) => PIECE_VALUES[a.type] - PIECE_VALUES[b.type]);
}

/**
 * Calculates total value of captured pieces
 * @param pieces - Array of captured pieces
 * @returns Total point value
 */
function calculateTotalValue(pieces: ChessPiece[]): number {
  return pieces.reduce((total, piece) => total + PIECE_VALUES[piece.type], 0);
}

/**
 * Gets captured pieces for a specific client/side based on current board position
 * @param chess - Chess instance with current game state
 * @param clientSide - Which side to calculate captured pieces for (1 = white, 2 = black)
 * @returns Captured pieces information for the specified side
 */
export function getCapturedPiecesForClient(chess: Chess, clientSide: 1 | 2): CapturedPieces {
  // Get current board state from chess.js
  const board = chess.chess.board();
  const currentCounts = countPiecesOnBoard(board);
  
  // Determine which color the client is playing
  const clientColor = clientSide === 1 ? 'white' : 'black';
  const opponentColor = clientSide === 1 ? 'black' : 'white';
  const clientColorCode = clientSide === 1 ? 'w' : 'b';
  const opponentColorCode = clientSide === 1 ? 'b' : 'w';
  
  // Calculate captured pieces (pieces that opponent had initially but are no longer on board)
  const capturedPieces: ChessPiece[] = [];
  const opponentCurrentCounts = clientSide === 1 ? currentCounts.black : currentCounts.white;
  
  // For each piece type, calculate how many were captured
  Object.keys(INITIAL_PIECE_COUNTS).forEach(pieceType => {
    const initialCount = INITIAL_PIECE_COUNTS[pieceType as keyof typeof INITIAL_PIECE_COUNTS];
    const currentCount = opponentCurrentCounts[pieceType] || 0;
    const capturedCount = initialCount - currentCount;
    
    // Add captured pieces to the array
    for (let i = 0; i < capturedCount; i++) {
      capturedPieces.push({
        type: pieceType as ChessPiece['type'],
        color: opponentColorCode as ChessPiece['color']
      });
    }
  });
  
  // Sort pieces by value (weakest to strongest)
  const sortedPieces = sortPiecesByValue(capturedPieces);
  const totalValue = calculateTotalValue(capturedPieces);
  
  return {
    pieces: sortedPieces,
    totalValue
  };
}

/**
 * Gets captured pieces for both sides and calculates material advantage
 * @param chess - Chess instance with current game state
 * @returns Complete captured pieces information for both sides
 */
export function getAllCapturedPieces(chess: Chess): CapturedPiecesResult {
  const whiteCaptured = getCapturedPiecesForClient(chess, 1);
  const blackCaptured = getCapturedPiecesForClient(chess, 2);
  
  // Calculate material advantage
  const materialDifference = whiteCaptured.totalValue - blackCaptured.totalValue;
  
  let materialAdvantage: CapturedPiecesResult['materialAdvantage'];
  if (materialDifference > 0) {
    materialAdvantage = { side: 'white', value: materialDifference };
  } else if (materialDifference < 0) {
    materialAdvantage = { side: 'black', value: Math.abs(materialDifference) };
  } else {
    materialAdvantage = { side: 'equal', value: 0 };
  }
  
  return {
    white: whiteCaptured,
    black: blackCaptured,
    materialAdvantage
  };
}

/**
 * Formats captured pieces for display
 * @param capturedPieces - Captured pieces data
 * @returns Formatted string representation
 */
export function formatCapturedPieces(capturedPieces: CapturedPieces): string {
  if (capturedPieces.pieces.length === 0) {
    return 'No pieces captured';
  }
  
  const pieceSymbols = {
    p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚'
  };
  
  const piecesString = capturedPieces.pieces
    .map(piece => pieceSymbols[piece.type])
    .join(' ');
  
  return `${piecesString} (${capturedPieces.totalValue} points)`;
}

/**
 * Gets piece display symbol (Unicode chess symbols)
 * @param piece - Chess piece
 * @returns Unicode symbol for the piece
 */
export function getPieceSymbol(piece: ChessPiece): string {
  const symbols = {
    w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
    b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
  };
  
  return symbols[piece.color][piece.type];
}

/**
 * Groups captured pieces by type for easier display
 * @param pieces - Array of captured pieces
 * @returns Object with pieces grouped by type
 */
export function groupCapturedPiecesByType(pieces: ChessPiece[]): Record<string, ChessPiece[]> {
  const grouped: Record<string, ChessPiece[]> = {};
  
  pieces.forEach(piece => {
    if (!grouped[piece.type]) {
      grouped[piece.type] = [];
    }
    grouped[piece.type].push(piece);
  });
  
  return grouped;
}

/**
 * Gets captured pieces count by type
 * @param pieces - Array of captured pieces
 * @returns Object with count for each piece type
 */
export function getCapturedPiecesCount(pieces: ChessPiece[]): Record<string, number> {
  const counts: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  
  pieces.forEach(piece => {
    counts[piece.type]++;
  });
  
  return counts;
}

/**
 * Creates a compact string representation of captured pieces for UI
 * @param pieces - Array of captured pieces
 * @returns Compact string like "3♟ 1♞ 1♜" (3 pawns, 1 knight, 1 rook)
 */
export function formatCapturedPiecesCompact(pieces: ChessPiece[]): string {
  if (pieces.length === 0) return '';
  
  const counts = getCapturedPiecesCount(pieces);
  const result: string[] = [];
  
  // Order by piece value (weakest to strongest)
  const orderedTypes: (keyof typeof PIECE_VALUES)[] = ['p', 'n', 'b', 'r', 'q', 'k'];
  
  orderedTypes.forEach(type => {
    if (counts[type] > 0) {
      const symbol = getPieceSymbol({ type, color: pieces.find(p => p.type === type)!.color });
      result.push(counts[type] > 1 ? `${counts[type]}${symbol}` : symbol);
    }
  });
  
  return result.join(' ');
}

/**
 * Calculates if a player has sufficient material to potentially win
 * @param pieces - Remaining pieces on board for the player
 * @returns True if player has sufficient material for checkmate
 */
export function hasSufficientMaterial(pieces: ChessPiece[]): boolean {
  const counts = getCapturedPiecesCount(pieces);
  
  // King alone cannot checkmate
  if (pieces.length <= 1) return false;
  
  // Queen, rook, or pawn can checkmate
  if (counts.q > 0 || counts.r > 0 || counts.p > 0) return true;
  
  // Two bishops can checkmate
  if (counts.b >= 2) return true;
  
  // Bishop and knight can checkmate
  if (counts.b >= 1 && counts.n >= 1) return true;
  
  // Three knights can checkmate (rare but possible)
  if (counts.n >= 3) return true;
  
  // Single bishop or knight cannot checkmate
  return false;
}
