/**
 * Supabase Client for Mobile App
 * Used for Realtime subscriptions to messages and conversations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  )
}

/**
 * Get a Supabase client authenticated with the user's JWT token
 * This allows RLS policies to work correctly with Realtime subscriptions
 *
 * CRITICAL: RLS policies use auth.uid() which requires a valid JWT
 * Without the JWT, Realtime events will be filtered out by RLS!
 *
 * @param accessToken - JWT access token from auth session
 * @returns Authenticated Supabase client
 */
export function getAuthenticatedClient(accessToken: string): SupabaseClient {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  console.log('[Supabase Client] Created authenticated client for Realtime with JWT')
  return client
}

// Base client (DO NOT use for Realtime - it won't respect RLS!)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
