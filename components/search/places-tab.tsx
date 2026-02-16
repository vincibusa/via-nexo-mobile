import React, { useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import * as Location from 'expo-location';
import { useFiltersStore } from '../../lib/stores/filters-store';
import { placesListService } from '../../lib/services/places-list';
import type { Place } from '../../lib/types/suggestion';
import { PlaceCard } from '../places/place-card';
import { Text } from '../ui/text';
import { API_CONFIG } from '../../lib/config';
import { THEME } from '../../lib/theme';
import { useColorScheme } from 'nativewind';

type PlaceWithExtras = Place & { distance_km?: number; events_count?: number };

interface PlacesTabProps {
  query: string;
}

export function PlacesTab({ query }: PlacesTabProps) {
  const { placesFilters } = useFiltersStore();
  const { colorScheme } = useColorScheme();
  const [places, setPlaces] = useState<PlaceWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const themeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const themeColors = THEME[themeMode];

  // Get user location
  useEffect(() => {
    (async () => {
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
          userLocation = API_CONFIG.DEFAULT_LOCATION;
        }
      } else {
        userLocation = API_CONFIG.DEFAULT_LOCATION;
      }

      setLocation(userLocation);
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
        search: query || undefined,
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
    [placesFilters, query, location]
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
  }, [query]);

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

  // Render item
  const renderItem: ListRenderItem<PlaceWithExtras> = useCallback(({ item }) => {
    return (
      <View className="flex-1 p-1">
        <PlaceCard place={item} variant="grid" />
      </View>
    );
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
    <View className="flex-1">


      {/* List */}
      {loading && places.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.foreground} />
        </View>
      ) : (
        <FlashList
          data={places}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 16 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.8}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={themeColors.foreground}
              colors={[themeColors.primary]}
            />
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}
