import React from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text } from '../ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { PlaceCard } from '../places/place-card';
import { EventCard } from '../events/event-card';
import { Clock, X } from 'lucide-react-native';
import { cn } from '../../lib/utils';
import { useRouter } from 'expo-router';

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
}: UnifiedSearchViewProps) {
  const router = useRouter();

  const allLoading = state.users.loading && state.places.loading && state.events.loading;
  const hasResults = state.users.data.length > 0 || state.places.data.length > 0 || state.events.data.length > 0;

  // No search query - show recent searches
  if (!query.trim()) {
    return (
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {recentSearches.length > 0 ? (
          <View className="px-4 py-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold">Ricerche Recenti</Text>
              <TouchableOpacity onPress={onClearRecentSearches}>
                <Text className="text-xs text-primary">Cancella</Text>
              </TouchableOpacity>
            </View>
            <View className="gap-2">
              {recentSearches.map((recentQuery, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between bg-muted/50 rounded-lg px-4 py-3"
                >
                  <TouchableOpacity
                    onPress={() => onSelectRecentSearch(recentQuery)}
                    className="flex-1 flex-row items-center gap-3"
                  >
                    <Clock size={16} color={themeColors.mutedForeground} />
                    <Text className="text-base">{recentQuery}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDeleteRecentSearch(recentQuery)} className="p-2">
                    <X size={16} color={themeColors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="px-4 py-6">
            <Text className="text-center text-muted-foreground mb-4">Nessuna ricerca recente</Text>
            <Text className="text-center text-xs text-muted-foreground">
              Le tue ricerche appariranno qui
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // Loading all
  if (allLoading && !searchPerformed) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={themeColors.foreground} />
      </View>
    );
  }

  // Show results in sections
  return (
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
      {state.users.data.length > 0 && (
        <View className="mb-6">
          <View className="px-4 py-3 border-b border-border/50">
            <Text className="text-lg font-semibold">Utenti</Text>
          </View>
          {state.users.data.map((user) => (
            <TouchableOpacity
              key={user.id}
              onPress={() => router.push(`/(app)/profile/${user.id}` as any)}
              className="flex-row items-center justify-between border-b border-border px-4 py-3"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <Avatar className="h-12 w-12" alt={''}>
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
                    <Text className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {user.bio}
                    </Text>
                  )}
                </View>
              </View>
              <Button
                variant={user.isFollowing ? 'outline' : 'default'}
                onPress={() => onFollowUser(user.id)}
                className="px-4"
              >
                <Text className={cn('font-medium', user.isFollowing ? '' : 'text-primary-foreground')}>
                  {user.isFollowing ? 'Seguendo' : 'Segui'}
                </Text>
              </Button>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* PLACES SECTION */}
      {state.places.data.length > 0 && (
        <View className="mb-6">
          <View className="px-4 py-3 border-b border-border/50">
            <Text className="text-lg font-semibold">Luoghi</Text>
          </View>
          <View className="px-2 pt-2">
            <View className="flex-row flex-wrap">
              {state.places.data.slice(0, 6).map((place) => (
                <View key={place.id} className="w-1/2 p-1">
                  <PlaceCard place={place} variant="grid" />
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* EVENTS SECTION */}
      {state.events.data.length > 0 && (
        <View className="mb-6">
          <View className="px-4 py-3 border-b border-border/50">
            <Text className="text-lg font-semibold">Eventi</Text>
          </View>
          <View className="px-2 pt-2">
            <View className="flex-row flex-wrap">
              {state.events.data.slice(0, 6).map((event) => (
                <View key={event.id} className="w-1/2 p-1">
                  <EventCard event={event} variant="grid" />
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* NO RESULTS */}
      {!hasResults && searchPerformed && !allLoading && (
        <View className="flex-1 items-center justify-center px-6 py-12">
          <Text className="text-center text-muted-foreground">
            Nessun risultato trovato{'\n'}per "{query}"
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
