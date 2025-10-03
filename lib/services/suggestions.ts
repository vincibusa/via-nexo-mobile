import { API_CONFIG } from '@/lib/config';
import type { SuggestParams, SuggestResponse, SuggestedPlace, Place } from '@/lib/types/suggestion';

interface StreamSuggestion {
  placeId: string;
  reason: string;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
}

interface StreamResponse {
  suggestions: StreamSuggestion[];
  searchMetadata: {
    totalCandidates: number;
    processingTime: number;
    cacheUsed: boolean;
  };
}

class SuggestionsService {
  /**
   * Get suggestions using streaming API
   * Reads the stream and fetches full place details
   */
  async getSuggestions(
    params: SuggestParams,
    onProgress?: (chunk: string) => void
  ): Promise<{ data?: SuggestResponse; error?: { code: string; message: string } }> {
    try {
      // Map mobile filter format to backend format
      const backendParams = this.mapParamsToBackend(params);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/suggest/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendParams),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: {
            code: response.status.toString(),
            message: errorData.error || 'Failed to get suggestions',
          },
        };
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        return {
          error: {
            code: 'STREAM_ERROR',
            message: 'Unable to read stream',
          },
        };
      }

      let fullText = '';

      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Callback for progress updates (optional)
        if (onProgress) {
          onProgress(chunk);
        }
      }

      // Parse the final result
      const streamResult = this.parseStreamResponse(fullText);

      if (!streamResult || !streamResult.suggestions.length) {
        return {
          data: {
            suggestions: [],
            log_id: '',
          },
        };
      }

      // Fetch full place details for all suggestions
      const placeIds = streamResult.suggestions.map((s) => s.placeId);
      const placesResult = await this.fetchPlacesByIds(placeIds);

      if (placesResult.error) {
        return { error: placesResult.error };
      }

      // Merge AI reasons with place details
      const suggestions: SuggestedPlace[] = streamResult.suggestions.map((s) => {
        const place = placesResult.data?.find((p) => p.id === s.placeId);

        if (!place) {
          // Fallback if place not found
          return {
            id: s.placeId,
            name: 'Unknown Place',
            category: '',
            address: '',
            city: '',
            latitude: 0,
            longitude: 0,
            verified: false,
            is_published: false,
            is_listed: false,
            ai_reason: s.reason,
            similarity_score: s.matchScore,
          };
        }

        return {
          ...place,
          ai_reason: s.reason,
          similarity_score: s.matchScore,
        };
      });

      return {
        data: {
          suggestions,
          log_id: '',
        },
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  /**
   * Parse streaming response (handles newline-delimited JSON from AI SDK)
   */
  private parseStreamResponse(fullText: string): StreamResponse | null {
    try {
      // The AI SDK stream returns newline-delimited JSON
      // Each line is prefixed with "0:" for the object stream
      const lines = fullText.trim().split('\n');
      let result: StreamResponse | null = null;

      for (const line of lines) {
        if (!line.trim()) continue;

        // Remove "0:" prefix that AI SDK adds
        const cleanedLine = line.replace(/^\d+:/, '').trim();

        try {
          const parsed = JSON.parse(cleanedLine);

          // Last complete object with suggestions array is our result
          if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            result = parsed;
          }
        } catch (e) {
          // Skip invalid JSON lines
          console.warn('Failed to parse stream line:', line);
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to parse stream result:', error);
      return null;
    }
  }

  /**
   * Fetch place details by IDs using batch endpoint
   */
  private async fetchPlacesByIds(
    ids: string[]
  ): Promise<{ data?: Place[]; error?: { code: string; message: string } }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLACES_BATCH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: {
            code: response.status.toString(),
            message: errorData.error || 'Failed to fetch place details',
          },
        };
      }

      const data = await response.json();
      return { data: data.places || [] };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch places',
        },
      };
    }
  }

  /**
   * Map mobile filter format to backend format
   */
  private mapParamsToBackend(params: SuggestParams) {
    return {
      // Backend expects single values, mobile sends arrays - take first value or undefined
      companionship: params.companionship[0] as 'alone' | 'partner' | 'friends' | 'family' | undefined,
      mood: params.mood[0] as 'relaxed' | 'energetic' | 'romantic' | 'adventurous' | undefined,
      budget: params.budget,
      time: this.mapTimeToBackend(params.time),
      location: params.location,
      radius_km: params.radius_km,
      preferences: params.preferences ? [params.preferences] : undefined,
    };
  }

  /**
   * Map mobile time format to backend format
   */
  private mapTimeToBackend(
    time: 'now' | 'tonight' | 'weekend'
  ): 'morning' | 'afternoon' | 'evening' | 'night' | undefined {
    const hour = new Date().getHours();

    if (time === 'now') {
      if (hour < 12) return 'morning';
      if (hour < 17) return 'afternoon';
      if (hour < 21) return 'evening';
      return 'night';
    }

    if (time === 'tonight') {
      return 'evening';
    }

    // For weekend, use current time as reference
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }
}

export const suggestionsService = new SuggestionsService();
