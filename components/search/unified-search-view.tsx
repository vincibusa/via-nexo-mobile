import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from '../ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { PlaceCard } from '../places/place-card';
import { EventCard } from '../events/event-card';
import { Clock, X, Search, Users, MapPin, Calendar } from 'lucide-react-native';
import { cn } from '../../lib/utils';
import { useRouter } from 'expo-router';
import { TrendingSearches, type TrendingSearch } from './trending-searches';
import { CategoryChips, type Category } from './category-chips';
import { SearchResultsSkeleton } from './search-skeleton';

interface User {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  isFollowing: boolean;
}

interface Place {
  id: string;
  name: string;
  category: string;
  cover_image?: string;
  address: string;
  city: string;
  distance_km?: number;
  verified: boolean;
}

interface EventListItem {
  id: string;
  title: string;
  event_type: string;
  start_datetime: string;
  cover_image?: string;
  place?: { name: string; city: string };
  distance_km?: number;
}

type PlaceWithExtras = Place & { distance_km?: number; events_count?: number };

interface UnifiedSearchState {
  users: { data: User[]; loading: boolean; error: string | null };
  places: { data: PlaceWithExtras[]; loading: boolean; error: string | null };
  events: { data: EventListItem[]; loading: boolean; error: string | null };
}

type FilterTab = 'all' | 'users' | 'places' | 'events';

const FILTER_TABS: { id: FilterTab; label: string; icon: typeof Search }[] = [
  { id: 'all', label: 'Tutti', icon: Search },
  { id: 'users', label: 'Utenti', icon: Users },
  { id: 'places', label: 'Luoghi', icon: MapPin },
  { id: 'events', label: 'Eventi', icon: Calendar },
];

interface UnifiedSearchViewProps {
  query: string;
  state: UnifiedSearchState;
  searchPerformed: boolean;
  recentSearches: string[];
  onSelectRecentSearch: (query: string) => void;
  onDeleteRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
  onRefresh: () => void;
  onFollowUser: (userId: string) => void;
  themeColors: any;
  refreshing: boolean;
  // New props
  trending: TrendingSearch[];
  categories: Category[];
  trendingLoading: boolean;
  categoriesLoading: boolean;
  onTrendingSelect: (query: string) => void;
  onCategorySelect: (category: Category) => void;
}

export function UnifiedSearchView({
  query,
  state,
  searchPerformed,
  recentSearches,
  onSelectRecentSearch,
  onDeleteRecentSearch,
  onClearRecentSearches,
  onRefresh,
  onFollowUser,
  themeColors,
  refreshing,
  trending,
  categories,
  trendingLoading,
  categoriesLoading,
  onTrendingSelect,
  onCategorySelect,
}: UnifiedSearchViewProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const allLoading = state.users.loading && state.places.loading && state.events.loading;
  const hasUsers = state.users.data.length > 0;
  const hasPlaces = state.places.data.length > 0;
  const hasEvents = state.events.data.length > 0;
  const hasResults = hasUsers || hasPlaces || hasEvents;

  // Filter results based on active tab
  const showUsers = activeFilter === 'all' || activeFilter === 'users';
  const showPlaces = activeFilter === 'all' || activeFilter === 'places';
  const showEvents = activeFilter === 'all' || activeFilter === 'events';

  // No search query - show trending, categories, and recent searches
  if (!query.trim()) {
    return (
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.foreground} />}
      >
        {/* Trending Searches */}
        <TrendingSearches
          data={trending}
          onSelect={onTrendingSelect}
          isLoading={trendingLoading}
        />

        {/* Category Chips */}
        <CategoryChips
          categories={categories}
          onSelect={onCategorySelect}
          isLoading={categoriesLoading}
        />

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View className="px-4 py-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-semibold">Ricerche Recenti</Text>
              <TouchableOpacity onPress={onClearRecentSearches}>
                <Text className="text-xs text-primary">Cancella tutto</Text>
              </TouchableOpacity>
            </View>
            <View className="gap-2">
              {recentSearches.map((recentQuery, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between bg-muted/30 rounded-xl px-4 py-3"
                >
                  <TouchableOpacity
                    onPress={() => onSelectRecentSearch(recentQuery)}
                    className="flex-1 flex-row items-center gap-3"
                  >
                    <Clock size={16} color={themeColors.mutedForeground} />
                    <Text className="text-base">{recentQuery}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDeleteRecentSearch(recentQuery)} className="p-2 -mr-2">
                    <X size={16} color={themeColors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty state when no recent searches */}
        {recentSearches.length === 0 && !trendingLoading && !categoriesLoading && (
          <View className="px-4 py-8">
            <Text className="text-center text-muted-foreground">
              Inizia a cercare luoghi, eventi o persone
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // Show skeleton while loading
  if (allLoading && searchPerformed) {
    return <SearchResultsSkeleton />;
  }

  // Show results with filter tabs
  return (
    <View className="flex-1">
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}
        style={{ flexGrow: 0 }}
        className="border-b border-border/30"
      >
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          const count = tab.id === 'users' ? state.users.data.length
            : tab.id === 'places' ? state.places.data.length
            : tab.id === 'events' ? state.events.data.length
            : state.users.data.length + state.places.data.length + state.events.data.length;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveFilter(tab.id)}
              className={cn(
                'flex-row items-center gap-2 px-4 py-2 rounded-full mr-2',
                isActive ? 'bg-foreground' : 'bg-muted/50'
              )}
            >
              <Icon size={14} color={isActive ? themeColors.background : themeColors.foreground} />
              <Text className={cn(
                'text-sm font-medium',
                isActive ? 'text-background' : 'text-foreground'
              )}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View className={cn(
                  'px-1.5 py-0.5 rounded-full min-w-5 items-center',
                  isActive ? 'bg-background/20' : 'bg-foreground/10'
                )}>
                  <Text className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-background' : 'text-foreground'
                  )}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.foreground}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* USERS SECTION */}
        {showUsers && hasUsers && (
          <View className="mb-4">
            {activeFilter === 'all' && (
              <View className="px-4 py-3 border-b border-border/30">
                <Text className="text-base font-semibold">Utenti</Text>
              </View>
            )}
            {state.users.data.slice(0, activeFilter === 'all' ? 3 : undefined).map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => router.push(`/(app)/profile/${user.id}` as any)}
                className="flex-row items-center justify-between border-b border-border/30 px-4 py-3"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <Avatar className="h-12 w-12" alt={user.display_name}>
                    <AvatarImage source={{ uri: user.avatar_url || '' }} />
                    <AvatarFallback>
                      <Text className="text-sm font-semibold">
                        {user.display_name.charAt(0).toUpperCase()}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                  <View className="flex-1">
                    <Text className="font-semibold">{user.display_name}</Text>
                    <Text className="text-xs text-muted-foreground">{user.email}</Text>
                    {user.bio && (
                      <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
                        {user.bio}
                      </Text>
                    )}
                  </View>
                </View>
                <Button
                  variant={user.isFollowing ? 'outline' : 'default'}
                  size="sm"
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onFollowUser(user.id);
                  }}
                  className="px-4"
                >
                  <Text className={cn('text-sm font-medium', user.isFollowing ? '' : 'text-primary-foreground')}>
                    {user.isFollowing ? 'Seguendo' : 'Segui'}
                  </Text>
                </Button>
              </TouchableOpacity>
            ))}
            {activeFilter === 'all' && state.users.data.length > 3 && (
              <TouchableOpacity
                onPress={() => setActiveFilter('users')}
                className="px-4 py-3"
              >
                <Text className="text-sm text-primary font-medium">
                  Vedi tutti gli utenti ({state.users.data.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PLACES SECTION */}
        {showPlaces && hasPlaces && (
          <View className="mb-4">
            {activeFilter === 'all' && (
              <View className="px-4 py-3 border-b border-border/30">
                <Text className="text-base font-semibold">Luoghi</Text>
              </View>
            )}
            <View className="px-2 pt-2">
              <View className="flex-row flex-wrap">
                {state.places.data.slice(0, activeFilter === 'all' ? 4 : undefined).map((place) => (
                  <View key={place.id} className="w-1/2 p-1">
                    <PlaceCard place={place} variant="grid" />
                  </View>
                ))}
              </View>
            </View>
            {activeFilter === 'all' && state.places.data.length > 4 && (
              <TouchableOpacity
                onPress={() => setActiveFilter('places')}
                className="px-4 py-3"
              >
                <Text className="text-sm text-primary font-medium">
                  Vedi tutti i luoghi ({state.places.data.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* EVENTS SECTION */}
        {showEvents && hasEvents && (
          <View className="mb-4">
            {activeFilter === 'all' && (
              <View className="px-4 py-3 border-b border-border/30">
                <Text className="text-base font-semibold">Eventi</Text>
              </View>
            )}
            <View className="px-2 pt-2">
              <View className="flex-row flex-wrap">
                {state.events.data.slice(0, activeFilter === 'all' ? 4 : undefined).map((event) => (
                  <View key={event.id} className="w-1/2 p-1">
                    <EventCard event={event} variant="grid" />
                  </View>
                ))}
              </View>
            </View>
            {activeFilter === 'all' && state.events.data.length > 4 && (
              <TouchableOpacity
                onPress={() => setActiveFilter('events')}
                className="px-4 py-3"
              >
                <Text className="text-sm text-primary font-medium">
                  Vedi tutti gli eventi ({state.events.data.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* NO RESULTS */}
        {!hasResults && searchPerformed && !allLoading && (
          <View className="flex-1 items-center justify-center px-6 py-12">
            <View className="items-center gap-3">
              <Search size={48} color={themeColors.mutedForeground} />
              <Text className="text-center text-lg font-semibold">
                Nessun risultato
              </Text>
              <Text className="text-center text-muted-foreground">
                Nessun risultato trovato per "{query}"
              </Text>
            </View>
          </View>
        )}

        {/* Bottom padding */}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
