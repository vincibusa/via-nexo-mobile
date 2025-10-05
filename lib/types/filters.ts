export interface PlacesFilters {
  search?: string;
  category?: string;
  price_range?: '€' | '€€' | '€€€';
  verified?: boolean;
  has_events?: boolean;
  max_distance_km?: number;
  sort?: 'name' | 'distance' | 'events_count';
}

export interface EventsFilters {
  search?: string;
  event_type?: string;
  music_genre?: string;
  price_min?: number;
  price_max?: number;
  time_filter?: 'upcoming' | 'today' | 'this_week' | 'this_weekend' | 'this_month';
  max_distance_km?: number;
  sort?: 'date' | 'distance' | 'price';
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}
