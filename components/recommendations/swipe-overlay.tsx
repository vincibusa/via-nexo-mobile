import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Text } from '../ui/text';
import { Heart, X } from 'lucide-react-native';

interface SwipeOverlayProps {
  likeOpacity: SharedValue<number>;
  nopeOpacity: SharedValue<number>;
}

export function SwipeOverlay({ likeOpacity, nopeOpacity }: SwipeOverlayProps) {
  const likeStyle = useAnimatedStyle(() => ({
    opacity: likeOpacity.value,
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: nopeOpacity.value,
  }));

  return (
    <>
      {/* LIKE overlay - right side */}
      <Animated.View style={[styles.overlay, styles.likeOverlay, likeStyle]}>
        <View className="bg-green-500/90 rounded-xl px-6 py-3 flex-row items-center border-4 border-green-400">
          <Heart size={32} color="white" fill="white" />
          <Text className="ml-2 text-2xl font-black text-white tracking-wider">
            LIKE
          </Text>
        </View>
      </Animated.View>

      {/* NOPE overlay - left side */}
      <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeStyle]}>
        <View className="bg-red-500/90 rounded-xl px-6 py-3 flex-row items-center border-4 border-red-400">
          <X size={32} color="white" strokeWidth={4} />
          <Text className="ml-2 text-2xl font-black text-white tracking-wider">
            NOPE
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 60,
    zIndex: 10,
  },
  likeOverlay: {
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  nopeOverlay: {
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
});
