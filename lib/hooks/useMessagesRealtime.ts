/**
 * Hook for Realtime messages updates in a specific conversation
 * Uses postgres_changes to listen directly to database changes with proper RLS
 *
 * Reference: https://supabase.com/docs/guides/realtime/postgres-changes
 */

import { useEffect, useRef } from 'react'
import { getAuthenticatedClient } from '../supabase/client'

/**
 * Subscribe to real-time updates for messages in a specific conversation
 *
 * This hook listens to postgres_changes events on the messages table.
 * Uses JWT authentication with Realtime to respect Row Level Security policies.
 * When a new message arrives, it triggers the onNewMessage callback.
 *
 * IMPORTANT: Requires accessToken to authenticate Realtime with RLS
 *
 * @param accessToken - User's JWT access token
 * @param conversationId - The conversation ID to listen to
 * @param onNewMessage - Callback to trigger when a new message arrives
 *
 * @example
 * ```tsx
 * useMessagesRealtime(session?.accessToken, conversationId as string, () => {
 *   loadMessages() // Refresh messages list
 * })
 * ```
 */
export function useMessagesRealtime(
  accessToken: string | undefined,
  conversationId: string,
  onNewMessage: () => void
) {
  // Use ref to store callback and avoid re-subscriptions when callback changes
  const callbackRef = useRef(onNewMessage)

  // Update ref when callback changes (doesn't trigger re-subscription)
  useEffect(() => {
    callbackRef.current = onNewMessage
  }, [onNewMessage])

  useEffect(() => {
    if (!accessToken) {
      console.log('[Realtime] No access token, skipping subscription')
      return
    }

    if (!conversationId) {
      console.warn('[Realtime] No conversation ID provided, skipping subscription')
      return
    }

    console.log('[Realtime] Setting up messages listener with postgres_changes:', conversationId)

    // Create authenticated Supabase client with user's JWT
    // This allows RLS policies to work correctly
    const supabase = getAuthenticatedClient(accessToken)

    // CRITICAL: Set auth for Realtime WebSocket connections
    // This is required for RLS policies to work with postgres_changes
    const setupSubscription = async () => {
      try {
        // Set auth token for Realtime BEFORE creating the channel
        await supabase.realtime.setAuth(accessToken)
        console.log('[Realtime] Auth set for WebSocket connection')

        // Subscribe to postgres_changes events on messages table
        // Filter by conversation_id to only receive messages for this conversation
        const channel = supabase
          .channel(`messages-${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              console.log('[Realtime] New message inserted in conversation:', payload.new)
              console.log('[Realtime] Triggering message refresh')
              callbackRef.current() // ← Call via ref to use latest callback
            }
          )
          .subscribe((status) => {
            console.log('[Realtime] Messages subscription status:', status)

            if (status === 'SUBSCRIBED') {
              console.log('[Realtime] ✅ Successfully subscribed to postgres_changes for conversation', conversationId)
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Realtime] ❌ Error subscribing to postgres_changes for conversation', conversationId)
            }
          })

        // Return cleanup function
        return () => {
          console.log('[Realtime] Cleaning up messages listener for conversation:', conversationId)
          supabase.removeChannel(channel)
        }
      } catch (error) {
        console.error('[Realtime] Error setting up subscription:', error)
      }
    }

    // Execute async setup
    let cleanup: (() => void) | undefined
    setupSubscription().then((fn) => {
      cleanup = fn
    })

    // Cleanup function: unsubscribe when component unmounts or conversationId changes
    return () => {
      if (cleanup) cleanup()
    }
  }, [accessToken, conversationId]) // ← Removed onNewMessage from dependencies!
}
