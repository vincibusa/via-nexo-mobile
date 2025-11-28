import { API_CONFIG } from '../config';
import { storage } from '../storage';
import type {
  Conversation,
  ConversationsResponse,
  CreateConversationRequest,
  CreateConversationResponse,
  Message,
  MessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/messaging';

class MessagingService {
  private async getAuthHeaders() {
    const session = await storage.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    };
  }

  /**
   * Get list of conversations for the current user
   */
  async getConversations(
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationsResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.BASE_URL}/api/messages/conversations?limit=${limit}&offset=${offset}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation with another user
   */
  async createConversation(
    data: CreateConversationRequest
  ): Promise<CreateConversationResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.BASE_URL}/api/messages/conversations`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create conversation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    before?: string
  ): Promise<MessagesResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams({ limit: limit.toString() });
      if (before) params.append('before', before);

      const url = `${API_CONFIG.BASE_URL}/api/messages/conversations/${conversationId}/messages?${params}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    data: SendMessageRequest
  ): Promise<SendMessageResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.BASE_URL}/api/messages/conversations/${conversationId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read in a conversation
   */
  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.BASE_URL}/api/messages/conversations/${conversationId}/read`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message_id: messageId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.BASE_URL}/api/messages/messages/${messageId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Get unread count for a conversation
   */
  async getUnreadCount(conversationId: string): Promise<number> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.BASE_URL}/api/messages/conversations/${conversationId}/unread-count`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get unread count');
      }

      const data = await response.json();
      return data.unread_count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export default new MessagingService();
