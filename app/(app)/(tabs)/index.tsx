import { QuickFilters, type Filters } from '@/components/home/quick-filters';
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

export default function HomeScreen() {
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

  // Auto-search when filters change (if we have location and at least one filter selected)
  useEffect(() => {
    if (location && (filters.companionship.length > 0 || filters.mood.length > 0)) {
      handleSearch();
    }
  }, [filters, location]);

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
        radius_km: 3, // Default 3km radius
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-6"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="gap-2">
          <Text className="text-2xl font-bold">Scopri NEXO</Text>
          <Text className="text-muted-foreground">
            Trova il posto perfetto per la tua serata
          </Text>
        </View>

        {/* Quick Filters */}
        <QuickFilters filters={filters} onFiltersChange={setFilters} />

        {/* Search Button (manual trigger) */}
        {!loading && suggestions.length === 0 && (
          <Button onPress={handleSearch} className="w-full">
            <Text>Cerca Suggerimenti</Text>
          </Button>
        )}

        {/* Loading State */}
        {loading && (
          <View className="gap-4">
            <Text className="text-lg font-semibold">Cerco i posti migliori per te...</Text>
            {[1, 2, 3].map((i) => (
              <View key={i} className="gap-3 rounded-lg border border-border p-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </View>
            ))}
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View className="gap-4 rounded-lg bg-destructive/10 p-4">
            <Text className="text-destructive font-medium">{error}</Text>
            <Button variant="outline" onPress={handleSearch}>
              <Text>Riprova</Text>
            </Button>
          </View>
        )}

        {/* Success: Suggestions */}
        {!loading && suggestions.length > 0 && (
          <View className="gap-4">
            <Text className="text-lg font-semibold">
              {suggestions.length} {suggestions.length === 1 ? 'Suggerimento' : 'Suggerimenti'} per
              te
            </Text>
            {suggestions.map((place) => (
              <SuggestionCard key={place.id} place={place} />
            ))}
          </View>
        )}

        {/* Empty State - No filters selected */}
        {!loading && suggestions.length === 0 && !error && (
          <View className="items-center gap-4 py-12">
            <Text className="text-4xl">🎯</Text>
            <Text className="text-center text-muted-foreground">
              Seleziona i filtri sopra per scoprire i posti migliori per la tua serata
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
