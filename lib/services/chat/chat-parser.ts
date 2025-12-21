/**
 * Chat Parser Module
 * Response parsing and data transformation
 */

import type {
  ChatSuggestionResponse,
  ChatSuggestion,
} from './types';

export class ChatParserService {
  /**
   * Parse raw API response into structured format
   */
  parseChatResponse(data: any): ChatSuggestionResponse {
    try {
      // Handle different response formats
      if (data.conversationalResponse && Array.isArray(data.suggestions)) {
        // Already in correct format
        return data as ChatSuggestionResponse;
      }

      if (data.response && data.suggestions) {
        // Alternative format
        return {
          conversationalResponse: data.response,
          suggestions: this.parseSuggestions(data.suggestions),
          searchMetadata: this.parseSearchMetadata(data.metadata || {}),
        };
      }

      // Fallback: try to extract from raw text
      return this.parseFromRawText(data);
    } catch (error) {
      console.error('[ChatParser] Error parsing response:', error);
      return this.createErrorResponse('Failed to parse chat response');
    }
  }

  /**
   * Parse suggestions array
   */
  private parseSuggestions(suggestions: any[]): ChatSuggestion[] {
    return suggestions.map((suggestion, index) => ({
      id: suggestion.id || `suggestion-${index}`,
      type: this.determineSuggestionType(suggestion),
      reason: suggestion.reason || suggestion.description || 'No reason provided',
      matchScore: this.calculateMatchScore(suggestion),
      confidence: this.determineConfidence(suggestion),
    }));
  }

  /**
   * Determine suggestion type
   */
  private determineSuggestionType(suggestion: any): 'place' | 'event' {
    if (suggestion.type) {
      return suggestion.type === 'event' ? 'event' : 'place';
    }

    // Infer from properties
    if (suggestion.eventDate || suggestion.startTime) {
      return 'event';
    }

    if (suggestion.address || suggestion.category) {
      return 'place';
    }

    // Default to place
    return 'place';
  }

  /**
   * Calculate match score
   */
  private calculateMatchScore(suggestion: any): number {
    // Use existing score if available
    if (typeof suggestion.score === 'number') {
      return Math.min(Math.max(suggestion.score, 0), 1);
    }

    if (typeof suggestion.matchScore === 'number') {
      return Math.min(Math.max(suggestion.matchScore, 0), 1);
    }

    // Calculate based on confidence
    if (suggestion.confidence === 'high') return 0.9;
    if (suggestion.confidence === 'medium') return 0.6;
    if (suggestion.confidence === 'low') return 0.3;

    // Default score
    return 0.5;
  }

  /**
   * Determine confidence level
   */
  private determineConfidence(suggestion: any): 'high' | 'medium' | 'low' {
    if (suggestion.confidence) {
      const conf = suggestion.confidence.toLowerCase();
      if (conf === 'high' || conf === 'medium' || conf === 'low') {
        return conf as 'high' | 'medium' | 'low';
      }
    }

    // Infer from match score
    const score = this.calculateMatchScore(suggestion);
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Parse search metadata
   */
  private parseSearchMetadata(metadata: any) {
    return {
      totalCandidates: metadata.totalCandidates || metadata.total || 0,
      totalPlaces: metadata.totalPlaces || metadata.places || 0,
      totalEvents: metadata.totalEvents || metadata.events || 0,
      processingTime: metadata.processingTime || metadata.time || 0,
      cacheUsed: Boolean(metadata.cacheUsed || metadata.fromCache),
      contextUsed: Boolean(metadata.contextUsed),
      conversationLength: metadata.conversationLength || 0,
    };
  }

  /**
   * Parse from raw text (fallback)
   */
  private parseFromRawText(data: any): ChatSuggestionResponse {
    let text = '';
    let suggestions: ChatSuggestion[] = [];

    if (typeof data === 'string') {
      text = data;
    } else if (data.text || data.message) {
      text = data.text || data.message;
    } else {
      text = JSON.stringify(data);
    }

    // Try to extract suggestions from text
    const suggestionMatches = text.match(/\[(.*?)\]/g);
    if (suggestionMatches) {
      suggestions = suggestionMatches.map((match, index) => ({
        id: `extracted-${index}`,
        type: 'place',
        reason: match.replace(/[\[\]]/g, ''),
        matchScore: 0.5,
        confidence: 'medium',
      }));
    }

    return {
      conversationalResponse: text,
      suggestions,
      searchMetadata: {
        totalCandidates: suggestions.length,
        totalPlaces: suggestions.length,
        totalEvents: 0,
        processingTime: 0,
        cacheUsed: false,
        contextUsed: false,
        conversationLength: 0,
      },
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(errorMessage: string): ChatSuggestionResponse {
    return {
      conversationalResponse: `Sorry, I encountered an error: ${errorMessage}`,
      suggestions: [],
      searchMetadata: {
        totalCandidates: 0,
        totalPlaces: 0,
        totalEvents: 0,
        processingTime: 0,
        cacheUsed: false,
        contextUsed: false,
        conversationLength: 0,
      },
    };
  }

  /**
   * Filter suggestions by type
   */
  filterSuggestionsByType(
    suggestions: ChatSuggestion[],
    type: 'place' | 'event'
  ): ChatSuggestion[] {
    return suggestions.filter(s => s.type === type);
  }

  /**
   * Sort suggestions by match score
   */
  sortSuggestionsByScore(
    suggestions: ChatSuggestion[],
    descending: boolean = true
  ): ChatSuggestion[] {
    return [...suggestions].sort((a, b) => {
      const diff = a.matchScore - b.matchScore;
      return descending ? -diff : diff;
    });
  }

  /**
   * Get top N suggestions
   */
  getTopSuggestions(
    suggestions: ChatSuggestion[],
    limit: number = 5
  ): ChatSuggestion[] {
    const sorted = this.sortSuggestionsByScore(suggestions);
    return sorted.slice(0, limit);
  }

  /**
   * Format response for display
   */
  formatResponseForDisplay(response: ChatSuggestionResponse): {
    text: string;
    suggestions: Array<{
      id: string;
      type: string;
      reason: string;
      confidence: string;
    }>;
  } {
    return {
      text: response.conversationalResponse,
      suggestions: response.suggestions.map(s => ({
        id: s.id,
        type: s.type,
        reason: s.reason,
        confidence: s.confidence,
      })),
    };
  }
}