import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, settingsService } from '../services/settings';
import { useAuth } from './auth';
import { useColorScheme } from 'nativewind';

interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  currentTheme: 'light' | 'dark';
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = '@nexo_settings';

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  push_token: null,
  push_enabled: true,
  language: 'it',
  default_radius_km: 5,
  theme: 'system',
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { colorScheme: systemColorScheme, setColorScheme } = useColorScheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate current theme based on user preference and system
  const currentTheme = React.useMemo(() => {
    if (!settings?.theme || settings.theme === 'system') {
      return systemColorScheme || 'light';
    }
    return settings.theme;
  }, [settings?.theme, systemColorScheme]);

  // Sync user theme preference with NativeWind
  useEffect(() => {
    if (settings?.theme) {
      if (settings.theme === 'system') {
        // Reset to system color scheme
        setColorScheme(systemColorScheme || 'light');
      } else {
        setColorScheme(settings.theme);
      }
    }
  }, [settings?.theme, setColorScheme, systemColorScheme]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [session]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      // Try to load from AsyncStorage first (cache)
      const cached = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (cached) {
        setSettings(JSON.parse(cached));
      }

      // If user is logged in, fetch from server
      if (session?.accessToken) {
        try {
          const serverSettings = await settingsService.getSettings(session.accessToken);
          setSettings(serverSettings);
          // Update cache
          await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(serverSettings));
        } catch (error) {
          console.error('Failed to fetch settings from server:', error);
          // Keep cached settings if server fetch fails
          if (!cached) {
            setSettings(DEFAULT_SETTINGS);
          }
        }
      } else {
        // Not logged in, use defaults
        if (!cached) {
          setSettings(DEFAULT_SETTINGS);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // Optimistic update
      const newSettings = { ...settings, ...updates } as UserSettings;
      setSettings(newSettings);

      // Update NativeWind color scheme if theme is being updated
      if (updates.theme) {
        if (updates.theme === 'system') {
          setColorScheme(systemColorScheme || 'light');
        } else {
          setColorScheme(updates.theme);
        }
      }

      // Update server
      const serverSettings = await settingsService.updateSettings(updates, session.accessToken);
      
      // Update with server response
      setSettings(serverSettings);
      
      // Update cache
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(serverSettings));

      // Handle push notification registration if push_enabled is being updated
      if (updates.push_enabled !== undefined) {
        if (updates.push_enabled) {
          // Enable push notifications - register token
          try {
            const { notificationsService } = await import('../services/notifications');
            await notificationsService.requestPermissions();
            await notificationsService.registerPushToken(session.accessToken);
          } catch (error) {
            console.error('Error registering push token:', error);
            // Don't throw error here - settings update should still succeed
          }
        }
        // If disabling push, we don't need to do anything special
        // The token will remain on the server but won't be used
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      // Rollback on error
      await loadSettings();
      throw error;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        refreshSettings,
        currentTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}