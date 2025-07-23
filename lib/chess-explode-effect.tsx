import React, { useState, useEffect } from 'react';
import Palawan from 'react-explode/Palawan';

interface ChessExplodeEffectProps {
  /**
   * Показывать ли эффект взрыва
   * @default true
   */
  show?: boolean;
  
  /**
   * Функция обратного вызова, вызываемая после завершения эффекта
   */
  onComplete?: () => void;
}

/**
 * Универсальный компонент эффекта взрыва для шахматных айтемов
 */
export default function ChessExplodeEffect({ 
  show = true, 
  onComplete 
}: ChessExplodeEffectProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    }
  }, [show]);

  return isVisible ? (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-40deg) scale(1.5)',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      <Palawan 
        size={400}
        delay={0}
        repeatDelay={0}
        repeat={1}
        color="#c084fc"
        onComplete={() => {
          setIsVisible(false);
          onComplete?.();
        }}
      />
    </div>
  ) : null;
}
