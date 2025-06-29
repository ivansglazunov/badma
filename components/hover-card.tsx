import React, { useState, useRef, useCallback } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import './hover-card.css';

interface HoverCardProps {
  children: React.ReactNode;
  force?: number; // 0-1, strength of mouse response
  className?: string;
  disabled?: boolean; // Disable hover effects
  maxRotation?: number; // Maximum rotation in degrees
  maxLift?: number; // Maximum lift in pixels
  enableGlow?: boolean; // Enable glow effect
}

export const HoverCard: React.FC<HoverCardProps> = ({ 
  children, 
  force = 0.5, 
  className = '',
  disabled = false,
  maxRotation = 15,
  maxLift = 30,
  enableGlow = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [elementCenter, setElementCenter] = useState({ x: 0, y: 0 });
  
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { width, height, ref } = useResizeDetector<HTMLDivElement>({
    refreshMode: 'debounce',
    refreshRate: 100,
  });

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    setIsHovered(true);
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setElementCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  }, [disabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled || !isHovered || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate relative position from center (-1 to 1)
    const relativeX = (e.clientX - centerX) / (rect.width / 2);
    const relativeY = (e.clientY - centerY) / (rect.height / 2);
    
    setMousePosition({ x: relativeX, y: relativeY });
  }, [disabled, isHovered]);

  // Calculate transform values based on mouse position and force
  const rotateX = mousePosition.y * force * maxRotation;
  const rotateY = -mousePosition.x * force * maxRotation; // Negative for natural feel
  const translateY = isHovered ? -force * maxLift : 0; // Lift effect
  const scale = isHovered ? 1 + force * 0.1 : 1; // Scale effect
  
  // Add subtle glow effect based on hover
  const boxShadow = enableGlow && isHovered 
    ? `0 ${force * 40}px ${force * 80}px rgba(0, 0, 0, 0.3), 0 0 ${force * 20}px rgba(255, 255, 255, 0.1)`
    : '0 4px 8px rgba(0, 0, 0, 0.1)';

  const transformStyle = {
    transform: `
      perspective(1200px) 
      rotateX(${rotateX}deg) 
      rotateY(${rotateY}deg) 
      translateY(${translateY}px) 
      scale(${scale})
    `,
    boxShadow,
    transition: isHovered 
      ? 'transform 0.08s ease-out, box-shadow 0.2s ease-out' 
      : 'transform 0.4s cubic-bezier(0.23, 1, 0.320, 1), box-shadow 0.4s ease-out',
  };

  // Merge refs for both resize detection and mouse events
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    cardRef.current = node;
    ref(node);
  }, [ref]);

  return (
    <div
      ref={mergedRef}
      className={`hover-card ${className}`}
      style={{
        ...transformStyle,
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        transformStyle: 'preserve-3d',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
}; 