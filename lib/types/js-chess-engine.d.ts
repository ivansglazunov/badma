declare module 'js-chess-engine' {
  export class Game {
    constructor(fen?: string);
    
    moves(): Record<string, string[]>;
    move(from: string, to: string): void;
    exportJson(): {
      turn: 'white' | 'black',
      pieces: Record<string, string>,
      moves: Record<string, string[]>,
      isFinished: boolean,
      check: boolean,
      checkMate: boolean,
      castling: {
        whiteLong: boolean,
        whiteShort: boolean,
        blackLong: boolean,
        blackShort: boolean
      },
      enPassant: string | null,
      halfMove: number,
      fullMove: number
    };
    exportFEN(): string;
  }
  
  export function moves(boardConfiguration: object | string): Record<string, string[]>;
  export function status(boardConfiguration: object | string): object;
  export function getFen(boardConfiguration: object | string): string;
  export function move(boardConfiguration: object | string, from: string, to: string): object;
  export function aiMove(boardConfiguration: object | string, level?: number): { [key: string]: string };
} 