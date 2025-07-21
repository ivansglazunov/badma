'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { useResizeDetector } from 'react-resize-detector';
import { useDeviceMotion } from '../hooks/device-motion';
import { Pawn, Rook, Knight, Bishop, Queen, King } from './pieces/badma';
import { HoverCard } from '@/components/hover-card';

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
 * Custom chess piece component that displays SVG pieces with interactive effects
 */
const CustomPiece: React.FC<{ piece: string }> = ({ piece }) => {
  // Убрали состояния hover и dragging чтобы не влиять на drag & drop
  
  const isWhite = piece && piece.startsWith('w');
  const pieceColor = isWhite ? '#ffffff' : '#000000';
  const pieceSize = `100px`; // Увеличиваем размер фигур до 100px
  
  const getPieceComponent = (pieceCode: string) => {
    const strokeColor = pieceColor === '#ffffff' ? '#000000' : '#ffffff';
    const strokeWidth = 0;
    const strokeLinejoin = 'round';
    const strokeLinecap = 'round';
    
    // Тень теперь применяется к контейнеру, не к SVG
    const filter = undefined;
    
    switch (pieceCode) {
      case 'wP':
      case 'bP':
        return <Pawn color={pieceColor} size={pieceSize} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      case 'wR':
      case 'bR':
        return <Rook color={pieceColor} size={pieceSize} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      case 'wN':
      case 'bN':
        return <Knight color={pieceColor} size={pieceSize} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      case 'wB':
      case 'bB':
        return <Bishop color={pieceColor} size={pieceSize} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      case 'wQ':
      case 'bQ':
        return <Queen color={pieceColor} size={pieceSize} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      case 'wK':
      case 'bK':
        return <King color={pieceColor} size={pieceSize} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      default:
        return <div style={{ fontSize: '2rem', color: pieceColor }}>?</div>;
    }
  };
  
  return (
    <ShockPiece>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100px', // Увеличиваем размер контейнера до 100px
          height: '100px',
          userSelect: 'none',
          pointerEvents: 'none', // Отключаем перехват событий
          filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))', // Возвращаем тень
        }}
      >
        {getPieceComponent(piece)}
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
    
    console.log('📝 [BOARD] Piece drop attempted:', {
      move,
      piece,
      hasOnMoveProp: !!onMove
    });
    
    // If onMove prop is provided, call it and return the result
    if (onMove) {
      console.log('📝 [BOARD] Calling onMove with:', move);
      const result = onMove(move);
      console.log('📝 [BOARD] onMove returned:', result);
      return result;
    }
    
    console.log('📝 [BOARD] No onMove prop - allowing move by default');
    return true;
  };

  const { width, height, ref } = useResizeDetector();

  // Create custom pieces object with SVG pieces
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