/**
 * Chat Streaming Module
 * SSE/streaming functionality for chat suggestions
 */

import { API_CONFIG } from '../../config';
import type {
  ChatSuggestionRequest,
  ChatSuggestionResponse,
  ChatStreamProgress,
  ChatStreamEvent,
} from './types';

export class ChatStreamingService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Get chat suggestions with Server-Sent Events streaming using fetch
   */
  async getChatSuggestionsStreamFetch(
    request: ChatSuggestionRequest,
    accessToken: string,
    onProgress?: (step: string, message: string) => void,
    onStream?: (content: string) => void
  ): Promise<ChatSuggestionResponse> {
    return new Promise((resolve, reject) => {
      let responseBuffer = '';
      let isComplete = false;

      const processSSE = async () => {
        try {
          const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.CHAT_SUGGEST_STREAM}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              Accept: 'text/event-stream',
            },
            body: JSON.stringify(request),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          // React Native compatibility: check if streaming is supported
          if (response.body && response.body.getReader) {
            // Use streaming reader (browser/newer RN versions)
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // Process any remaining buffer
                if (responseBuffer) {
                  const remainingLines = responseBuffer.split('\n');
                  for (const line of remainingLines) {
                    if (line.startsWith('data: ')) {
                      const data = line.substring(6).trim();
                      if (!data || data === '[DONE]') {
                        continue;
                      }

                      try {
                        const parsed = JSON.parse(data);
                        this.handleStreamEvent(parsed, onProgress, onStream);

                        if (parsed.type === 'complete') {
                          const responseData: ChatSuggestionResponse = {
                            conversationalResponse: parsed.conversationalResponse || '',
                            suggestions: parsed.suggestions || [],
                            searchMetadata: parsed.searchMetadata || {
                              totalCandidates: 0,
                              totalPlaces: 0,
                              totalEvents: 0,
                              processingTime: 0,
                              cacheUsed: false,
                              contextUsed: false,
                              conversationLength: 0,
                            },
                          };
                          isComplete = true;
                          resolve(responseData);
                          return;
                        }
                      } catch (parseError) {
                        console.warn('[ChatStreaming] Failed to parse SSE data:', parseError, 'Data:', data);
                      }
                    }
                  }
                }
                if (!isComplete) {
                  throw new Error('Stream ended without completion');
                }
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              responseBuffer += chunk;

              // Process complete SSE messages (only process complete lines)
              const lines = responseBuffer.split('\n');
              // Keep the last incomplete line in buffer
              responseBuffer = lines.pop() || '';

              // Process complete lines
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.substring(6).trim();
                  if (!data || data === '[DONE]') {
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    this.handleStreamEvent(parsed, onProgress, onStream);

                    // Check if this is the final response
                    if (parsed.type === 'complete') {
                      const responseData: ChatSuggestionResponse = {
                        conversationalResponse: parsed.conversationalResponse || '',
                        suggestions: parsed.suggestions || [],
                        searchMetadata: parsed.searchMetadata || {
                          totalCandidates: 0,
                          totalPlaces: 0,
                          totalEvents: 0,
                          processingTime: 0,
                          cacheUsed: false,
                          contextUsed: false,
                          conversationLength: 0,
                        },
                        bookingIntentId: parsed.bookingIntentId, // FIXED: Include bookingIntentId from backend
                      };
                      isComplete = true;
                      resolve(responseData);
                      return;
                    }
                  } catch (parseError) {
                    console.warn('[ChatStreaming] Failed to parse SSE data:', parseError, 'Data:', data);
                  }
                }
              }
            }
          } else {
            // Fallback for React Native: read entire response as text
            console.log('[ChatStreaming] Streaming not supported, reading full response');
            const fullText = await response.text();
            
            // Process the entire SSE stream
            const lines = fullText.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6).trim();
                if (!data || data === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  this.handleStreamEvent(parsed, onProgress, onStream);

                  // Check if this is the final response
                  if (parsed.type === 'complete') {
                    const responseData: ChatSuggestionResponse = {
                      conversationalResponse: parsed.conversationalResponse || '',
                      suggestions: parsed.suggestions || [],
                      searchMetadata: parsed.searchMetadata || {
                        totalCandidates: 0,
                        totalPlaces: 0,
                        totalEvents: 0,
                        processingTime: 0,
                        cacheUsed: false,
                        contextUsed: false,
                        conversationLength: 0,
                      },
                      bookingIntentId: parsed.bookingIntentId, // FIXED: Include bookingIntentId from backend
                    };
                    isComplete = true;
                    resolve(responseData);
                    return;
                  }
                } catch (parseError) {
                  console.warn('[ChatStreaming] Failed to parse SSE data:', parseError, 'Data:', data);
                }
              }
            }

            if (!isComplete) {
              throw new Error('Stream ended without completion');
            }
          }
        } catch (error) {
          console.error('[ChatStreaming] Stream error:', error);
          reject(error);
        }
      };

      processSSE();
    });
  }

  /**
   * Handle stream events
   */
  private async handleStreamEvent(
    event: any,
    onProgress?: (step: string, message: string) => void,
    onStream?: (content: string) => void
  ): Promise<void> {
    switch (event.type) {
      case 'progress':
        if (onProgress) {
          // Backend sends: { type: 'progress', step: '...', message: '...' }
          onProgress(event.step || 'processing', event.message || '');
        }
        break;

      case 'stream':
        // Backend sends: { type: 'stream', content: '...' }
        if (onStream && event.content) {
          onStream(event.content);
        }
        break;

      case 'error':
        console.error('[ChatStreaming] Stream error:', event.error || event);
        break;

      case 'init':
        // Initial connection event, can be ignored
        break;

      case 'complete':
        // Final response handled in main loop
        break;

      default:
        console.warn('[ChatStreaming] Unknown event type:', event.type);
    }
  }

  /**
   * Cancel an ongoing stream
   */
  cancelStream(): void {
    // Note: This is a placeholder. In a real implementation,
    // you would need to track and abort the fetch request.
    console.log('[ChatStreaming] Stream cancellation requested');
  }

  /**
   * Check if streaming is supported
   */
  isStreamingSupported(): boolean {
    return typeof fetch !== 'undefined' && typeof ReadableStream !== 'undefined';
  }

  /**
   * Get streaming status
   */
  getStreamingStatus(): {
    supported: boolean;
    method: 'fetch' | 'eventsource' | 'none';
  } {
    return {
      supported: this.isStreamingSupported(),
      method: this.isStreamingSupported() ? 'fetch' : 'none',
    };
  }
}