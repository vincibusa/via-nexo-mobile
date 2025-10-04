import { API_CONFIG } from '../../lib/config';
import type { LoginResponse, SignupResponse, User } from '../../lib/types/auth';

class AuthService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data?: T; error?: { code: string; message: string } }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json() as T;

      if (!response.ok) {
        return { error: (data as any).error || { code: 'UNKNOWN_ERROR', message: 'An error occurred' } };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  async login(email: string, password: string) {
    return this.request<LoginResponse>(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email: string, password: string, displayName?: string) {
    return this.request<SignupResponse>(API_CONFIG.ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async logout(token: string) {
    return this.request(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getProfile(token: string) {
    return this.request<User>(API_CONFIG.ENDPOINTS.ME, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const authService = new AuthService();
