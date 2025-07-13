'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { useResizeDetector } from 'react-resize-detector';
import { useDeviceMotion } from '../hooks/device-motion';

interface BoardProps {
  position?: string;
  onMove?: (move: { from: string; to: string; promotion?: string }) => boolean;
  orientation?: 'white' | 'w' | 1 | 'black' | 'b' | 2;
  bgBlack?: string;
  bgWhite?: string;
  customPieces?: Record<string, (args: any) => React.JSX.Element>;
}

/**
 * ShockPiece component that reacts to device motion
 */
const ShockPiece: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isShocked, setIsShocked] = useState(false);
  const [transform, setTransform] = useState('');
  const originalTransformRef = useRef('');
  const returnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleShock = (data: any) => {
    if (isShocked) return; // Prevent multiple shocks
    
    setIsShocked(true);
    
    // Calculate random displacement (max half screen size)
    const maxDisplacement = Math.min(window.innerWidth, window.innerHeight) / 2;
    const x = (Math.random() - 0.5) * maxDisplacement;
    const y = (Math.random() - 0.5) * maxDisplacement;
    const rotation = (Math.random() - 0.5) * 360; // Random rotation
    
    // Apply shock transform
    const shockTransform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
    setTransform(shockTransform);
    
    // Return to original position after random time (3-6 seconds)
    const returnDelay = 3000 + Math.random() * 3000; // 3-6 seconds
    
    returnTimeoutRef.current = setTimeout(() => {
      setTransform(originalTransformRef.current);
      setIsShocked(false);
    }, returnDelay);
  };

  // Setup device motion listener
  const { requestPermission, isSupported, permissionGranted, permissionStatus } = useDeviceMotion(handleShock, {
    threshold: 15,
    cooldown: 1000, // 1 second cooldown
    requirePermission: true
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (returnTimeoutRef.current) {
        clearTimeout(returnTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      style={{
        transform: transform,
        transition: 'all 1s ease',
        display: 'inline-block'
      }}
    >
      {children}
    </div>
  );
};

/**
 * Custom chess piece component that displays large bold letters
 */
const CustomPiece: React.FC<{ piece: string }> = ({ piece }) => {
  // Map piece codes to display letters
  const pieceMap: Record<string, string> = {
    'wP': '♙', // White pawn
    'wR': '♖', // White rook
    'wN': '♘', // White knight
    'wB': '♗', // White bishop
    'wQ': '♕', // White queen
    'wK': '♔', // White king
    'bP': '♟', // Black pawn
    'bR': '♜', // Black rook
    'bN': '♞', // Black knight
    'bB': '♝', // Black bishop
    'bQ': '♛', // Black queen
    'bK': '♚', // Black king
  };

  const displayChar = pieceMap[piece] || piece;
  
  return (
    <ShockPiece>
      <div 
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: piece && piece.startsWith('w') ? '#000' : '#fff',
          textShadow: piece && piece.startsWith('w') ? '1px 1px 2px rgba(255,255,255,0.8)' : '1px 1px 2px rgba(0,0,0,0.8)',
          userSelect: 'none',
          pointerEvents: 'none'
        }}
      >
        {displayChar}
      </div>
    </ShockPiece>
  );
};

/**
 * Simple chess board component that renders a board and emits move events
 * without validation logic
 */
export default function Board({
  position = 'start',
  onMove,
  orientation = 'white',
  bgBlack = '#cacaca',
  bgWhite = '#fff',
  customPieces
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

  // Create custom pieces object with large bold letters
  const defaultCustomPieces: Record<string, (args: any) => React.JSX.Element> = {
    wP: ({ piece }) => <CustomPiece piece={piece || 'wP'} />,
    wR: ({ piece }) => <CustomPiece piece={piece || 'wR'} />,
    wN: ({ piece }) => <CustomPiece piece={piece || 'wN'} />,
    wB: ({ piece }) => <CustomPiece piece={piece || 'wB'} />,
    wQ: ({ piece }) => <CustomPiece piece={piece || 'wQ'} />,
    wK: ({ piece }) => <CustomPiece piece={piece || 'wK'} />,
    bP: ({ piece }) => <CustomPiece piece={piece || 'bP'} />,
    bR: ({ piece }) => <CustomPiece piece={piece || 'bR'} />,
    bN: ({ piece }) => <CustomPiece piece={piece || 'bN'} />,
    bB: ({ piece }) => <CustomPiece piece={piece || 'bB'} />,
    bQ: ({ piece }) => <CustomPiece piece={piece || 'bQ'} />,
    bK: ({ piece }) => <CustomPiece piece={piece || 'bK'} />,
  };

  // Use custom pieces if provided, otherwise use default
  const piecesToUse = customPieces || defaultCustomPieces;

  return (
    <div key={bgBlack+bgWhite} ref={ref} style={{ 
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
        customDarkSquareStyle={{ backgroundColor: bgBlack }}
        customLightSquareStyle={{ backgroundColor: bgWhite }}
        boardOrientation={orientation === 'w' || orientation === 1 || orientation === 'white' ? 'white' : 'black'}
        customPieces={piecesToUse}
      />
    </div>
  );
}