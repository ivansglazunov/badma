export interface UserSetting {
  id: string;
  key: string;
  value: string;
}

export interface UserSettings {
  board: string;
  pieces: string;
  color?: string;
  [key: string]: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  board: 'classic',
  pieces: 'classic',
  color: 'badma'
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
 * Sets a user setting by first deleting all existing settings with the same key,
 * then creating a new one. This ensures no duplicates exist.
 */
export async function setSetting(
  hasyx: any,
  settingKey: string,
  settingValue: string
): Promise<void> {
  if (!hasyx.userId) {
    throw new Error('User not authenticated');
  }

  console.log(`🔧 [SET_SETTING] Setting ${settingKey} = ${settingValue} for user ${hasyx.userId}`);

  try {
    // First, delete all existing settings with this key to remove duplicates
    await hasyx.delete({
      table: 'badma_settings',
      where: {
        user_id: { _eq: hasyx.userId },
        key: { _eq: settingKey }
      }
    });

    console.log(`🗑️ [SET_SETTING] Deleted existing ${settingKey} settings`);

    // Then create the new setting
    await hasyx.insert({
      table: 'badma_settings',
      object: {
        user_id: hasyx.userId,
        key: settingKey,
        value: settingValue
      }
    });

    console.log(`✅ [SET_SETTING] Created new ${settingKey} setting with value ${settingValue}`);
  } catch (error) {
    console.error(`❌ [SET_SETTING] Error setting ${settingKey}:`, error);
    throw error;
  }
}
