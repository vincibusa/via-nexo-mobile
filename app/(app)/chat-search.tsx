import { ChatBubble } from '../../components/chat/chat-bubble';
import { ChatInput } from '../../components/chat/chat-input';
import { TypingIndicator } from '../../components/chat/typing-indicator';
import { QuickChips } from '../../components/chat/quick-chips';
import { FilterPanel, type GuidedFilters } from '../../components/chat/filter-panel';
import { ChatSuggestionCards } from '../../components/chat/chat-suggestion-cards';

import { Stack, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SuggestedPlace } from '../../lib/types/suggestion';
import { chatService } from '../../lib/services/chat';
import { chatHistoryService } from '../../lib/services/chat-history';
import { API_CONFIG } from '../../lib/config';
import { useAuth } from '../../lib/contexts/auth';
import * as Location from 'expo-location';
import type { ChatConversationWithMessages } from '../../lib/types/chat-history';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: SuggestedPlace[]; // AI messages can include suggestions
}

const QUICK_SUGGESTIONS = [
  'Romantico stasera',
  'Festa con amici',
  'Aperitivo tranquillo',
  'Cena in coppia',
  'Evento culturale',
];

export default function ChatSearchScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams();
  const mode = (params.mode as 'guided' | 'free') || 'free';
  const conversationId = params.conversation_id as string;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        mode === 'guided'
          ? 'Ciao! 👋 Seleziona i filtri sopra per trovare il posto perfetto, oppure scrivi liberamente cosa cerchi!'
          : 'Ciao! 👋 Sono qui per aiutarti a trovare il posto perfetto. Raccontami cosa stai cercando per stasera!',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ChatConversationWithMessages | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(!!conversationId);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load existing conversation if conversation_id is provided
  useEffect(() => {
    if (conversationId && session?.accessToken) {
      loadExistingConversation(conversationId);
    }
  }, [conversationId, session?.accessToken]);

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        // Fallback to Rome center
        setLocation({ lat: 41.9028, lon: 12.4964 });
        return;
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          lat: currentLocation.coords.latitude,
          lon: currentLocation.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        // Fallback to Rome center
        setLocation({ lat: 41.9028, lon: 12.4964 });
      }
    })();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  // Auto-save conversation after 3+ messages
  useEffect(() => {
    if (messages.length >= 3 && !currentConversation && session?.accessToken) {
      // Only auto-save if we have at least 3 messages and no existing conversation
      autoSaveConversation();
    }
  }, [messages.length, currentConversation, session?.accessToken]);

  const loadExistingConversation = async (id: string) => {
    try {
      if (!session?.accessToken) return;
      
      const conversation = await chatHistoryService.continueConversation(id, session.accessToken);
      
      // Convert database messages to UI messages
      const uiMessages: Message[] = conversation.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.is_user,
        timestamp: new Date(msg.timestamp),
        suggestions: msg.suggestions_data || undefined,
      }));
      
      setMessages(uiMessages);
      setCurrentConversation(conversation);
    } catch (error) {
      console.error('Error loading conversation:', error);
      Alert.alert('Errore', 'Impossibile caricare la conversazione');
    } finally {
      setLoadingConversation(false);
    }
  };

  const autoSaveConversation = async () => {
    try {
      if (!session?.accessToken || messages.length < 3) return;
      
      const conversation = await chatHistoryService.saveConversation(messages, session.accessToken);
      setCurrentConversation(conversation);
      console.log('Conversation auto-saved:', conversation.id);
    } catch (error) {
      console.error('Error auto-saving conversation:', error);
      // Don't show error to user for auto-save
    }
  };

  const handleSaveConversation = async () => {
    try {
      if (!session?.accessToken) {
        Alert.alert('Errore', 'Devi essere autenticato per salvare la conversazione');
        return;
      }

      if (messages.length === 0) {
        Alert.alert('Errore', 'Non ci sono messaggi da salvare');
        return;
      }

      if (currentConversation) {
        Alert.alert('Info', 'Questa conversazione è già salvata');
        return;
      }

      const conversation = await chatHistoryService.saveConversation(messages, session.accessToken);
      setCurrentConversation(conversation);
      Alert.alert('Successo', 'Conversazione salvata con successo!');
    } catch (error) {
      console.error('Error saving conversation:', error);
      Alert.alert('Errore', 'Impossibile salvare la conversazione');
    }
  };

  const handleSendMessage = async (message: string) => {
    console.log('[ChatSearch] Sending message:', message);
    console.log('[ChatSearch] Location:', location);
    console.log('[ChatSearch] Session exists:', !!session);
    console.log('[ChatSearch] Access token exists:', !!session?.accessToken);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // If we have an existing conversation, save the message to it
    if (currentConversation && session?.accessToken) {
      try {
        await chatHistoryService.addMessage(currentConversation.id, {
          content: message,
          is_user: true,
        }, session.accessToken);
      } catch (error) {
        console.error('Error saving message to conversation:', error);
        // Continue anyway, don't block user
      }
    }

    // Show typing indicator
    setIsTyping(true);

    try {
      // Check if we have location and session
      if (!location) {
        console.error('[ChatSearch] No location available');
        throw new Error('Posizione non disponibile');
      }

      if (!session?.accessToken) {
        console.error('[ChatSearch] No access token available');
        throw new Error('Autenticazione non disponibile');
      }

      console.log('[ChatSearch] Calling chat API...');

      // Call actual AI API endpoint
      const response = await chatService.getChatSuggestions(
        {
          message,
          location,
          radius_km: 5,
        },
        session.accessToken
      );

      // Fetch full details for suggestions (both places and events)
      let suggestedPlaces: SuggestedPlace[] = [];

      if (response.suggestions.length > 0) {
        // Separate place and event suggestions
        const placeSuggestions = response.suggestions.filter((s) => s.type === 'place');
        const eventSuggestions = response.suggestions.filter((s) => s.type === 'event');
        
        console.log('[ChatSearch] Suggestions - Places:', placeSuggestions.length, 'Events:', eventSuggestions.length);
        
        // Fetch places if any
        if (placeSuggestions.length > 0) {
          const placeIds = placeSuggestions.map((s) => s.id);

          const placesResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLACES_BATCH}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ ids: placeIds }),
          });

          if (placesResponse.ok) {
            const placesData = (await placesResponse.json()) as { places: any[] };
            const places = placesData.places || [];

            // Map places with AI reasons
            const mappedPlaces = placeSuggestions.map((suggestion) => {
              const place = places.find((p: any) => p.id === suggestion.id);
              if (!place) return null;

              return {
                ...place,
                ai_reason: suggestion.reason,
                similarity_score: suggestion.matchScore,
              };
            }).filter((p): p is SuggestedPlace => p !== null);

            suggestedPlaces.push(...mappedPlaces);
          }
        }

        // Fetch events if any
        if (eventSuggestions.length > 0) {
          const eventIds = eventSuggestions.map((s) => s.id);

          const eventsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENTS_BATCH}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ ids: eventIds }),
          });

          if (eventsResponse.ok) {
            const eventsData = (await eventsResponse.json()) as { events: any[] };
            const events = eventsData.events || [];

            // Map events with AI reasons (convert to place-like format for display)
            const mappedEvents = eventSuggestions.map((suggestion) => {
              const event = events.find((e: any) => e.id === suggestion.id);
              if (!event || !event.place) return null;

              // Convert event to place-like structure for ChatSuggestionCards
              return {
                id: event.id,
                name: event.title,
                category: event.event_type,
                description: event.description,
                cover_image: event.cover_image,
                address: event.place.address,
                city: event.place.city,
                latitude: event.place.latitude,
                longitude: event.place.longitude,
                price_range: event.place.price_range,
                verified: event.place.verified,
                ai_reason: suggestion.reason,
                similarity_score: suggestion.matchScore,
                // Mark as event for navigation
                _isEvent: true,
                _eventData: event,
              } as any;
            }).filter((e): e is SuggestedPlace => e !== null);

            suggestedPlaces.push(...mappedEvents);
          }
        }
      }

      // Add AI response with suggestions embedded
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.conversationalResponse,
        isUser: false,
        timestamp: new Date(),
        suggestions: suggestedPlaces,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // If we have an existing conversation, save the AI message to it
      if (currentConversation && session?.accessToken) {
        try {
          await chatHistoryService.addMessage(currentConversation.id, {
            content: response.conversationalResponse,
            is_user: false,
            suggestions_data: suggestedPlaces,
          }, session.accessToken);
        } catch (error) {
          console.error('Error saving AI message to conversation:', error);
          // Continue anyway, don't block user
        }
      }
    } catch (error) {
      console.error('Error getting chat suggestions:', error);

      // Fallback to mock response on error
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getMockAIResponse(message),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Determine header title based on context
  const getHeaderTitle = () => {
    if (currentConversation) {
      return currentConversation.title || 'Conversazione';
    }
    return mode === 'guided' ? 'Ricerca Guidata' : 'Ricerca Libera';
  };

  const handleGuidedSearch = (filters: GuidedFilters) => {
    // Generate natural language message from filters
    const parts: string[] = [];

    if (filters.companionship.length > 0) {
      const compMap = {
        alone: 'da solo',
        partner: 'con il partner',
        friends: 'con amici',
        family: 'con la famiglia',
      };
      parts.push(compMap[filters.companionship[0]]);
    }

    if (filters.mood.length > 0) {
      const moodMap = {
        relaxed: 'atmosfera rilassata',
        energetic: 'atmosfera energica',
        cultural: 'atmosfera culturale',
        romantic: 'atmosfera romantica',
      };
      parts.push(moodMap[filters.mood[0]]);
    }

    parts.push(`budget ${filters.budget}`);

    const timeMap = {
      now: 'adesso',
      tonight: 'stasera',
      morning: 'domani mattina',
      afternoon: 'domani pomeriggio',
      evening: 'domani sera',
      night: 'stanotte',
      weekend: 'questo weekend',
    };
    parts.push(timeMap[filters.time]);

    const message = `Cerco un locale ${parts.join(', ')}`;

    // Send the generated message
    handleSendMessage(message);
  };

  // Mock AI response generator
  const getMockAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('romantico')) {
      return 'Perfetto! Ho capito che cerchi un posto romantico. Stai cercando per stasera? E con che budget? 💕';
    }

    if (lowerMessage.includes('amici') || lowerMessage.includes('festa')) {
      return 'Festa con gli amici! 🎉 Quanti siete? E preferite un locale con musica live o DJ?';
    }

    if (lowerMessage.includes('tranquillo') || lowerMessage.includes('relax')) {
      return 'Un posto tranquillo, ottima scelta! 😌 Preferisci un wine bar, un caffè o un ristorante?';
    }

    if (lowerMessage.includes('budget') || lowerMessage.includes('€')) {
      return 'Capito il budget! Sto cercando i posti migliori per te... Un momento! ✨';
    }

    // Default response
    return 'Interessante! Puoi darmi qualche dettaglio in più? Ad esempio: con chi esci, che mood hai, e il tuo budget? Così posso aiutarti meglio! 😊';
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: getHeaderTitle(),
          headerShown: true,
          headerBackTitle: ' ',
          headerBackTitleStyle: { fontSize: 0 },
          headerRight: () => (
            <View className="mr-4">
              <Button
                variant="ghost"
                size="sm"
                onPress={handleSaveConversation}
                disabled={loadingConversation || !!currentConversation || messages.length === 0}
              >
                <Text className="text-primary text-sm">
                  {currentConversation ? '✓ Salvata' : 'Salva'}
                </Text>
              </Button>
            </View>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        {/* Loading indicator for conversation */}
        {loadingConversation && (
          <View className="absolute inset-0 bg-background/80 z-50 justify-center items-center">
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-muted-foreground">Caricamento conversazione...</Text>
          </View>
        )}

        {/* Filter Panel (only in guided mode) */}
        {mode === 'guided' && <FilterPanel onSearch={handleGuidedSearch} />}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
          keyboardVerticalOffset={100}
        >
          <View className="flex-1">
            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4"
              contentContainerClassName="py-6"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg, index) => (
                <View key={msg.id} className="mb-6">
                  <ChatBubble
                    message={msg.content}
                    isUser={msg.isUser}
                    timestamp={msg.timestamp}
                  />
                  {/* Show suggestions inline with AI messages */}
                  {!msg.isUser && msg.suggestions && msg.suggestions.length > 0 && (
                    <View className="mt-4">
                      <ChatSuggestionCards suggestions={msg.suggestions} />
                    </View>
                  )}
                </View>
              ))}

              {isTyping && (
                <View className="mb-6">
                  <TypingIndicator />
                </View>
              )}
            </ScrollView>

            {/* Quick Suggestions (shown only if no messages yet or few messages) */}
            {mode === 'free' && messages.length <= 2 && !isTyping && (
              <QuickChips suggestions={QUICK_SUGGESTIONS} onSelect={handleQuickSuggestion} />
            )}

            {/* Input */}
            <ChatInput onSend={handleSendMessage} disabled={isTyping} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
