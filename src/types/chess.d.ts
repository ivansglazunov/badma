declare module 'chess.js' {
  export class Chess {
    constructor(fen?: string);
    
    turn(): 'w' | 'b';
    fen(): string;
    load(fen: string): boolean;
    move(options: { from: string; to: string; promotion?: string }): any;
    game_over(): boolean;
    in_checkmate(): boolean;
    in_stalemate(): boolean;
    in_draw(): boolean;
    in_threefold_repetition(): boolean;
    insufficient_material(): boolean;
    moves(options?: { verbose?: boolean }): any[];
  }
  
  export default Chess;
  
  // Ensure the module is callable and has properties
  export interface ChessJsModule {
    Chess: typeof Chess;
    default?: typeof Chess;
    (fen?: string): Chess;
  }
  
  // Make the module both a namespace and a function
  const chess: ChessJsModule;
  export = chess;
} 