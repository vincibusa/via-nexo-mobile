import React, { useEffect } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '../ui/text';
import {
  Sparkles,
  ChevronRight,
  Users,
  Utensils,
  Music,
  MapPin,
  Heart,
  Calendar,
  Wallet
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { THEME } from '../../lib/theme';
import { GlassSurface, GlassView } from '../glass';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFloatingTabBarScrollPadding } from '../../lib/layout/floating-tab-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';

interface Suggestion {
  id: string;
  text: string;
  icon: typeof Users;
  query?: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: '1',
    text: 'Serata con amici',
    icon: Users,
    query: 'Voglio uscire con gli amici stasera',
  },
  {
    id: '2',
    text: 'Cena romantica',
    icon: Heart,
    query: 'Cerco un ristorante romantico per una cena speciale',
  },
  {
    id: '3',
    text: 'Aperitivo trendy',
    icon: Utensils,
    query: 'Dove fare aperitivo in un locale trendy',
  },
  {
    id: '4',
    text: 'Musica dal vivo',
    icon: Music,
    query: 'Locali con musica dal vivo stasera',
  },
  {
    id: '5',
    text: 'Budget limitato',
    icon: Wallet,
    query: 'Cena con budget limitato ma di qualità',
  },
  {
    id: '6',
    text: 'Eventi del weekend',
    icon: Calendar,
    query: 'Cosa fare questo weekend',
  },
];

export function ChatAITab() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  // Animation values for pulse effect
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  // Get dynamic colors for icons
  const themeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const isDark = themeMode === 'dark';
  const themeColors = THEME[themeMode];
  const scrollBottomPadding = getFloatingTabBarScrollPadding(insets.bottom, 16);

  // Pulse animation for sparkles icon
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [scale, opacity]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleSuggestionPress = (suggestion: Suggestion) => {
    if (suggestion.query) {
      router.push({
        pathname: '/(app)/chat-search',
        params: { mode: 'free', initialMessage: suggestion.query }
      } as any);
    } else {
      router.push('/(app)/chat-search?mode=free' as any);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
    >
      {/* Main AI Chat Card */}
      <View className="px-4 pt-4">
        <GlassSurface
          variant="card"
          intensity={isDark ? 'regular' : 'light'}
          tint={isDark ? 'extraLight' : 'light'}
          style={{ borderRadius: 18, padding: 1.5 }}
        >
          <TouchableOpacity
            onPress={() => router.push('/(app)/chat-search?mode=free' as any)}
            activeOpacity={0.8}
            className="rounded-2xl overflow-hidden border border-primary/20 bg-primary/10"
          >
            <View className="flex-row items-center gap-4 p-5">
              <Animated.View style={animatedIconStyle}>
                <View className="rounded-full bg-primary/20 p-4">
                  <Sparkles size={28} color={themeColors.primary} />
                </View>
              </Animated.View>
              <View className="flex-1">
                <Text className="text-xl font-bold mb-1">Chiedi all'AI</Text>
                <Text className="text-sm text-muted-foreground leading-relaxed">
                  Descrivi cosa cerchi e ti guideremo alla serata perfetta
                </Text>
              </View>
              <ChevronRight size={24} color={themeColors.mutedForeground} />
            </View>
          </TouchableOpacity>
        </GlassSurface>
      </View>

      {/* Quick location search */}
      <View className="px-4 mt-6">
        <GlassSurface
          variant="card"
          intensity={isDark ? 'light' : 'regular'}
          tint={isDark ? 'dark' : 'light'}
          style={{ borderRadius: 14, padding: 0 }}
        >
          <TouchableOpacity
            onPress={() => router.push('/(app)/chat-search?mode=free' as any)}
            activeOpacity={0.7}
            className="flex-row items-center gap-3 bg-muted/20 rounded-xl px-4 py-3"
          >
            <MapPin size={18} color={themeColors.mutedForeground} />
            <Text className="flex-1 text-muted-foreground">Cerca vicino a me...</Text>
          </TouchableOpacity>
        </GlassSurface>
      </View>

      {/* Suggestions Section */}
      <View className="mt-8 px-4">
        <Text className="font-semibold text-base mb-4">Prova a chiedere</Text>
        <View className="gap-2">
          {SUGGESTIONS.map((suggestion) => {
            const IconComponent = suggestion.icon;
            return (
              <GlassView
                key={suggestion.id}
                intensity={isDark ? 'light' : 'regular'}
                tint={isDark ? 'dark' : 'light'}
                style={{ borderRadius: 14 }}
              >
                <TouchableOpacity
                  onPress={() => handleSuggestionPress(suggestion)}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 bg-muted/20 rounded-xl px-4 py-3.5"
                >
                  <View className="w-9 h-9 rounded-full bg-muted/50 items-center justify-center">
                    <IconComponent size={18} color={themeColors.foreground} />
                  </View>
                  <Text className="flex-1 font-medium">{suggestion.text}</Text>
                  <ChevronRight size={18} color={themeColors.mutedForeground} />
                </TouchableOpacity>
              </GlassView>
            );
          })}
        </View>
      </View>

      {/* Tips section */}
      <View className="mt-8 px-4">
        <GlassSurface
          variant="card"
          intensity={isDark ? 'light' : 'regular'}
          tint={isDark ? 'dark' : 'light'}
          style={{ borderRadius: 16, padding: 0 }}
        >
          <View className="bg-muted/20 rounded-2xl p-4">
            <Text className="font-semibold mb-2">Suggerimento</Text>
            <Text className="text-sm text-muted-foreground leading-relaxed">
              Puoi essere specifico! Prova: "Ristorante giapponese con tavoli all'aperto"
              o "Locale tranquillo per lavorare con wifi veloce"
            </Text>
          </View>
        </GlassSurface>
      </View>
    </ScrollView>
  );
}
