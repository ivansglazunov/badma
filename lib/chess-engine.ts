import jsChessEngine from 'js-chess-engine';
import Debug from './debug.js';

const debug = Debug('chess-engine');

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

/**
 * Minimalistic game class for chess move validation.
 * Using js-chess-engine internally instead of chess.js
 */
export default class Chess {
  private _chess!: jsChessEngine.Game;
  private _gameStatus: ChessStatus = 'continue';
  
  constructor() {
    this.reset();
    debug(`🎮 Initial state created`);
  }

  /**
   * Resets the chess instance to the starting position
   */
  reset(): void {
    this._chess = new jsChessEngine.Game();
    this._gameStatus = 'continue';
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
    const gameJson = this._chess.exportJson();
    return gameJson.turn === 'white' ? 1 : 2;
  }

  /**
   * Sets the turn of the game
   * @param value - Turn value (1 or 2)
   */
  set turn(value: ChessPossibleSide) {
    const side = Chess.normalizeSide(value);
    const fen = this._chess.exportFEN();
    const parts = fen.split(' ');
    parts[1] = side === 1 ? 'w' : 'b';
    this._chess = new jsChessEngine.Game(parts.join(' '));
  }

  /**
   * Gets the FEN notation of the current position
   * @returns Current FEN string
   */
  get fen(): string {
    return this._chess.exportFEN();
  }

  /**
   * Sets the FEN notation of the current position
   * @param fen - FEN string to set (optional)
   * @returns Current FEN string
   */
  set fen(value: string) {
    this._chess = new jsChessEngine.Game(value);
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
    
    try {
      const availableMoves = this._chess.moves();
      const fromSquare = move.from.toUpperCase();
      
      if (!availableMoves[fromSquare] || !availableMoves[fromSquare].includes(move.to.toUpperCase())) {
        debug(`❌ Invalid move: ${move.from} -> ${move.to}`);
        return { 
          success: false, 
          error: `Invalid move: ${move.from} -> ${move.to}. This move is not allowed in the current position.` 
        };
      }
      
      // Execute the move
      this._chess.move(fromSquare, move.to.toUpperCase());
      
      // Handle promotion (js-chess-engine automatically promotes to Queen, we need to handle other promotions)
      if (move.promotion && move.promotion !== 'q' && move.promotion !== 'Q') {
        // If we need to promote to something other than queen, we would handle it here
        // But js-chess-engine doesn't support specifying promotion piece easily
        debug(`⚠️ js-chess-engine always promotes to queen, ignoring requested promotion: ${move.promotion}`);
      }
      
      // Update game status after the move
      this._updateGameStatus();
      
      debug(`✅ Move executed successfully: ${move.from} -> ${move.to}`);
      return { success: true, error: '' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      debug(`❌ Error executing move: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }
  
  /**
   * Updates the internal game status based on the current position
   * @private
   */
  private _updateGameStatus(): void {
    const gameState = this._chess.exportJson();
    
    // Check for checkmate
    if (gameState.checkMate) {
      this._gameStatus = 'checkmate';
      return;
    }
    
    // Проверяем на пат: король не под шахом, но нет легальных ходов
    // js-chess-engine не всегда корректно определяет пат, поэтому мы делаем дополнительные проверки
    const allMoves = this._chess.moves();
    if (Object.keys(allMoves).length === 0 && !gameState.check) {
      this._gameStatus = 'stalemate';
      return;
    }
    
    // Если игра закончена, но это не шах и не пат, то считаем пат
    if (gameState.isFinished && !gameState.check) {
      this._gameStatus = 'stalemate';
      return;
    }
    
    // js-chess-engine has limited draw detection compared to chess.js
    // We'll need to implement our own for more advanced cases
    if (this._isInsufficientMaterial() || this._isDrawByRepetition() || this._isDrawByFiftyMoveRule()) {
      this._gameStatus = 'draw';
      return;
    }
    
    this._gameStatus = 'continue';
  }
  
  /**
   * Check if there's insufficient material for checkmate
   * @private
   */
  private _isInsufficientMaterial(): boolean {
    // Simple implementation - can be expanded for more accurate detection
    const pieces = this._chess.exportJson().pieces;
    const pieceCount = Object.keys(pieces).length;
    
    // K vs K
    if (pieceCount === 2) return true;
    
    // K+B vs K or K+N vs K
    if (pieceCount === 3) {
      const values = Object.values(pieces as Record<string, string>);
      const hasBishop = values.includes('B') || values.includes('b');
      const hasKnight = values.includes('N') || values.includes('n');
      
      if (hasBishop || hasKnight) return true;
    }
    
    return false;
  }
  
  /**
   * Check for draw by repetition
   * @private
   */
  private _isDrawByRepetition(): boolean {
    // js-chess-engine doesn't track position history
    // We would need to implement this ourselves by tracking FENs
    return false;
  }
  
  /**
   * Check for draw by fifty-move rule
   * @private
   */
  private _isDrawByFiftyMoveRule(): boolean {
    // Extract halfmove clock from FEN
    const fen = this._chess.exportFEN();
    const halfmoveClock = parseInt(fen.split(' ')[4], 10);
    return halfmoveClock >= 100; // 50 full moves = 100 half moves
  }
  
  /**
   * Gets the reason why the game is over or not
   * @returns Description of the game over reason
   */
  get status(): ChessStatus {
    return this._gameStatus;
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
      return this._gameStatus !== 'continue';
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
      return this._gameStatus === 'checkmate';
    } catch (error) {
      debug(`❌ Error checking checkmate: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Checks if the king is in check
   * @returns True if the king is in check
   */
  isCheck(): boolean {
    if (!this._chess) return false;
    
    try {
      const gameState = this._chess.exportJson();
      return gameState.check === true;
    } catch (error) {
      debug(`❌ Error checking check status: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Checks if the current position is stalemate
   * @returns True if stalemate
   */
  get isStalemate(): boolean {
    // Проверяем что король не под шахом
    const isInCheck = this.isCheck();
    
    // И что у текущего игрока нет ходов
    const hasNoMoves = Object.keys(this._chess.moves()).length === 0;
    
    // Это пат - когда не шах, но и ходов нет
    const isStalemate = !isInCheck && hasNoMoves;
    
    // Update game status if stalemate is detected
    if (isStalemate) {
      this._gameStatus = 'stalemate';
    }
    
    return isStalemate;
  }

  /**
   * Checks if the current position is a draw
   * @returns True if draw
   */
  get isDraw(): boolean {
    if (!this._chess) return false;
    
    try {
      return this._gameStatus === 'draw';
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
      this._chess = new jsChessEngine.Game(fen);
      this._updateGameStatus();
      return true;
    } catch (error) {
      debug(`❌ Error loading position: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

export { Chess }; 