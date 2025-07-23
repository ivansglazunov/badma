'use client'

import React from 'react';
import { Card, CardContent } from "hasyx/components/ui/card";
import { King, Knight, Rook } from "@/lib/pieces/classic";

interface ClassicPiecesProps {
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function ClassicPieces({ className, onClick, size = 'small' }: ClassicPiecesProps) {
  // Определяем размеры в зависимости от размера карточки
  let cardSize, titleSize, kingSize, otherSize;
  
  if (size === 'large') {
    cardSize = 'w-80 h-96';
    titleSize = 'text-xl';
    kingSize = 60;
    otherSize = 48;
  } else if (size === 'medium') {
    cardSize = 'w-64 h-80'; // Средний размер между маленьким и большим
    titleSize = 'text-lg';
    kingSize = 50;
    otherSize = 40;
  } else { // small
    cardSize = 'w-48 h-64';
    titleSize = 'text-sm';
    kingSize = 40;
    otherSize = 32;
  }
  
  return (
    <Card className={`${cardSize} cursor-pointer ${className}`} onClick={onClick}>
      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
        <h3 className={`${titleSize} font-semibold mb-3 text-center`}>Классические фигуры</h3>
        
        {/* Chess pieces preview */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          {/* Left knight - rotated slightly left */}
          <div 
            className="transform -rotate-12 opacity-80"
            style={{ transform: 'rotate(-12deg) scale(0.8)' }}
          >
            <Knight color="#ffffff" size={otherSize} />
          </div>
          
          {/* Center king - main piece */}
          <div className="z-10">
            <King color="#ffffff" size={kingSize} />
          </div>
          
          {/* Right rook - rotated slightly right */}
          <div 
            className="transform rotate-12 opacity-80"
            style={{ transform: 'rotate(12deg) scale(0.8)' }}
          >
            <Rook color="#ffffff" size={otherSize} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
