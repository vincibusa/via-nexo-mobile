export interface DiscoveryItem {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  event_id: string;
  event?: {
    id: string;
    title: string;
    place?: {
      name: string;
      id: string;
    };
    start_datetime: string;
    cover_image?: string;
    description?: string;
  };
  title?: string;
  description?: string;
  display_order: number;
  views_count: number;
  likes_count: number;
  is_liked?: boolean; // per utente corrente
  created_at: string;
}

