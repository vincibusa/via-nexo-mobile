import { API_CONFIG } from '../../lib/config';
import { storage } from '../../lib/storage';

export interface Recommendation {
  id: string;
  entity_type: 'place' | 'event';
  entity_id: string;
  featured_date: string;
  source: 'automatic' | 'admin';
  priority: number;
  score?: number;
  reason?: string;
  place?: {
    id: string;
    name: string;
    cover_image_url?: string;
    city: string;
    place_type: string;
  };
  event?: {
    id: string;
    title: string;
    cover_image_url?: string;
    start_datetime: string;
  };
}

interface CheckResponse {
  hasRecommendations: boolean;
  count: number;
  date: string;
}

interface DailyRecommendationsResponse {
  recommendations: Recommendation[];
  hasRecommendations: boolean;
  count: number;
  date: string;
}

class DailyRecommendationsService {
  /**
   * Check if there are daily recommendations for a specific date
   */
  async checkHasRecommendations(
    date?: string
  ): Promise<{ data?: CheckResponse; error?: string }> {
    try {
      const url = new URL(
        `${API_CONFIG.BASE_URL}/api/recommendations/daily/check`
      );

      if (date) {
        url.searchParams.set('date', date);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          data: { hasRecommendations: false, count: 0, date: date || new Date().toISOString().split('T')[0] },
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Check recommendations error:', error);
      return { data: { hasRecommendations: false, count: 0, date: date || new Date().toISOString().split('T')[0] } };
    }
  }

  /**
   * Get daily recommendations for a specific date
   */
  async getDailyRecommendations(
    date?: string,
    city?: string
  ): Promise<{ data?: DailyRecommendationsResponse; error?: string }> {
    try {
      const url = new URL(
        `${API_CONFIG.BASE_URL}/api/recommendations/daily`
      );

      if (date) {
        url.searchParams.set('date', date);
      }
      if (city) {
        url.searchParams.set('city', city);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          data: {
            recommendations: [],
            hasRecommendations: false,
            count: 0,
            date: date || new Date().toISOString().split('T')[0],
          },
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Get daily recommendations error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get recommendations for today (convenience method)
   */
  async getTodayRecommendations(
    city?: string
  ): Promise<{ data?: Recommendation[]; error?: string }> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await this.getDailyRecommendations(today, city);

    if (error) {
      return { error };
    }

    return { data: data?.recommendations || [] };
  }
}

export const dailyRecommendationsService = new DailyRecommendationsService();
