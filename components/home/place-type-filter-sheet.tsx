/**
 * Place Type Filter Sheet - Bottom sheet modal for place type filtering
 * Enhanced with improved backdrop, liquid glass, and fallback support
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useModalContext } from '../../app/(app)/(tabs)/_layout';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle, Pressable, TouchableWithoutFeedback } from 'react-native';
import { Text } from '../ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { PlaceTypeGrid } from './place-type-grid';
import { useFiltersStore } from '../../lib/stores/filters-store';
import { PlaceTypeValue } from '../../lib/constants/place-types';
import { GlassSurface } from '../glass/glass-surface';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface PlaceTypeFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// Enhanced backdrop with INTENSE blur (iOS Control Center style)
function SheetBackdrop({
  isVisible,
  onPress,
}: {
  isVisible: boolean;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration: 250 });
  }, [isVisible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        style={[StyleSheet.absoluteFill, animatedStyle]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        {/* Dark overlay - stronger for better darkening */}
        <View style={styles.backdrop} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export function PlaceTypeFilterSheet({
  isOpen,
  onClose,
}: PlaceTypeFilterSheetProps) {
  const { placesFilters, setPlacesFilters } = useFiltersStore();
  const { setIsModalOpen } = useModalContext();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(500); // Start off-screen right

  // Bottom sheet sizing - iOS Control Center style (larger for grid layout)
  const snapPoints = useMemo(() => ['70%'], []);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const handleSelect = (value: PlaceTypeValue) => {
    if (value === null) {
      setPlacesFilters({ category: undefined });
    } else {
      setPlacesFilters({ category: value });
    }
  };

  const selectedValue: PlaceTypeValue = (placesFilters.category as PlaceTypeValue) || null;

  // Control bottom sheet visibility and notify tab bar
  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.snapToIndex(0);
      setIsModalOpen(true);
      // Slide in from right - smooth animation
      translateX.value = withTiming(0, {
        duration: 350,
      });
    } else {
      bottomSheetRef.current?.close();
      setIsModalOpen(false);
      // Slide out to right - smooth animation
      translateX.value = withTiming(500, {
        duration: 250,
      });
    }

    // Cleanup: ensure modal state persists
    return () => {
      if (!isOpen) {
        setIsModalOpen(false);
      }
    };
  }, [isOpen, setIsModalOpen, translateX]);

  const slideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <>
      {/* Custom Backdrop */}
      <SheetBackdrop isVisible={isOpen} onPress={onClose} />

      {/* Animated wrapper for slide animation */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          slideAnimatedStyle,
          { zIndex: 1000 }
        ]}
        pointerEvents="box-none"
      >
        <BottomSheet
          ref={bottomSheetRef}
          index={isOpen ? 0 : -1}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          onChange={handleSheetChange}
          enablePanDownToClose={true}
          backgroundStyle={{ backgroundColor: 'transparent' }}
          handleStyle={styles.transparentHandleArea}
          handleIndicatorStyle={styles.handleIndicator}
          backdropComponent={() => null} // We use our custom backdrop
          animateOnMount={false} // We handle animation manually
        >
        <BottomSheetView style={styles.sheetRoot}>
          <GlassSurface variant="modal" intensity="regular" tint="extraLight" style={styles.sheetSurface}>
            <View style={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
              {/* Header with close button */}
              <View style={styles.headerContainer}>
                <Text className="text-base font-semibold text-foreground">Categorie</Text>
                <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
                  <View style={styles.closeButtonInner}>
                    <Text className="text-sm text-muted-foreground">Fatto</Text>
                  </View>
                </Pressable>
              </View>

              {/* Beautiful Grid Layout */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                contentContainerStyle={styles.gridScrollContent}
              >
                <PlaceTypeGrid selectedValue={selectedValue} onSelect={handleSelect} />
              </ScrollView>

              {/* Spacer to ensure content fills space */}
              <View style={{ flex: 1, minHeight: 20 }} />
            </View>
          </GlassSurface>
        </BottomSheetView>
      </BottomSheet>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // Stronger dark overlay like CreateMenuSheet
    zIndex: 999,
  },
  transparentHandleArea: {
    backgroundColor: 'transparent',
  },
  handleIndicator: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  sheetRoot: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    flex: 1,
  },
  sheetSurface: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16, // Spacing dal bottom
  },
  glassContainer: {
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  fallbackSurface: {
    backgroundColor: 'rgba(22, 24, 30, 0.95)',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  contentContainer: {
    paddingHorizontal: 24, // More generous padding (iOS style)
    paddingTop: 28,
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeButtonInner: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gridScrollContent: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
});
