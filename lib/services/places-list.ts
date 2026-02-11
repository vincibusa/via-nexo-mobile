import { API_CONFIG } from '../config';
import type { Place } from '../types/suggestion';
import type { PlacesFilters, PaginatedResponse } from '../types/filters';

class PlacesListService {
  /**
   * Fetch paginated list of places with filters
   */
  async getPlaces(
    filters: PlacesFilters = {},
    location?: { lat: number; lon: number },
    cursor?: string | null
  ): Promise<{ data?: PaginatedResponse<Place>; error?: string }> {
    try {
      // Build query params
      const params = new URLSearchParams();

      // Pagination
      if (cursor) {
        params.append('cursor', cursor);
      }
      params.append('limit', '20');

      // Location
      if (location) {
        params.append('lat', location.lat.toString());
        params.append('lon', location.lon.toString());
      }

      // Filters
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.category) {
        params.append('category', filters.category);
      }
      if (filters.price_range) {
        params.append('price_range', filters.price_range);
      }
      if (filters.verified !== undefined) {
        params.append('verified', filters.verified.toString());
      }
      if (filters.has_events !== undefined) {
        params.append('has_events', filters.has_events.toString());
      }
      // NOTE: max_distance_km removed (FASE 1) - users see all places
      if (filters.sort) {
        params.append('sort', filters.sort);
      }

      const url = `${API_CONFIG.BASE_URL}/api/places?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        return {
          error: errorData.error || 'Failed to fetch places',
        };
      }

      const data = (await response.json()) as PaginatedResponse<Place>;
      return { data };
    } catch (error) {
      console.error('Error fetching places:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }
}

export const placesListService = new PlacesListService();
