import React, { useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import * as Location from 'expo-location';
import { useFiltersStore } from '../../../lib/stores/filters-store';
import { placesListService } from '../../../lib/services/places-list';
import type { Place } from '../../../lib/types/suggestion';
import { PlaceCard } from '../../../components/places/place-card';
import { SearchBar } from '../../../components/common/search-bar';
import { FilterPills, type FilterPill } from '../../../components/common/filter-pills';
import { Text } from '../../../components/ui/text';

const CATEGORY_FILTERS: FilterPill[] = [
  { id: 'all', label: 'Tutti', value: null },
  { id: 'bar', label: 'Bar', value: 'bar' },
  { id: 'ristorante', label: 'Ristorante', value: 'ristorante' },
  { id: 'club', label: 'Club', value: 'club' },
  { id: 'pub', label: 'Pub', value: 'pub' },
  { id: 'lounge', label: 'Lounge', value: 'lounge' },
];

type PlaceWithExtras = Place & { distance_km?: number; events_count?: number };

export default function PlacesScreen() {
  const { placesFilters, setPlacesFilters } = useFiltersStore();
  const [places, setPlaces] = useState<PlaceWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      });
    })();
  }, []);

  // Fetch places
  const fetchPlaces = useCallback(
    async (cursor: string | null = null, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const filters = {
        ...placesFilters,
        search: searchQuery || undefined,
      };

      const { data, error } = await placesListService.getPlaces(filters, location || undefined, cursor);

      if (isRefresh) {
        setRefreshing(false);
      } else if (cursor) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }

      if (error) {
        console.error('Error fetching places:', error);
        return;
      }

      if (data) {
        if (cursor) {
          setPlaces((prev) => [...prev, ...data.data]);
        } else {
          setPlaces(data.data);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    },
    [placesFilters, searchQuery, location]
  );

  // Initial fetch
  useEffect(() => {
    fetchPlaces();
  }, [placesFilters, location]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlaces();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && nextCursor) {
      fetchPlaces(nextCursor);
    }
  }, [loadingMore, hasMore, nextCursor, fetchPlaces]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchPlaces(null, true);
  }, [fetchPlaces]);

  // Handle category filter
  const handleCategorySelect = useCallback(
    (pill: FilterPill) => {
      console.log('Filter selected:', pill);
      setSelectedCategoryId(pill.id);
      setPlacesFilters({ category: pill.value || undefined });
      // Reset data when filter changes
      setPlaces([]);
      setNextCursor(null);
      setHasMore(true);
    },
    [setPlacesFilters]
  );

  // Render item
  const renderItem = useCallback(({ item }: { item: PlaceWithExtras }) => {
    return <PlaceCard place={item} />;
  }, []);

  // Render footer
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator />
      </View>
    );
  }, [loadingMore]);

  // Render empty
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text variant="muted" className="text-center">
          Nessun locale trovato
        </Text>
      </View>
    );
  }, [loading]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <View className="pb-3">
        <Text variant="h2" className="px-4 mb-4 border-0">
          Luoghi
        </Text>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cerca un locale..."
        />
        <FilterPills
          filters={CATEGORY_FILTERS}
          selectedId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />
      </View>

      {/* List */}
      {loading && places.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlashList
          data={places}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.8}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}
