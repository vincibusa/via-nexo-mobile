/**
 * Hook for real-time typing indicators in conversations
 * Uses Realtime Broadcast for ephemeral, low-latency typing events
 *
 * Reference: https://supabase.com/docs/guides/realtime/broadcast
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { getAuthenticatedClient } from '../supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface TypingUser {
  userId: string
  displayName: string
  timestamp: number
}

interface TypingPayload {
  user_id: string
  display_name: string
  is_typing: boolean
}

/**
 * Hook to manage typing indicators in a conversation
 *
 * @param accessToken - User's JWT access token
 * @param conversationId - The conversation ID
 * @param currentUserId - Current user's ID (to exclude own typing events)
 * @param currentUserName - Current user's display name
 * @returns Object with typingUsers array and sendTyping function
 *
 * @example
 * ```tsx
 * const { typingUsers, sendTyping } = useTypingIndicator(
 *   session?.accessToken,
 *   conversationId,
 *   session?.user?.id,
 *   session?.user?.displayName
 * )
 *
 * // Send typing indicator
 * const handleTextChange = (text: string) => {
 *   setText(text)
 *   if (text.length > 0) {
 *     sendTyping(true)
 *   } else {
 *     sendTyping(false)
 *   }
 * }
 *
 * // Display typing users
 * {typingUsers.length > 0 && (
 *   <Text>{typingUsers[0].displayName} is typing...</Text>
 * )}
 * ```
 */
export function useTypingIndicator(
  accessToken: string | undefined,
  conversationId: string | undefined,
  currentUserId: string | undefined,
  currentUserName: string | undefined
) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Send typing indicator to other users
  const sendTyping = useCallback(
    async (isTyping: boolean) => {
      if (!channelRef.current || !currentUserId || !currentUserName) {
        return
      }

      const payload: TypingPayload = {
        user_id: currentUserId,
        display_name: currentUserName,
        is_typing: isTyping,
      }

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload,
        })
      } catch (error) {
        console.error('[Typing] Error sending typing indicator:', error)
      }
    },
    [currentUserId, currentUserName]
  )

  // Clean up typing indicator after 3 seconds of inactivity
  const cleanupTypingUser = useCallback((userId: string) => {
    setTypingUsers((prev) => prev.filter((user) => user.userId !== userId))
  }, [])

  useEffect(() => {
    if (!accessToken || !conversationId || !currentUserId) {
      console.log('[Typing] Missing required params, skipping subscription')
      return
    }

    console.log('[Typing] Setting up typing indicator for conversation:', conversationId)

    const supabase = getAuthenticatedClient(accessToken)

    const setupChannel = async () => {
      try {
        // Set auth for Realtime
        await supabase.realtime.setAuth(accessToken)
        console.log('[Typing] Auth set for typing indicator')

        // Create broadcast channel for typing events
        const channel = supabase
          .channel(`typing-${conversationId}`)
          .on<TypingPayload>(
            'broadcast',
            {
              event: 'typing',
            },
            (payload) => {
              const data = payload.payload

              // Ignore own typing events
              if (data.user_id === currentUserId) {
                return
              }

              console.log('[Typing] Received typing event:', data)

              if (data.is_typing) {
                // Add or update typing user
                setTypingUsers((prev) => {
                  const existing = prev.find((u) => u.userId === data.user_id)
                  if (existing) {
                    // Update timestamp
                    return prev.map((u) =>
                      u.userId === data.user_id ? { ...u, timestamp: Date.now() } : u
                    )
                  } else {
                    // Add new typing user
                    return [
                      ...prev,
                      {
                        userId: data.user_id,
                        displayName: data.display_name,
                        timestamp: Date.now(),
                      },
                    ]
                  }
                })

                // Auto-remove after 3 seconds
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current)
                }
                typingTimeoutRef.current = setTimeout(() => {
                  cleanupTypingUser(data.user_id)
                }, 3000)
              } else {
                // Remove typing user immediately
                cleanupTypingUser(data.user_id)
              }
            }
          )
          .subscribe((status) => {
            console.log('[Typing] Subscription status:', status)

            if (status === 'SUBSCRIBED') {
              console.log('[Typing] ✅ Successfully subscribed to typing indicators')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Typing] ❌ Error subscribing to typing indicators')
            }
          })

        channelRef.current = channel

        return () => {
          console.log('[Typing] Cleaning up typing indicator')
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          supabase.removeChannel(channel)
          channelRef.current = null
        }
      } catch (error) {
        console.error('[Typing] Error setting up typing indicator:', error)
      }
    }

    let cleanup: (() => void) | undefined
    setupChannel().then((fn) => {
      cleanup = fn
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [accessToken, conversationId, currentUserId, cleanupTypingUser])

  return {
    typingUsers,
    sendTyping,
  }
}
