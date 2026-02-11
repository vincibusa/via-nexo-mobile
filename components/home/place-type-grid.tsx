/**
 * Place Type Grid - Beautiful grid layout for place type filtering
 * iOS Control Center inspired design with glassmorphism cards
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '../ui/text';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  useSharedValue,
} from 'react-native-reanimated';
import { PLACE_TYPES, PlaceTypeValue } from '../../lib/constants/place-types';
import { BlurView } from 'expo-blur';

interface PlaceTypeGridProps {
  selectedValue: PlaceTypeValue;
  onSelect: (value: PlaceTypeValue) => void;
}

// Color accents for each place type
const ACCENT_COLORS = {
  null: 'rgba(99, 102, 241, 0.2)',      // Indigo - Tutti
  bar: 'rgba(236, 72, 153, 0.2)',       // Pink - Bar
  club: 'rgba(168, 85, 247, 0.2)',      // Purple - Club
  restaurant: 'rgba(251, 146, 60, 0.2)', // Orange - Ristoranti
  pub: 'rgba(251, 191, 36, 0.2)',       // Amber - Pub
  lounge: 'rgba(59, 130, 246, 0.2)',    // Blue - Lounge
  cafe: 'rgba(139, 92, 246, 0.2)',      // Violet - Caffè
  other: 'rgba(156, 163, 175, 0.2)',    // Gray - Altro
} as const;

const GLOW_COLORS = {
  null: 'rgba(99, 102, 241, 0.6)',
  bar: 'rgba(236, 72, 153, 0.6)',
  club: 'rgba(168, 85, 247, 0.6)',
  restaurant: 'rgba(251, 146, 60, 0.6)',
  pub: 'rgba(251, 191, 36, 0.6)',
  lounge: 'rgba(59, 130, 246, 0.6)',
  cafe: 'rgba(139, 92, 246, 0.6)',
  other: 'rgba(156, 163, 175, 0.6)',
} as const;

/**
 * Animated card component for each place type
 */
const PlaceTypeCard = ({
  type,
  isSelected,
  onPress,
}: {
  type: typeof PLACE_TYPES[number];
  isSelected: boolean;
  onPress: () => void;
}) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      isSelected ? 1 : pressed.value,
      [0, 1],
      [1, 0.95]
    );

    return {
      transform: [{ scale: withSpring(isSelected ? 1.05 : scale) }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isSelected ? 1 : 0, { damping: 15 }),
  }));

  const accentColor = ACCENT_COLORS[type.value ?? 'null' as keyof typeof ACCENT_COLORS];
  const glowColor = GLOW_COLORS[type.value ?? 'null' as keyof typeof GLOW_COLORS];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (pressed.value = 1)}
      onPressOut={() => (pressed.value = 0)}
      style={styles.cardPressable}
    >
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        {/* Glow effect when selected */}
        <Animated.View
          style={[
            styles.glowEffect,
            glowStyle,
            { backgroundColor: glowColor },
          ]}
        />

        {/* Glass card with blur */}
        <BlurView intensity={60} tint="light" style={styles.cardBlur}>
          <View
            style={[
              styles.cardContent,
              {
                backgroundColor: isSelected
                  ? accentColor
                  : 'rgba(255, 255, 255, 0.1)',
                borderColor: isSelected
                  ? glowColor
                  : 'rgba(255, 255, 255, 0.2)',
              },
            ]}
          >
            {/* Emoji icon */}
            <Text style={styles.emoji}>{type.emoji}</Text>

            {/* Label */}
            <Text
              className="text-sm font-medium text-foreground"
              style={styles.label}
            >
              {type.label}
            </Text>
          </View>
        </BlurView>
      </Animated.View>
    </Pressable>
  );
};

/**
 * PlaceTypeGrid Component
 * Beautiful 2-column grid layout with glassmorphism cards
 */
export function PlaceTypeGrid({ selectedValue, onSelect }: PlaceTypeGridProps) {
  return (
    <View style={styles.gridContainer}>
      {PLACE_TYPES.map((type) => (
        <PlaceTypeCard
          key={type.value ?? 'all'}
          type={type}
          isSelected={selectedValue === type.value}
          onPress={() => onSelect(type.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },
  cardPressable: {
    width: '31%', // 3 columns with gap
  },
  cardContainer: {
    position: 'relative',
    height: 70, // Più compatte
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    opacity: 0,
  },
  cardBlur: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  emoji: {
    fontSize: 17, // 40% più piccole (28 * 0.6 = 16.8)
    marginBottom: 3,
  },
  label: {
    textAlign: 'center',
    fontSize: 10,
  },
});
