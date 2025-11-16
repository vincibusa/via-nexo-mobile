import React, { useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import * as Location from 'expo-location';
import { useFiltersStore } from '../../../lib/stores/filters-store';
import { eventsListService, type EventListItem } from '../../../lib/services/events-list';
import { EventCard } from '../../../components/events/event-card';
import { SearchBar } from '../../../components/common/search-bar';
import { FilterPills, type FilterPill } from '../../../components/common/filter-pills';
import { Text } from '../../../components/ui/text';
import { useColorScheme } from 'nativewind';
import { cn } from '../../../lib/utils';
import { API_CONFIG } from '../../../lib/config';

const TIME_FILTERS: FilterPill[] = [
  { id: 'upcoming', label: 'In arrivo', value: 'upcoming' },
  { id: 'today', label: 'Oggi', value: 'today' },
  { id: 'this_week', label: 'Questa settimana', value: 'this_week' },
  { id: 'this_weekend', label: 'Weekend', value: 'this_weekend' },
  { id: 'this_month', label: 'Questo mese', value: 'this_month' },
];

export default function EventsScreen() {
  const { eventsFilters, setEventsFilters } = useFiltersStore();
  const { colorScheme } = useColorScheme();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeId, setSelectedTimeId] = useState('upcoming');

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
          // Fallback to default location
          userLocation = API_CONFIG.DEFAULT_LOCATION;
        }
      } else {
        // Fallback to default location if permission denied
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
        search: searchQuery || undefined,
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
    [eventsFilters, searchQuery, location]
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
  }, [searchQuery]);

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

  // Handle time filter
  const handleTimeSelect = useCallback(
    (pill: FilterPill) => {
      console.log('Time filter selected:', pill);
      setSelectedTimeId(pill.id);
      setEventsFilters({ time_filter: pill.value });
      // Reset data when filter changes
      setEvents([]);
      setNextCursor(null);
      setHasMore(true);
    },
    [setEventsFilters]
  );

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
    <SafeAreaView edges={['top']} className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')}>
      {/* Header */}
      <View className="pb-3">
        <Text variant="h2" className="px-4 mb-4 border-0">
          Eventi
        </Text>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Cerca un evento..." />
        <FilterPills filters={TIME_FILTERS} selectedId={selectedTimeId} onSelect={handleTimeSelect} />
      </View>

      {/* List */}
      {loading && events.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlashList
          data={events}
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
