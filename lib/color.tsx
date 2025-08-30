"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';
import { useHasyx } from 'hasyx';
import { setSetting } from './settings';
import { COLORS, AppColorId } from './colors';
import { useUserSettingsStore } from './stores/user-settings-store';

interface ColorStoreState {
  activeColorId: AppColorId;
  setActiveColorId: (id: AppColorId) => void;
}

export const useColorStore = create<ColorStoreState>((set) => ({
  activeColorId: 'badma',
  setActiveColorId: (id) => set({ activeColorId: id }),
}));

const ColorContext = createContext<ColorStoreState | null>(null);

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const { activeColorId, setActiveColorId } = useColorStore();
  const hasyx = useHasyx();
  const { getSetting, updateSetting } = useUserSettingsStore();

  // Initialize from settings when available
  useEffect(() => {
    const settingColor = (getSetting as any)?.('color') as string | undefined;
    if (settingColor && settingColor in COLORS && settingColor !== activeColorId) {
      setActiveColorId(settingColor as AppColorId);
    }
  }, [getSetting, activeColorId, setActiveColorId]);

  // Expose provider
  return (
    <ColorContext.Provider value={{ activeColorId, setActiveColorId }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColor(): {
  colorId: AppColorId;
  setColor: (id: AppColorId) => void;
} {
  const ctx = useContext(ColorContext);
  const hasyx = useHasyx();
  const { updateSetting } = useUserSettingsStore();

  if (!ctx) {
    // Fallback to store directly if provider not mounted
    const { activeColorId, setActiveColorId } = useColorStore.getState();
    return {
      colorId: activeColorId,
      setColor: (id: AppColorId) => {
        useColorStore.setState({ activeColorId: id });
        updateSetting('color' as any, id);
        // Persist in background
        if (hasyx?.userId) {
          setSetting(hasyx, 'color', id).catch(() => {});
        }
      },
    };
  }

  return {
    colorId: ctx.activeColorId,
    setColor: (id: AppColorId) => {
      ctx.setActiveColorId(id);
      updateSetting('color' as any, id);
      if (hasyx?.userId) {
        setSetting(hasyx, 'color', id).catch(() => {});
      }
    },
  };
}


