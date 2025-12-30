export interface EventGroupChatInfo {
  exists: boolean;
  conversation_id: string | null;
  participant_count: number;
  is_member: boolean;
}

export interface EventGroupChatResponse {
  success: boolean;
  error?: string;
}
