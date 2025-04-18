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
  constructor() {
    this.reset();
    
    debug(`🎮 Initial state: FEN = ${this._chess.fen()}`);
  }

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
    
    // Check if the correct side is moving
    if (!!move.side) {
      const currentTurn = this.turn;
      if (move.side !== currentTurn) {
        debug(`❌ Wrong side to move: expected ${currentTurn}, got ${move.side}`);
        return { 
          success: false, 
          error: `It's ${currentTurn === 1 ? 'white' : 'black'}'s turn to move, not ${move.side === 1 ? 'white' : 'black'}'s` 
        };
      }
    }
    
    debug(`🎲 Attempting move: ${move.from} -> ${move.to}`);
    debug(`🎲 Current state: FEN = ${this._chess.fen()}`);
    debug(`🎲 Current turn: ${this._chess.turn() === 'w' ? 'white' : 'black'}`);
    
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
        debug(`✅ New state: FEN = ${this._chess.fen()}`);
        debug(`✅ Current turn: ${this._chess.turn() === 'w' ? 'white' : 'black'}`);
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
}

export { Chess };
