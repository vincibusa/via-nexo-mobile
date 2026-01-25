import { API_CONFIG } from '../config';
import type { DiscoveryItem } from '../types/discovery';
import { useAuth } from '../contexts/auth';

class DiscoveryService {
  /**
   * Get discovery feed items
   */
  async getDiscoveryFeed(
    limit = 20,
    offset = 0
  ): Promise<{ data?: DiscoveryItem[]; error?: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISCOVERY}?limit=${limit}&offset=${offset}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch discovery feed',
        };
      }

      const data = await response.json() as { items: DiscoveryItem[] };
      return { data: data.items || [] };
    } catch (error) {
      console.error('Error fetching discovery feed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  /**
   * Toggle like on a discovery item
   */
  async toggleLike(
    discoveryId: string,
    accessToken: string
  ): Promise<{ data?: { is_liked: boolean; likes_count: number }; error?: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISCOVERY_LIKE(discoveryId)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to toggle like',
        };
      }

      const data = await response.json() as { is_liked: boolean; likes_count: number };
      return { data };
    } catch (error) {
      console.error('Error toggling like:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  /**
   * Increment view count for a discovery item
   */
  async incrementViews(
    discoveryId: string,
    accessToken?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISCOVERY_VIEW(discoveryId)}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          success: false,
          error: errorData.error || 'Failed to increment views',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error incrementing views:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }
}

export const discoveryService = new DiscoveryService();









