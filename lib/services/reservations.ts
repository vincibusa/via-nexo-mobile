import { API_CONFIG } from '../../lib/config';
import { storage } from '../../lib/storage';

export interface Reservation {
  id: string;
  event_id: string;
  owner_id: string;
  qr_code_token: string;
  status: 'confirmed' | 'cancelled' | 'checked_in' | 'expired' | 'no_show';
  total_guests: number;
  notes?: string;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
  event?: {
    id: string;
    title: string;
    start_datetime: string;
    end_datetime?: string;
    cover_image_url?: string;
    place?: {
      id: string;
      name: string;
      address: string;
      city: string;
    };
  };
  owner?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    email: string;
  };
}

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  email: string;
  bio?: string;
}

export interface ReservationGuest {
  id: string;
  reservation_id: string;
  user_id: string;
  checked_in: boolean;
  checked_in_at?: string;
  user?: UserProfile;
}

class ReservationsService {
  /**
   * Get all reservations for current user
   */
  async getMyReservations(
    offset = 0,
    limit = 20
  ): Promise<{ data?: Reservation[]; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/my?offset=${offset}&limit=${limit}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to fetch your reservations',
        };
      }

      const data = await response.json();
      return { data: data.reservations };
    } catch (error) {
      console.error('Get my reservations error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Get all reservations for a specific user (for viewing other profiles)
   */
  async getUserReservations(
    userId: string,
    offset = 0,
    limit = 20
  ): Promise<{ data?: Reservation[]; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/user/${userId}?offset=${offset}&limit=${limit}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to fetch user reservations',
        };
      }

      const data = await response.json();
      return { data: data.reservations };
    } catch (error) {
      console.error('Get user reservations error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Get a specific reservation by ID
   */
  async getReservation(
    id: string
  ): Promise<{ data?: Reservation; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/${id}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to fetch reservation',
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Get reservation error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Create a new reservation for an event
   */
  async createReservation(
    eventId: string,
    guestIds: string[] = [],
    notes?: string,
    wantsGroupChat: boolean = false
  ): Promise<{ data?: Reservation; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/events/${eventId}/reservations`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guest_ids: guestIds,
          notes,
          wants_group_chat: wantsGroupChat,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to create reservation',
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Create reservation error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(
    id: string
  ): Promise<{ error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/${id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to cancel reservation',
        };
      }

      return {};
    } catch (error) {
      console.error('Cancel reservation error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Add a guest to a reservation
   */
  async addGuest(
    reservationId: string,
    guestId: string
  ): Promise<{ data?: ReservationGuest; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/${reservationId}/guests`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ guest_id: guestId }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to add guest',
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Add guest error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Remove a guest from a reservation
   */
  async removeGuest(
    reservationId: string,
    guestId: string
  ): Promise<{ error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/${reservationId}/guests?guest_id=${guestId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to remove guest',
        };
      }

      return {};
    } catch (error) {
      console.error('Remove guest error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Get guests for a reservation
   */
  async getGuests(
    reservationId: string
  ): Promise<{ data?: ReservationGuest[]; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/${reservationId}/guests`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch guests',
        };
      }

      const data = await response.json();
      return { data: data.guests };
    } catch (error) {
      console.error('Get guests error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Verify a QR code token (for mobile display)
   */
  async verifyQRCode(
    qrToken: string
  ): Promise<{ data?: Reservation; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/verify`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_code_token: qrToken }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error: errorData.error || 'Invalid QR code',
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Verify QR code error:', error);
      return { error: 'Network error' };
    }
  }
}

export const reservationsService = new ReservationsService();
