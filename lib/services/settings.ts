import { API_CONFIG } from '../config';

export interface UserSettings {
  push_token: string | null;
  push_enabled: boolean;
  language: 'it' | 'en';
  default_radius_km: number;
  theme: 'light' | 'dark' | 'system';
}

export interface UpdateSettingsParams {
  push_token?: string | null;
  push_enabled?: boolean;
  language?: 'it' | 'en';
  default_radius_km?: number;
  theme?: 'light' | 'dark' | 'system';
}

class SettingsService {
  /**
   * Get user settings
   */
  async getSettings(accessToken: string): Promise<UserSettings> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_SETTINGS}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to fetch settings');
      }

      const data = await response.json() as { settings: UserSettings };
      return data.settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(
    params: UpdateSettingsParams,
    accessToken: string
  ): Promise<UserSettings> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_SETTINGS}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to update settings');
      }

      const data = await response.json() as { settings: UserSettings; message: string };
      return data.settings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();