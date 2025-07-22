import React from 'react';
import ClassicBoard from './items/classic-board';
import BadmaBoard from './items/badma-board';
import ClassicPieces from './items/classic-pieces';
import BadmaPieces from './items/badma-pieces';

export interface ItemType {
  id: string;
  name: string;
  description: string;
  category: 'pieces' | 'board';
  Component: React.ComponentType<{ 
    className?: string;
    onClick?: () => void;
    size?: 'small' | 'large';
  }>;
}

export interface BoardStyle {
  id: string;
  name: string;
  description: string;
  lightColor: string;
  darkColor: string;
}

export interface PiecesStyle {
  id: string;
  name: string;
  description: string;
  colors: {
    white: string;
    black: string;
  };
}

// Supported board styles
export const BOARD_STYLES: BoardStyle[] = [
  {
    id: 'classic_board',
    name: 'Классическая доска',
    description: 'Стандартные цвета шахматной доски',
    lightColor: '#ECCCA9',
    darkColor: '#BD9375'
  },
  {
    id: 'badma_board',
    name: 'Доска Бадма',
    description: 'В стиле проекта Бадма, благодарность за участие в Альфа тесте',
    lightColor: '#e8d0ff',
    darkColor: '#c084fc'
  }
];

// Supported pieces styles
export const PIECES_STYLES: PiecesStyle[] = [
  {
    id: 'classic_pieces',
    name: 'Классические фигуры',
    description: 'Набор шахмат без стилизации',
    colors: {
      white: '#ffffff',
      black: '#000000'
    }
  },
  {
    id: 'badma_pieces',
    name: 'Фигуры Бадма',
    description: 'Набор шахмат в стиле проекта Бадма, благодарность за участие в Альфа тесте',
    colors: {
      white: '#ffffff',
      black: '#000000'
    }
  }
];

// Component mapping
export const COMPONENT_MAP: Record<string, React.ComponentType<{ 
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'large';
}>> = {
  'classic_board': ClassicBoard,
  'badma_board': BadmaBoard,
  'classic_pieces': ClassicPieces,
  'badma_pieces': BadmaPieces
};

// All supported items
export const SUPPORTED_ITEMS: ItemType[] = [
  ...BOARD_STYLES.map(style => ({
    id: style.id,
    name: style.name,
    description: style.description,
    category: 'board' as const,
    Component: COMPONENT_MAP[style.id]
  })),
  ...PIECES_STYLES.map(style => ({
    id: style.id,
    name: style.name,
    description: style.description,
    category: 'pieces' as const,
    Component: COMPONENT_MAP[style.id]
  }))
];

// Helper functions
export function getBoardStyle(id: string): BoardStyle | undefined {
  return BOARD_STYLES.find(style => style.id === id);
}

export function getPiecesStyle(id: string): PiecesStyle | undefined {
  return PIECES_STYLES.find(style => style.id === id);
}

export function getItemType(id: string): ItemType | undefined {
  return SUPPORTED_ITEMS.find(item => item.id === id);
}

/**
 * Grant an item to a user (server-side function using admin hasyx instance)
 * @param adminHasyx - Admin hasyx instance with elevated permissions
 * @param objectId - Optional object ID (can be null)
 * @param typeString - Type of item to grant (e.g., 'badma_pieces', 'badma_board')
 * @param userId - ID of user to grant item to
 * @returns Promise that resolves when item is granted
 */
export async function grantItem(
  adminHasyx: any,
  objectId: string | null,
  typeString: string,
  userId: string
): Promise<void> {
  try {
    // Check if item already exists for this user and type
    const existingItems = await adminHasyx.select({
      table: 'badma_items',
      where: {
        user_id: { _eq: userId },
        type: { _eq: typeString }
      },
      returning: ['id'],
      limit: 1
    });
    
    // If item already exists, don't grant again
    if (existingItems && existingItems.length > 0) {
      console.log(`ℹ️ [GRANT_ITEM] Item ${typeString} already exists for user ${userId}`);
      return;
    }
    
    // Grant the item
    await adminHasyx.insert({
      table: 'badma_items',
      object: {
        type: typeString,
        user_id: userId,
        accepted: false,
        ...(objectId && { reason_id: objectId })
      }
    });
    
    console.log(`✅ [GRANT_ITEM] Granted ${typeString} to user ${userId}`);
  } catch (error) {
    console.error(`❌ [GRANT_ITEM] Failed to grant ${typeString} to user ${userId}:`, error);
    throw error;
  }
}
