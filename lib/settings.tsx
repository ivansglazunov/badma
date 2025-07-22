export interface UserSetting {
  id: string;
  key: string;
  value: string;
}

export interface UserSettings {
  board: string;
  pieces: string;
  [key: string]: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  board: 'classic',
  pieces: 'classic'
};

/**
 * Converts array of user settings to key-value object with defaults
 */
export function getUserSettings(settingsArray: UserSetting[] = []): UserSettings {
  const settings: UserSettings = { ...DEFAULT_SETTINGS };
  
  settingsArray.forEach(setting => {
    settings[setting.key] = setting.value;
  });
  
  return settings;
}

/**
 * Gets a specific setting value with fallback to default
 */
export function getSetting(settingsArray: UserSetting[] = [], key: keyof UserSettings): string {
  const setting = settingsArray.find(s => s.key === key);
  return setting?.value || DEFAULT_SETTINGS[key];
}
