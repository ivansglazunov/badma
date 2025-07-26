"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Cyto, CytoNode, CytoStyle } from "hasyx/lib/cyto";
import { useTheme } from "hasyx/components/theme-switcher";
import { useHasyx } from "hasyx";

// Создаем SVG data URL для шахматного фона
const createChessSVG = (bgBlack: string, bgWhite: string, multiplier: number = 1): string => {
  const max = 100;
  const cellSize = max / 8;
  const svg = `
    <svg width="${multiplier * max}" height="${multiplier * max}" viewBox="0 0 ${multiplier * max} ${multiplier * max}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="chess-pattern" x="0" y="0" width="${multiplier * (cellSize * 2)}" height="${multiplier * (cellSize * 2)}" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="${multiplier * cellSize}" height="${multiplier * cellSize}" fill="${bgWhite}"/>
          <rect x="${multiplier * cellSize}" y="0" width="${multiplier * cellSize}" height="${multiplier * cellSize}" fill="${bgBlack}"/>
          <rect x="0" y="${multiplier * cellSize}" width="${multiplier * cellSize}" height="${multiplier * cellSize}" fill="${bgBlack}"/>
          <rect x="${multiplier * cellSize}" y="${multiplier * cellSize}" width="${multiplier * cellSize}" height="${multiplier * cellSize}" fill="${bgWhite}"/>
        </pattern>
      </defs>
      <rect width="${multiplier * max}" height="${multiplier * max}" fill="url(#chess-pattern)"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Стили для Cytoscape с шахматным фоном
const createChessStylesheet = (bgBlack: string, bgWhite: string) => [
  {
    selector: 'node',
    style: {
      'background-color': 'var(--foreground)',
      'background-opacity': 0,
      'shape': 'circle',
      'width': 10,
      'height': 10,
      'border-radius': 10,
      'color': 'var(--foreground)',
    }
  },
  {
    selector: 'node.avatar',
    style: {
      'background-image': 'data(image)',
      'background-fit': 'cover cover',
      'background-opacity': 1,
      'width': 10,
      'height': 10,
      'shape': 'circle',
      // 'label': 'data(label)',
      'font-size': 8,
      'border-color': 'var(--color-purple-500)',
      'border-width': 1,
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': 'var(--foreground)',
      'target-arrow-color': 'var(--foreground)',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier'
    }
  }
];

export const ChessVerse: React.FC = () => {
  const hasyx = useHasyx();
  const { theme } = useTheme();
  const bgBlack = theme === "dark" ? '#3b0764' : '#c084fc';
  const bgWhite = theme === "dark" ? '#581c87' : '#dfbfff';
  const [showText, setShowText] = useState(false);

  const stylesheet = useMemo(() => createChessStylesheet(bgBlack, bgWhite), [bgBlack, bgWhite]);
  
  // Создаем SVG background image
  const chessBackgroundImage = useMemo(() => createChessSVG(bgBlack, bgWhite, 1), [bgBlack, bgWhite]);

  const onGraphLoaded = useCallback(async (cy: any) => {
    if (global) (global as any).cy = cy;
    cy.gridGuide({
      gridSpacing: 12,
      drawGrid: false,
    });
    await new Promise(resolve => setTimeout(resolve, 700));
    cy.elements().forEach(element => {
      element.position({ x: 6, y: 6 });
    });
    cy.animate({
      // center: { x: '50%', y: '50%' }
      fit: {
        eles: cy.$('#' + hasyx.userId),
        padding: 100,
      }
    });
  }, []);

  const layoutConfig = useMemo(() => ({
    name: 'cola',
    nodeDimensionsIncludeLabels: true,
    fit: false
  }), []);

  // Показываем текст через 2 секунды
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Шахматный фон */}
      
      {/* Cyto пространство */}
      <div className="relative z-10 w-full h-full">
        <Cyto
          onLoaded={onGraphLoaded}
          buttons={false}
          layout={layoutConfig}
          zoomHandler={(zoom) => zoom * 2}
          style={{
            backgroundImage: `url("${chessBackgroundImage}")`,
          }}
        >
          <CytoStyle stylesheet={stylesheet} />
          <CytoNode element={{
            id: hasyx.userId,
            data: {
              id: hasyx.userId,
              image: hasyx.user.image,
              label: hasyx.user.name,
            },
            classes: 'avatar',
          }} />
        </Cyto>
      </div>

      {/* Текст поверх */}
      <div className="absolute bottom-20 pointer-events-none z-20 w-full">
        <div className={`text-center transition-opacity duration-1000 ${showText ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-4xl font-bold text-foreground mb-2">Chess Verse</h1>
          <h3 className="text-xl text-foreground">coming soon ;)</h3>
        </div>
      </div>
    </div>
  );
}; 