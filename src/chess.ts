import * as chessJs from 'chess.js';
import Debug from './debug.js';

const debug = Debug('badma:chess');

// Type for possible side values
export type ChessPossibleSide = 'w' | 'b' | 'white' | 'black' | 1 | 2;

// Type for side values
export type ChessSide = 1 | 2;

// Type for chess move
export interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
  side?: ChessSide;
  validation?: boolean;
}

export type ChessStatus = 'continue' | 'checkmate' | 'stalemate' | 'draw' | 'unknown';

// Type for move result with error
interface ChessMoveResult {
  success: boolean;
  error: string;
}

// Configuration for Chess instance
export interface ChessConfig {
  // strictFideCastling?: boolean; // Removed this line
}

// Support for different chess.js import formats
let ChessNative: any;
try {
  // Determine where to find the Chess constructor
  // In TypeScript we use chessJs import as an object that may contain Chess or default
  const ChessComponent = (chessJs as any).Chess || (chessJs as any).default || chessJs;
  
  // Check the type of imported object
  debug(`📦 Chess imported as: ${typeof ChessComponent}`);
  
  // If Chess is not a constructor, try to create a wrapper
  if (typeof ChessComponent !== 'function') {
    debug(`⚠️ Chess imported, but is not a function, creating wrapper`);
    const originalChess = ChessComponent;
    
    // Create a constructor function
    const ChessWrapper = function(this: any, fen?: string): any {
      // Support for calling without new
      if (!(this instanceof ChessWrapper)) {
        return new (ChessWrapper as any)(fen);
      }
      
      try {
        // Try different ways to create an instance
        if (typeof originalChess === 'function') {
          return originalChess(fen);
        } else if (originalChess.Chess && typeof originalChess.Chess === 'function') {
          return new originalChess.Chess(fen);
        } else if (originalChess.default && typeof originalChess.default === 'function') {
          return new originalChess.default(fen);
        } else {
          throw new Error('Failed to create Chess instance');
        }
      } catch (err) {
        debug(`❌ Error creating chess engine: ${err instanceof Error ? err.stack || err.message : err}`);
        throw err;
      }
    };
    
    ChessNative = ChessWrapper;
  } else {
    // Use directly
    ChessNative = ChessComponent;
  }
  
  // Test call to verify
  try {
    const testInstance = new ChessNative();
    debug(`✅ Test instance created successfully: ${typeof testInstance}`);
  } catch (error) {
    debug(`❌ Failed to create test instance: ${error instanceof Error ? error.stack || error.message : error}`);
  }
} catch (error) {
  debug(`❌ Critical error importing chess.js: ${error instanceof Error ? error.stack || error.message : error}`);
  // No fallback to require, since this is ESM
  throw new Error(`Cannot import chess.js: ${error instanceof Error ? error.message : String(error)}`);
}

debug(`✅ Chess successfully imported: ${typeof ChessNative}`);

/**
 * Minimalistic game class for chess move validation.
 * Don't know about user, side just move abstract.
 */
export default class Chess {
  private _chess: any;
  private _config: ChessConfig;
  
  constructor(config: ChessConfig = {}) {
    this._config = {
      // strictFideCastling: false, // Removed this line
      ...config
    };
    
    this.reset();
    
    debug(`🎮 Initial state: FEN = ${this._chess.fen()}`);
    // debug(`🎮 Configuration: ${JSON.stringify(this._config)}`); // Removed or comment out if config becomes empty
  }

  /**
   * Enable or disable strict FIDE castling rules
   * @param enable - Whether to enable strict FIDE castling rules
   */
  // setStrictFideCastling(enable: boolean): void { // Removed this method
  //   this._config.strictFideCastling = enable;
  //   debug(`🔧 Strict FIDE castling rules ${enable ? 'enabled' : 'disabled'}`);
  // }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  // getConfig(): ChessConfig { // Removed this method
  //   return { ...this._config };
  // }

  /**
   * Resets the chess instance to the starting position
   */
  reset(): void {
    this._chess = new ChessNative();
    debug(`🔄 Reset chess state to initial position`);
  }
  
  /**
   * Gets the current chess instance
   * @returns Current chess instance
   */
  get chess(): any {
    return this._chess;
  }
  
  /**
   * Sets the chess instance
   * @param value - New chess instance
   */
  set chess(value: any) {
    this._chess = value;
  }

  /**
   * Gets the turn of the game
   * @returns Turn value (1 or 2)
   */
  get turn(): ChessSide {
    return this._chess.turn() === 'w' ? 1 : 2;
  }

  /**
   * Sets the turn of the game
   * @param value - Turn value (1 or 2)
   */
  set turn(value: ChessPossibleSide) {
    const side = Chess.normalizeSide(value);
    const parts = this._chess.fen().split(' ');
    parts[1] = side === 1 ? 'w' : 'b';
    this._chess.load(parts.join(' '));
  }

  /**
   * Gets the FEN notation of the current position
   * @returns Current FEN string
   */
  get fen(): string {
    return this._chess.fen();
  }

  /**
   * Sets the FEN notation of the current position
   * @param fen - FEN string to set (optional)
   * @returns Current FEN string
   */
  set fen(value: string) {
    this._chess.load(value);
  }
  
  /**
   * Converts various side formats to standard Side type (1 or 2)
   * @param side - Side in various formats
   * @returns Standard Side type (1 or 2)
   */
  static normalizeSide(side: ChessPossibleSide): ChessSide {
    if (side === 'w' || side === 'white' || side === 1) {
      return 1;
    }
    return 2;
  }
  
  /**
   * Converts standard Side type (1 or 2) to letter format ('w' or 'b')
   * @param side - Standard Side type (1 or 2)
   * @returns Letter format ('w' or 'b')
   */
  static sideToLetter(side: ChessSide): 'w' | 'b' {
    return side === 1 ? 'w' : 'b';
  }
  
  /**
   * Applies an array of moves to the current position
   * @param moves - Array of chess moves
   * @returns Object with success status and error message if any
   */
  moves(moves: ChessMove[]): ChessMoveResult {
    if (!Array.isArray(moves) || moves.length === 0) {
      return { success: true, error: '' };
    }
    
    debug(`📥 Applying ${moves.length} moves to the current position`);
    
    for (const move of moves) {
      const result = this.move(move);
      if (!result.success) {
        return result;
      }
    }
    
    return { success: true, error: '' };
  }
  
  /**
   * Gets the reason why the game is over or not
   * @returns Description of the game over reason
   */
  get status(): ChessStatus {
    if (!this.isGameOver) {
      return "continue";
    } else if (this.isCheckmate) {
      return "checkmate";
    } else if (this.isStalemate) {
      return "stalemate";
    } else if (this.isDraw) {
      return "draw";
    }
    return "unknown";
  }

  /**
   * Gets the reason why the game is over or not
   * @returns Description of the game over reason
   */
  getGameEndReason(): ChessStatus {
    return this.status;
  }

  /**
   * Checks if the game is over
   * @returns True if the game is over
   */
  get isGameOver(): boolean {
    if (!this._chess) return false;
    
    try {
      return this._chess.game_over() || this.isStalemate || this.isCheckmate || this.isDraw;
    } catch (error) {
      debug(`❌ Error checking game over: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Checks if the current position is checkmate
   * @returns True if checkmate
   */
  get isCheckmate(): boolean {
    if (!this._chess) return false;
    
    try {
      return this._chess.in_checkmate();
    } catch (error) {
      debug(`❌ Error checking checkmate: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Checks if the current position is stalemate
   * @returns True if stalemate
   */
  get isStalemate(): boolean {
    if (!this._chess) return false;
    
    try {
      return this._chess.in_stalemate();
    } catch (error) {
      debug(`❌ Error checking stalemate: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Checks if the current position is a draw
   * @returns True if draw
   */
  get isDraw(): boolean {
    if (!this._chess) return false;
    
    try {
      return this._chess.in_draw();
    } catch (error) {
      debug(`❌ Error checking draw: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Loads a position from FEN notation
   * @param fen - FEN string
   * @returns True if position was loaded successfully
   */
  load(fen: string): boolean {
    try {
      return this._chess.load(fen);
    } catch (error) {
      debug(`❌ Error loading position: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Checks if a square is attacked by a particular side
   * @param square - The square to check (e.g. 'e4')
   * @param attackingSide - Which side is attacking (1 for white, 2 for black)
   * @returns True if the square is under attack by the specified side
   */
  isSquareAttacked(square: string, attackingSide: ChessSide): boolean {
    const log = Debug('chess:attack');
    const attackers: { piece: { type: string; color: string }, from: string }[] = []; // Collect attackers

    // Convert target square to coordinates
    const targetFile = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const targetRank = parseInt(square[1]) - 1;

    if (targetFile < 0 || targetFile >= 8 || targetRank < 0 || targetRank >= 8) {
      log(`🚨 Invalid target square: ${square}`);
      return false;
    }

    const attackingColor = Chess.sideToLetter(attackingSide);
    log(`>>> Checking if square ${square} (${targetFile},${targetRank}) is attacked by ${attackingColor}`);

    // --- Initial Check: Cannot attack your own piece --- 
    const targetPiece = this._chess.get(square);
    if (targetPiece && targetPiece.color === attackingColor) {
      log(`🛡️ Target square ${square} contains a friendly piece ${targetPiece.type}${targetPiece.color}, cannot be attacked by ${attackingColor}`);
      return false; // Cannot attack your own piece
    }

    log(`🔍 Iterating through all squares to find potential attackers...`);
    // Iterate through all squares to find attacking pieces
    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        const currentSquare = String.fromCharCode('a'.charCodeAt(0) + file) + (rank + 1);
        const piece = this._chess.get(currentSquare);

        // Check only pieces of the attacking color
        if (!piece || piece.color !== attackingColor) {
          continue;
        }

        log(`   🧐 Found potential attacker: ${piece.type}${piece.color} at ${currentSquare} (${file},${rank})`);

        // Check attack based on piece type
        switch (piece.type) {
          case 'p': // Pawn Attack Check
            const pawnDir = attackingColor === 'w' ? 1 : -1;
            // Pawn attacks diagonally forward one square
            if (rank + pawnDir === targetRank && (file + 1 === targetFile || file - 1 === targetFile)) {
              log(`      ⚔️ Pawn attack detected from ${currentSquare} to ${square}!`);
              attackers.push({ piece, from: currentSquare });
            }
            break;

          case 'n': // Knight Attack Check
            const knightMoves = [
              [-2, -1], [-2, 1], [-1, -2], [-1, 2],
              [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            for (const [df, dr] of knightMoves) {
              if (file + df === targetFile && rank + dr === targetRank) {
                log(`      ⚔️ Knight attack detected from ${currentSquare} to ${square}!`);
                attackers.push({ piece, from: currentSquare });
                // Knight attack is direct, no need to check other knight moves from this square
                break; 
              }
            }
            break;

          case 'k': // King Attack Check
             const kingMoves = [
               [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
             ];
             for (const [df, dr] of kingMoves) {
               if (file + df === targetFile && rank + dr === targetRank) {
                 log(`      ⚔️ King attack detected from ${currentSquare} to ${square}!`);
                 attackers.push({ piece, from: currentSquare });
                 // King attack is direct, no need to check other king moves from this square
                 break;
               }
             }
             break;

          case 'r': // Rook Attack Check (Orthogonal)
          case 'b': // Bishop Attack Check (Diagonal)
          case 'q': // Queen Attack Check (Both)
            log(`      🎯 Checking sliding piece ${piece.type}${piece.color} from ${currentSquare}`);
            const isRook = piece.type === 'r' || piece.type === 'q';
            const isBishop = piece.type === 'b' || piece.type === 'q';
            
            const directions = [];
            if (isRook) directions.push(...[[0, 1], [0, -1], [1, 0], [-1, 0]]); // Orthogonal
            if (isBishop) directions.push(...[[1, 1], [1, -1], [-1, 1], [-1, -1]]); // Diagonal

            directionLoop: // Label for breaking out of the direction loop if attack found
            for (const [df, dr] of directions) {
               // Basic check: Ensure the target square is potentially reachable along this direction vector from the piece
               // For Rooks (df=0 or dr=0): Target must be on the same file or rank
               // if (df === 0 && file !== targetFile) continue; // Rook check: Must be same file
               // if (dr === 0 && rank !== targetRank) continue; // Rook check: Must be same rank
               // For Bishops (df!=0 and dr!=0): Target must be on the same diagonal
               // if (df !== 0 && dr !== 0 && Math.abs(file - targetFile) !== Math.abs(rank - targetRank)) continue; // Bishop check: Must be on diagonal
               
               log(`         ↗️ Checking line from ${currentSquare} in direction (${df},${dr}) towards ${square}`);
               let tempFile = file + df;
               let tempRank = rank + dr;

               // --- Explicit check for sliding pieces --- 
               while (tempFile >= 0 && tempFile < 8 && tempRank >= 0 && tempRank < 8) {
                 const intermediateSquare = String.fromCharCode('a'.charCodeAt(0) + tempFile) + (tempRank + 1);
                 const isTargetSquare = (tempFile === targetFile && tempRank === targetRank);
                 
                 log(`            ➡️ Checking intermediate square ${intermediateSquare} (Target? ${isTargetSquare})`);
                 
                 const pieceOnSquare = this._chess.get(intermediateSquare);
                 log(`            ♟️ Piece at ${intermediateSquare}: ${pieceOnSquare ? pieceOnSquare.type + pieceOnSquare.color : 'null'}`);
                 
                 if (isTargetSquare) {
                   // Reached the target square. Attack detected.
                   log(`            ⚔️ ${piece.type.toUpperCase()} attack detected from ${currentSquare} to ${square} along direction (${df},${dr})!`);
                   attackers.push({ piece, from: currentSquare });
                   break; // Stop checking this direction
                 } else if (pieceOnSquare) {
                    // Found a piece on an *intermediate* square (NOT the target). Path is blocked.
                    log(`            🚫 Path blocked by intermediate piece ${pieceOnSquare.type}${pieceOnSquare.color} at ${intermediateSquare}`);
                    break; // Stop checking this direction
                 }
                 
                 // If it's not the target and square is empty, continue along the line
                 tempFile += df;
                 tempRank += dr;
               } // --- End of explicit check ---
            } // End direction loop
            // REMOVED break here to allow checking other pieces after a sliding piece
        } // End switch
      } // End rank loop
    } // End file loop (board iteration)

    if (attackers.length > 0) {
      log(`<<< ✅ Square ${square} is attacked by ${attackingColor}. Attackers: ${JSON.stringify(attackers)}`);
      return true;
    } else {
      log(`<<< ❌ Square ${square} is NOT attacked by ${attackingColor}`);
      return false;
    }
  }

  // Helper method to check if piece color matches the attacking side
  private _isMatchingSide(pieceColor: 'w' | 'b', attackingSide: ChessSide): boolean {
    return (pieceColor === 'w' && attackingSide === 1) || (pieceColor === 'b' && attackingSide === 2);
  }

  /**
   * Debug helper to check square details
   * @param square - The square to check
   * @returns Object with details about the square
   */
  debugSquare(square: string): any {
    const log = Debug('chess:debug');
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(square[1]) - 1;
    
    // Get the piece on this square
    const piece = this._chess.get(square);
    
    // Check attacking pieces
    const attackedByWhite = this.isSquareAttacked(square, 1);
    const attackedByBlack = this.isSquareAttacked(square, 2);
    
    // Get surrounding squares and their pieces
    const surroundingSquares: Record<string, any> = {};
    
    // Check all 8 directions for possible attacking pieces
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dx, dy] of directions) {
      const x = file + dx;
      const y = rank + dy;
      
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        const targetSquare = String.fromCharCode('a'.charCodeAt(0) + x) + (y + 1);
        const targetPiece = this._chess.get(targetSquare);
        if (targetPiece) {
          surroundingSquares[targetSquare] = targetPiece;
        }
      }
    }
    
    // Check for knight positions
    const knightMoves = [
      { file: file - 2, rank: rank - 1 },
      { file: file - 2, rank: rank + 1 },
      { file: file - 1, rank: rank - 2 },
      { file: file - 1, rank: rank + 2 },
      { file: file + 1, rank: rank - 2 },
      { file: file + 1, rank: rank + 2 },
      { file: file + 2, rank: rank - 1 },
      { file: file + 2, rank: rank + 1 }
    ];
    
    for (const move of knightMoves) {
      if (move.file >= 0 && move.file < 8 && move.rank >= 0 && move.rank < 8) {
        const knightSquare = String.fromCharCode('a'.charCodeAt(0) + move.file) + (move.rank + 1);
        const knight = this._chess.get(knightSquare);
        if (knight) {
          surroundingSquares[knightSquare] = knight;
        }
      }
    }
    
    return {
      square,
      piece,
      attackedByWhite,
      attackedByBlack,
      surroundingSquares,
      fenPosition: this.fen
    };
  }

  /**
   * Checks if the king is in check
   * @param side - Which side's king to check (1 for white, 2 for black)
   * @returns True if the king is in check
   */
  isKingInCheck(side: ChessSide): boolean {
    const log = Debug('chess:check');
    const kingColor = Chess.sideToLetter(side);
    const opposingSide = side === 1 ? 2 : 1;
    
    // Find the king
    let kingSquare = null;
    
    // Scan the board to find the king
    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        const square = String.fromCharCode('a'.charCodeAt(0) + file) + (rank + 1);
        const piece = this._chess.get(square);
        if (piece && piece.type === 'k' && piece.color === kingColor) {
          kingSquare = square;
          break;
        }
      }
      if (kingSquare) break;
    }
    
    if (!kingSquare) {
      log(`Could not find ${side === 1 ? 'white' : 'black'} king on the board`);
      return false; // No king found (shouldn't happen in a valid game)
    }
    
    // Check if the king square is attacked by the opposite side
    const inCheck = this.isSquareAttacked(kingSquare, opposingSide);
    log(`${side === 1 ? 'White' : 'Black'} king at ${kingSquare} is ${inCheck ? '' : 'not '}in check`);
    return inCheck;
  }

  /**
   * Checks if castling path is safe (squares not under attack)
   * @param kingside - Whether checking kingside (true) or queenside (false)
   * @param side - Which side is attempting to castle (1 for white, 2 for black)
   * @returns True if the path is safe
   */
  isCastlingPathSafe(kingside: boolean, side: ChessSide = this.turn): boolean {
    const opposingSide = side === 1 ? 2 : 1;
    const rank = side === 1 ? '1' : '8';
    const log = Debug('chess:castling');
    
    // King's current square must also be checked (e1/e8)
    const kingSquare = `e${rank}`;
    
    // For kingside castling, check if e, f and g squares are attacked
    if (kingside) {
      const eAttacked = this.isSquareAttacked(kingSquare, opposingSide);
      const fAttacked = this.isSquareAttacked(`f${rank}`, opposingSide);
      const gAttacked = this.isSquareAttacked(`g${rank}`, opposingSide);
      
      log(`Kingside castling path check for ${side === 1 ? 'white' : 'black'}: `);
      log(`- e${rank} attacked by ${opposingSide === 1 ? 'white' : 'black'}: ${eAttacked}`);
      log(`- f${rank} attacked by ${opposingSide === 1 ? 'white' : 'black'}: ${fAttacked}`);
      log(`- g${rank} attacked by ${opposingSide === 1 ? 'white' : 'black'}: ${gAttacked}`);
      
      return !eAttacked && !fAttacked && !gAttacked;
    } 
    // For queenside castling, check if e, d and c squares are attacked
    else {
      const eAttacked = this.isSquareAttacked(kingSquare, opposingSide);
      const dAttacked = this.isSquareAttacked(`d${rank}`, opposingSide);
      const cAttacked = this.isSquareAttacked(`c${rank}`, opposingSide);
      
      log(`Queenside castling path check for ${side === 1 ? 'white' : 'black'}: `);
      log(`- e${rank} attacked by ${opposingSide === 1 ? 'white' : 'black'}: ${eAttacked}`);
      log(`- d${rank} attacked by ${opposingSide === 1 ? 'white' : 'black'}: ${dAttacked}`);
      log(`- c${rank} attacked by ${opposingSide === 1 ? 'white' : 'black'}: ${cAttacked}`);
      
      return !eAttacked && !dAttacked && !cAttacked;
    }
  }

  /**
   * Checks if castling path is clear (squares not occupied)
   * @param kingside - Whether checking kingside (true) or queenside (false)
   * @param side - Which side is attempting to castle (1 for white, 2 for black)
   * @returns True if the path is clear
   */
  isCastlingPathClear(kingside: boolean, side: ChessSide = this.turn): boolean {
    const rank = side === 1 ? '1' : '8';
    
    // Squares that must be empty
    const squaresToCheck = kingside 
      ? [`f${rank}`, `g${rank}`] 
      : [`b${rank}`, `c${rank}`, `d${rank}`];
      
    // Check if all squares are empty
    return squaresToCheck.every(sq => {
      const piece = this._chess.get(sq);
      return piece === null;
    });
  }

  /**
   * Checks if side has castling rights
   * @param side - Which side to check (1 for white, 2 for black)
   * @param kingside - Whether checking kingside (true) or queenside (false)
   * @returns True if castling rights exist
   */
  hasCastlingRights(side: ChessSide, kingside: boolean): boolean {
    const castlingRights = this._chess.fen().split(' ')[2];
    const right = kingside
      ? (side === 1 ? 'K' : 'k')
      : (side === 1 ? 'Q' : 'q');
    return castlingRights.includes(right);
  }

  /**
   * Comprehensive castling validation according to FIDE rules
   * @param kingside - Whether we're checking kingside (true) or queenside (false) castling
   * @param side - Which side is attempting to castle (1 for white, 2 for black)
   * @returns Object with legal status and reason if illegal
   */
  isCastlingLegal(kingside: boolean, side: ChessSide = this.turn): { legal: boolean; reason?: string } {
    // 1. Check if king is in check
    if (this.isKingInCheck(side)) {
      return { legal: false, reason: 'King is in check' };
    }
    
    // 2. Check if castling rights exist in FEN
    if (!this.hasCastlingRights(side, kingside)) {
      return { legal: false, reason: 'No castling rights' };
    }
    
    // 3. Check if squares between king and rook are empty
    if (!this.isCastlingPathClear(kingside, side)) {
      return { legal: false, reason: 'Path not clear' };
    }
    
    // 4. Check if king passes through or lands on attacked square
    if (!this.isCastlingPathSafe(kingside, side)) {
      return { legal: false, reason: 'King passes through or lands on attacked square' };
    }
    
    return { legal: true };
  }

  /**
   * Checks if kingside castling is legal according to FIDE rules
   * @param side - Which side is attempting to castle (1 for white, 2 for black)
   * @returns True if kingside castling is legal
   */
  canCastleKingside(side: ChessSide = this.turn): boolean {
    // Check all FIDE rules for kingside castling
    return !this.isKingInCheck(side) && 
           this.hasCastlingRights(side, true) &&
           this.isCastlingPathClear(true, side) &&
           this.isCastlingPathSafe(true, side);
  }

  /**
   * Checks if queenside castling is legal according to FIDE rules
   * @param side - Which side is attempting to castle (1 for white, 2 for black)
   * @returns True if queenside castling is legal
   */
  canCastleQueenside(side: ChessSide = this.turn): boolean {
    // Check all FIDE rules for queenside castling
    return !this.isKingInCheck(side) && 
           this.hasCastlingRights(side, false) &&
           this.isCastlingPathClear(false, side) &&
           this.isCastlingPathSafe(false, side);
  }

  /**
   * Checks if a move is a castling move
   * @param move - The move object to check
   * @returns True if the move is a castling move
   */
  isCastlingMove(move: ChessMove): boolean {
    // Get king positions
    const whiteKingPos = 'e1';
    const blackKingPos = 'e8';
    
    // Check if it's a king moving two squares
    if (move.from === whiteKingPos && (move.to === 'g1' || move.to === 'c1')) {
      return true;
    }
    
    if (move.from === blackKingPos && (move.to === 'g8' || move.to === 'c8')) {
      return true;
    }
    
    return false;
  }

  /**
   * Makes a move in the chess game
   * @param move - Move object with from, to and optional properties
   * @returns Move result with success status and error message if invalid
   */
  move(move: ChessMove): ChessMoveResult {
    if (!move.from || !move.to) {
      debug(`❌ Invalid move: missing 'from' or 'to'`);
      return { success: false, error: "Move must include 'from' and 'to' positions" };
    }
    
    // Check if the game is over
    if (this.isGameOver) {
      const reason = this.status;
      debug(`❌ Game is already over: ${reason}`);
      return { success: false, error: `Game is already over: ${reason}` };
    }

    // --- New Turn Check ---
    const currentTurn = this.turn;
    const pieceToMove = this._chess.get(move.from);

    if (!pieceToMove) {
      debug(`❌ Invalid move: no piece found at ${move.from}`);
      return { success: false, error: `Invalid move: No piece at ${move.from}` };
    }

    const pieceSide = Chess.normalizeSide(pieceToMove.color);
    if (pieceSide !== currentTurn) {
      debug(`❌ Wrong side to move: expected ${currentTurn}, got ${pieceSide} (piece at ${move.from})`);
      const expectedColor = currentTurn === 1 ? 'white' : 'black';
      const actualColor = pieceSide === 1 ? 'white' : 'black';
      return { 
        success: false, 
        error: `It's ${expectedColor}'s turn to move, not ${actualColor}'s (tried to move ${pieceToMove.color}${pieceToMove.type} from ${move.from})` 
      };
    }
    // --- End New Turn Check ---
    
    // Check if the correct side is moving - This check becomes redundant with the one above, but kept for backward compatibility if move.side is explicitly passed
    if (!!move.side) {
      if (move.side !== currentTurn) {
        debug(`❌ Wrong side to move (explicit side check): expected ${currentTurn}, got ${move.side}`);
        return { 
          success: false, 
          error: `It's ${currentTurn === 1 ? 'white' : 'black'}'s turn to move, not ${move.side === 1 ? 'white' : 'black'}'s` 
        };
      }
    }
    
    // Check for castling move
    if (this.isCastlingMove(move)) {
      const isKingside = (move.to === 'g1' || move.to === 'g8');
      const side = this.turn;
      
      debug(`🏰 Castling move detected: ${isKingside ? 'kingside' : 'queenside'} for ${side === 1 ? 'white' : 'black'}`);
      
      // Comprehensive castling validation for strict mode - NOW ALWAYS ACTIVE
      // if (this._config.strictFideCastling) { // Removed this condition
        debug(`🛡️ Strict FIDE castling validation always enabled`);
        // Use isCastlingLegal for comprehensive check
        const castlingLegality = this.isCastlingLegal(isKingside, side);
        
        if (!castlingLegality.legal) {
          debug(`❌ Castling not allowed: ${castlingLegality.reason}`);
          return {
            success: false,
            error: `Castling not allowed: ${castlingLegality.reason}`
          };
        }
        debug(`✅ Strict FIDE castling validation passed`);
      // } // Removed this closing brace
    }
    
    debug(`🎲 Attempting move: ${move.from} -> ${move.to}`);
    
    // Create a clean move object, omitting props
    const moveObj: {
      from: string;
      to: string;
      promotion?: string;
    } = {
      from: move.from,
      to: move.to
    };
    
    if (move.promotion) {
      moveObj.promotion = move.promotion;
    }
    
    try {
      const result = this._chess.move(moveObj);
      
      if (result) {
        debug(`✅ Move executed successfully: ${move.from} -> ${move.to}`);
        return { success: true, error: '' };
      } else {
        debug(`❌ Invalid move: ${move.from} -> ${move.to}`);
        return { 
          success: false, 
          error: `Invalid move: ${move.from} -> ${move.to}. This move is not allowed in the current position.` 
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      debug(`❌ Error executing move: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Places a piece on a square.
   * @param piece - The piece to place (e.g., { type: 'p', color: 'w' })
   * @param square - The square to place the piece on (e.g., 'a1')
   * @returns True if the piece was placed successfully
   */
  put(piece: { type: string; color: string }, square: string): boolean {
    try {
      // Type assertion to satisfy underlying chess.js method, though input types are simplified
      const result = this._chess.put(piece as { type: any; color: any }, square as any);
      if (result) {
        debug(`📥 Piece ${piece.color}${piece.type} placed on ${square}`);
      } else {
        debug(`⚠️ Failed to place piece ${piece.color}${piece.type} on ${square}`);
      }
      return result;
    } catch (error) {
      debug(`❌ Error placing piece: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Removes a piece from a square.
   * @param square - The square to remove the piece from (e.g., 'a1')
   * @returns The removed piece object or null if the square was empty
   */
  remove(square: string): { type: string; color: string } | null {
    try {
      // Type assertion to satisfy underlying chess.js method, though input types are simplified
      const piece = this._chess.remove(square as any);
      // We need to assert the return type as well if we want to keep the string signature
      if (piece) {
        debug(`🗑️ Piece ${piece.color}${piece.type} removed from ${square}`);
        return { type: piece.type as string, color: piece.color as string };
      }
      debug(`🤷 No piece found to remove at ${square}`);
      return null;
    } catch (error) {
      debug(`❌ Error removing piece: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}

export { Chess };