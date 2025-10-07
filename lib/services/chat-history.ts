import { API_CONFIG } from '../../lib/config';
import type {
  ChatConversation,
  ChatConversationWithMessages,
  ChatConversationsResponse,
  CreateConversationRequest,
  AddMessageRequest,
} from '../types/chat-history';

class ChatHistoryService {
  /**
   * Get user's chat conversations
   */
  async getConversations(
    accessToken: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatConversationsResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/chat/conversations?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to fetch conversations');
      }

      const data = await response.json();
      return data as ChatConversationsResponse;
    } catch (error) {
      console.error('Error getting chat conversations:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    request: CreateConversationRequest,
    accessToken: string
  ): Promise<{ conversation: ChatConversationWithMessages; message: string }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to create conversation');
      }

      const data = await response.json();
      return data as { conversation: ChatConversationWithMessages; message: string };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(
    conversationId: string,
    accessToken: string
  ): Promise<ChatConversationWithMessages> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/chat/conversations/${conversationId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to fetch conversation');
      }

      return await response.json() as ChatConversationWithMessages;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Add a message to an existing conversation
   */
  async addMessage(
    conversationId: string,
    request: AddMessageRequest,
    accessToken: string
  ): Promise<{ message: any; conversation: ChatConversation }> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_CONVERSATION_MESSAGES(conversationId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to add message');
      }

      const data = await response.json();
      return data as { message: any; conversation: ChatConversation };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(
    conversationId: string,
    accessToken: string
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/chat/conversations/${conversationId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to delete conversation');
      }

      const data = await response.json();
      return data as { message: string };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Save current conversation from chat interface
   */
  async saveConversation(
    messages: any[], // Using any to match existing Message interface
    accessToken: string
  ): Promise<ChatConversationWithMessages> {
    try {
      if (messages.length === 0) {
        throw new Error('Cannot save empty conversation');
      }

      // Use first user message as initial message
      const firstUserMessage = messages.find(msg => msg.isUser);
      if (!firstUserMessage) {
        throw new Error('No user messages found to save');
      }

      const request: CreateConversationRequest = {
        initial_message: firstUserMessage.content,
      };

      // Create conversation
      const { conversation } = await this.createConversation(request, accessToken);

      // Add all remaining messages
      for (const message of messages) {
        if (message.id === firstUserMessage.id) continue; // Skip first message already added

        await this.addMessage(conversation.id, {
          content: message.content,
          is_user: message.isUser,
          suggestions_data: message.suggestions,
        }, accessToken);
      }

      // Return updated conversation with all messages
      return await this.getConversation(conversation.id, accessToken);
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  /**
   * Continue an existing conversation
   */
  async continueConversation(
    conversationId: string,
    accessToken: string
  ): Promise<ChatConversationWithMessages> {
    try {
      return await this.getConversation(conversationId, accessToken);
    } catch (error) {
      console.error('Error continuing conversation:', error);
      throw error;
    }
  }
}

export const chatHistoryService = new ChatHistoryService();