import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Text } from '../../../components/ui/text';
import { DiscoveryCard } from '../../../components/discovery/discovery-card';
import { discoveryService } from '../../../lib/services/discovery';
import type { DiscoveryItem } from '../../../lib/types/discovery';
import { useAuth } from '../../../lib/contexts/auth';
import { THEME } from '../../../lib/theme';
import { useFavorites } from '../../../lib/contexts/favorites';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DiscoveryScreen() {
  const { session } = useAuth();
  const { addFavorite, removeFavorite, isFavorite, getFavoriteId } = useFavorites();
  const insets = useSafeAreaInsets();
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const viewedItemsRef = useRef<Set<string>>(new Set());
  const themeColors = THEME.dark;
  const isFocused = useIsFocused();

  // Full screen height for immersive video experience
  const availableHeight = SCREEN_HEIGHT;

  // Configure audio to play even in silent mode (iOS)
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });
  }, []);

  useEffect(() => {
    loadDiscoveryFeed();
  }, []);

  const loadDiscoveryFeed = async () => {
    try {
      setLoading(true);
      const { data, error } = await discoveryService.getDiscoveryFeed(50, 0);
      if (error) {
        console.error('Error loading discovery feed:', error);
      } else if (data) {
        setDiscoveryItems(data);
        // Track viewed items for view count increment
        viewedItemsRef.current.clear();
      }
    } catch (error) {
      console.error('Error loading discovery feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDiscoveryFeed();
  }, []);

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newActiveIndex = viewableItems[0].index ?? 0;
      setActiveIndex(newActiveIndex);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleLike = async (item: DiscoveryItem) => {
    if (!session?.accessToken) return;

    try {
      const { data, error } = await discoveryService.toggleLike(
        item.id,
        session.accessToken
      );

      if (!error && data) {
        setDiscoveryItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  is_liked: data.is_liked,
                  likes_count: data.likes_count,
                }
              : i
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleView = useCallback(
    async (item: DiscoveryItem) => {
      // Only increment view count once per session
      if (viewedItemsRef.current.has(item.id)) return;
      viewedItemsRef.current.add(item.id);

      try {
        await discoveryService.incrementViews(
          item.id,
          session?.accessToken
        );
        // Update view count optimistically
        setDiscoveryItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, views_count: i.views_count + 1 } : i
          )
        );
      } catch (error) {
        console.error('Error incrementing views:', error);
      }
    },
    [session?.accessToken]
  );

  const handleSave = async (item: DiscoveryItem) => {
    if (!session?.accessToken) return;

    try {
      if (item.event_id) {
        const isEventFavorite = isFavorite('event', item.event_id);
        const favoriteId = getFavoriteId('event', item.event_id);

        if (isEventFavorite && favoriteId) {
          await removeFavorite(favoriteId, 'event');
        } else {
          await addFavorite({ resource_type: 'event', resource_id: item.event_id });
        }
      }
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  const renderItem = ({ item, index }: { item: DiscoveryItem; index: number }) => (
    <View style={{ height: availableHeight }}>
      <DiscoveryCard
        item={item}
        isActive={activeIndex === index && isFocused}
        onLike={() => handleLike(item)}
        onView={() => handleView(item)}
        containerHeight={availableHeight}
      />
    </View>
  );

  if (loading && discoveryItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.foreground} />
          <Text className="mt-4 text-muted-foreground">
            Caricamento contenuti...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (discoveryItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-lg font-medium text-muted-foreground mb-2">
            Nessun contenuto disponibile
          </Text>
          <Text className="text-muted-foreground text-center">
            I contenuti Discovery verranno mostrati qui
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={[]}>
      <FlatList
        ref={flatListRef}
        data={discoveryItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={availableHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: availableHeight,
          offset: availableHeight * index,
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.foreground}
            colors={[themeColors.primary]}
          />
        }
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </SafeAreaView>
  );
}




