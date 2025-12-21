/**
 * Chat API Module
 * REST API calls for chat functionality
 */

import { API_CONFIG } from '../../config';
import type {
  ChatSuggestionRequest,
  ChatSuggestionResponse,
  ChatApiError,
  ChatHistoryEntry,
  ChatConversation,
} from './types';

export class ChatApiService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Get chat suggestions via REST API (non-streaming)
   */
  async getChatSuggestions(
    request: ChatSuggestionRequest,
    accessToken: string
  ): Promise<ChatSuggestionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/chat/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData: ChatApiError = await response.json();
        throw new Error(errorData.error || 'Failed to get chat suggestions');
      }

      return await response.json();
    } catch (error) {
      console.error('[ChatApi] Error getting suggestions:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a user
   */
  async getChatHistory(
    accessToken: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatHistoryEntry[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/ai/chat/history?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData: ChatApiError = await response.json();
        throw new Error(errorData.error || 'Failed to get chat history');
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('[ChatApi] Error getting history:', error);
      throw error;
    }
  }

  /**
   * Get chat conversations list
   */
  async getConversations(
    accessToken: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatConversation[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/ai/chat/conversations?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData: ChatApiError = await response.json();
        throw new Error(errorData.error || 'Failed to get conversations');
      }

      const data = await response.json();
      return data.conversations || [];
    } catch (error) {
      console.error('[ChatApi] Error getting conversations:', error);
      throw error;
    }
  }

  /**
   * Delete a chat conversation
   */
  async deleteConversation(
    conversationId: string,
    accessToken: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/ai/chat/conversations/${conversationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData: ChatApiError = await response.json();
        throw new Error(errorData.error || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('[ChatApi] Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Clear all chat history
   */
  async clearHistory(accessToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/chat/history`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData: ChatApiError = await response.json();
        throw new Error(errorData.error || 'Failed to clear history');
      }
    } catch (error) {
      console.error('[ChatApi] Error clearing history:', error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(
    conversationId: string,
    accessToken: string
  ): Promise<ChatHistoryEntry[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/ai/chat/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData: ChatApiError = await response.json();
        throw new Error(errorData.error || 'Failed to get conversation');
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('[ChatApi] Error getting conversation:', error);
      throw error;
    }
  }
}