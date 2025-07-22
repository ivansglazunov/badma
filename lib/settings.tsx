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


