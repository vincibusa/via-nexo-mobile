import { API_CONFIG } from '../config';
import type { EventsFilters, PaginatedResponse } from '../types/filters';

export interface EventListItem {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime?: string;
  cover_image?: string;
  lineup?: string[];
  music_genre?: string[];
  ticket_price_min?: number;
  ticket_price_max?: number;
  ticket_url?: string;
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
  distance_km?: number;
}

class EventsListService {
  /**
   * Fetch paginated list of events with filters
   */
  async getEvents(
    filters: EventsFilters = {},
    location?: { lat: number; lon: number },
    cursor?: string | null
  ): Promise<{ data?: PaginatedResponse<EventListItem>; error?: string }> {
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
      if (filters.event_type) {
        params.append('event_type', filters.event_type);
      }
      if (filters.music_genre) {
        params.append('music_genre', filters.music_genre);
      }
      if (filters.price_min !== undefined) {
        params.append('price_min', filters.price_min.toString());
      }
      if (filters.price_max !== undefined) {
        params.append('price_max', filters.price_max.toString());
      }
      if (filters.time_filter) {
        params.append('time_filter', filters.time_filter);
      } else {
        // Default to upcoming events
        params.append('time_filter', 'upcoming');
      }
      if (filters.max_distance_km !== undefined) {
        params.append('max_distance_km', filters.max_distance_km.toString());
      }
      if (filters.sort) {
        params.append('sort', filters.sort);
      }

      const url = `${API_CONFIG.BASE_URL}/api/events?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        return {
          error: errorData.error || 'Failed to fetch events',
        };
      }

      const data = (await response.json()) as PaginatedResponse<EventListItem>;
      return { data };
    } catch (error) {
      console.error('Error fetching events:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }
}

export const eventsListService = new EventsListService();
