import { API_CONFIG } from '../../lib/config';
import type { Place } from '../../lib/types/suggestion';

export interface PlaceDetail extends Place {
  events?: Event[];
}

interface Event {
  id: string;
  title: string;
  event_type: string;
  start_datetime: string;
  end_datetime?: string;
  cover_image?: string;
  ticket_price_min?: number;
  ticket_price_max?: number;
}

class PlacesService {
  /**
   * Get place details by ID
   */
  async getPlaceById(
    id: string,
    userLocation?: { lat: number; lon: number }
  ): Promise<{ data?: PlaceDetail; error?: string }> {
    try {
      // Build URL with optional location params
      let url = `${API_CONFIG.BASE_URL}/api/places/${id}`;
      if (userLocation) {
        url += `?lat=${userLocation.lat}&lon=${userLocation.lon}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch place details',
        };
      }

      const data = await response.json() as PlaceDetail;
      return { data };
    } catch (error) {
      console.error('Error fetching place details:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }
}

export const placesService = new PlacesService();
