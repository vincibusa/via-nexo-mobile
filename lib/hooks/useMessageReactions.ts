/**
 * Hook for message reactions functionality
 */

import { useState, useCallback } from 'react';
import messagingService from '../services/messaging';
import type { MessageReaction } from '../types/messaging';

export interface UseMessageReactionsReturn {
  reactions: MessageReaction[];
  isLoading: boolean;
  error: string | null;
  addReaction: (messageId: string, emoji: string) => Promise<MessageReaction | null>;
  removeReaction: (messageId: string, reactionId: string) => Promise<boolean>;
  loadReactions: (messageId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing message reactions
 */
export function useMessageReactions(): UseMessageReactionsReturn {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReactions = useCallback(async (messageId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await messagingService.getReactions(messageId);
      setReactions(data);
    } catch (err) {
      console.error('[useMessageReactions] Error loading reactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<MessageReaction | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const reaction = await messagingService.addReaction(messageId, emoji);

      // Update local state
      setReactions(prev => {
        // Check if user already reacted with this emoji
        const existingIndex = prev.findIndex(r =>
          r.user_id === reaction.user_id && r.emoji === emoji
        );

        if (existingIndex >= 0) {
          // Replace existing reaction
          const updated = [...prev];
          updated[existingIndex] = reaction;
          return updated;
        }

        // Add new reaction
        return [...prev, reaction];
      });

      return reaction;
    } catch (err) {
      console.error('[useMessageReactions] Error adding reaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeReaction = useCallback(async (messageId: string, reactionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await messagingService.removeReaction(messageId, reactionId);

      // Update local state
      setReactions(prev => prev.filter(r => r.id !== reactionId));
      return true;
    } catch (err) {
      console.error('[useMessageReactions] Error removing reaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove reaction');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    reactions,
    isLoading,
    error,
    addReaction,
    removeReaction,
    loadReactions,
    clearError,
  };
}