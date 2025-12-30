/**
 * Profile service for fetching user content
 */

import { API_CONFIG } from '../config'
import type { EventReservation, UserStory, ReservationsResponse } from '../types/profile'

class ProfileService {
  /**
   * Fetch user's event reservations
   */
  async getMyReservations(
    accessToken: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: EventReservation[] | null; error: string | null }> {
    try {
      const url = new URL(`${API_CONFIG.BASE_URL}/api/reservations/my`)
      url.searchParams.set('limit', limit.toString())
      url.searchParams.set('offset', offset.toString())

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        return { data: null, error: `HTTP ${response.status}` }
      }

      const result: ReservationsResponse = await response.json()
      return { data: result.reservations, error: null }
    } catch (err) {
      console.error('Error fetching reservations:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  /**
   * Fetch user's stories (optionally filter by user_id)
   * @param includeExpired - If true, includes expired stories (for archive view)
   */
  async getUserStories(
    accessToken: string,
    userId?: string,
    includeExpired: boolean = false
  ): Promise<{ data: UserStory[] | null; error: string | null }> {
    try {
      const url = new URL(`${API_CONFIG.BASE_URL}/api/social/stories`)
      if (userId) {
        url.searchParams.set('user_id', userId)
      }
      if (includeExpired) {
        url.searchParams.set('include_expired', 'true')
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        return { data: null, error: `HTTP ${response.status}` }
      }

      const stories: UserStory[] = await response.json()
      return { data: stories, error: null }
    } catch (err) {
      console.error('Error fetching stories:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }
}

export const profileService = new ProfileService()
