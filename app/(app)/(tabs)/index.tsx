import { SearchModeCard } from '@/components/home/search-mode-card';
import { QuickSuggestionCard } from '@/components/home/quick-suggestion-card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/contexts/auth';
import { useRouter } from 'expo-router';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MessageCircle } from 'lucide-react-native';
import { useMemo, useState, useEffect } from 'react';
import { quickSuggestionsService, type QuickSuggestion } from '@/lib/services/quick-suggestions';
import * as Location from 'expo-location';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [quickSuggestions, setQuickSuggestions] = useState<QuickSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Memoized user name extraction with proper error handling
  const userName = useMemo(() => {
    try {
      if (user?.displayName?.trim()) {
        return user.displayName.split(' ')[0];
      }
      if (user?.email?.includes('@')) {
        return user.email.split('@')[0];
      }
    } catch (error) {
      console.warn('Error parsing user name:', error);
    }
    return 'Amico';
  }, [user]);

  // Memoized time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) {
      return `Ciao ${userName} ☀️, cosa facciamo oggi?`;
    }
    if (hour >= 12 && hour < 18) {
      return `Ciao ${userName} 👋, cosa organizziamo per stasera?`;
    }
    if (hour >= 18 && hour < 24) {
      return `Ciao ${userName} 🌙, la serata è tua!`;
    }
    return `Ciao ${userName} 🌃, ancora in giro?`;
  }, [userName]);


  // Fetch location and quick suggestions
  useEffect(() => {
    let mounted = true;

    const fetchQuickSuggestions = async () => {
      try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        let userLocation: { lat: number; lon: number };

        if (status === 'granted') {
          try {
            const currentLocation = await Location.getCurrentPositionAsync({});
            userLocation = {
              lat: currentLocation.coords.latitude,
              lon: currentLocation.coords.longitude,
            };
          } catch (error) {
            console.warn('Error getting location:', error);
            // Fallback to Rome center
            userLocation = { lat: 41.9028, lon: 12.4964 };
          }
        } else {
          // Fallback to Rome center if permission denied
          userLocation = { lat: 41.9028, lon: 12.4964 };
        }

        if (!mounted) return;
        setLocation(userLocation);

        // Fetch quick suggestions
        const { data, error } = await quickSuggestionsService.getQuickSuggestions(
          userLocation,
          10, // 10km radius
          6   // 6 suggestions
        );

        if (!mounted) return;

        if (error) {
          console.error('Error fetching quick suggestions:', error);
        } else if (data) {
          setQuickSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        if (mounted) {
          setIsLoadingSuggestions(false);
        }
      }
    };

    fetchQuickSuggestions();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="gap-3 p-6">
          <Text
            className="text-2xl font-bold leading-tight"
            accessibilityRole="header"
          >
            {greeting}
          </Text>
          <Text className="text-base text-muted-foreground leading-relaxed">
            Scegli come cercare il tuo locale o evento perfetto
          </Text>
        </View>

        {/* Search Mode Cards */}
        <View className="gap-6 px-6">
          {/* Ricerca Guidata */}
          <SearchModeCard
            icon={Search}
            title="Ricerca Guidata"
            description="Trova rapidamente con filtri: compagnia, mood, budget e orario"
            onPress={() => router.push('/(app)/chat-search?mode=guided' as any)}
          />

          {/* Ricerca Libera (Chat) */}
          <SearchModeCard
            icon={MessageCircle}
            title="Ricerca Libera (Chat)"
            description="Descrivi la tua serata ideale e il nostro AI ti aiuterà"
            onPress={() => router.push('/(app)/chat-search?mode=free' as any)}
          />
        </View>

        {/* Quick Suggestions Section */}
        <View className="mt-8 gap-4 pb-6">
          <View className="px-6">
            <Text
              className="text-lg font-semibold"
              accessibilityRole="header"
            >
              Suggerimenti Rapidi
            </Text>
          </View>

          {isLoadingSuggestions ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" />
              <Text className="mt-4 text-sm text-muted-foreground">
                Caricamento suggerimenti...
              </Text>
            </View>
          ) : quickSuggestions.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3 px-6"
            >
              {quickSuggestions.map((suggestion, index) => (
                <Animated.View
                  key={suggestion.id}
                  entering={FadeInDown.delay(index * 100)
                    .duration(400)
                    .springify()}
                >
                  <QuickSuggestionCard
                    id={suggestion.id}
                    name={suggestion.name}
                    place_type={suggestion.place_type}
                    address={suggestion.address}
                    city={suggestion.city}
                    distance_km={suggestion.distance_km}
                    photos={suggestion.photos}
                    badge={suggestion.badge}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <View className="mx-6 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8">
              <Text className="text-center text-sm text-muted-foreground leading-relaxed">
                Nessun suggerimento disponibile{'\n'}nella tua zona al momento
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
