/**
 * TanStack Query Client Configuration
 * Centralized query client with caching and retry logic
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  // Auth
  auth: {
    session: ['auth', 'session'],
    profile: (userId: string) => ['auth', 'profile', userId],
  },

  // Places
  places: {
    all: ['places'],
    list: (filters: any) => ['places', 'list', filters],
    detail: (placeId: string) => ['places', 'detail', placeId],
    nearby: (location: any, radius: number) => ['places', 'nearby', location, radius],
  },

  // Messages
  messages: {
    conversations: ['messages', 'conversations'],
    conversation: (conversationId: string) => ['messages', 'conversation', conversationId],
    messages: (conversationId: string) => ['messages', 'list', conversationId],
    unreadCount: ['messages', 'unreadCount'],
  },

  // Chat AI
  chat: {
    history: ['chat', 'history'],
    conversation: (conversationId: string) => ['chat', 'conversation', conversationId],
    suggestions: (query: string) => ['chat', 'suggestions', query],
  },

  // Social
  social: {
    stories: ['social', 'stories'],
    favorites: ['social', 'favorites'],
    followers: (userId: string) => ['social', 'followers', userId],
    following: (userId: string) => ['social', 'following', userId],
  },

  // User
  user: {
    profile: (userId: string) => ['user', 'profile', userId],
    stats: (userId: string) => ['user', 'stats', userId],
    activity: (userId: string) => ['user', 'activity', userId],
  },
};

/**
 * Invalidate queries helper
 */
export function invalidateQueries(key: any[]) {
  return queryClient.invalidateQueries({ queryKey: key });
}

/**
 * Prefetch queries helper
 */
export async function prefetchQuery(key: any[], queryFn: () => Promise<any>) {
  return queryClient.prefetchQuery({
    queryKey: key,
    queryFn,
  });
}

/**
 * Reset queries helper
 */
export function resetQueries(key: any[]) {
  return queryClient.resetQueries({ queryKey: key });
}

/**
 * Set query data helper
 */
export function setQueryData(key: any[], data: any) {
  return queryClient.setQueryData(key, data);
}

/**
 * Get query data helper
 */
export function getQueryData(key: any[]) {
  return queryClient.getQueryData(key);
}