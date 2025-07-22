'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { useResizeDetector } from 'react-resize-detector';
import { useDeviceMotion } from '../hooks/device-motion';
import { Pawn as ClassicPawn, Rook as ClassicRook, Knight as ClassicKnight, Bishop as ClassicBishop, Queen as ClassicQueen, King as ClassicKing } from './pieces/classic';
import { Pawn as BadmaPawn, Rook as BadmaRook, Knight as BadmaKnight, Bishop as BadmaBishop, Queen as BadmaQueen, King as BadmaKing } from './pieces/badma';
import { PiecesStyle } from './items';
import { HoverCard } from '@/components/hover-card';

// Telegram WebApp haptic feedback utilities
const isTelegramWebApp = () => {
  return typeof window !== 'undefined' && 
         window.Telegram && 
         window.Telegram.WebApp && 
         window.Telegram.WebApp.HapticFeedback;
};

const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
  if (typeof window !== 'undefined' && isTelegramWebApp()) {
    try {
      window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
      console.log('🎯 [HAPTIC] Triggered haptic feedback:', type);
    } catch (error) {
      console.warn('⚠️ [HAPTIC] Failed to trigger haptic feedback:', error);
    }
  }
};

interface BoardProps {
  position?: string;
  onMove?: (move: { from: string; to: string; promotion?: string }) => boolean;
  orientation?: 'white' | 'w' | 1 | 'black' | 'b' | 2;
  bgBlack?: string;
  bgWhite?: string;
  customPieces?: Record<string, (args: any) => React.JSX.Element>;
  piecesStyle?: PiecesStyle; // deprecated, use whitePiecesStyle and blackPiecesStyle
  whitePiecesStyle?: PiecesStyle;
  blackPiecesStyle?: PiecesStyle;
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
const CustomPiece: React.FC<{ 
  piece: string; 
  squareSize: number; 
  pieceSize: number; 
  piecesStyle?: PiecesStyle; // deprecated
  whitePiecesStyle?: PiecesStyle;
  blackPiecesStyle?: PiecesStyle;
}> = ({ piece, squareSize, pieceSize, piecesStyle, whitePiecesStyle, blackPiecesStyle }) => {
  const isWhite = piece && piece.startsWith('w');
  
  // Determine which style to use for this piece
  const currentPiecesStyle = isWhite 
    ? (whitePiecesStyle || piecesStyle) 
    : (blackPiecesStyle || piecesStyle);
  
  const pieceColor = currentPiecesStyle 
    ? (isWhite ? currentPiecesStyle.colors.white : currentPiecesStyle.colors.black) 
    : (isWhite ? '#ffffff' : '#000000');
  const pieceSizeStr = `${pieceSize}px`; // Используем вычисленный размер
  
  const getPieceComponent = (pieceCode: string) => {
    const strokeColor = pieceColor === '#ffffff' ? '#000000' : '#ffffff';
    const strokeWidth = 0;
    const strokeLinejoin = 'round';
    const strokeLinecap = 'round';
    
    // Тень теперь применяется к контейнеру, не к SVG
    const filter = undefined;
    
    // Choose pieces set based on current piece style
    const PieceComponents = currentPiecesStyle?.id === 'badma_pieces' ? {
      Pawn: BadmaPawn,
      Rook: BadmaRook,
      Knight: BadmaKnight,
      Bishop: BadmaBishop,
      Queen: BadmaQueen,
      King: BadmaKing
    } : {
      Pawn: ClassicPawn,
      Rook: ClassicRook,
      Knight: ClassicKnight,
      Bishop: ClassicBishop,
      Queen: ClassicQueen,
      King: ClassicKing
    };
    
    switch (pieceCode) {
      case 'wP':
      case 'bP':
        return <PieceComponents.Pawn color={pieceColor} size={pieceSizeStr} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      case 'wR':
      case 'bR':
        return <PieceComponents.Rook color={pieceColor} size={pieceSizeStr} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      case 'wN':
      case 'bN':
        return <PieceComponents.Knight color={pieceColor} size={pieceSizeStr} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      case 'wB':
      case 'bB':
        return <PieceComponents.Bishop color={pieceColor} size={pieceSizeStr} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      case 'wQ':
      case 'bQ':
        return <PieceComponents.Queen color={pieceColor} size={pieceSizeStr} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
      case 'wK':
      case 'bK':
        return <PieceComponents.King color={pieceColor} size={pieceSizeStr} strokeColor={strokeColor} strokeWidth={strokeWidth} strokeLinejoin={strokeLinejoin} strokeLinecap={strokeLinecap} filter={filter}/>;
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
          width: `${squareSize}px`, // Размер клетки
          height: `${squareSize}px`,
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
  customPieces,
  piecesStyle, // deprecated
  whitePiecesStyle,
  blackPiecesStyle
}: BoardProps) {
  console.log('🏁 [BOARD] Board rendered with position:', position);

  // Handle piece drop (move)
  const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    // Trigger light haptic feedback when piece is grabbed/moved
    triggerHapticFeedback('light');
    
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
      
      // Trigger haptic feedback based on move result
      if (result) {
        // Successful move - medium haptic feedback
        triggerHapticFeedback('medium');
      } else {
        // Invalid move - rigid haptic feedback
        triggerHapticFeedback('rigid');
      }
      
      return result;
    }
    
    console.log('📝 [BOARD] No onMove prop - allowing move by default');
    // Default successful move - medium haptic feedback
    triggerHapticFeedback('medium');
    return true;
  };

  const { width, height, ref } = useResizeDetector();

  // Вычисляем размер клетки (доска 8x8)
  const squareSize = width ? Math.floor(width / 8) : 60; // По умолчанию 60px
  const pieceSize = Math.floor(squareSize * 0.85); // 85% от размера клетки

  // Create custom pieces object with SVG pieces
  const defaultCustomPieces: Record<string, (args: any) => React.JSX.Element> = {
    wP: ({ piece }) => <CustomPiece piece={piece || 'wP'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    wR: ({ piece }) => <CustomPiece piece={piece || 'wR'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    wN: ({ piece }) => <CustomPiece piece={piece || 'wN'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    wB: ({ piece }) => <CustomPiece piece={piece || 'wB'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    wQ: ({ piece }) => <CustomPiece piece={piece || 'wQ'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    wK: ({ piece }) => <CustomPiece piece={piece || 'wK'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    bP: ({ piece }) => <CustomPiece piece={piece || 'bP'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    bR: ({ piece }) => <CustomPiece piece={piece || 'bR'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    bN: ({ piece }) => <CustomPiece piece={piece || 'bN'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    bB: ({ piece }) => <CustomPiece piece={piece || 'bB'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    bQ: ({ piece }) => <CustomPiece piece={piece || 'bQ'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
    bK: ({ piece }) => <CustomPiece piece={piece || 'bK'} squareSize={squareSize} pieceSize={pieceSize} piecesStyle={piecesStyle} whitePiecesStyle={whitePiecesStyle} blackPiecesStyle={blackPiecesStyle} />,
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