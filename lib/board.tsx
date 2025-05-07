'use client'

import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useResizeDetector } from 'react-resize-detector';

interface BoardProps {
  position?: string;
  onMove?: (move: { from: string; to: string; promotion?: string }) => boolean;
  orientation?: 'white' | 'w' | 1 | 'black' | 'b' | 2;
}

/**
 * Simple chess board component that renders a board and emits move events
 * without validation logic
 */
export default function Board({
  position = 'start',
  onMove,
  orientation = 'white'
}: BoardProps) {

  // Handle piece drop (move)
  const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1].toLowerCase() === 'p' ? 'q' : undefined // Default promotion to queen
    };
    
    // If onMove prop is provided, call it and return the result
    if (onMove) {
      return onMove(move);
    }
    
    return true;
  };

  const { width, height, ref } = useResizeDetector();

  return (
    <div ref={ref} style={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Chessboard
        position={position}
        onPieceDrop={handlePieceDrop}
        boardWidth={width}
        customDarkSquareStyle={{ backgroundColor: '#cacaca' }}
        customLightSquareStyle={{ backgroundColor: '#fff' }}
        boardOrientation={orientation === 'w' || orientation === 1 || orientation === 'white' ? 'white' : 'black'}
      />
    </div>
  );
}