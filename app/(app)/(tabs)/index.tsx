/**
 * Home Screen - Refactored Version
 * Uses extracted components for better maintainability
 */

import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Platform,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../../../lib/contexts/settings';
import { THEME } from '../../../lib/theme';

// Import extracted components
import { HomeMap } from '../../../components/home/home-map';
import { HomeStories } from '../../../components/home/home-stories';
import { HomeOverlay } from '../../../components/home/home-overlay';
import { useHomeData } from '../../../lib/hooks/useHomeData';

export default function HomeScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);

  // Use dark theme (single theme for the app)
  const themeColors = THEME.dark;
  const isDark = true;

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
    incrementStoriesRefresh,
  } = useHomeData();

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>();

  const handlePlacePress = (place: any) => {
    setSelectedPlaceId(place.id);
    // Navigate to place detail
    router.push(`/place/${place.id}` as any);
  };

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.foreground}
              colors={[themeColors.primary]}
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Map View */}
          <View className="flex-1 min-h-[400px]">
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
        />
      </View>
    </View>
  );
}