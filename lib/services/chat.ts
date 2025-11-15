import { API_CONFIG } from '../../lib/config';
import { EventSource } from 'react-native-sse';
import 'react-native-url-polyfill/auto';

export interface ChatSuggestionRequest {
  message: string;
  location: {
    lat: number;
    lon: number;
  };
  radius_km?: number;
  conversation_id?: string; // NUOVO: Per memoria conversazionale
}

export interface ChatSuggestion {
  id: string; // Can be placeId or eventId
  type: 'place' | 'event';
  reason: string;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ChatSuggestionResponse {
  conversationalResponse: string;
  suggestions: ChatSuggestion[];
  searchMetadata: {
    totalCandidates: number;
    totalPlaces: number;
    totalEvents: number;
    processingTime: number;
    cacheUsed: boolean;
    contextUsed?: boolean; // NUOVO: Indica se è stato usato contesto conversazionale
    conversationLength?: number; // NUOVO: Lunghezza conversazione
  };
}

class ChatService {
  /**
   * Get AI-powered chat suggestions with Server-Sent Events streaming
   * Uses react-native-sse for proper SSE support in React Native
   */
  async getChatSuggestionsStream(
    request: ChatSuggestionRequest,
    accessToken: string,
    onProgress?: (step: string, message: string) => void,
    onStream?: (content: string) => void
  ): Promise<ChatSuggestionResponse> {
    // Try native EventSource first (for React Native)
    if (typeof EventSource !== 'undefined') {
      return this.getChatSuggestionsStreamEventSource(request, accessToken, onProgress, onStream)
    }
    
    // Fallback to fetch-based implementation
    return this.getChatSuggestionsStreamFetch(request, accessToken, onProgress, onStream)
  }

  /**
   * SSE implementation using EventSource (react-native-sse)
   */
  async getChatSuggestionsStreamEventSource(
    request: ChatSuggestionRequest,
    accessToken: string,
    onProgress?: (step: string, message: string) => void,
    onStream?: (content: string) => void
  ): Promise<ChatSuggestionResponse> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[DEBUG] Using EventSource for SSE: ${API_CONFIG.BASE_URL}/api/chat/suggest-stream`)
        
        // EventSource doesn't support POST, so we need to use a GET-compatible approach
        // or use fetch for POST then switch to EventSource
        const url = `${API_CONFIG.BASE_URL}/api/chat/suggest-stream`
        
        // Create EventSource with proper headers
        const eventSource = new EventSource(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          method: 'POST', // Some implementations support this
          body: JSON.stringify(request),
        })

        let finalResult: ChatSuggestionResponse | null = null

        eventSource.addEventListener('open', (event) => {
          console.log('[EventSource] ✅ Connection opened:', event)
        })

        eventSource.addEventListener('message', (event) => {
          console.log('[EventSource] 📦 Raw message:', event.data)
          
          try {
            const data = JSON.parse(event.data)
            
            switch (data.type) {
              case 'init':
                console.log('[EventSource] Connected to stream')
                break
                
              case 'progress':
                if (onProgress) {
                  onProgress(data.step, data.message)
                }
                break
                
              case 'stream':
                if (onStream) {
                  onStream(data.content)
                }
                break
                
              case 'complete':
                finalResult = {
                  conversationalResponse: data.conversationalResponse,
                  suggestions: data.suggestions,
                  searchMetadata: data.searchMetadata,
                }
                console.log('[EventSource] ✅ Received complete response')
                eventSource.close()
                resolve(finalResult)
                break
                
              case 'error':
                eventSource.close()
                reject(new Error(data.error))
                break
            }
          } catch (error) {
            console.warn('[EventSource] Error parsing message:', error)
          }
        })

        eventSource.addEventListener('error', (event) => {
          console.error('[EventSource] ❌ Connection error:', event)
          eventSource.close()
          reject(new Error(`EventSource error: ${event.message || 'Connection failed'}`))
        })

        // Timeout after 60 seconds
        setTimeout(() => {
          if (!finalResult) {
            console.error('[EventSource] ⏰ Timeout after 60 seconds')
            eventSource.close()
            reject(new Error('EventSource timeout after 60 seconds'))
          }
        }, 60000)
        
      } catch (error) {
        console.error('[EventSource] Setup error:', error)
        reject(error)
      }
    })
  }

  /**
   * Fallback fetch-based SSE implementation
   */
  async getChatSuggestionsStreamFetch(
    request: ChatSuggestionRequest,
    accessToken: string,
    onProgress?: (step: string, message: string) => void,
    onStream?: (content: string) => void
  ): Promise<ChatSuggestionResponse> {
    try {
      console.log(`[DEBUG] Making SSE request to: ${API_CONFIG.BASE_URL}/api/chat/suggest-stream`)
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/chat/suggest-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Accept': 'text/event-stream',
          // React Native specific headers
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify(request),
        // React Native specific options
        ...(typeof window === 'undefined' ? {
          // We're in React Native environment
          reactNative: { textStreaming: true }
        } : {})
      })

      console.log(`[DEBUG] Response status: ${response.status}`)
      console.log(`[DEBUG] Response headers:`, Object.fromEntries(response.headers.entries()))
      console.log(`[DEBUG] Response body exists:`, !!response.body)
      console.log(`[DEBUG] Response body type:`, typeof response.body)
      console.log(`[DEBUG] Response body readable:`, response.body?.readable)

      if (!response.ok) {
        console.error(`[DEBUG] Response not ok: ${response.status} ${response.statusText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // React Native compatibility: check if body is available
      const hasReadableBody = response.body && (response.body.getReader || typeof response.body.read === 'function')
      
      if (!hasReadableBody) {
        console.warn('[DEBUG] No readable body stream, using React Native fallback')
      }

      // Read the stream
      let buffer = ''
      
      const processChunk = (chunk: string) => {
        buffer += chunk
        const lines = buffer.split('\n')
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'init':
                  console.log('[ChatService Stream] Connected to stream')
                  break
                  
                case 'progress':
                  if (onProgress) {
                    onProgress(data.step, data.message)
                  }
                  break
                  
                case 'stream':
                  if (onStream) {
                    onStream(data.content)
                  }
                  break
                  
                case 'complete':
                  return {
                    conversationalResponse: data.conversationalResponse,
                    suggestions: data.suggestions,
                    searchMetadata: data.searchMetadata,
                  }
                  
                case 'error':
                  throw new Error(data.error)
              }
            } catch (error) {
              console.warn('[ChatService Stream] Error parsing line:', line, error)
            }
          }
        }
        return null
      }

      // Read the stream response
      let finalResult: any = null
      
      // Always try React Native fallback first for better compatibility
      if (!hasReadableBody) {
        try {
          // React Native fallback: read entire response as text
          console.log('[ChatService Stream] Using React Native text fallback')
          console.log('[ChatService Stream] Waiting for text response...')
          
          // Add timeout to avoid indefinite waiting
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Text read timeout after 45 seconds')), 45000)
          )
          
          const text = await Promise.race([
            response.text(),
            timeoutPromise
          ]) as string
          console.log('[ChatService Stream] Full text received, length:', text.length)
          
          if (text.length > 0) {
            console.log('[ChatService Stream] First 500 chars:', text.substring(0, 500))
            console.log('[ChatService Stream] Last 500 chars:', text.substring(text.length - 500))
            
            const result = processChunk(text)
            if (result) {
              finalResult = result
            } else {
              // Manual parsing if processChunk fails
              console.log('[ChatService Stream] processChunk failed, attempting manual parsing')
              const lines = text.trim().split('\n')
              for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i]
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    if (data.type === 'complete') {
                      finalResult = {
                        conversationalResponse: data.conversationalResponse,
                        suggestions: data.suggestions,
                        searchMetadata: data.searchMetadata,
                      }
                      break
                    }
                  } catch (error) {
                    console.log(`[ChatService Stream] Error parsing line ${i}:`, error.message)
                  }
                }
              }
            }
          }
        } catch (textError) {
          console.error('[ChatService Stream] React Native text fallback failed:', textError)
        }
      } else if (response.body) {
        try {
          // Try to use getReader if available (web/newer RN versions)
          if (response.body.getReader) {
            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const result = processChunk(chunk)
              if (result) {
                finalResult = result
                break
              }
            }
          } else {
            // Fallback for React Native: read as text and parse
            console.log('[ChatService Stream] Using React Native fallback (read full text)')
            const text = await response.text()
            console.log('[ChatService Stream] Full text received, length:', text.length)
            console.log('[ChatService Stream] First 500 chars:', text.substring(0, 500))
            console.log('[ChatService Stream] Last 500 chars:', text.substring(text.length - 500))
            
            // Process the entire response as one chunk
            const result = processChunk(text)
            console.log('[ChatService Stream] processChunk result:', result)
            
            if (result) {
              finalResult = result
            } else {
              // If no 'complete' event found, try to extract from the last few lines
              console.log('[ChatService Stream] No complete event found, searching manually...')
              const lines = text.trim().split('\n')
              console.log('[ChatService Stream] Total lines:', lines.length)
              
              // Check last 10 lines for debugging
              for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
                console.log(`[ChatService Stream] Line ${i}:`, lines[i])
              }
              
              for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i]
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    console.log(`[ChatService Stream] Parsed data type at line ${i}:`, data.type)
                    if (data.type === 'complete') {
                      finalResult = {
                        conversationalResponse: data.conversationalResponse,
                        suggestions: data.suggestions,
                        searchMetadata: data.searchMetadata,
                      }
                      console.log('[ChatService Stream] Found complete event manually')
                      break
                    }
                  } catch (error) {
                    console.log(`[ChatService Stream] Error parsing line ${i}:`, error.message)
                  }
                }
              }
            }
          }
        } catch (streamError) {
          console.error('[ChatService Stream] Stream reading error:', streamError)
          throw new Error('Failed to read stream response')
        }
      }

      if (finalResult) {
        console.log('[ChatService Stream] ✅ Successfully parsed SSE response')
        return finalResult
      }

      // Enhanced error with debugging info
      console.error('[ChatService Stream] ❌ Failed to parse SSE response')
      console.error('[ChatService Stream] Debug info:', {
        hasReadableBody,
        bodyExists: !!response.body,
        bodyType: typeof response.body,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      throw new Error('No valid response received from stream - check SSE parsing logic')
    } catch (error) {
      console.error('[ChatService Stream] Error:', error)
      throw error
    }
  }

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
