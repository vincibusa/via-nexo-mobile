import { API_CONFIG } from '../config';

export interface FavoritePlace {
  favorite_id: string;
  created_at: string;
  id: string;
  name: string;
  category: string;
  description?: string;
  cover_image?: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  price_range?: '€' | '€€' | '€€€';
  verified: boolean;
}

export interface FavoriteEvent {
  favorite_id: string;
  created_at: string;
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  cover_image?: string;
  ticket_price_min?: number;
  ticket_price_max?: number;
  music_genre?: string[];
  place?: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

export interface FavoritesResponse {
  places: FavoritePlace[];
  events: FavoriteEvent[];
  total: number;
}

export interface AddFavoriteParams {
  resource_type: 'place' | 'event';
  resource_id: string;
}

export interface CheckFavoriteResponse {
  is_favorite: boolean;
  favorite_id: string | null;
}

class FavoritesService {
  /**
   * Get user's favorites
   */
  async getFavorites(accessToken: string): Promise<FavoritesResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to fetch favorites');
      }

      return response.json() as Promise<FavoritesResponse>;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  /**
   * Add a place or event to favorites
   */
  async addFavorite(
    params: AddFavoriteParams,
    accessToken: string
  ): Promise<{ favorite: any; message: string }> {
    try {
      // Map resource_type/resource_id to entity_type/entity_id for backend
      const body = {
        entity_type: params.resource_type,
        entity_id: params.resource_id,
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to add favorite');
      }

      return response.json() as Promise<{ favorite: any; message: string }>;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  /**
   * Remove a favorite by ID
   */
  async removeFavorite(favoriteId: string, accessToken: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITE_BY_ID(favoriteId)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to remove favorite');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  /**
   * Check if a resource is in favorites
   */
  async checkFavorite(
    resourceType: 'place' | 'event',
    resourceId: string,
    accessToken: string
  ): Promise<CheckFavoriteResponse> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES_CHECK}?resource_type=${resourceType}&resource_id=${resourceId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to check favorite status');
      }

      return response.json() as Promise<CheckFavoriteResponse>;
    } catch (error) {
      console.error('Error checking favorite:', error);
      throw error;
    }
  }
}

export const favoritesService = new FavoritesService();
