import { API_CONFIG } from '../config'
import { storage } from '../storage'
import type { RaveScore, RaveScoreEvent, RaveScoreEventsResponse, RaveScoreType } from '../types/rave-score'

class RaveScoreService {
  /**
   * Get RAVE ID score for a user
   */
  async getScore(userId: string): Promise<{ data?: RaveScore; error?: string }> {
    try {
      const session = await storage.getSession()
      if (!session?.accessToken) {
        return { error: 'Not authenticated' }
      }

      const url = `${API_CONFIG.BASE_URL}/api/rave-score/${userId}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any
        return {
          error: errorData.error || 'Failed to fetch RAVE score',
        }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('Error fetching RAVE score:', error)
      return { error: 'Network error' }
    }
  }

  /**
   * Get events that contribute to RAVE score
   */
  async getEvents(
    userId: string,
    type?: RaveScoreType,
    limit = 20,
    offset = 0
  ): Promise<{ data?: RaveScoreEvent[]; total?: number; hasMore?: boolean; error?: string }> {
    try {
      const session = await storage.getSession()
      if (!session?.accessToken) {
        return { error: 'Not authenticated' }
      }

      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })

      if (type) {
        params.append('type', type)
      }

      const url = `${API_CONFIG.BASE_URL}/api/rave-score/${userId}/events?${params.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any
        return {
          error: errorData.error || 'Failed to fetch RAVE score events',
        }
      }

      const result = (await response.json()) as RaveScoreEventsResponse
      return {
        data: result.events,
        total: result.total,
        hasMore: result.hasMore,
      }
    } catch (error) {
      console.error('Error fetching RAVE score events:', error)
      return { error: 'Network error' }
    }
  }
}

export const raveScoreService = new RaveScoreService()
