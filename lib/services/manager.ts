import { API_CONFIG } from '../config';
import { storage } from '../storage';
import type {
  ManagerEvent,
  EventFormData,
  ManagerPlace,
  EventsListResponse,
  PlacesListResponse,
} from '../types/manager';
import type { Reservation } from './reservations';

class ManagerService {
  /**
   * Get all events for the current manager
   */
  async getMyEvents(
    page = 1,
    limit = 20,
    filter?: string,
    search?: string
  ): Promise<{ data?: EventsListResponse; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MANAGER_EVENTS}?${params}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch events',
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Get my events error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Create a new event
   */
  async createEvent(
    eventData: EventFormData
  ): Promise<{ data?: ManagerEvent; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MANAGER_EVENTS}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to create event',
        };
      }

      const responseData = await response.json();
      return { data: responseData.event };
    } catch (error) {
      console.error('Create event error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Get a single event by ID
   */
  async getEvent(
    id: string
  ): Promise<{ data?: ManagerEvent; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MANAGER_EVENT_BY_ID(id)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch event',
        };
      }

      const responseData = await response.json();
      return { data: responseData.event };
    } catch (error) {
      console.error('Get event error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    id: string,
    eventData: Partial<EventFormData>
  ): Promise<{ data?: ManagerEvent; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MANAGER_EVENT_BY_ID(id)}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to update event',
        };
      }

      const responseData = await response.json();
      return { data: responseData.event };
    } catch (error) {
      console.error('Update event error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<{ error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MANAGER_EVENT_BY_ID(id)}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to delete event',
        };
      }

      return {};
    } catch (error) {
      console.error('Delete event error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Get all available places where managers can create events
   * Returns all published and approved places in the database
   */
  async getMyPlaces(
    page = 1,
    limit = 100
  ): Promise<{ data?: PlacesListResponse; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MANAGER_PLACES}?${params}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to fetch places',
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Get my places error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Check in a reservation (owner or guests)
   */
  async checkInReservation(
    id: string,
    guestIds?: string[]
  ): Promise<{ data?: Reservation; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESERVATION_CHECKIN(id)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          guest_ids: guestIds || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return {
          error: errorData.error || 'Failed to check in',
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Check in reservation error:', error);
      return { error: 'Network error' };
    }
  }
}

export const managerService = new ManagerService();
