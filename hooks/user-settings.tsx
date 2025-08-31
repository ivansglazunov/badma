'use client'

import { useMemo } from 'react';
import { useSubscription, useQuery, useSelect, useHasyx } from 'hasyx';
import { getUserSettings, UserSetting, UserSettings } from '../lib/settings';
import { useUserSettingsStore } from '../lib/stores/user-settings-store';
import Debug from '../lib/debug';

const debug = Debug('user-settings');

/**
 * Hook to get user settings from zustand store
 */
export function useUserSettings(): {
  settings: UserSettings;
  loading: boolean;
  error: any;
  getSetting: (key: keyof UserSettings) => string | undefined;
  updateSetting: (key: keyof UserSettings, value: string) => void;
} {
  const { settings, isLoading, error, getSetting, updateSetting } = useUserSettingsStore();
  
  return {
    settings,
    loading: isLoading,
    error,
    getSetting,
    updateSetting
  };
}

/**
 * Hook to get user settings by user ID (legacy version for backward compatibility)
 */
export function useUserSettingsByUserId(userId?: string): {
  settings: UserSettings;
  loading: boolean;
  error: any;
} {
  const { data, loading, error } = useSubscription(
    {
      table: 'badma_settings',
      where: { 
        user_id: { _eq: userId }
      },
      returning: [
        'id',
        'key',
        'value',
        'user_id'
      ]
    }
  );

  const settings = useMemo(() => {
    debug('⚙️ [USER_SETTINGS] Processing settings for user:', userId);
    debug('⚙️ [USER_SETTINGS] Raw data:', data);
    
    if (!data || !Array.isArray(data)) {
      debug('⚙️ [USER_SETTINGS] No data or not array, using defaults');
      return getUserSettings([]);
    }

    // Convert settings data to UserSetting format
    const settingsArray: UserSetting[] = data.map((setting: any) => ({
      id: setting.id,
      key: setting.key,
      value: setting.value
    }));
    
    debug('⚙️ [USER_SETTINGS] Settings from database:', settingsArray);

    debug('⚙️ [USER_SETTINGS] Settings array:', settingsArray);
    const finalSettings = getUserSettings(settingsArray);
    debug('⚙️ [USER_SETTINGS] Final settings:', finalSettings);
    
    return finalSettings;
  }, [data, userId]);

  return {
    settings,
    loading,
    error
  };
}

/**
 * Hook to get settings for multiple users
 */
export function useMultipleUserSettings(userIds: string[]): {
  settingsMap: Record<string, UserSettings>;
  loading: boolean;
  error: any;
} {
  debug('🔍 [MULTIPLE_USER_SETTINGS] Hook called with userIds:', userIds);
  
  const skipCondition = userIds.length === 0;
  debug('🔍 [MULTIPLE_USER_SETTINGS] Skip condition:', skipCondition);
  
  const subscriptionConfig = {
    table: 'badma_settings',
    where: { 
      user_id: { _in: userIds }
    },
    returning: [
      'id',
      'key',
      'value',
      'user_id'
    ]
  };
  
  debug('🔍 [MULTIPLE_USER_SETTINGS] Subscription config:', subscriptionConfig);
  
  // Use query instead of subscription since subscriptions are not enabled for badma_settings
  const { data, loading, error } = useQuery(
    subscriptionConfig,
    { skip: skipCondition }
  );
  
  debug('🔍 [MULTIPLE_USER_SETTINGS] Raw query result:', { data, loading, error, userIds });
  
  // Log data type and structure
  if (data) {
    debug('🔍 [MULTIPLE_USER_SETTINGS] Data type:', typeof data);
    debug('🔍 [MULTIPLE_USER_SETTINGS] Data is array:', Array.isArray(data));
    debug('🔍 [MULTIPLE_USER_SETTINGS] Data length:', data?.length);
  }

  const settingsMap = useMemo(() => {
    debug('🔍 [MULTIPLE_USER_SETTINGS] Processing data for users:', userIds);
    debug('🔍 [MULTIPLE_USER_SETTINGS] Raw data from query:', data);
    
    const result: Record<string, UserSettings> = {};
    
    // Initialize with default settings for all users
    userIds.forEach(userId => {
      result[userId] = getUserSettings([]);
      debug('🔍 [MULTIPLE_USER_SETTINGS] Initialized defaults for user:', userId, result[userId]);
    });

    if (!data || !Array.isArray(data)) {
      debug('🔍 [MULTIPLE_USER_SETTINGS] No data or not array, returning defaults');
      return result;
    }

    debug('🔍 [MULTIPLE_USER_SETTINGS] Data is valid array with length:', data.length);

    // Group settings by user_id
    const settingsByUser: Record<string, any[]> = {};
    data.forEach((setting: any, index: number) => {
      debug('🔍 [MULTIPLE_USER_SETTINGS] Processing setting', index, ':', setting);
      
      if (!settingsByUser[setting.user_id]) {
        settingsByUser[setting.user_id] = [];
      }
      settingsByUser[setting.user_id].push(setting);
    });
    
    debug('🔍 [MULTIPLE_USER_SETTINGS] Settings grouped by user:', settingsByUser);

    // Convert to UserSettings for each user
    Object.entries(settingsByUser).forEach(([userId, settings]) => {
      debug('🔍 [MULTIPLE_USER_SETTINGS] Processing settings for user:', userId, settings);
      
      const settingsArray: UserSetting[] = settings.map((setting: any) => ({
        id: setting.id,
        key: setting.key,
        value: setting.value
      }));
      
      debug('🔍 [MULTIPLE_USER_SETTINGS] Settings array for user:', userId, settingsArray);
      
      const userSettings = getUserSettings(settingsArray);
      debug('🔍 [MULTIPLE_USER_SETTINGS] Final settings for user:', userId, userSettings);
      
      result[userId] = userSettings;
    });
    
    debug('🔍 [MULTIPLE_USER_SETTINGS] Final result:', result);

    return result;
  }, [data, userIds]);

  return {
    settingsMap,
    loading,
    error
  };
}
