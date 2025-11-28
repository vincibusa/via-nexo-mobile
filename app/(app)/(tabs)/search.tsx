import { View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Text } from '../../../components/ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../lib/contexts/auth';
import { cn } from '../../../lib/utils';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Clock } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_CONFIG } from '../../../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacesTab } from '../../../components/search/places-tab';
import { EventsTab } from '../../../components/search/events-tab';
import { ChatAITab } from '../../../components/search/chatai-tab';
import { THEME } from '../../../lib/theme';
import { useSettings } from '../../../lib/contexts/settings';

interface User {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  isFollowing: boolean;
}

interface SearchTab {
  id: 'users' | 'places' | 'events' | 'chatai';
  label: string;
  hasSearch: boolean;
}

const SEARCH_TABS: SearchTab[] = [
  { id: 'users', label: 'Utenti', hasSearch: true },
  { id: 'places', label: 'Luoghi', hasSearch: true },
  { id: 'events', label: 'Eventi', hasSearch: true },

  { id: 'chatai', label: 'Chat AI', hasSearch: false },
];

const RECENT_SEARCHES_KEY = 'recent_user_searches';
const MAX_RECENT_SEARCHES = 10;

export default function SearchScreen() {
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'places' | 'events' | 'chatai'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  // Load recent searches when component mounts or users tab is focused
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'users') {
        loadRecentSearches();
      }
    }, [activeTab])
  );

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

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setUsers([]);
        setSearchPerformed(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab]);

  const performSearch = async () => {
    setIsLoading(true);
    setSearchPerformed(true);
    try {
      const url = `${API_CONFIG.BASE_URL}/api/social/profiles/search?q=${encodeURIComponent(searchQuery)}&limit=20`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json() as Array<{
        id: string;
        display_name?: string;
        email: string;
        avatar_url?: string;
        bio?: string;
        isFollowing?: boolean;
      }>;
      setUsers(
        data.map((u) => ({
          id: u.id,
          display_name: u.display_name || u.email?.split('@')[0] || 'Utente',
          email: u.email,
          avatar_url: u.avatar_url,
          bio: u.bio,
          isFollowing: u.isFollowing || false,
        }))
      );

      // Save the search query to recent searches
      await saveRecentSearch(searchQuery);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'users') {
      if (searchQuery.trim()) {
        // Ricarica la ricerca se c'è una query
        await performSearch();
      } else {
        // Ricarica le ricerche recenti se non c'è query
        await loadRecentSearches();
      }
    } else if (activeTab === 'places' || activeTab === 'events') {
      // These tabs handle their own refresh through PlacesTab and EventsTab components
      // They already have RefreshControl implemented
    }
    setRefreshing(false);
  };

  const handleFollow = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
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
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/profile/${item.id}` as any)}
      className="flex-row items-center justify-between border-b border-border px-4 py-3"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Avatar className="h-12 w-12" alt={''}>
          <AvatarImage source={{ uri: item.avatar_url || '' }} />
          <AvatarFallback>
            <Text className="text-sm font-semibold">
              {item.display_name.charAt(0).toUpperCase()}
            </Text>
          </AvatarFallback>
        </Avatar>
        <View className="flex-1">
          <Text className="font-semibold">{item.display_name}</Text>
          <Text className="text-xs text-muted-foreground">{item.email}</Text>
          {item.bio && (
            <Text className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {item.bio}
            </Text>
          )}
        </View>
      </View>
      <Button
        variant={item.isFollowing ? 'outline' : 'default'}
        onPress={() => handleFollow(item.id)}
        className="px-4"
      >
        <Text className={cn('font-medium', item.isFollowing ? '' : 'text-primary-foreground')}>
          {item.isFollowing ? 'Seguendo' : 'Segui'}
        </Text>
      </Button>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')}
      edges={['top']}
    >
      <View className="flex-1 flex-col">
        {/* Header */}
        {/* Header */}
        <View className="px-4 py-2">
          {/* Search Input */}
          {SEARCH_TABS[SEARCH_TABS.findIndex(t => t.id === activeTab)]?.hasSearch && (
            <View className="flex-row items-center gap-3">
              <View className="flex-1 flex-row items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                <Search size={18} color={themeColors.mutedForeground} />
                <TextInput
                  placeholder="Cerca"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#999"
                  className="flex-1 py-0 text-base text-foreground leading-5"
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color={themeColors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
              {/* Cancel Button - visible when focused or has text (simplified for now to always show if query exists, or we could add focus state) */}
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text className="text-base font-medium">Annulla</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View className="flex-row border-b border-border/50">
          {SEARCH_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 items-center justify-center py-3 border-b-2',
                activeTab === tab.id
                  ? 'border-foreground'
                  : 'border-transparent'
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

        {/* Content */}
        {activeTab === 'users' ? (
          isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={themeColors.foreground} />
            </View>
          ) : searchQuery.trim() ? (
            <>
              {users.length > 0 ? (
                <FlatList
                  data={users}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => item.id}
                  className="flex-1"
                  refreshControl={
                    <RefreshControl 
                      refreshing={refreshing} 
                      onRefresh={onRefresh}
                      tintColor={themeColors.foreground}
                      colors={[themeColors.primary]}
                    />
                  }
                />
              ) : (
                <View className="flex-1 items-center justify-center px-6">
                  <Text className="text-center text-muted-foreground">
                    Nessun utente trovato{'\n'}con "{searchQuery}"
                  </Text>
                </View>
              )}
            </>
          ) : (
            <ScrollView 
              className="flex-1" 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {/* Recent Searches Section */}
              {recentSearches.length > 0 ? (
                <View className="px-4 py-6">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-semibold">
                      Ricerche Recenti
                    </Text>
                    <TouchableOpacity onPress={clearAllRecentSearches}>
                      <Text className="text-xs text-primary">Cancella</Text>
                    </TouchableOpacity>
                  </View>
                  <View className="gap-2">
                    {recentSearches.map((query, index) => (
                      <View
                        key={index}
                        className="flex-row items-center justify-between bg-muted/50 rounded-lg px-4 py-3"
                      >
                        <TouchableOpacity
                          onPress={() => setSearchQuery(query)}
                          className="flex-1 flex-row items-center gap-3"
                        >
                          <Clock size={16} color={themeColors.mutedForeground} />
                          <Text className="text-base">{query}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deleteRecentSearch(query)}
                          className="p-2"
                        >
                          <X size={16} color={themeColors.mutedForeground} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View className="px-4 py-6">
                  <Text className="text-center text-muted-foreground mb-4">
                    Nessuna ricerca recente
                  </Text>
                  <Text className="text-center text-xs text-muted-foreground">
                    Le tue ricerche appariranno qui
                  </Text>
                </View>
              )}
            </ScrollView>
          )
        ) : activeTab === 'places' ? (
          <PlacesTab query={searchQuery} />
        ) : activeTab === 'events' ? (
          <EventsTab query={searchQuery} />
        ) : (
          <ChatAITab />
        )}
      </View>
    </SafeAreaView>
  );
}
