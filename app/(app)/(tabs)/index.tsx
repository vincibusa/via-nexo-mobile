/**
 * Home Screen - Refactored Version
 * Uses extracted components for better maintainability
 */

import React, { useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { THEME } from '../../../lib/theme';
import { useGlassCapability } from '../../../lib/glass/use-glass-capability';
import { useColorScheme } from 'nativewind';

// Import extracted components
import { HomeMap } from '../../../components/home/home-map';
import { HomeStories } from '../../../components/home/home-stories';
import { HomeOverlay } from '../../../components/home/home-overlay';
import { useHomeData } from '../../../lib/hooks/useHomeData';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const mapRef = useRef<any>(null);
  const { colorScheme } = useColorScheme();

  const themeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const themeColors = THEME[themeMode];
  const isDark = themeMode === 'dark';

  // Use custom hook for data management
  const {
    places,
    isLoadingPlaces,
    location,
    refreshing,
    storiesRefreshTrigger,
    showCreateMenu,
    onRefresh,
    handleOpenCreateMenu,
    handleCloseCreateMenu,
  } = useHomeData();

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>();
  const lastPlaceNavigationRef = useRef<{ id: string; timestamp: number } | null>(null);

  // Use the glass capability hook for automatic detection
  const { hasLiquidGlass } = useGlassCapability();

  const handlePlacePress = (place: any) => {
    const now = Date.now();
    const lastNavigation = lastPlaceNavigationRef.current;

    if (
      lastNavigation &&
      lastNavigation.id === place.id &&
      now - lastNavigation.timestamp < 800
    ) {
      return;
    }

    lastPlaceNavigationRef.current = { id: place.id, timestamp: now };
    setSelectedPlaceId(place.id);
    // Navigate to place detail
    router.push(`/place/${place.id}` as any);
  };

  const contentBottomPadding = insets.bottom + 96;
  const overlayBottomOffset = 120;

  // Show loading state
  if (isLoadingPlaces && places.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <View className="p-4 rounded-lg bg-card">
            <Text className="text-foreground">
              Loading places...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          scrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.foreground}
              colors={[themeColors.primary]}
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: contentBottomPadding }}
        >
          {/* Map View */}
          <View className="flex-1" style={{ height: windowHeight }}>
            <HomeMap
              places={places}
              location={location}
              onPlacePress={handlePlacePress}
              selectedPlaceId={selectedPlaceId}
              isDark={isDark}
              onMapRefReady={(ref) => {
                mapRef.current = ref;
              }}
            />
          </View>

          {/* Stories Carousel */}
          <HomeStories
            refreshTrigger={storiesRefreshTrigger}
            isDark={isDark}
            topInset={insets.top}
            onCreateStoryPress={handleOpenCreateMenu}
          />
        </ScrollView>

        {/* Overlay Elements - positioned absolutely over the content */}
        <HomeOverlay
          showCreateMenu={showCreateMenu}
          onOpenCreateMenu={handleOpenCreateMenu}
          onCloseCreateMenu={handleCloseCreateMenu}
          isDark={isDark}
          themeColors={{
            primary: themeColors.primary,
            primaryForeground: themeColors.primaryForeground,
            background: themeColors.background,
            card: themeColors.card,
            foreground: themeColors.foreground,
            accent: themeColors.accent,
          }}
          location={location}
          mapRef={mapRef.current}
          canUseLiquidGlass={hasLiquidGlass}
          floatingBottomOffset={overlayBottomOffset}
        />
      </View>
    </View>
  );
}
