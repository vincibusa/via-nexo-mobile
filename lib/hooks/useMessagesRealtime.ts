/**
 * Hook for Realtime messages updates in a specific conversation
 * Listens to broadcast events from messages table via database triggers
 *
 * FIXED: Switched from postgres_changes to broadcast to bypass RLS authorization issues
 * Reference: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
 */

import { useEffect, useRef } from 'react'
import { getAuthenticatedClient } from '../supabase/client'

/**
 * Subscribe to real-time updates for messages in a specific conversation
 *
 * This hook listens to broadcast events triggered by the messages table.
 * A database trigger sends broadcasts to a conversation-specific channel
 * whenever messages are inserted/updated/deleted in that conversation.
 * When a new message arrives, it triggers the onNewMessage callback.
 *
 * IMPORTANT: Requires accessToken to authenticate Realtime with RLS on realtime.messages
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

    console.log('[Realtime] Setting up messages listener with broadcast (not postgres_changes):', conversationId)

    // Create authenticated Supabase client with user's JWT
    // This allows RLS policies on realtime.messages to work correctly
    const supabase = getAuthenticatedClient(accessToken)

    // CRITICAL: Set auth for Realtime WebSocket connections
    // This is required for private channels to work with RLS
    const setupSubscription = async () => {
      try {
        // Set auth token for Realtime (required for private channels)
        await supabase.realtime.setAuth(accessToken)
        console.log('[Realtime] Auth set for WebSocket connection')

        // Subscribe to broadcast events from messages table
        // The database trigger sends broadcasts to conversation-specific channels
        // Channel name format: conversation-{conversationId}
        // Using private channel with RLS on realtime.messages for authorization
        const channel = supabase
          .channel(`conversation-${conversationId}`, {
            config: {
              private: true,  // Requires RLS policies on realtime.messages table
            },
          })
          .on(
            'broadcast',
            {
              event: 'INSERT',  // Listen for INSERT events from the trigger
            },
            (payload) => {
              console.log('[Realtime] New message broadcast in conversation:', payload.payload)
              console.log('[Realtime] Triggering message refresh')
              callbackRef.current() // ← Call via ref to use latest callback
            }
          )
          .subscribe((status) => {
            console.log('[Realtime] Messages subscription status:', status)

            if (status === 'SUBSCRIBED') {
              console.log('[Realtime] ✅ Successfully subscribed to message broadcasts in conversation', conversationId)
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Realtime] ❌ Error subscribing to message broadcasts in conversation', conversationId)
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
