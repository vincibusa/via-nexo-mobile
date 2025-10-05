import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, settingsService } from '../services/settings';
import { useAuth } from './auth';

interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
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
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      // Update server
      const serverSettings = await settingsService.updateSettings(updates, session.accessToken);
      
      // Update with server response
      setSettings(serverSettings);
      
      // Update cache
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(serverSettings));
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