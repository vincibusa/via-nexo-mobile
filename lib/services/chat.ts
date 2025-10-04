import { API_CONFIG } from '../../lib/config';

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
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/chat/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error || 'Failed to get chat suggestions');
      }

      // Parse the streaming response
      // React Native doesn't fully support ReadableStream, so we read as text
      let fullText = '';
      let result: Partial<ChatSuggestionResponse> = {};

      try {
        // Try to use getReader if available (web/newer RN versions)
        if (response.body?.getReader) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            fullText += decoder.decode(value, { stream: true });
          }
        } else {
          // Fallback: read entire response as text (React Native default)
          fullText = await response.text();
        }
      } catch (streamError) {
        console.error('[ChatService] Stream reading error:', streamError);
        // Last resort fallback: try to read as text
        try {
          fullText = await response.text();
        } catch (textError) {
          throw new Error('Unable to read stream response');
        }
      }

      console.log('[ChatService] Received response length:', fullText.length);
      console.log('[ChatService] First 200 chars:', fullText.substring(0, 200));

      // Try to parse as complete JSON first
      try {
        const parsed = JSON.parse(fullText);
        if (parsed.conversationalResponse && parsed.suggestions && parsed.searchMetadata) {
          result = parsed;
        }
      } catch (e) {
        // Not a complete JSON, try line-by-line parsing
        const lines = fullText.trim().split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          // Remove stream prefixes like "0:"
          const cleanedLine = line.replace(/^\d+:/, '').trim();

          try {
            const chunk = JSON.parse(cleanedLine);

            if (chunk.conversationalResponse !== undefined) {
              result.conversationalResponse = chunk.conversationalResponse;
            }
            if (chunk.suggestions !== undefined) {
              result.suggestions = chunk.suggestions;
            }
            if (chunk.searchMetadata !== undefined) {
              result.searchMetadata = chunk.searchMetadata;
            }
          } catch (parseError) {
            // Skip invalid JSON lines
          }
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
