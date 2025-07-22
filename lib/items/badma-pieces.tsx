'use client'

import React from 'react';
import { Card, CardContent } from "hasyx/components/ui/card";
import { King, Knight, Rook } from "@/lib/pieces/badma";

interface BadmaPiecesProps {
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'large';
}

export default function BadmaPieces({ className, onClick, size = 'small' }: BadmaPiecesProps) {
  const isLarge = size === 'large';
  const cardSize = isLarge ? 'w-80 h-96' : 'w-48 h-64';
  const titleSize = isLarge ? 'text-xl' : 'text-sm';
  const kingSize = isLarge ? 60 : 40;
  const otherSize = isLarge ? 48 : 32;
  
  return (
    <Card className={`${cardSize} cursor-pointer ${className}`} onClick={onClick}>
      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
        <h3 className={`${titleSize} font-semibold mb-3 text-center`}>Фигуры Бадма</h3>
        
        {/* Chess pieces preview */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          {/* Left knight - rotated slightly left */}
          <div 
            className="transform -rotate-12 opacity-80"
            style={{ transform: 'rotate(-12deg) scale(0.8)' }}
          >
            <Knight color="#c084fc" size={otherSize} />
          </div>
          
          {/* Center king - main piece */}
          <div className="z-10">
            <King color="#c084fc" size={kingSize} />
          </div>
          
          {/* Right rook - rotated slightly right */}
          <div 
            className="transform rotate-12 opacity-80"
            style={{ transform: 'rotate(12deg) scale(0.8)' }}
          >
            <Rook color="#c084fc" size={otherSize} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
