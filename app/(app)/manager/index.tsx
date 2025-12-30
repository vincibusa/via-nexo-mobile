/**
 * Manager Events List Screen
 * Displays all events owned by the current manager
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Plus } from 'lucide-react-native';
import { managerService } from '../../../lib/services/manager';
import { ManagerEventCard } from '../../../components/manager/manager-event-card';
import type { ManagerEvent } from '../../../lib/types/manager';

export default function ManagerEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<ManagerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const filters = [
    { id: 'all', label: 'Tutti' },
    { id: 'published', label: 'Pubblicati' },
    { id: 'upcoming', label: 'In arrivo' },
    { id: 'past', label: 'Passati' },
  ];

  // Load events
  const loadEvents = async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }

      const { data, error } = await managerService.getMyEvents(
        pageNum,
        20,
        selectedFilter !== 'all' ? selectedFilter : undefined,
        searchQuery || undefined
      );

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      if (data) {
        if (append) {
          setEvents((prev) => [...prev, ...data.events]);
        } else {
          setEvents(data.events);
        }
        setHasMore(data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Load events error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [selectedFilter, searchQuery]);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadEvents(1);
  };

  // Load more handler
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadEvents(page + 1, true);
    }
  };

  // Render filter pill
  const renderFilterPill = (filter: { id: string; label: string }) => (
    <TouchableOpacity
      key={filter.id}
      onPress={() => setSelectedFilter(filter.id)}
      className={`px-4 py-2 rounded-full mr-2 ${
        selectedFilter === filter.id
          ? 'bg-primary'
          : 'bg-muted'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          selectedFilter === filter.id
            ? 'text-primary-foreground'
            : 'text-muted-foreground'
        }`}
      >
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-4 py-12">
      <Text className="text-lg font-semibold text-foreground mb-2">
        Nessun evento
      </Text>
      <Text className="text-muted-foreground text-center mb-6">
        {searchQuery
          ? 'Nessun evento corrisponde alla ricerca'
          : 'Crea il tuo primo evento per iniziare'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          onPress={() => router.push('/(app)/manager/events/create' as any)}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-primary-foreground font-semibold">
            Crea Evento
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render footer loading
  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Search Bar */}
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row items-center bg-muted rounded-lg px-3 py-2">
          <Search size={20} className="text-muted-foreground mr-2" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cerca eventi..."
            placeholderTextColor="#666"
            className="flex-1 text-foreground"
          />
        </View>
      </View>

      {/* Filter Pills */}
      <View className="px-4 pb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          renderItem={({ item }) => renderFilterPill(item)}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* Events List */}
      {loading && page === 1 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={({ item }) => <ManagerEventCard event={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#fff"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* FAB - Create Event */}
      <TouchableOpacity
        onPress={() => router.push('/(app)/manager/events/create' as any)}
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg active:opacity-70"
        style={{
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
