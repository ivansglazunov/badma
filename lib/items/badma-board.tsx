'use client'

import React from 'react';
import { Card, CardContent } from "hasyx/components/ui/card";

interface BadmaBoardProps {
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function BadmaBoard({ className, onClick, size = 'small' }: BadmaBoardProps) {
  const lightColor = '#e8d0ff';
  const darkColor = '#c084fc';
  
  // Определяем размеры в зависимости от размера карточки
  let cardSize, boardSize, titleSize;
  
  if (size === 'large') {
    cardSize = 'w-80 h-96';
    boardSize = 'w-64 h-64';
    titleSize = 'text-xl';
  } else if (size === 'medium') {
    cardSize = 'w-64 h-80'; // Средний размер между маленьким и большим
    boardSize = 'w-48 h-48';
    titleSize = 'text-lg';
  } else { // small
    cardSize = 'w-48 h-64';
    boardSize = 'w-32 h-32';
    titleSize = 'text-sm';
  }

  return (
    <Card className={`${cardSize} cursor-pointer ${className}`} onClick={onClick}>
      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
        <h3 className={`${titleSize} font-semibold mb-3 text-center`}>Доска Бадма</h3>
        
        {/* 8x8 chess board preview */}
        <div className={`${boardSize} grid grid-cols-8 gap-0 border border-gray-300 rounded-sm overflow-hidden`}>
          {Array.from({ length: 64 }, (_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isLight = (row + col) % 2 === 0;
            
            return (
              <div
                key={i}
                className="aspect-square"
                style={{
                  backgroundColor: isLight ? lightColor : darkColor
                }}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
