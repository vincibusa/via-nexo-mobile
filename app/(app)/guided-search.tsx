import { QuickFilters, type Filters } from '@/components/home/quick-filters';
import { ActiveFiltersChip } from '@/components/home/active-filters-chip';
import { SuggestionCard } from '@/components/home/suggestion-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { getCurrentLocation } from '@/lib/services/location';
import { suggestionsService } from '@/lib/services/suggestions';
import type { SuggestedPlace } from '@/lib/types/suggestion';
import { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Stack } from 'expo-router';

export default function GuidedSearchScreen() {
  const [filters, setFilters] = useState<Filters>({
    companionship: [],
    mood: [],
    budget: '€€',
    time: 'tonight',
  });

  const [suggestions, setSuggestions] = useState<SuggestedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Get location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (err) {
      console.error('Failed to get location:', err);
      Alert.alert(
        'Permesso Posizione',
        'Non possiamo accedere alla tua posizione. Useremo Roma come località predefinita.'
      );
    }
  };

  const handleSearch = async () => {
    if (!location) {
      Alert.alert('Errore', 'Impossibile ottenere la tua posizione');
      return;
    }

    if (filters.companionship.length === 0 && filters.mood.length === 0) {
      Alert.alert('Seleziona Filtri', 'Scegli almeno una compagnia o un mood per iniziare');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await suggestionsService.getSuggestions({
        companionship: filters.companionship,
        mood: filters.mood,
        budget: filters.budget,
        time: filters.time,
        location,
        radius_km: 3,
      });

      if (apiError) {
        setError(apiError.message);
        setSuggestions([]);
      } else if (data) {
        setSuggestions(data.suggestions);
        if (data.suggestions.length === 0) {
          setError('Nessun risultato trovato. Prova ad allargare i filtri.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    getLocation();
    if (location) {
      handleSearch();
    }
  };

  const handleRemoveFilter = (type: 'companionship' | 'mood', value: string) => {
    if (type === 'companionship') {
      setFilters({
        ...filters,
        companionship: filters.companionship.filter((c) => c !== value),
      });
    } else if (type === 'mood') {
      setFilters({
        ...filters,
        mood: filters.mood.filter((m) => m !== value),
      });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Ricerca Guidata',
          headerShown: true,
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
        >
          {/* Quick Filters */}
          <View className="px-4 pt-4">
            <QuickFilters filters={filters} onFiltersChange={setFilters} />
          </View>

          {/* Active Filters Chip */}
          <ActiveFiltersChip filters={filters} onRemoveFilter={handleRemoveFilter} />

          {/* Search Button (manual trigger) */}
          {!loading && suggestions.length === 0 && !error && (
            <View className="px-4 pt-4">
              <Button onPress={handleSearch} className="w-full">
                <Text>Cerca Suggerimenti</Text>
              </Button>
            </View>
          )}

          {/* Loading State with Stagger Animation */}
          {loading && (
            <View className="gap-4 px-4 pt-4">
              <Text className="text-lg font-semibold">Cerco i posti migliori per te...</Text>
              {[1, 2, 3].map((i, index) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(index * 100).duration(300)}
                  className="gap-3 rounded-lg border border-border p-4"
                >
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                  <Skeleton className="h-16 w-full rounded" />
                </Animated.View>
              ))}
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View className="mx-4 mt-4 gap-4 rounded-lg bg-destructive/10 p-4">
              <View className="gap-2">
                <Text className="text-xl">⚠️</Text>
                <Text className="font-semibold text-destructive">
                  Ops, qualcosa è andato storto
                </Text>
                <Text className="text-sm text-muted-foreground">{error}</Text>
              </View>
              <View className="flex-row gap-2">
                <Button variant="default" onPress={handleSearch} className="flex-1">
                  <Text>Riprova</Text>
                </Button>
                <Button variant="ghost" onPress={() => setError(null)} className="flex-1">
                  <Text>Chiudi</Text>
                </Button>
              </View>
            </View>
          )}

          {/* Success: Suggestions with Stagger */}
          {!loading && suggestions.length > 0 && (
            <View className="gap-4 px-4 pt-4">
              <Text className="text-lg font-semibold">
                {suggestions.length}{' '}
                {suggestions.length === 1 ? 'Suggerimento' : 'Suggerimenti'} per te
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

          {/* Empty State - No filters selected */}
          {!loading && suggestions.length === 0 && !error && (
            <View className="items-center gap-4 px-4 py-12">
              <Text className="text-6xl">🎯</Text>
              <Text className="text-center text-xl font-semibold">Pronto per scoprire?</Text>
              <Text className="text-center text-muted-foreground">
                Seleziona i filtri sopra per trovare il posto perfetto per la tua serata
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
