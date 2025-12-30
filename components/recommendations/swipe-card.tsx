import React, { memo } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Text } from '../ui/text';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Calendar, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageCarousel } from './image-carousel';
import { MatchBadge } from './match-badge';
import { SwipeOverlay } from './swipe-overlay';
import type { Recommendation } from '../../lib/services/daily-recommendations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const ROTATION_MULTIPLIER = 15;

interface SwipeCardProps {
  recommendation: Recommendation;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isActive: boolean;
  containerHeight: number;
}

function SwipeCardComponent({
  recommendation,
  onSwipeLeft,
  onSwipeRight,
  isActive,
  containerHeight,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const hapticTriggered = useSharedValue(false);

  const event = recommendation.event;
  const score = recommendation.score ?? 1;

  // Collect images (cover + any additional)
  const images = event?.cover_image_url ? [event.cover_image_url] : [];

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const triggerLikeHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const triggerPassHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .activeOffsetX([-15, 15])
    .failOffsetY([-30, 30])
    .onStart(() => {
      hapticTriggered.value = false;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5; // Dampen vertical movement
      rotation.value = (event.translationX / 100) * ROTATION_MULTIPLIER;

      // Haptic feedback at threshold
      if (
        Math.abs(event.translationX) >= SWIPE_THRESHOLD &&
        !hapticTriggered.value
      ) {
        hapticTriggered.value = true;
        runOnJS(triggerHaptic)();
      } else if (
        Math.abs(event.translationX) < SWIPE_THRESHOLD &&
        hapticTriggered.value
      ) {
        hapticTriggered.value = false;
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right - LIKE
        translateX.value = withSpring(SCREEN_WIDTH * 1.5, {
          damping: 15,
          stiffness: 100,
        });
        runOnJS(triggerLikeHaptic)();
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left - PASS
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5, {
          damping: 15,
          stiffness: 100,
        });
        runOnJS(triggerPassHaptic)();
        runOnJS(onSwipeLeft)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        rotation.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const likeOpacity = useSharedValue(0);
  const nopeOpacity = useSharedValue(0);

  // Update overlay opacities based on swipe
  const updateOverlays = useAnimatedStyle(() => {
    likeOpacity.value = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    nopeOpacity.value = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {};
  });

  // Format date
  const formatEventDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.card, cardAnimatedStyle, updateOverlays]}
        className="bg-card rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Image carousel */}
        <ImageCarousel
          images={images}
          width={SCREEN_WIDTH}
          height={containerHeight}
        />

        {/* Match badge - top left */}
        <View className="absolute top-4 left-4 z-10">
          <MatchBadge score={score} size="md" />
        </View>

        {/* Swipe overlays */}
        <SwipeOverlay likeOpacity={likeOpacity} nopeOpacity={nopeOpacity} />

        {/* Gradient overlay for text */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
          style={styles.gradient}
        />

        {/* Event info */}
        <View className="absolute bottom-0 left-0 right-0 p-5">
          {/* Title */}
          <Text className="text-2xl font-bold text-white mb-2" numberOfLines={2}>
            {event?.title || 'Evento'}
          </Text>

          {/* Date & Time */}
          <View className="flex-row items-center mb-2">
            <Calendar size={16} color="#fff" />
            <Text className="ml-2 text-white/90 text-sm">
              {formatEventDate(event?.start_datetime)}
            </Text>
          </View>

          {/* Location placeholder - would need place data */}
          <View className="flex-row items-center mb-3">
            <MapPin size={16} color="#fff" />
            <Text className="ml-2 text-white/90 text-sm" numberOfLines={1}>
              {recommendation.place?.name || 'Luogo da definire'}
            </Text>
          </View>

          {/* AI Reason if available */}
          {recommendation.reason && (
            <View className="bg-white/10 rounded-xl px-3 py-2 mt-2">
              <Text className="text-white/80 text-sm italic" numberOfLines={2}>
                "{recommendation.reason}"
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export const SwipeCard = memo(SwipeCardComponent);

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
});
