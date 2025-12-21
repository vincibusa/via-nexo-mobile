/**
 * Hook for message search functionality
 */

import { useState, useCallback } from 'react';
import messagingService from '../services/messaging';
import type { Message, Conversation } from '../types/messaging';

export interface SearchResult {
  message: Message;
  conversation: Conversation;
  highlights: string[];
}

export interface UseMessageSearchReturn {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  searchInConversation: (conversationId: string, query: string) => Promise<void>;
  searchAllConversations: (query: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

/**
 * Hook for searching messages
 */
export function useMessageSearch(): UseMessageSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const searchInConversation = useCallback(async (conversationId: string, query: string) => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await messagingService.searchMessages(conversationId, query);

      // Convert to search results format
      const searchResults: SearchResult[] = response.messages.map(message => ({
        message,
        conversation: {} as Conversation, // Will be populated from context
        highlights: extractHighlights(message.content, query),
      }));

      setResults(searchResults);
      setTotalResults(response.pagination?.total || searchResults.length);
    } catch (err) {
      console.error('[useMessageSearch] Error searching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to search messages');
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchAllConversations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await messagingService.searchAllMessages(query);

      // Convert to search results format
      const searchResults: SearchResult[] = response.messages.map(message => ({
        message,
        conversation: response.conversations?.[message.conversation_id] || {} as Conversation,
        highlights: extractHighlights(message.content, query),
      }));

      setResults(searchResults);
      setTotalResults(response.pagination?.total || searchResults.length);
    } catch (err) {
      console.error('[useMessageSearch] Error searching all messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to search messages');
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotalResults(0);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    totalResults,
    searchInConversation,
    searchAllConversations,
    clearResults,
    clearError,
  };
}

/**
 * Extract highlighted text fragments around search matches
 */
function extractHighlights(text: string, query: string): string[] {
  const highlights: string[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Find all occurrences of the query
  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    // Extract context around the match (50 chars before and after)
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    const highlight = text.substring(start, end);

    // Add ellipsis if not at beginning/end
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    highlights.push(`${prefix}${highlight}${suffix}`);

    // Find next occurrence
    index = lowerText.indexOf(lowerQuery, index + 1);
  }

  // If no exact matches, try fuzzy matching with word boundaries
  if (highlights.length === 0) {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    for (const word of words) {
      const wordIndex = lowerText.indexOf(word);
      if (wordIndex !== -1) {
        const start = Math.max(0, wordIndex - 50);
        const end = Math.min(text.length, wordIndex + word.length + 50);
        const highlight = text.substring(start, end);
        const prefix = start > 0 ? '...' : '';
        const suffix = end < text.length ? '...' : '';
        highlights.push(`${prefix}${highlight}${suffix}`);
      }
    }
  }

  return highlights.slice(0, 3); // Return max 3 highlights
}