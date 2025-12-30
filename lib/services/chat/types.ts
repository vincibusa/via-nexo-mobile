/**
 * Chat Service Types
 * TypeScript interfaces for chat functionality
 */

export interface ChatSuggestionRequest {
  message: string;
  location: {
    lat: number;
    lon: number;
  };
  radius_km?: number;
  conversation_id?: string; // For conversational memory

  // BOOKING FLOW
  booking_action?: 'select' | 'confirm' | 'cancel' | 'swipe_complete';
  selected_event_id?: string;
  booking_intent_id?: string;
  liked_event_ids?: string[]; // SWIPE: IDs of events user liked
}

export interface ChatSuggestion {
  id: string; // Can be placeId or eventId
  type: 'place' | 'event';
  reason: string;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ChatSuggestionResponse {
  conversationalResponse: string;
  suggestions: ChatSuggestion[];
  searchMetadata: {
    totalCandidates: number;
    totalPlaces: number;
    totalEvents: number;
    processingTime: number;
    cacheUsed: boolean;
    contextUsed?: boolean; // Indicates if conversational context was used
    conversationLength?: number; // Conversation length
  };
  bookingIntentId?: string; // BOOKING FLOW: ID for booking intent if events were suggested
}

export interface ChatStreamProgress {
  step: string;
  message: string;
  timestamp: number;
}

export interface ChatStreamEvent {
  type: 'progress' | 'response' | 'error' | 'complete';
  data: any;
}

export interface ChatApiError {
  error: string;
  code?: string;
  details?: any;
}

export interface ChatHistoryEntry {
  id: string;
  message: string;
  response?: ChatSuggestionResponse;
  timestamp: string;
  location: {
    lat: number;
    lon: number;
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  lastMessage: string;
  lastUpdated: string;
  messageCount: number;
  location: {
    lat: number;
    lon: number;
  };
}