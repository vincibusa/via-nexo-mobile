import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../ui/text';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Frown, RefreshCw } from 'lucide-react-native';
import { SwipeCard } from './swipe-card';
import { THEME } from '../../lib/theme';
import type { Recommendation } from '../../lib/services/daily-recommendations';

const MAX_VISIBLE_CARDS = 3;

interface SwipeStackProps {
  recommendations: Recommendation[];
  onSwipeLeft: (recommendation: Recommendation) => void;
  onSwipeRight: (recommendation: Recommendation) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  onComplete?: () => void;
  containerHeight: number;
}

export function SwipeStack({
  recommendations,
  onSwipeLeft,
  onSwipeRight,
  isLoading = false,
  onLoadMore,
  onComplete,
  containerHeight,
}: SwipeStackProps) {
  const themeColors = THEME.dark;

  // Get visible cards (max 3)
  const visibleCards = useMemo(
    () => recommendations.slice(0, MAX_VISIBLE_CARDS),
    [recommendations]
  );

  const handleSwipeLeft = (rec: Recommendation) => {
    onSwipeLeft(rec);

    // Check if this was the last card
    if (recommendations.length === 1 && onComplete) {
      setTimeout(() => onComplete(), 300); // Wait for animation
    }
  };

  const handleSwipeRight = (rec: Recommendation) => {
    onSwipeRight(rec);

    // Check if this was the last card
    if (recommendations.length === 1 && onComplete) {
      setTimeout(() => onComplete(), 300); // Wait for animation
    }
  };

  // Empty state
  if (!isLoading && recommendations.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <View className="bg-muted rounded-2xl p-8 items-center">
          <Frown size={64} color={themeColors.mutedForeground} />
          <Text className="mt-4 text-lg font-semibold text-foreground text-center">
            Nessun evento disponibile
          </Text>
          <Text className="mt-2 text-muted-foreground text-center">
            Torna più tardi per nuove raccomandazioni personalizzate
          </Text>
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading && recommendations.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text className="mt-4 text-muted-foreground">
          Caricamento eventi...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Render cards in reverse order (bottom to top) */}
      {visibleCards
        .slice()
        .reverse()
        .map((rec, reversedIndex) => {
          const index = visibleCards.length - 1 - reversedIndex;
          const isTop = index === 0;

          // Calculate scale and offset for stacking effect
          const scale = 1 - index * 0.05;
          const translateY = index * -10;

          return (
            <Animated.View
              key={rec.id}
              style={[
                styles.cardContainer,
                {
                  zIndex: MAX_VISIBLE_CARDS - index,
                  transform: [{ scale }, { translateY }],
                },
              ]}
              pointerEvents={isTop ? 'auto' : 'none'}
            >
              <SwipeCard
                recommendation={rec}
                onSwipeLeft={() => handleSwipeLeft(rec)}
                onSwipeRight={() => handleSwipeRight(rec)}
                isActive={isTop}
                containerHeight={containerHeight}
              />
            </Animated.View>
          );
        })}

      {/* Loading more indicator */}
      {isLoading && recommendations.length > 0 && (
        <View className="absolute bottom-[-60px] left-0 right-0 items-center">
          <View className="flex-row items-center bg-muted/80 px-4 py-2 rounded-full">
            <RefreshCw size={16} color={themeColors.primary} />
            <Text className="ml-2 text-sm text-muted-foreground">
              Caricamento altri eventi...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    position: 'absolute',
  },
});
