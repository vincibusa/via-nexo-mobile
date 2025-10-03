export interface SuggestParams {
  companionship: string[]; // ['alone', 'partner', 'friends', 'family']
  mood: string[]; // ['relaxed', 'energetic', 'cultural', 'romantic']
  budget: '€' | '€€' | '€€€';
  time: 'now' | 'tonight' | 'weekend';
  location: {
    lat: number;
    lon: number;
  };
  radius_km: number;
  preferences?: string; // Optional text input
}

export interface Place {
  id: string;
  name: string;
  category: string;
  description?: string;
  cover_image?: string;
  gallery_images?: string[];
  address: string;
  city: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  price_range?: '€' | '€€' | '€€€';
  ambience_tags?: string[];
  music_genre?: string[];
  capacity?: number;
  opening_hours?: Record<string, string>;
  verified: boolean;
  is_published: boolean;
  is_listed: boolean;
  // Computed fields
  distance_km?: number;
  events_count?: number;
}

export interface SuggestedPlace extends Place {
  ai_reason: string; // Motivazione AI generata
  similarity_score?: number;
}

export interface SuggestResponse {
  suggestions: SuggestedPlace[];
  log_id: string;
}
