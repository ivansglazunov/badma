import React from 'react';
import ClassicBoard from './items/classic-board';
import BadmaBoard from './items/badma-board';
import ClassicPieces from './items/classic-pieces';
import BadmaPieces from './items/badma-pieces';
import MinefieldPerkCard, { MinefieldPerk, MinefieldEffect } from './items/minefield-perk';

// Component mapping
export const COMPONENT_MAP: Record<string, React.ComponentType<{ 
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}>> = {
  'classic_board': ClassicBoard,
  'badma_board': BadmaBoard,
  'classic_pieces': ClassicPieces,
  'badma_pieces': BadmaPieces,
  'minefield_perk': MinefieldPerkCard
};

export type ItemComponent = React.ComponentType<{ 
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}>;

export interface ItemType {
  id: string;
  name: string;
  description: string;
  category: 'pieces' | 'board' | 'perk';
  ItemComponent: ItemComponent;
}

export interface BoardStyle extends ItemType {
  lightColor: string;
  darkColor: string;
}

export interface PiecesStyle extends ItemType {
  colors: {
    white: string;
    black: string;
  };
}

export interface PerkType extends ItemType {
  perkClass: typeof MinefieldPerk;
  EffectComponent?: React.ComponentType<{
    gameData: any;
  }>;
}



// Supported pieces styles
export const PIECES_STYLES: PiecesStyle[] = [
  {
    id: 'classic_pieces',
    name: 'Классические фигуры',
    description: 'Набор шахмат без стилизации',
    colors: {
      white: '#ffffff',
      black: '#000000'
    },
    category: 'pieces' as const,
    ItemComponent: COMPONENT_MAP['classic_pieces']
  },
  {
    id: 'badma_pieces',
    name: 'Фигуры Бадма',
    description: 'Набор шахмат в стиле проекта Бадма, благодарность за участие в Альфа тесте',
    colors: {
      white: '#ffffff',
      black: '#000000'
    },
    category: 'pieces' as const,
    ItemComponent: COMPONENT_MAP['badma_pieces'],
  }
];

// Supported perks
export const PERK_TYPES: PerkType[] = [
  {
    id: 'minefield',
    name: 'Минное поле',
    description: 'Расставляет 4 случайные мины на пустых клетках доски. При попадании фигуры на мину она уничтожается.',
    perkClass: MinefieldPerk,
    EffectComponent: MinefieldEffect,
    category: 'perk' as const,
    ItemComponent: COMPONENT_MAP['minefield_perk'],
  }
];

// Supported board styles
export const BOARD_STYLES: BoardStyle[] = [
  {
    id: 'classic_board',
    name: 'Классическая',
    description: 'Стандартные цвета шахматной доски',
    lightColor: '#ECCCA9',
    darkColor: '#BD9375',
    category: 'board' as const,
    ItemComponent: COMPONENT_MAP['classic_board'],
  },
  {
    id: 'badma_board',
    name: 'Бадма',
    description: 'Фиолетовая тема в стиле проекта',
    lightColor: '#e8d0ff',
    darkColor: '#c084fc',
    category: 'board' as const,
    ItemComponent: COMPONENT_MAP['badma_board'],
  }
];

// Helper functions
export function getBoardStyle(id: string): BoardStyle {
  return BOARD_STYLES.find(style => style.id === id) || BOARD_STYLES[0];
}

export function getPiecesStyle(id: string): PiecesStyle | undefined {
  return PIECES_STYLES.find(style => style.id === id);
}

export function getPerkType(id: string): PerkType | undefined {
  return PERK_TYPES.find(perk => perk.id === id);
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

// All supported items
export const SUPPORTED_ITEMS: ItemType[] = [
  ...BOARD_STYLES.map(style => ({
    ...style,
    category: 'board' as const,
  })),
  ...PIECES_STYLES.map(style => ({
    ...style,
    category: 'pieces' as const,
  })),
  ...PERK_TYPES.map(perk => ({
    ...perk,
    category: 'perk' as const,
  }))
];