import { API_CONFIG } from '@/lib/config';

export interface QuickSuggestion {
  id: string;
  name: string;
  place_type: string;
  description: string | null;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  price_range: string | null;
  ambience_tags: string[] | null;
  music_genre: string[] | null;
  verification_status: string;
  is_published: boolean;
  is_listed: boolean;
  distance_km: number;
  suggestions_count: number;
  created_at: string;
  photos: Array<{ url: string; is_primary: boolean }>;
  badge: string | null;
}

export interface QuickSuggestionsResponse {
  suggestions: QuickSuggestion[];
  metadata: {
    total: number;
    radius_km: number;
  };
}

class QuickSuggestionsService {
  /**
   * Get quick suggestions (popular places and events) near user location
   */
  async getQuickSuggestions(
    location: { lat: number; lon: number },
    radius_km: number = 10,
    limit: number = 6
  ): Promise<{ data?: QuickSuggestionsResponse; error?: string }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/suggestions/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          radius_km,
          limit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.error || 'Failed to fetch quick suggestions',
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching quick suggestions:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }
}

export const quickSuggestionsService = new QuickSuggestionsService();
