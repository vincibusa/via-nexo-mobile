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
  MessageReaction,
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

  /**
   * Get total unread message count across all conversations
   * @returns Promise with total unread count
   */
  async getTotalUnreadCount(): Promise<number> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.BASE_URL}/api/messages/unread-count`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get total unread count');
      }

      const data = await response.json();
      return data.unreadCount;
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0; // Return 0 on error to avoid breaking UI
    }
  }

  /**
   * Add reaction to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<MessageReaction> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.BASE_URL}/api/messages/messages/${messageId}/reactions`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add reaction');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(messageId: string, reactionId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.BASE_URL}/api/messages/messages/${messageId}/reactions/${reactionId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove reaction');
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Get reactions for a message
   */
  async getReactions(messageId: string): Promise<MessageReaction[]> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.BASE_URL}/api/messages/messages/${messageId}/reactions`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get reactions');
      }

      const data = await response.json();
      return data.reactions || [];
    } catch (error) {
      console.error('Error getting reactions:', error);
      throw error;
    }
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(
    conversationId: string,
    query: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessagesResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const url = `${API_CONFIG.BASE_URL}/api/messages/conversations/${conversationId}/search?${params}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Search across all conversations
   */
  async searchAllMessages(
    query: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    messages: Message[];
    conversations: Record<string, Conversation>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const url = `${API_CONFIG.BASE_URL}/api/messages/search?${params}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search all messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching all messages:', error);
      throw error;
    }
  }
}

export default new MessagingService();
