/**
 * Hook for Realtime conversations list updates
 * Uses postgres_changes to listen directly to database changes with proper RLS
 *
 * Reference: https://supabase.com/docs/guides/realtime/postgres-changes
 */

import { useEffect, useRef } from 'react'
import { getAuthenticatedClient } from '../supabase/client'

/**
 * Subscribe to real-time updates for conversations list
 *
 * This hook listens to postgres_changes events on the messages table.
 * When a new message is created, it triggers the onUpdate callback
 * which should refresh the conversations list.
 *
 * IMPORTANT: Requires accessToken to authenticate Realtime with RLS
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

    console.log('[Realtime] Setting up conversations listener with postgres_changes')

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
        // Listen to all INSERT events to detect new messages in any conversation
        const channel = supabase
          .channel('conversations-updates')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
            },
            (payload) => {
              console.log('[Realtime] New message inserted:', payload.new)
              console.log('[Realtime] Refreshing conversations list')
              callbackRef.current() // ← Call via ref to use latest callback
            }
          )
          .subscribe((status) => {
            console.log('[Realtime] Conversations subscription status:', status)

            if (status === 'SUBSCRIBED') {
              console.log('[Realtime] ✅ Successfully subscribed to postgres_changes for conversations')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Realtime] ❌ Error subscribing to postgres_changes for conversations')
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
