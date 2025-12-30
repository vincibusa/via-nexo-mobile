import { API_CONFIG } from '../config';
import * as storage from '../storage';
import type { EventGroupChatInfo, EventGroupChatResponse } from '../types/event-group-chat';

class EventGroupChatService {
  private async getHeaders(): Promise<HeadersInit> {
    const session = await storage.getSession();
    if (!session?.accessToken) {
      throw new Error('No session found');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    };
  }

  /**
   * Get event group chat information
   */
  async getEventGroupChat(eventId: string): Promise<{ data: EventGroupChatInfo | null; error: string | null }> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/events/${eventId}/group-chat`,
        {
          method: 'GET',
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error || 'Failed to fetch event group chat' };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching event group chat:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  /**
   * Join event group chat
   */
  async joinGroupChat(eventId: string): Promise<{ data: EventGroupChatResponse | null; error: string | null }> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/events/${eventId}/group-chat/join`,
        {
          method: 'POST',
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error || 'Failed to join event group chat' };
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      console.error('Error joining event group chat:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  /**
   * Leave event group chat
   */
  async leaveGroupChat(eventId: string): Promise<{ data: EventGroupChatResponse | null; error: string | null }> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/events/${eventId}/group-chat/leave`,
        {
          method: 'POST',
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error || 'Failed to leave event group chat' };
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      console.error('Error leaving event group chat:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Network error' };
    }
  }
}

export const eventGroupChatService = new EventGroupChatService();
