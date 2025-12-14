import { API_CONFIG } from '../config';
import { useAuth } from '../contexts/auth';

export interface EventRecommendation {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime?: string;
  cover_image?: string;
  place?: {
    id: string;
    name: string;
    category: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    cover_image?: string;
    price_range?: string;
    verified: boolean;
  };
  friends_going?: Array<{
    id: string;
    display_name: string;
    avatar_url?: string;
  }>;
  friend_count: number;
  match_score: number;
  reason: string;
}

export interface RecommendationFilters {
  date_range?: 'today' | 'weekend' | 'next_week' | 'month';
  event_types?: string[];
  max_distance_km?: number;
  max_price?: number;
  min_friend_count?: number;
}

class EventRecommendationsService {
  /**
   * Get personalized event recommendations
   */
  async getRecommendations(
    accessToken: string,
    filters?: RecommendationFilters
  ): Promise<{ data?: EventRecommendation[]; error?: string }> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', '20');
      
      if (filters?.date_range) {
        // Map date_range to backend parameters if needed
        // Currently backend uses lat/lng for location-based filtering
      }
      
      if (filters?.max_distance_km) {
        // This would require location to be passed separately
      }
      
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENT_RECOMMENDATIONS}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch recommendations',
        };
      }

      const responseData = await response.json() as { recommendations?: EventRecommendation[] };
      
      // Extract recommendations from response
      const data = responseData.recommendations || [];
      return { data };
    } catch (error) {
      console.error('Error fetching event recommendations:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  /**
   * Get events with friends (simplified version for mobile)
   */
  async getEventsWithFriends(
    accessToken: string,
    limit: number = 10
  ): Promise<{ data?: EventRecommendation[]; error?: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENTS_WITH_FRIENDS}?limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch events with friends',
        };
      }

      const responseData = await response.json() as { events?: EventRecommendation[] };
      
      // Extract events from response
      const data = responseData.events || [];
      return { data };
    } catch (error) {
      console.error('Error fetching events with friends:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  /**
   * Record user interest in an event (for improving recommendations)
   */
  async recordInterest(
    accessToken: string,
    eventId: string,
    interestLevel: 'viewed' | 'saved' | 'shared' | 'attending'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENT_INTEREST}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          interest_level: interestLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          success: false,
          error: errorData.error || 'Failed to record interest',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error recording event interest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  /**
   * Get trending events in user's area
   */
  async getTrendingEvents(
    accessToken: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<{ data?: EventRecommendation[]; error?: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRENDING_EVENTS}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          latitude,
          longitude,
          radius_km: radiusKm,
          limit: 15,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch trending events',
        };
      }

      const responseData = await response.json() as { events?: EventRecommendation[] };
      
      // Extract events from response
      const data = responseData.events || [];
      return { data };
    } catch (error) {
      console.error('Error fetching trending events:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  /**
   * Get event recommendations based on user's past attendance
   */
  async getSimilarToPastEvents(
    accessToken: string,
    limit: number = 10
  ): Promise<{ data?: EventRecommendation[]; error?: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SIMILAR_EVENTS}?limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch similar events',
        };
      }

      const responseData = await response.json() as { events?: EventRecommendation[] };
      
      // Extract events from response
      const data = responseData.events || [];
      return { data };
    } catch (error) {
      console.error('Error fetching similar events:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }
}

export const eventRecommendationsService = new EventRecommendationsService();