export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  content: string;
  is_user: boolean;
  timestamp: string;
  suggestions_data?: any; // JSON data for embedded suggestions
}

export interface ChatConversationWithMessages extends ChatConversation {
  messages: ChatMessage[];
}

export interface ChatConversationsResponse {
  conversations: ChatConversation[];
  total: number;
  hasMore: boolean;
}

export interface CreateConversationRequest {
  title?: string;
  initial_message: string;
}

export interface AddMessageRequest {
  content: string;
  is_user: boolean;
  suggestions_data?: any;
}