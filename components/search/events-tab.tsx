import React, { useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as Location from 'expo-location';
import { useFiltersStore } from '../../lib/stores/filters-store';
import { eventsListService, type EventListItem } from '../../lib/services/events-list';
import { EventCard } from '../events/event-card';
import { Text } from '../ui/text';
import { API_CONFIG } from '../../lib/config';

interface EventsTabProps {
  query: string;
}

export function EventsTab({ query }: EventsTabProps) {
  const { eventsFilters, setEventsFilters } = useFiltersStore();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

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

  // Fetch events
  const fetchEvents = useCallback(
    async (cursor: string | null = null, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const filters = {
        ...eventsFilters,
        search: query || undefined,
      };

      const { data, error } = await eventsListService.getEvents(filters, location || undefined, cursor);

      if (isRefresh) {
        setRefreshing(false);
      } else if (cursor) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      if (data) {
        if (cursor) {
          setEvents((prev) => [...prev, ...data.data]);
        } else {
          setEvents(data.data);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    },
    [eventsFilters, query, location]
  );

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [eventsFilters, location]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && nextCursor) {
      fetchEvents(nextCursor);
    }
  }, [loadingMore, hasMore, nextCursor, fetchEvents]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchEvents(null, true);
  }, [fetchEvents]);

  // Render item
  const renderItem = useCallback(({ item }: { item: EventListItem }) => {
    return <EventCard event={item} />;
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
          Nessun evento trovato
        </Text>
      </View>
    );
  }, [loading]);

  return (
    <View className="flex-1">


      {/* List */}
      {loading && events.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlashList
          data={events}
          renderItem={({ item }) => (
            <View className="flex-1 p-1">
              <EventCard event={item} variant="grid" />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          estimatedItemSize={220}
          contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 16 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.8}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}
