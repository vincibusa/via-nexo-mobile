import { ChatBubble } from '@/components/chat/chat-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { QuickChips } from '@/components/chat/quick-chips';
import { SuggestionCard } from '@/components/home/suggestion-card';
import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        'Ciao! 👋 Sono qui per aiutarti a trovare il posto perfetto. Raccontami cosa stai cercando per stasera!',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedPlace[]>([]);
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
      if (!location || !session?.accessToken) {
        throw new Error('Location or authentication not available');
      }

      // Call actual AI API endpoint
      const response = await chatService.getChatSuggestions(
        {
          message,
          location,
          radius_km: 5,
        },
        session.accessToken
      );

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.conversationalResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Fetch full place details for suggestions
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
          const placesData = await placesResponse.json();
          const places = placesData.places || [];

          // Map places with AI reasons
          const suggestedPlaces: SuggestedPlace[] = response.suggestions.map((suggestion) => {
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

          setSuggestions(suggestedPlaces);
        } else {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
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
          title: 'Ricerca Libera',
          headerShown: true,
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
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
                <ChatBubble
                  key={msg.id}
                  message={msg.content}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                />
              ))}

              {isTyping && <TypingIndicator />}

              {/* Suggestions Results */}
              {suggestions.length > 0 && !isTyping && (
                <View className="mt-4 gap-4">
                  <Text className="text-lg font-semibold">
                    Ho trovato {suggestions.length}{' '}
                    {suggestions.length === 1 ? 'posto' : 'posti'} per te:
                  </Text>
                  {suggestions.map((place, index) => (
                    <Animated.View
                      key={place.id}
                      entering={FadeInDown.delay(index * 100)
                        .duration(300)
                        .springify()}
                    >
                      <SuggestionCard place={place} />
                    </Animated.View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Quick Suggestions (shown only if no messages yet or few messages) */}
            {messages.length <= 2 && !isTyping && (
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
