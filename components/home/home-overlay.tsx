/**
 * Home Overlay Component
 * Bottom sheet, FAB, and other overlay elements
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Navigation, Sliders } from 'lucide-react-native';
import { GlassView } from '../glass/glass-view';
import { CreateMenuSheet } from '../social/create-menu-sheet';
import { PlaceTypeFilterSheet } from './place-type-filter-sheet';
import { dailyRecommendationsService } from '../../lib/services/daily-recommendations';
import { useModalContext } from '../../app/(app)/(tabs)/_layout';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface HomeOverlayProps {
  showCreateMenu: boolean;
  onOpenCreateMenu: () => void;
  onCloseCreateMenu: () => void;
  isDark: boolean;
  themeColors: {
    primary: string;
    primaryForeground: string;
    background: string;
    card: string;
    foreground: string;
    accent: string;
  };
  location: { lat: number; lon: number } | null;
  mapRef: any;
  canUseLiquidGlass?: boolean;
  floatingBottomOffset?: number;
}

export function HomeOverlay({
  showCreateMenu,
  onOpenCreateMenu,
  onCloseCreateMenu,
  isDark,
  themeColors,
  location,
  mapRef,
  canUseLiquidGlass = false,
  floatingBottomOffset = 20,
}: HomeOverlayProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { isModalOpen } = useModalContext();

  useFocusEffect(
    useCallback(() => {
      setIsFilterSheetOpen(false);
      return () => setIsFilterSheetOpen(false);
    }, [])
  );

  const getJustifyContent = (): 'flex-start' | 'flex-end' | 'space-between' => {
    if (hasRecommendations && location) return 'space-between';
    if (hasRecommendations) return 'flex-start';
    return 'flex-end';
  };

  const buttonsContainerStyle = {
    ...styles.buttonsContainer,
    bottom: insets.bottom + floatingBottomOffset,
    justifyContent: getJustifyContent(),
  };

  const centerOnUserLocation = () => {
    if (mapRef && location) {
      mapRef.animateToRegion({
        latitude: location.lat,
        longitude: location.lon,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 500);
    }
  };

  const checkRecommendations = useCallback(async () => {
    try {
      const { data } = await dailyRecommendationsService.checkHasRecommendations();
      setHasRecommendations(data?.hasRecommendations || false);
    } catch (error) {
      console.error('Error checking recommendations:', error);
    }
  }, []);

  // Check recommendations when screen is focused
  useFocusEffect(
    useCallback(() => {
      checkRecommendations();
    }, [checkRecommendations])
  );

  // Also check periodically in case data changes
  useEffect(() => {
    const interval = setInterval(checkRecommendations, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkRecommendations]);

  const handleRecommendationsPress = () => {
    router.push('/(app)/daily-recommendations' as any);
  };

  // Animated style for dimming buttons when modal is open
  const buttonsDimStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isModalOpen ? 0.25 : 1, { duration: 250 }),
  }));

  return (
    <>
      {/* Create Menu Sheet */}
      <CreateMenuSheet
        isOpen={showCreateMenu}
        onClose={onCloseCreateMenu}
        canUseLiquidGlass={canUseLiquidGlass}
      />

      {/* Place Type Filter Sheet */}
      <PlaceTypeFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        canUseLiquidGlass={canUseLiquidGlass}
      />

      {/* Bottom buttons row - Recommendations and Location */}
      <Animated.View
        style={[buttonsContainerStyle, buttonsDimStyle]}
        pointerEvents={isModalOpen ? 'none' : 'auto'}
      >
        {/* Daily Recommendations Button */}
        {hasRecommendations && (
          <TouchableOpacity
            onPress={handleRecommendationsPress}
            style={[styles.button, { backgroundColor: themeColors.accent }]}
          >
            <Sparkles size={24} color={themeColors.primaryForeground} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Location and Filter Buttons Group */}
        {location && (
          <View style={styles.verticalButtonsGroup}>
            {/* Filter Button */}
            <TouchableOpacity
              onPress={() => setIsFilterSheetOpen(true)}
              activeOpacity={0.85}
            >
              <GlassView
                intensity="light"
                tint="extraLight"
                isInteractive
                style={styles.glassButton}
              >
                <Sliders
                  size={28}
                  color={themeColors.foreground}
                />
              </GlassView>
            </TouchableOpacity>

            {/* Location Button */}
            <TouchableOpacity
              onPress={centerOnUserLocation}
              activeOpacity={0.85}
            >
              <GlassView
                intensity="light"
                tint="extraLight"
                isInteractive
                style={styles.glassButton}
              >
                <View style={styles.iconWrapper}>
                  <Navigation
                    size={28}
                    color={themeColors.foreground}
                  />
                </View>
              </GlassView>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    elevation: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  verticalButtonsGroup: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  glassButton: {
    width: 60,
    height: 60,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 9,
  },
  fallbackGlassButton: {
    backgroundColor: 'rgba(24, 26, 32, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  iconWrapper: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
});
