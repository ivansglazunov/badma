'use client'

import React, { useState, useEffect } from 'react';
import Palawan from 'react-explode/Palawan';

interface GrantProps {
  show?: boolean;
  onComplete?: () => void;
}

/**
 * Компонент для отображения эффекта взрыва при открытии приложения
 */
export default function Grant({ show = true, onComplete }: GrantProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Автоматически скрыть эффект через 3 секунды
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <Palawan 
        size={400}
        delay={0}
        repeatDelay={0}
        repeat={1}
      />
    </div>
  );
}
