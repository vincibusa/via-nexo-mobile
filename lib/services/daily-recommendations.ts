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

export interface SwipeParams {
  recommendation_id: string;
  action_type: 'like' | 'pass';
  featured_date: string;
  event_id?: string;
  event_type?: string;
  event_genre?: string[];
  place_id?: string;
  place_type?: string;
}

interface SwipeResponse {
  success: boolean;
  swipe: {
    id: string;
    action_type: string;
    swiped_at: string;
  };
  completion_status: {
    completed: boolean;
    total_recommendations: number;
    total_swiped: number;
    remaining: number;
  };
}

interface CompletionResponse {
  completed: boolean;
  total_recommendations: number;
  total_swiped: number;
  remaining: number;
  liked_events: Array<{
    id: string;
    title: string;
    cover_image_url?: string;
    start_datetime: string;
  }>;
}

interface UserSwipe {
  id: string;
  recommendation_id: string;
  action_type: 'like' | 'pass';
  featured_date: string;
  swiped_at: string;
  event_id?: string;
  event?: {
    id: string;
    title: string;
    cover_image_url?: string;
    start_datetime: string;
  };
  place_id?: string;
  place?: {
    id: string;
    name: string;
    cover_image_url?: string;
    city: string;
    place_type: string;
  };
}

interface SwipesResponse {
  swipes: UserSwipe[];
  completion_status: {
    completed: boolean;
    total_recommendations: number;
    total_swiped: number;
    remaining: number;
  };
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

  /**
   * Save a swipe action (like or pass)
   */
  async saveSwipe(
    params: SwipeParams,
    accessToken?: string
  ): Promise<{ data?: SwipeResponse; error?: string }> {
    try {
      let token = accessToken;
      if (!token) {
        const session = await storage.getSession();
        token = session?.accessToken || null;
      }
      if (!token) {
        return { error: 'No access token available' };
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/recommendations/daily/swipe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Failed to save swipe' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Save swipe error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get all swipes for a specific date
   */
  async getSwipes(
    date?: string,
    accessToken?: string
  ): Promise<{ data?: SwipesResponse; error?: string }> {
    try {
      let token = accessToken;
      if (!token) {
        const session = await storage.getSession();
        token = session?.accessToken || null;
      }
      if (!token) {
        return { error: 'No access token available' };
      }

      const url = new URL(
        `${API_CONFIG.BASE_URL}/api/recommendations/daily/swipes`
      );

      if (date) {
        url.searchParams.set('date', date);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Failed to fetch swipes' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Get swipes error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Check completion status and get liked events if completed
   */
  async checkCompletion(
    date?: string,
    accessToken?: string
  ): Promise<{ data?: CompletionResponse; error?: string }> {
    try {
      let token = accessToken;
      if (!token) {
        const session = await storage.getSession();
        token = session?.accessToken || null;
      }
      if (!token) {
        return { error: 'No access token available' };
      }

      const url = new URL(
        `${API_CONFIG.BASE_URL}/api/recommendations/daily/completion`
      );

      if (date) {
        url.searchParams.set('date', date);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Failed to check completion' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Check completion error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get recommendations filtered by already swiped items
   */
  async getFilteredRecommendations(
    date?: string,
    accessToken?: string
  ): Promise<{ data?: DailyRecommendationsResponse; error?: string }> {
    try {
      // First, get all recommendations
      const recommendationsResult = await this.getDailyRecommendations(date);

      if (recommendationsResult.error || !recommendationsResult.data) {
        return recommendationsResult;
      }

      // Then, get user's swipes to filter out already swiped items
      const swipesResult = await this.getSwipes(date, accessToken);

      if (swipesResult.error || !swipesResult.data) {
        // If we can't get swipes, just return all recommendations
        return recommendationsResult;
      }

      // Create a Set of already swiped recommendation IDs for fast lookup
      const swipedIds = new Set(
        swipesResult.data.swipes.map((s) => s.recommendation_id)
      );

      // Filter out swiped recommendations
      const filteredRecommendations =
        recommendationsResult.data.recommendations.filter(
          (rec) => !swipedIds.has(rec.id)
        );

      return {
        data: {
          ...recommendationsResult.data,
          recommendations: filteredRecommendations,
          count: filteredRecommendations.length,
        },
      };
    } catch (error) {
      console.error('Get filtered recommendations error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

export const dailyRecommendationsService = new DailyRecommendationsService();
