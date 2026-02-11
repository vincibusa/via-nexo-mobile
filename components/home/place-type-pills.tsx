/**
 * Place Type Filter Pills - Horizontal scrollable pills for place type filtering
 * Reusable component for displaying and selecting place types
 */

import React, { useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Badge } from '../ui/badge';
import { Text } from '../ui/text';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { PLACE_TYPES, PlaceTypeValue } from '../../lib/constants/place-types';

interface PlaceTypePillsProps {
  selectedValue: PlaceTypeValue;
  onSelect: (value: PlaceTypeValue) => void;
}

/**
 * Animated pill component with spring animation on selection
 */
const AnimatedPill = React.memo(
  ({
    isSelected,
    onPress,
    emoji,
    label,
  }: {
    isSelected: boolean;
    onPress: () => void;
    emoji: string;
    label: string;
  }) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: withSpring(isSelected ? 1.05 : 1.0, {
            stiffness: 300,
            damping: 20,
          }),
        },
      ],
    }));

    return (
      <Animated.View style={animatedStyle}>
        <Badge
          variant={isSelected ? 'default' : 'outline'}
          className="px-3 py-2"
          asChild
        >
          <Pressable onPress={onPress}>
            <Text className="text-xs">
              {emoji} {label}
            </Text>
          </Pressable>
        </Badge>
      </Animated.View>
    );
  }
);

AnimatedPill.displayName = 'AnimatedPill';

/**
 * PlaceTypePills Component
 * Renders horizontal scrollable pills for place type selection
 */
export const PlaceTypePills = React.memo(function PlaceTypePills({
  selectedValue,
  onSelect,
}: PlaceTypePillsProps) {
  // Memoize the pills to avoid re-renders
  const pills = useMemo(() => PLACE_TYPES, []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 8,
        paddingVertical: 8,
      }}
    >
      <View className="flex-row gap-2">
        {pills.map((type) => (
          <AnimatedPill
            key={type.value ?? 'all'}
            isSelected={selectedValue === type.value}
            onPress={() => onSelect(type.value)}
            emoji={type.emoji}
            label={type.label}
          />
        ))}
      </View>
    </ScrollView>
  );
});

PlaceTypePills.displayName = 'PlaceTypePills';
