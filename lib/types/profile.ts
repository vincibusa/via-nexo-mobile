/**
 * Types for profile content (reservations and stories)
 */

export interface EventReservation {
  id: string
  owner_id: string
  event_id: string
  status: 'confirmed' | 'cancelled' | 'checked_in' | 'expired' | 'no_show'
  total_guests: number
  created_at: string
  event: {
    id: string
    title: string
    start_datetime: string
    end_datetime: string
    cover_image_url?: string
    place: {
      id: string
      name: string
      address?: string
      city?: string
    }
  }
  owner: {
    id: string
    display_name?: string
    avatar_url?: string
    email: string
  }
}

export interface UserStory {
  id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video'
  thumbnail_url?: string
  text_overlay?: string
  place_id?: string
  event_id?: string
  created_at: string
  expires_at: string
  profiles?: {
    id: string
    display_name?: string
    avatar_url?: string
  }
}

export interface ReservationsResponse {
  reservations: EventReservation[]
}
