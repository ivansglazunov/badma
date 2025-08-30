"use client";

import { useMemo } from 'react';

// Shadcn/Tailwind color tokens we commonly use
// Key is our app color id, value is tailwind token suffix (e.g., purple-500)
export const COLORS: Record<string, string> = {
  badma: 'purple-500',
  purple: 'purple-500',
  violet: 'violet-500',
  indigo: 'indigo-500',
  blue: 'blue-500',
  sky: 'sky-500',
  cyan: 'cyan-500',
  teal: 'teal-500',
  emerald: 'emerald-500',
  green: 'green-500',
  lime: 'lime-500',
  yellow: 'yellow-500',
  amber: 'amber-500',
  orange: 'orange-500',
  red: 'red-500',
  rose: 'rose-500',
  pink: 'pink-500',
  fuchsia: 'fuchsia-500',
};

export type AppColorId = keyof typeof COLORS;

export function resolveTailwindColor(colorId: AppColorId | string): string {
  return COLORS[colorId] || COLORS.badma;
}

// Provide both main and dark variants for backgrounds when needed
export function resolveBgClasses(colorId: AppColorId | string): { main: string; dark: string } {
  const token = resolveTailwindColor(colorId);
  // Derive a darker shade for dark overlays
  const [name] = token.split('-');
  return {
    main: `bg-${token}`,
    dark: `bg-${name}-900`,
  };
}

export function useColorToken(colorId: AppColorId | string): string {
  return useMemo(() => resolveTailwindColor(colorId), [colorId]);
}

// Precomputed classes so Tailwind keeps them
export const BOTTOM_MENU_BG_CLASS: Record<AppColorId, string> = {
  badma: 'bg-purple-900/90',
  purple: 'bg-purple-900/90',
  violet: 'bg-violet-900/90',
  indigo: 'bg-indigo-900/90',
  blue: 'bg-blue-900/90',
  sky: 'bg-sky-900/90',
  cyan: 'bg-cyan-900/90',
  teal: 'bg-teal-900/90',
  emerald: 'bg-emerald-900/90',
  green: 'bg-green-900/90',
  lime: 'bg-lime-900/90',
  yellow: 'bg-yellow-900/90',
  amber: 'bg-amber-900/90',
  orange: 'bg-orange-900/90',
  red: 'bg-red-900/90',
  rose: 'bg-rose-900/90',
  pink: 'bg-pink-900/90',
  fuchsia: 'bg-fuchsia-900/90',
};

export function getBottomMenuBgClass(id: AppColorId | string): string {
  const key = (id in COLORS ? id : 'badma') as AppColorId;
  return BOTTOM_MENU_BG_CLASS[key];
}

export const COLOR_CIRCLE_BG_CLASS: Record<AppColorId, string> = {
  badma: 'bg-purple-500',
  purple: 'bg-purple-500',
  violet: 'bg-violet-500',
  indigo: 'bg-indigo-500',
  blue: 'bg-blue-500',
  sky: 'bg-sky-500',
  cyan: 'bg-cyan-500',
  teal: 'bg-teal-500',
  emerald: 'bg-emerald-500',
  green: 'bg-green-500',
  lime: 'bg-lime-500',
  yellow: 'bg-yellow-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  rose: 'bg-rose-500',
  pink: 'bg-pink-500',
  fuchsia: 'bg-fuchsia-500',
};


