/**
 * Chat Service - Re-export of refactored version
 * Maintains backward compatibility while using new modular structure
 */

import ChatService, {
  type ChatSuggestionRequest,
  type ChatSuggestionResponse,
  type ChatSuggestion,
} from './chat/index';

// Re-export the singleton instance
export default ChatService;

// Re-export types for backward compatibility
export type {
  ChatSuggestionRequest,
  ChatSuggestionResponse,
  ChatSuggestion,
};

// Legacy type exports (for compatibility with existing code)
export interface ChatStreamProgress {
  step: string;
  message: string;
  timestamp: number;
}

// Legacy class wrapper for backward compatibility
export class ChatServiceLegacy {
  /**
   * Get AI-powered chat suggestions with Server-Sent Events streaming
   */
  async getChatSuggestionsStream(
    request: ChatSuggestionRequest,
    accessToken: string,
    onProgress?: (step: string, message: string) => void,
    onStream?: (content: string) => void
  ): Promise<ChatSuggestionResponse> {
    return ChatService.getChatSuggestionsStream(request, accessToken, onProgress, onStream);
  }

  /**
   * Get chat suggestions via REST API (non-streaming)
   */
  async getChatSuggestions(
    request: ChatSuggestionRequest,
    accessToken: string
  ): Promise<ChatSuggestionResponse> {
    return ChatService.getChatSuggestions(request, accessToken);
  }

  /**
   * Get chat history for a user
   */
  async getChatHistory(
    accessToken: string,
    limit: number = 50,
    offset: number = 0
  ) {
    return ChatService.getChatHistory(accessToken, limit, offset);
  }

  /**
   * Get chat conversations list
   */
  async getConversations(
    accessToken: string,
    limit: number = 20,
    offset: number = 0
  ) {
    return ChatService.getConversations(accessToken, limit, offset);
  }

  /**
   * Get conversation by ID
   */
  async getConversation(
    conversationId: string,
    accessToken: string
  ) {
    return ChatService.getConversation(conversationId, accessToken);
  }

  /**
   * Delete a chat conversation
   */
  async deleteConversation(
    conversationId: string,
    accessToken: string
  ): Promise<void> {
    return ChatService.deleteConversation(conversationId, accessToken);
  }

  /**
   * Clear all chat history
   */
  async clearHistory(accessToken: string): Promise<void> {
    return ChatService.clearHistory(accessToken);
  }

  /**
   * Filter suggestions by type
   */
  filterSuggestionsByType(
    suggestions: any[],
    type: 'place' | 'event'
  ): any[] {
    return ChatService.filterSuggestionsByType(suggestions, type);
  }

  /**
   * Sort suggestions by match score
   */
  sortSuggestionsByScore(
    suggestions: any[],
    descending: boolean = true
  ): any[] {
    return ChatService.sortSuggestionsByScore(suggestions, descending);
  }

  /**
   * Get top N suggestions
   */
  getTopSuggestions(
    suggestions: any[],
    limit: number = 5
  ): any[] {
    return ChatService.getTopSuggestions(suggestions, limit);
  }

  /**
   * Format response for display
   */
  formatResponseForDisplay(response: ChatSuggestionResponse) {
    return ChatService.formatResponseForDisplay(response);
  }

  /**
   * Check if streaming is supported
   */
  isStreamingSupported(): boolean {
    return ChatService.isStreamingSupported();
  }

  /**
   * Get streaming status
   */
  getStreamingStatus() {
    return ChatService.getStreamingStatus();
  }

  /**
   * Cancel an ongoing stream
   */
  cancelStream(): void {
    ChatService.cancelStream();
  }
}

// Export legacy instance for backward compatibility
export const chatService = new ChatServiceLegacy();