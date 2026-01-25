/**
 * Types for open table reservations and join requests
 */

export interface OpenTable {
  id: string;
  owner: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  description?: string;
  min_budget?: number;
  available_spots: number;
  total_members: number;
  created_at: string;
}

export interface JoinRequest {
  id: string;
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  created_at: string;
  responded_at?: string;
  requester: {
    id: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
  };
}

export interface JoinRequestWithReservation extends JoinRequest {
  reservation_id: string;
  reservation: {
    id: string;
    reservation_type?: 'pista' | 'prive';
    open_table_available_spots?: number;
    event?: {
      id: string;
      title: string;
      start_datetime: string;
      cover_image_url?: string;
      place?: {
        id: string;
        name: string;
        city: string;
      };
    };
  } | null;
}
