import React from 'react';
import { HoverCard } from 'badma/components/hover-card';
import { ChessPerk, ChessPerks } from '../chess-perks';
import { ChessClient } from '../chess-client';
import { Chess } from '../chess';
import Debug from '../debug';

const debug = Debug('minefield-perk');

interface MinefieldPerkCardProps {
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

// Minefield Perk Card Component
export default function MinefieldPerkCard({ className = '', onClick, size = 'medium' }: MinefieldPerkCardProps) {
  const cardSize = size === 'small' ? 'w-32 h-40' : size === 'large' ? 'w-64 h-80' : 'w-48 h-64';
  
  return (
    <div 
      className={`${cardSize} ${className} cursor-pointer`}
      onClick={onClick}
    >
      <HoverCard 
        className="w-full h-full"
        force={1.2}
        maxRotation={15}
        maxLift={30}
      >
      <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-lg border border-red-200 dark:border-red-800 p-4 flex flex-col items-center justify-center">
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-1">
            Минное поле
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400">
            Расставляет 4 мины на пустых клетках
          </p>
        </div>
        
        {/* SVG Minefield Visualization */}
        <div className="flex-1 flex items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120" className="border border-red-300 dark:border-red-700 rounded">
            {/* Chess board background */}
            {Array.from({ length: 8 }, (_, row) =>
              Array.from({ length: 8 }, (_, col) => {
                const isLight = (row + col) % 2 === 0;
                const x = col * 15;
                const y = row * 15;
                return (
                  <rect
                    key={`${row}-${col}`}
                    x={x}
                    y={y}
                    width="15"
                    height="15"
                    fill={isLight ? '#f0f0f0' : '#d0d0d0'}
                    stroke="#999"
                    strokeWidth="0.5"
                  />
                );
              })
            )}
            
            {/* Mine positions (example positions) */}
            {[
              { x: 2, y: 3 }, // c5
              { x: 5, y: 2 }, // f6
              { x: 1, y: 6 }, // b2
              { x: 6, y: 4 }  // g4
            ].map((mine, index) => (
              <g key={index}>
                {/* Mine explosion effect */}
                <circle
                  cx={mine.x * 15 + 7.5}
                  cy={mine.y * 15 + 7.5}
                  r="6"
                  fill="#ff4444"
                  opacity="0.3"
                />
                {/* Mine icon */}
                <circle
                  cx={mine.x * 15 + 7.5}
                  cy={mine.y * 15 + 7.5}
                  r="3"
                  fill="#cc0000"
                />
                {/* Mine spikes */}
                <g stroke="#cc0000" strokeWidth="1" opacity="0.8">
                  <line
                    x1={mine.x * 15 + 7.5}
                    y1={mine.y * 15 + 4.5}
                    x2={mine.x * 15 + 7.5}
                    y2={mine.y * 15 + 10.5}
                  />
                  <line
                    x1={mine.x * 15 + 4.5}
                    y1={mine.y * 15 + 7.5}
                    x2={mine.x * 15 + 10.5}
                    y2={mine.y * 15 + 7.5}
                  />
                  <line
                    x1={mine.x * 15 + 5.5}
                    y1={mine.y * 15 + 5.5}
                    x2={mine.x * 15 + 9.5}
                    y2={mine.y * 15 + 9.5}
                  />
                  <line
                    x1={mine.x * 15 + 9.5}
                    y1={mine.y * 15 + 5.5}
                    x2={mine.x * 15 + 5.5}
                    y2={mine.y * 15 + 9.5}
                  />
                </g>
              </g>
            ))}
            
            {/* Warning text */}
            <text
              x="60"
              y="10"
              textAnchor="middle"
              fontSize="8"
              fill="#cc0000"
              fontWeight="bold"
            >
              ⚠ DANGER ⚠
            </text>
          </svg>
        </div>
      </div>
      </HoverCard>
    </div>
  );
}

// Minefield Chess Perk Implementation
export class MinefieldPerk extends ChessPerk {
  private minePositions: string[] = [];

  constructor(side: 'client' | 'server') {
    super('minefield', side);
  }

  async handlePerk(
    gameId: string,
    clientId: string,
    data: Record<string, any>,
    chessPerks: ChessPerks
  ): Promise<void> {
    this.log(`Minefield perk applied on ${this.side} with data: ${JSON.stringify(data)}`);

    if (this.side === 'server') {
      // Server generates random mine positions on empty squares using game FEN
      const chess = new Chess();
      chess.fen = data._serverFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const emptySquares = this.getEmptySquares(chess.fen);
      this.minePositions = this.selectRandomMines(emptySquares, 4);
      
      // Store mine positions in data for saving to database
      data.squares = this.minePositions;
      
      this.log(`Server: Generated mine positions: ${this.minePositions.join(', ')}`);
    } else {
      // Client receives mine positions from server
      this.minePositions = data.squares || [];
      this.log(`Client: Received mine positions: ${this.minePositions.join(', ')}`);
    }
  }

  async handleMoveBefore(
    gameId: string,
    clientId: string,
    move: { from: string; to: string; promotion?: string },
    fen: string,
    chessPerks: ChessPerks
  ): Promise<Record<string, any> | null> {
    const logMessage = `[BEFORE] Checking move ${move.from}-${move.to} for mine collision`;
    this.log(logMessage);

    // Check if the destination square has a mine
    const hitMine = this.minePositions.includes(move.to);
    
    if (hitMine) {
      this.log(`[BEFORE] 💥 Mine detected at ${move.to}!`);
      return { hitMine: true, mineSquare: move.to };
    }

    return { hitMine: false };
  }

  async handleMoveAfter(
    gameId: string,
    clientId: string,
    move: { from: string; to: string; promotion?: string },
    fen: string,
    beforeData: Record<string, any> | null,
    chessPerks: ChessPerks
  ): Promise<string | null> {
    if (!beforeData?.hitMine) {
      return null; // No mine hit, keep original FEN
    }

    const mineSquare = beforeData.mineSquare;
    this.log(`[AFTER] 💥 Exploding mine at ${mineSquare}, removing piece`);

    // Remove the piece that stepped on the mine
    const chess = new Chess();
    chess.fen = fen;
    
    // Remove the piece that stepped on the mine
    chess.remove(mineSquare);
    
    const modifiedFen = chess.fen;
    this.log(`[AFTER] Modified FEN: ${modifiedFen}`);
    
    return modifiedFen;
  }

  private getEmptySquares(fen: string): string[] {
    const chess = new Chess();
    chess.fen = fen;
    
    const emptySquares: string[] = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    for (const file of files) {
      for (const rank of ranks) {
        const square = file + rank;
        const piece = chess.chess.get(square);
        if (!piece) {
          emptySquares.push(square);
        }
      }
    }
    
    debug(`Found ${emptySquares.length} empty squares:`, emptySquares);
    return emptySquares;
  }

  private selectRandomMines(emptySquares: string[], count: number): string[] {
    if (emptySquares.length < count) {
      debug(`Warning: Only ${emptySquares.length} empty squares available, requested ${count} mines`);
      return [...emptySquares]; // Return all available squares
    }
    
    const selected: string[] = [];
    const available = [...emptySquares];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      selected.push(available[randomIndex]);
      available.splice(randomIndex, 1); // Remove selected square
    }
    
    debug(`Selected ${selected.length} random mine positions:`, selected);
    return selected;
  }

  // Getter for mine positions (for testing/debugging)
  public getMinePositions(): string[] {
    return [...this.minePositions];
  }
}

// Minefield Effect Component
interface MinefieldEffectProps {
  gameData: any;
}

export const MinefieldEffect: React.FC<MinefieldEffectProps> = ({ gameData }) => {
  const minefieldPerks = gameData?.perks?.filter((perk: any) => perk.type === 'minefield') || [];
  
  // Get all mine squares from all minefield perks
  const allMineSquares: string[] = [];
  minefieldPerks.forEach((perk: any) => {
    if (perk.data?.squares && Array.isArray(perk.data.squares)) {
      allMineSquares.push(...perk.data.squares);
    }
  });

  if (allMineSquares.length === 0) {
    return null;
  }

  return (
    <>
      {allMineSquares.map((square, index) => {
        try {
          const coords = ChessClient.positionToCoordinates(square);
          
          // Calculate position as percentage of board size
          const leftPercent = (coords.x / 8) * 100;
          const topPercent = (coords.y / 8) * 100;
          const sizePercent = (1 / 8) * 100;
          
          return (
            <div
              key={`mine-${square}-${index}`}
              className="absolute bg-red-500 opacity-70 pointer-events-none z-10"
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${sizePercent}%`,
                height: `${sizePercent}%`,
              }}
              title={`Mine at ${square}`}
            />
          );
        } catch (error) {
          console.warn(`Invalid mine square: ${square}`, error);
          return null;
        }
      })}
    </>
  );
};
