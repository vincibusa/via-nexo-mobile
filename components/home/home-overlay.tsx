/**
 * Home Overlay Component
 * Bottom sheet, FAB, and other overlay elements
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Navigation } from 'lucide-react-native';
import { CreateMenuSheet } from '../social/create-menu-sheet';
import { dailyRecommendationsService } from '../../lib/services/daily-recommendations';

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
}

export function HomeOverlay({
  showCreateMenu,
  onOpenCreateMenu,
  onCloseCreateMenu,
  isDark,
  themeColors,
  location,
  mapRef,
}: HomeOverlayProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasRecommendations, setHasRecommendations] = useState(false);

  const getJustifyContent = (): 'flex-start' | 'flex-end' | 'space-between' => {
    if (hasRecommendations && location) return 'space-between';
    if (hasRecommendations) return 'flex-start';
    return 'flex-end';
  };

  const buttonsContainerStyle = {
    ...styles.buttonsContainer,
    bottom: insets.bottom + 20,
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

  return (
    <>
      {/* Create Menu Sheet */}
      <CreateMenuSheet
        isOpen={showCreateMenu}
        onClose={onCloseCreateMenu}
      />

      {/* Bottom buttons row - Recommendations and Location */}
      <View
        style={buttonsContainerStyle}
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

        {/* Location Button */}
        {location && (
          <TouchableOpacity
            onPress={centerOnUserLocation}
            style={[styles.button, { backgroundColor: themeColors.card }]}
          >
            <Navigation 
              size={24} 
              color={themeColors.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});