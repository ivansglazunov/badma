import { create } from 'zustand';
import { UserSettings, UserSetting, DEFAULT_SETTINGS, getUserSettings } from '../settings';

interface UserSettingsStore {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  setSettings: (settingsData: UserSetting[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getSetting: (key: keyof UserSettings) => string | undefined;
  updateSetting: (key: keyof UserSettings, value: string) => void;
}

export const useUserSettingsStore = create<UserSettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,
  
  setSettings: (settingsData) => {
    const settings = getUserSettings(settingsData);
    set({ settings });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  getSetting: (key) => {
    const { settings } = get();
    return settings[key];
  },
  
  updateSetting: (key, value) => {
    set((state) => ({
      settings: {
        ...state.settings,
        [key]: value
      }
    }));
  },
}));
