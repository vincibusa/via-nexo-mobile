import { API_CONFIG } from '@/lib/config';
import type { SuggestParams, SuggestResponse } from '@/lib/types/suggestion';

class SuggestionsService {
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

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || { code: 'UNKNOWN_ERROR', message: 'An error occurred' } };
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

  async getSuggestions(params: SuggestParams) {
    return this.request<SuggestResponse>(API_CONFIG.ENDPOINTS.SUGGEST, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const suggestionsService = new SuggestionsService();
