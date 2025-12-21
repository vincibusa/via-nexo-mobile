/**
 * Chat Service - Refactored Version
 * Main entry point that combines all chat modules
 */

import { ChatApiService } from './chat-api';
import { ChatStreamingService } from './chat-streaming';
import { ChatParserService } from './chat-parser';
import type {
  ChatSuggestionRequest,
  ChatSuggestionResponse,
  ChatHistoryEntry,
  ChatConversation,
} from './types';

export class ChatService {
  private apiService: ChatApiService;
  private streamingService: ChatStreamingService;
  private parserService: ChatParserService;

  constructor() {
    this.apiService = new ChatApiService();
    this.streamingService = new ChatStreamingService();
    this.parserService = new ChatParserService();
  }

  /**
   * Get AI-powered chat suggestions with Server-Sent Events streaming
   */
  async getChatSuggestionsStream(
    request: ChatSuggestionRequest,
    accessToken: string,
    onProgress?: (step: string, message: string) => void,
    onStream?: (content: string) => void
  ): Promise<ChatSuggestionResponse> {
    try {
      // Use fetch-based streaming if supported
      if (this.streamingService.isStreamingSupported()) {
        const response = await this.streamingService.getChatSuggestionsStreamFetch(
          request,
          accessToken,
          onProgress,
          onStream
        );
        return this.parserService.parseChatResponse(response);
      }

      // Fallback to non-streaming API
      console.warn('[ChatService] Streaming not supported, falling back to REST API');
      const response = await this.apiService.getChatSuggestions(request, accessToken);
      return this.parserService.parseChatResponse(response);
    } catch (error) {
      console.error('[ChatService] Error getting chat suggestions:', error);
      throw error;
    }
  }

  /**
   * Get chat suggestions via REST API (non-streaming)
   */
  async getChatSuggestions(
    request: ChatSuggestionRequest,
    accessToken: string
  ): Promise<ChatSuggestionResponse> {
    try {
      const response = await this.apiService.getChatSuggestions(request, accessToken);
      return this.parserService.parseChatResponse(response);
    } catch (error) {
      console.error('[ChatService] Error getting chat suggestions:', error);
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
    return this.apiService.getChatHistory(accessToken, limit, offset);
  }

  /**
   * Get chat conversations list
   */
  async getConversations(
    accessToken: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatConversation[]> {
    return this.apiService.getConversations(accessToken, limit, offset);
  }

  /**
   * Get conversation by ID
   */
  async getConversation(
    conversationId: string,
    accessToken: string
  ): Promise<ChatHistoryEntry[]> {
    return this.apiService.getConversation(conversationId, accessToken);
  }

  /**
   * Delete a chat conversation
   */
  async deleteConversation(
    conversationId: string,
    accessToken: string
  ): Promise<void> {
    return this.apiService.deleteConversation(conversationId, accessToken);
  }

  /**
   * Clear all chat history
   */
  async clearHistory(accessToken: string): Promise<void> {
    return this.apiService.clearHistory(accessToken);
  }

  /**
   * Filter suggestions by type
   */
  filterSuggestionsByType(
    suggestions: any[],
    type: 'place' | 'event'
  ): any[] {
    return this.parserService.filterSuggestionsByType(suggestions, type);
  }

  /**
   * Sort suggestions by match score
   */
  sortSuggestionsByScore(
    suggestions: any[],
    descending: boolean = true
  ): any[] {
    return this.parserService.sortSuggestionsByScore(suggestions, descending);
  }

  /**
   * Get top N suggestions
   */
  getTopSuggestions(
    suggestions: any[],
    limit: number = 5
  ): any[] {
    return this.parserService.getTopSuggestions(suggestions, limit);
  }

  /**
   * Format response for display
   */
  formatResponseForDisplay(response: ChatSuggestionResponse) {
    return this.parserService.formatResponseForDisplay(response);
  }

  /**
   * Check if streaming is supported
   */
  isStreamingSupported(): boolean {
    return this.streamingService.isStreamingSupported();
  }

  /**
   * Get streaming status
   */
  getStreamingStatus() {
    return this.streamingService.getStreamingStatus();
  }

  /**
   * Cancel an ongoing stream
   */
  cancelStream(): void {
    this.streamingService.cancelStream();
  }
}

// Export singleton instance
export default new ChatService();

// Export types
export type {
  ChatSuggestionRequest,
  ChatSuggestionResponse,
  ChatSuggestion,
  ChatHistoryEntry,
  ChatConversation,
} from './types';