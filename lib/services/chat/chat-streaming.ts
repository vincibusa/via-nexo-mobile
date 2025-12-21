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
          const response = await fetch(`${this.baseUrl}/api/ai/chat/suggestions/stream`, {
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

          if (!response.body) {
            throw new Error('No response body');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              if (!isComplete) {
                throw new Error('Stream ended without completion');
              }
              break;
            }

            const chunk = decoder.decode(value);
            responseBuffer += chunk;

            // Process complete SSE messages
            const lines = responseBuffer.split('\n');
            responseBuffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6);
                if (data === '[DONE]') {
                  isComplete = true;
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  await this.handleStreamEvent(parsed, onProgress, onStream);

                  // Check if this is the final response
                  if (parsed.type === 'complete' && parsed.data) {
                    resolve(parsed.data);
                    return;
                  }
                } catch (parseError) {
                  console.warn('[ChatStreaming] Failed to parse SSE data:', parseError, 'Data:', data);
                }
              }
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
    event: ChatStreamEvent,
    onProgress?: (step: string, message: string) => void,
    onStream?: (content: string) => void
  ): Promise<void> {
    switch (event.type) {
      case 'progress':
        if (onProgress && event.data) {
          const progress = event.data as ChatStreamProgress;
          onProgress(progress.step, progress.message);
        }
        break;

      case 'response':
        if (onStream && event.data?.content) {
          onStream(event.data.content);
        }
        break;

      case 'error':
        console.error('[ChatStreaming] Stream error:', event.data);
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