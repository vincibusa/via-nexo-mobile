import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { API_CONFIG } from '../../../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatAITab } from '../../../components/search/chatai-tab';
import type { TrendingSearch } from '../../../components/search/trending-searches';
import type { Category } from '../../../components/search/category-chips';
import { GlassSurface } from '../../../components/glass';
import { THEME } from '../../../lib/theme';
import type { Place } from '../../../lib/types/suggestion';
import type { EventListItem } from '../../../lib/services/events-list';
import { placesListService } from '../../../lib/services/places-list';
import { eventsListService } from '../../../lib/services/events-list';
import * as Location from 'expo-location';
import { UnifiedSearchView } from '../../../components/search/unified-search-view';
import { useColorScheme } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type PlaceWithExtras = Place & { distance_km?: number; events_count?: number };

interface User {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  isFollowing: boolean;
}

interface SearchTab {
  id: 'unified' | 'chatai';
  label: string;
  hasSearch: boolean;
}

const SEARCH_TABS: SearchTab[] = [
  { id: 'unified', label: 'Cerca', hasSearch: true },
  { id: 'chatai', label: 'Chat AI', hasSearch: false },
];

interface UnifiedSearchState {
  users: { data: User[]; loading: boolean; error: string | null };
  places: { data: PlaceWithExtras[]; loading: boolean; error: string | null };
  events: { data: EventListItem[]; loading: boolean; error: string | null };
}

const RECENT_SEARCHES_KEY = 'recent_user_searches';
const MAX_RECENT_SEARCHES = 10;

export default function SearchScreen() {
  const { colorScheme } = useColorScheme();
  const searchInputRef = useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'unified' | 'chatai'>('unified');
  const [unifiedState, setUnifiedState] = useState<UnifiedSearchState>({
    users: { data: [], loading: false, error: null },
    places: { data: [], loading: false, error: null },
    events: { data: [], loading: false, error: null },
  });
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Trending and Categories
  const [trending, setTrending] = useState<TrendingSearch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Animation values
  const isDark = colorScheme === 'dark';
  const themeMode = isDark ? 'dark' : 'light';
  const borderOpacity = useSharedValue(0);
  const bgOpacity = useSharedValue(isDark ? 0.3 : 0.12);

  const themeColors = THEME[themeMode];
  const searchSurfaceStyle = isDark
    ? styles.searchSurface
    : { ...styles.searchSurface, ...styles.searchSurfaceLight };
  const tabsSurfaceStyle = isDark
    ? styles.tabsSurface
    : { ...styles.tabsSurface, ...styles.tabsSurfaceLight };
  const borderRgb = isDark ? '148, 163, 184' : '30, 41, 59';
  const bgRgb = isDark ? '71, 85, 105' : '148, 163, 184';

  // Animated styles for search bar
  const animatedSearchBarStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(${borderRgb}, ${borderOpacity.value})`,
    backgroundColor: `rgba(${bgRgb}, ${bgOpacity.value})`,
  }));

  // Handle focus animation
  useEffect(() => {
    if (isFocused || searchQuery.length > 0) {
      borderOpacity.value = withTiming(isDark ? 0.38 : 0.22, { duration: 200, easing: Easing.out(Easing.ease) });
      bgOpacity.value = withTiming(isDark ? 0.4 : 0.18, { duration: 200, easing: Easing.out(Easing.ease) });
    } else {
      borderOpacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
      bgOpacity.value = withTiming(isDark ? 0.3 : 0.12, { duration: 200, easing: Easing.out(Easing.ease) });
    }
  }, [isDark, isFocused, searchQuery, borderOpacity, bgOpacity]);

  // Load trending and categories on mount
  useEffect(() => {
    fetchTrending();
    fetchCategories();
  }, []);

  const fetchTrending = async () => {
    try {
      setTrendingLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH_TRENDING}`);
      if (response.ok) {
        const data = (await response.json()) as { trending?: TrendingSearch[] };
        setTrending(data.trending || []);
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setTrendingLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH_CATEGORIES}`);
      if (response.ok) {
        const data = (await response.json()) as { categories?: Category[] };
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load recent searches when component mounts or unified tab is focused
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'unified') {
        loadRecentSearches();
      }
    }, [activeTab])
  );

  // Get user location on mount
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

  // Load recent searches from storage
  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  // Save search to recent searches
  const saveRecentSearch = async (query: string) => {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      const updated = [
        trimmedQuery,
        ...recentSearches.filter(s => s !== trimmedQuery),
      ].slice(0, MAX_RECENT_SEARCHES);

      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  // Delete a recent search
  const deleteRecentSearch = async (query: string) => {
    try {
      const updated = recentSearches.filter(s => s !== query);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting recent search:', error);
    }
  };

  // Clear all recent searches
  const clearAllRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  // Helper: Search users
  const searchUsers = async (query: string): Promise<User[]> => {
    const url = `${API_CONFIG.BASE_URL}/api/social/profiles/search?q=${encodeURIComponent(query)}&limit=20`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`User search failed: ${response.status}`);

    const data = await response.json() as Array<{
      id: string;
      display_name?: string;
      email: string;
      avatar_url?: string;
      bio?: string;
      isFollowing?: boolean;
    }>;

    return data.map((u) => ({
      id: u.id,
      display_name: u.display_name || u.email?.split('@')[0] || 'Utente',
      email: u.email,
      avatar_url: u.avatar_url,
      bio: u.bio,
      isFollowing: u.isFollowing || false,
    }));
  };

  // Helper: Search places
  const searchPlaces = async (query: string): Promise<PlaceWithExtras[]> => {
    const filters = { search: query };
    const { data, error } = await placesListService.getPlaces(
      filters,
      location || undefined,
      null
    );
    if (error) throw new Error(error);
    return data?.data || [];
  };

  // Helper: Search events
  const searchEvents = async (query: string): Promise<EventListItem[]> => {
    const filters = { search: query, time_filter: 'upcoming' as const };
    const { data, error } = await eventsListService.getEvents(
      filters,
      location || undefined,
      null
    );
    if (error) throw new Error(error);
    return data?.data || [];
  };

  // Main unified search function
  const performUnifiedSearch = async (query: string) => {
    if (!query.trim()) {
      setUnifiedState({
        users: { data: [], loading: false, error: null },
        places: { data: [], loading: false, error: null },
        events: { data: [], loading: false, error: null },
      });
      setSearchPerformed(false);
      return;
    }

    setSearchPerformed(true);

    // Set all to loading
    setUnifiedState(prev => ({
      users: { ...prev.users, loading: true, error: null },
      places: { ...prev.places, loading: true, error: null },
      events: { ...prev.events, loading: true, error: null },
    }));

    // Execute 3 API calls in parallel
    const [usersResult, placesResult, eventsResult] = await Promise.allSettled([
      searchUsers(query),
      searchPlaces(query),
      searchEvents(query),
    ]);

    // Update users state
    if (usersResult.status === 'fulfilled') {
      setUnifiedState(prev => ({
        ...prev,
        users: { data: usersResult.value, loading: false, error: null },
      }));
    } else {
      setUnifiedState(prev => ({
        ...prev,
        users: { data: [], loading: false, error: 'Errore nel caricamento utenti' },
      }));
    }

    // Update places state
    if (placesResult.status === 'fulfilled') {
      setUnifiedState(prev => ({
        ...prev,
        places: { data: placesResult.value, loading: false, error: null },
      }));
    } else {
      setUnifiedState(prev => ({
        ...prev,
        places: { data: [], loading: false, error: 'Errore nel caricamento luoghi' },
      }));
    }

    // Update events state
    if (eventsResult.status === 'fulfilled') {
      setUnifiedState(prev => ({
        ...prev,
        events: { data: eventsResult.value, loading: false, error: null },
      }));
    } else {
      setUnifiedState(prev => ({
        ...prev,
        events: { data: [], loading: false, error: 'Errore nel caricamento eventi' },
      }));
    }

    // Save to recent searches
    await saveRecentSearch(query);
  };

  // Debounced unified search
  useEffect(() => {
    if (activeTab !== 'unified') return;

    const timeoutId = setTimeout(() => {
      performUnifiedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab, location]);

  const handleUnifiedRefresh = async () => {
    setRefreshing(true);

    if (searchQuery.trim()) {
      await performUnifiedSearch(searchQuery);
    } else {
      await Promise.all([loadRecentSearches(), fetchTrending(), fetchCategories()]);
    }

    setRefreshing(false);
  };

  const handleFollow = async (userId: string) => {
    try {
      const user = unifiedState.users.data.find((u) => u.id === userId);
      if (!user) return;

      if (user.isFollowing) {
        // Unfollow
        const url = `${API_CONFIG.BASE_URL}/api/social/follows?followingId=${userId}`;
        const response = await fetch(url, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to unfollow');
      } else {
        // Follow
        const url = `${API_CONFIG.BASE_URL}/api/social/follows`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followingId: userId }),
        });

        if (!response.ok) throw new Error('Failed to follow');
      }

      // Update local state
      setUnifiedState((prev) => ({
        ...prev,
        users: {
          ...prev.users,
          data: prev.users.data.map((u) =>
            u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
          ),
        },
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    setSearchQuery(category.name);
    searchInputRef.current?.focus();
  };

  // Handle trending selection
  const handleTrendingSelect = (query: string) => {
    setSearchQuery(query);
    searchInputRef.current?.focus();
  };

  // Handle cancel button
  const handleCancel = () => {
    setSearchQuery('');
    setIsFocused(false);
    searchInputRef.current?.blur();
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top']}
    >
      <View className="flex-1 flex-col">
        {/* Header with Search Input */}
        <View className="px-4 py-3">
          {SEARCH_TABS[SEARCH_TABS.findIndex(t => t.id === activeTab)]?.hasSearch && (
            <View className="flex-row items-center gap-3">
              <GlassSurface
                variant="card"
                intensity={isDark ? 'regular' : 'light'}
                tint={isDark ? 'extraLight' : 'light'}
                style={searchSurfaceStyle}
              >
                <Animated.View
                  style={animatedSearchBarStyle}
                  className="flex-1 flex-row items-center gap-2 rounded-full px-4 py-3 border"
                >
                  <Search size={18} color={themeColors.mutedForeground} />
                  <TextInput
                    ref={searchInputRef}
                    placeholder="Cerca luoghi, eventi, persone..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholderTextColor={themeColors.mutedForeground}
                    className="flex-1 py-0 text-base text-foreground leading-5"
                    autoCapitalize="none"
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <X size={18} color={themeColors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </GlassSurface>
              {(isFocused || searchQuery.length > 0) && (
                <TouchableOpacity onPress={handleCancel}>
                  <Text className="text-base font-medium text-primary">Annulla</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View className="px-4 pb-1">
          <GlassSurface
            variant="card"
            intensity={isDark ? 'regular' : 'light'}
            tint={isDark ? 'extraLight' : 'light'}
            style={tabsSurfaceStyle}
          >
            <View className="flex-row">
              {SEARCH_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 items-center justify-center py-3 rounded-full',
                    activeTab === tab.id ? 'bg-foreground/10' : 'bg-transparent'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-semibold',
                      activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassSurface>
        </View>

        {/* Content */}
        {activeTab === 'unified' ? (
          <UnifiedSearchView
            query={searchQuery}
            state={unifiedState}
            searchPerformed={searchPerformed}
            recentSearches={recentSearches}
            onSelectRecentSearch={setSearchQuery}
            onDeleteRecentSearch={deleteRecentSearch}
            onClearRecentSearches={clearAllRecentSearches}
            onRefresh={handleUnifiedRefresh}
            onFollowUser={handleFollow}
            themeColors={themeColors}
            refreshing={refreshing}
            trending={trending}
            categories={categories}
            trendingLoading={trendingLoading}
            categoriesLoading={categoriesLoading}
            onTrendingSelect={handleTrendingSelect}
            onCategorySelect={handleCategorySelect}
            isDark={isDark}
          />
        ) : (
          <ChatAITab />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchSurface: {
    flex: 1,
    borderRadius: 999,
    padding: 4,
    borderWidth: 0,
    borderColor: 'rgba(255,255,255,0.12)',
    height: 52,
  },
  searchSurfaceLight: {
    borderColor: 'rgba(15,23,42,0.08)',
  },
  tabsSurface: {
    borderRadius: 999,
    padding: 4,
    borderWidth: 0,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tabsSurfaceLight: {
    borderColor: 'rgba(15,23,42,0.08)',
  },
});
