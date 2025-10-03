import { SearchModeCard } from '@/components/home/search-mode-card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/contexts/auth';
import { useRouter } from 'expo-router';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MessageCircle } from 'lucide-react-native';
import { useMemo, useCallback, useState } from 'react';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

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

  // Navigation handler with loading state
  const handleNavigation = useCallback((route: string) => {
    setIsNavigating(true);
    router.push(route as any);
    // Reset loading state after navigation
    setTimeout(() => setIsNavigating(false), 100);
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="gap-3 p-6">
          <Text 
            className="text-2xl font-bold leading-tight"
            accessibilityRole="header"
            accessibilityLevel={1}
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
            onPress={() => handleNavigation('/(app)/guided-search')}
            accessibilityLabel="Ricerca Guidata. Trova rapidamente con filtri: compagnia, mood, budget e orario"
            accessibilityHint="Tocca per aprire la ricerca con filtri"
            disabled={isNavigating}
          />

          {/* Ricerca Libera (Chat) */}
          <SearchModeCard
            icon={MessageCircle}
            title="Ricerca Libera (Chat)"
            description="Descrivi la tua serata ideale e il nostro AI ti aiuterà"
            onPress={() => handleNavigation('/(app)/chat-search')}
            accessibilityLabel="Ricerca Libera con Chat. Descrivi la tua serata ideale e il nostro AI ti aiuterà"
            accessibilityHint="Tocca per aprire la ricerca con chat AI"
            disabled={isNavigating}
          />
        </View>

        {/* Quick Suggestions Section */}
        <View className="mt-8 gap-4 p-6">
          <Text 
            className="text-lg font-semibold"
            accessibilityRole="header"
            accessibilityLevel={2}
          >
            Suggerimenti Rapidi
          </Text>
          <View className="items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8 min-h-[120px]">
            <Text className="text-center text-sm text-muted-foreground leading-relaxed">
              Eventi in evidenza e locali popolari{'\n'}in arrivo presto...
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
