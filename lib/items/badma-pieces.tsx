'use client'

import React from 'react';
import { Card, CardContent } from "hasyx/components/ui/card";
import { King, Knight, Rook } from "@/lib/pieces/badma";

interface BadmaPiecesProps {
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function BadmaPieces({ className, onClick, size = 'small' }: BadmaPiecesProps) {
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
      <CardContent className="pt-4 flex flex-col items-center justify-center h-full">
        {/* Chess pieces preview */}
        <div className="flex items-center justify-center space-x-2 my-4">
          {/* Left knight - rotated slightly left */}
          <div 
            className="transform -rotate-12 opacity-70 scale-200 relative right-2"
            style={{ transform: 'rotate(-12deg) scale(0.8)' }}
          >
            <Knight color="#c084fc" size={otherSize} />
          </div>
          
          {/* Center king - main piece */}
          <div className="z-10 scale-240">
            <King color="#c084fc" size={kingSize} />
          </div>
          
          {/* Right rook - rotated slightly right */}
          <div 
            className="transform rotate-12 opacity-70 scale-200 relative left-2"
            style={{ transform: 'rotate(12deg) scale(0.8)' }}
          >
            <Rook color="#c084fc" size={otherSize} />
          </div>
        </div>

        <h3 className={`${titleSize} font-semibold mt-3 text-center`}>Омм Мани<br/>Бадма Чесс</h3>
      </CardContent>
    </Card>
  );
}
