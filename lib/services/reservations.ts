import { API_CONFIG } from '../../lib/config';
import { storage } from '../../lib/storage';
import type {
  OpenTable,
  JoinRequest,
  JoinRequestWithReservation,
} from '../types/reservations';

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
  reservation_type?: 'pista' | 'prive';
  is_open_table?: boolean;
  open_table_description?: string;
  open_table_min_budget?: number;
  open_table_available_spots?: number;
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
    limit = 20,
    includePast = true
  ): Promise<{ data?: Reservation[]; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/my?offset=${offset}&limit=${limit}&include_past=${includePast}`;

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
    limit = 20,
    includePast = true
  ): Promise<{ data?: Reservation[]; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/user/${userId}?offset=${offset}&limit=${limit}&include_past=${includePast}`;

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
    wantsGroupChat: boolean = false,
    reservationType: 'pista' | 'prive' = 'pista',
    isOpenTable: boolean = false,
    openTableDescription?: string,
    openTableMinBudget?: number,
    openTableAvailableSpots?: number,
    userLocation?: { lat: number; lon: number }
  ): Promise<{ data?: Reservation; error?: string; details?: any }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/events/${eventId}/reservations`;

      const body: any = {
        guest_ids: guestIds,
        notes,
        wants_group_chat: wantsGroupChat,
        reservation_type: reservationType,
        user_location: userLocation, // FASE 2: Send user location for distance validation
      };

      // Add open table fields only for prive reservations
      if (reservationType === 'prive' && isOpenTable) {
        body.is_open_table = true;
        body.open_table_description = openTableDescription;
        body.open_table_min_budget = openTableMinBudget;
        body.open_table_available_spots = openTableAvailableSpots;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to create reservation',
          details: errorData.details, // Include error details for distance validation errors
        };
      }

      const data = await response.json();
      return { data: data.reservation || data };
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

      const responseText = await response.text();
      console.log('[Reservations] Cancel response:', {
        status: response.status,
        ok: response.ok,
        text: responseText,
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || 'Unknown error' };
        }
        console.error('[Reservations] Cancel error:', {
          status: response.status,
          error: errorData,
        });
        return {
          error:
            errorData.error ||
            `Failed to cancel reservation (${response.status})`,
        };
      }

      // Verify response is successful
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.warn('[Reservations] Failed to parse response:', e);
        // If response is empty or invalid JSON but status is OK, consider it success
        data = {};
      }
      console.log('[Reservations] Cancel success:', data);
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

  /**
   * Get open tables for an event
   */
  async getOpenTables(
    eventId: string
  ): Promise<{ data?: OpenTable[]; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/events/${eventId}/open-tables`;

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
          error: errorData.error || 'Failed to fetch open tables',
        };
      }

      const data = await response.json();
      return { data: data.open_tables || [] };
    } catch (error) {
      console.error('Get open tables error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Send a join request to an open table
   */
  async sendJoinRequest(
    reservationId: string,
    message?: string
  ): Promise<{ data?: JoinRequest; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/${reservationId}/join-request`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to send join request',
        };
      }

      const data = await response.json();
      return { data: data.join_request };
    } catch (error) {
      console.error('Send join request error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Get join requests for a reservation (owner only)
   */
  async getJoinRequests(
    reservationId: string,
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<{ data?: JoinRequest[]; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      let url = `${API_CONFIG.BASE_URL}/api/reservations/${reservationId}/join-requests`;
      if (status) {
        url += `?status=${status}`;
      }

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
          error: errorData.error || 'Failed to fetch join requests',
        };
      }

      const data = await response.json();
      return { data: data.join_requests || [] };
    } catch (error) {
      console.error('Get join requests error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Approve a join request
   */
  async approveJoinRequest(
    reservationId: string,
    requestId: string
  ): Promise<{ data?: JoinRequest; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/${reservationId}/join-requests/${requestId}/approve`;

      const response = await fetch(url, {
        method: 'POST',
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
          error: errorData.error || 'Failed to approve join request',
        };
      }

      const data = await response.json();
      return { data: data.join_request };
    } catch (error) {
      console.error('Approve join request error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Reject a join request
   */
  async rejectJoinRequest(
    reservationId: string,
    requestId: string
  ): Promise<{ data?: JoinRequest; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/${reservationId}/join-requests/${requestId}/reject`;

      const response = await fetch(url, {
        method: 'POST',
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
          error: errorData.error || 'Failed to reject join request',
        };
      }

      const data = await response.json();
      return { data: data.join_request };
    } catch (error) {
      console.error('Reject join request error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Get all pending join requests for current user's open tables
   */
  async getMyPendingRequests(): Promise<{
    data?: JoinRequestWithReservation[];
    error?: string;
  }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/reservations/my-pending-requests`;

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
          error: errorData.error || 'Failed to fetch pending requests',
        };
      }

      const data = await response.json();
      return { data: data.requests || [] };
    } catch (error) {
      console.error('Get my pending requests error:', error);
      return { error: 'Network error' };
    }
  }
}

export const reservationsService = new ReservationsService();
