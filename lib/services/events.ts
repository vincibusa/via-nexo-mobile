import { API_CONFIG } from '../../lib/config';

export interface EventDetail {
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
  ticket_availability: 'available' | 'sold_out' | 'limited';
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
}

class EventsService {
  /**
   * Get event details by ID
   */
  async getEventById(id: string): Promise<{ data?: EventDetail; error?: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}/api/events/${id}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch event details',
        };
      }

      const data = await response.json() as EventDetail;
      return { data };
    } catch (error) {
      console.error('Error fetching event details:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }
}

export const eventsService = new EventsService();
