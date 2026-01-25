/**
 * Manager-specific types for event management and check-in functionality
 */

export interface ManagerEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime?: string;
  doors_open_time?: string;
  place_id: string;
  place?: {
    id: string;
    name: string;
    city: string;
    address?: string;
  };
  owner_id: string;
  is_published: boolean;
  is_listed?: boolean;
  is_cancelled?: boolean;
  cover_image_url?: string;
  promo_video_url?: string;
  genre?: string[];
  lineup?: string[];
  ticket_url?: string;
  ticket_price_min?: number;
  ticket_price_max?: number;
  tickets_available?: boolean;
  capacity?: number;
  verification_status: string;
  embeddings_status?: string;
  lista_nominativa_enabled?: boolean;
  max_guests_per_reservation?: number;
  prive_enabled?: boolean;
  prive_min_price?: number | null;
  prive_max_seats?: number | null;
  prive_deposit_required?: number | null;
  prive_total_capacity?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime?: string;
  doors_open_time?: string;
  place_id: string;
  is_published: boolean;
  is_listed?: boolean;
  cover_image_url?: string;
  promo_video_url?: string;
  genre?: string[];
  lineup?: string[];
  ticket_url?: string;
  ticket_price_min?: number;
  ticket_price_max?: number;
  tickets_available?: boolean;
  capacity?: number;
  lista_nominativa_enabled?: boolean;
  max_guests_per_reservation?: number;
  prive_enabled?: boolean;
  prive_min_price?: number | null;
  prive_max_seats?: number | null;
  prive_deposit_required?: number | null;
  prive_total_capacity?: number | null;
}

export interface ManagerPlace {
  id: string;
  name: string;
  city: string;
  address: string;
  place_type?: string;
  cover_image_url?: string;
}

export interface CheckInData {
  reservationId: string;
  guestIds?: string[];
}

export interface EventsListResponse {
  events: ManagerEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface PlacesListResponse {
  places: ManagerPlace[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
