import { User } from './auth';

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  other_user: User | null;
  last_message: LastMessage | null;
  unread_count: number;
  is_muted: boolean;
  // Group conversation fields
  type: 'direct' | 'group';
  title?: string;
  participants?: User[];
  is_group: boolean;
}

export interface LastMessage {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'voice';
  created_at: string;
  sender_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'voice';
  media_url?: string;
  media_thumbnail_url?: string;
  media_size?: number;
  media_duration?: number; // in seconds for voice messages
  created_at: string;
  is_deleted: boolean;
  read_by: ReadReceipt[];
  reactions?: MessageReaction[];
  sender: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
  };
  reply_to_message_id?: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface ReadReceipt {
  user_id: string;
  read_at: string;
}

export interface TypingIndicator {
  user_id: string;
  displayName: string;
  started_at: string;
}

export interface ConversationUpdate {
  new_messages: Message[];
  read_receipts: ReadReceipt[];
  typing_indicators: TypingIndicator[];
  deleted_messages: string[];
  last_update: string;
}

export interface SendMessageRequest {
  content?: string;
  message_type: 'text' | 'image' | 'voice';
  media_url?: string;
  media_thumbnail_url?: string;
  media_size?: number;
  media_duration?: number;
  reply_to_message_id?: string;
}

export interface CreateConversationRequest {
  other_user_id?: string;
  // Group conversation fields
  participant_ids?: string[];
  title?: string;
  type?: 'direct' | 'group';
}

export interface CreateConversationResponse {
  conversation_id: string;
  created: boolean;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface MessagesResponse {
  messages: Message[];
  pagination: {
    has_more: boolean;
    oldest_message_id: string | null;
    newest_message_id: string | null;
  };
}

export interface SendMessageResponse {
  message: Message;
}

// For offline message queue
export interface OfflineMessage {
  tempId: string;
  conversation_id: string;
  content: string;
  message_type: 'text' | 'image' | 'voice';
  media_url?: string;
  created_at: string;
  status: 'pending' | 'sending' | 'failed' | 'sent';
  retryCount: number;
}

// For media upload
export interface MediaUploadResponse {
  media_url: string;
  thumbnail_url?: string;
  media_size: number;
  media_duration?: number;
  mime_type: string;
}
