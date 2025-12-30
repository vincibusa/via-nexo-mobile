import { useCallback, useState, useEffect } from 'react'
import { raveScoreService } from '../services/rave-score'
import type { RaveScore } from '../types/rave-score'

export interface UseRaveScoreReturn {
  score: RaveScore | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRaveScore(userId: string | null | undefined): UseRaveScoreReturn {
  const [score, setScore] = useState<RaveScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setError('No user ID provided')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: apiError } = await raveScoreService.getScore(userId)

    if (apiError) {
      setError(apiError)
      setScore(null)
    } else if (data) {
      setScore(data)
      setError(null)
    }

    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [userId, refresh])

  return { score, loading, error, refresh }
}
