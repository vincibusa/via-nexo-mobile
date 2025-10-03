import { API_BASE_URL } from '@/lib/config';

export interface ChatSuggestionRequest {
  message: string;
  location: {
    lat: number;
    lon: number;
  };
  radius_km?: number;
}

export interface ChatSuggestion {
  placeId: string;
  reason: string;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ChatSuggestionResponse {
  conversationalResponse: string;
  suggestions: ChatSuggestion[];
  searchMetadata: {
    totalCandidates: number;
    processingTime: number;
    cacheUsed: boolean;
  };
}

class ChatService {
  /**
   * Get AI-powered chat suggestions based on natural language input
   */
  async getChatSuggestions(
    request: ChatSuggestionRequest,
    accessToken: string
  ): Promise<ChatSuggestionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get chat suggestions');
      }

      // Parse the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let result: Partial<ChatSuggestionResponse> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON objects from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            // Parse streaming object chunks
            const chunk = JSON.parse(line);

            // Merge chunk into result
            if (chunk.conversationalResponse !== undefined) {
              result.conversationalResponse = chunk.conversationalResponse;
            }
            if (chunk.suggestions !== undefined) {
              result.suggestions = chunk.suggestions;
            }
            if (chunk.searchMetadata !== undefined) {
              result.searchMetadata = chunk.searchMetadata;
            }
          } catch (e) {
            // Skip invalid JSON
            console.warn('Failed to parse chunk:', line);
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer);
          if (chunk.conversationalResponse !== undefined) {
            result.conversationalResponse = chunk.conversationalResponse;
          }
          if (chunk.suggestions !== undefined) {
            result.suggestions = chunk.suggestions;
          }
          if (chunk.searchMetadata !== undefined) {
            result.searchMetadata = chunk.searchMetadata;
          }
        } catch (e) {
          console.warn('Failed to parse final buffer:', buffer);
        }
      }

      if (!result.conversationalResponse || !result.suggestions || !result.searchMetadata) {
        throw new Error('Incomplete response from chat API');
      }

      return result as ChatSuggestionResponse;
    } catch (error) {
      console.error('Error getting chat suggestions:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
