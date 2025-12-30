export interface RaveScore {
  userId: string
  totalScore: number
  updatedAt: string

  presence: {
    score: number
    maxScore: number
    checkIns90d: number
    label: 'Regular' | 'Active' | 'Elite'
  }

  trust: {
    score: number
    maxScore: number
    rate: number | null
    label: 'Reliable' | 'Risk' | 'No-Show'
    breakdown: {
      shows: number
      earlyCancels: number
      lateCancels: number
      noShows: number
    }
  }

  crew: {
    score: number
    maxScore: number
    hostedGuests90d: number
    hostedShows: number
    showRate: number | null
    label: 'Connector' | 'Promoter' | 'Legend'
  }
}

export interface RaveScoreEvent {
  id: string
  type:
    | 'check_in'
    | 'show'
    | 'early_cancel'
    | 'late_cancel'
    | 'no_show'
    | 'hosted_guest_show'
  eventTitle: string | null
  eventDate: string | null
  pointsImpact: number | null
  occurredAt: string
}

export interface RaveScoreEventsResponse {
  events: RaveScoreEvent[]
  total: number
  hasMore: boolean
}

export type RaveScoreType = 'presence' | 'trust' | 'crew'
