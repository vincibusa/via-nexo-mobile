/**
 * Hook for Realtime conversations list updates
 * Listens to broadcast events from messages table via database triggers
 *
 * FIXED: Switched from postgres_changes to broadcast to bypass RLS authorization issues
 * Reference: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
 */

import { useEffect, useRef } from 'react'
import { getAuthenticatedClient } from '../supabase/client'

/**
 * Subscribe to real-time updates for conversations list
 *
 * This hook listens to broadcast events triggered by the messages table.
 * A database trigger sends broadcasts whenever messages are inserted/updated/deleted.
 * When a new message is created, it triggers the onUpdate callback
 * which should refresh the conversations list.
 *
 * IMPORTANT: Requires accessToken to authenticate Realtime with RLS on realtime.messages
 *
 * @param accessToken - User's JWT access token
 * @param onUpdate - Callback to trigger when a new message arrives
 *
 * @example
 * ```tsx
 * useConversationsRealtime(session?.accessToken, () => {
 *   loadConversations(true)
 * })
 * ```
 */
export function useConversationsRealtime(
  accessToken: string | undefined,
  onUpdate: () => void
) {
  // Use ref to store callback and avoid re-subscriptions when callback changes
  const callbackRef = useRef(onUpdate)

  // Update ref when callback changes (doesn't trigger re-subscription)
  useEffect(() => {
    callbackRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!accessToken) {
      console.log('[Realtime] No access token, skipping subscription')
      return
    }

    console.log('[Realtime] Setting up conversations listener with broadcast (not postgres_changes)')

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
        // The database trigger sends broadcasts to this channel whenever messages change
        // Using private channel with RLS on realtime.messages for authorization
        const channel = supabase
          .channel('messages-updates', {
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
              console.log('[Realtime] New message broadcast received:', payload.payload)
              console.log('[Realtime] Refreshing conversations list')
              callbackRef.current() // ← Call via ref to use latest callback
            }
          )
          .subscribe((status) => {
            console.log('[Realtime] Conversations subscription status:', status)

            if (status === 'SUBSCRIBED') {
              console.log('[Realtime] ✅ Successfully subscribed to conversations broadcasts')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Realtime] ❌ Error subscribing to conversations broadcasts')
            }
          })

        // Return cleanup function
        return () => {
          console.log('[Realtime] Cleaning up conversations listener')
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

    // Cleanup function: unsubscribe when component unmounts
    return () => {
      if (cleanup) cleanup()
    }
  }, [accessToken]) // ← Removed onUpdate from dependencies!
}
