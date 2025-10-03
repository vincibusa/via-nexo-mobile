import { ChatBubble } from '@/components/chat/chat-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { QuickChips } from '@/components/chat/quick-chips';
import { FilterPanel, type GuidedFilters } from '@/components/chat/filter-panel';
import { ChatSuggestionCards } from '@/components/chat/chat-suggestion-cards';
import { Text } from '@/components/ui/text';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SuggestedPlace } from '@/lib/types/suggestion';
import { chatService } from '@/lib/services/chat';
import { API_CONFIG } from '@/lib/config';
import { useAuth } from '@/lib/contexts/auth';
import * as Location from 'expo-location';

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
  const scrollViewRef = useRef<ScrollView>(null);

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

      // Fetch full place details for suggestions
      let suggestedPlaces: SuggestedPlace[] = [];

      if (response.suggestions.length > 0) {
        const placeIds = response.suggestions.map((s) => s.placeId);

        // Fetch places using batch endpoint
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
          suggestedPlaces = response.suggestions.map((suggestion) => {
            const place = places.find((p: any) => p.id === suggestion.placeId);

            if (!place) {
              return null;
            }

            return {
              ...place,
              ai_reason: suggestion.reason,
              similarity_score: suggestion.matchScore,
            };
          }).filter((p): p is SuggestedPlace => p !== null);
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
          title: mode === 'guided' ? 'Ricerca Guidata' : 'Ricerca Libera',
          headerShown: true,
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
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
              contentContainerClassName="py-4"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg) => (
                <View key={msg.id}>
                  <ChatBubble
                    message={msg.content}
                    isUser={msg.isUser}
                    timestamp={msg.timestamp}
                  />
                  {/* Show suggestions inline with AI messages */}
                  {!msg.isUser && msg.suggestions && msg.suggestions.length > 0 && (
                    <ChatSuggestionCards suggestions={msg.suggestions} />
                  )}
                </View>
              ))}

              {isTyping && <TypingIndicator />}
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
