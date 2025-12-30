import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/text';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChatSwipeCard } from './chat-swipe-card';
import type { SuggestedPlace } from '../../lib/types/suggestion';

const MAX_VISIBLE_CARDS = 3;
const CARD_HEIGHT = 350;

interface ChatSwipeStackProps {
  suggestions: SuggestedPlace[];
  onSwipeComplete: (likedIds: string[], passedIds: string[]) => void;
  containerHeight?: number;
}

export function ChatSwipeStack({
  suggestions,
  onSwipeComplete,
  containerHeight = CARD_HEIGHT,
}: ChatSwipeStackProps) {
  // Local state for tracking swipes (NOT persisted to DB)
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get remaining suggestions to show
  const remainingSuggestions = useMemo(
    () => suggestions.slice(currentIndex),
    [suggestions, currentIndex]
  );

  // Get visible cards (max 3)
  const visibleCards = useMemo(
    () => remainingSuggestions.slice(0, MAX_VISIBLE_CARDS),
    [remainingSuggestions]
  );

  const handleSwipeLeft = useCallback(
    (suggestion: SuggestedPlace) => {
      // Add to passed list
      setPassedIds((prev) => [...prev, suggestion.id]);

      // Move to next card
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);

      // Check if this was the last card
      if (newIndex >= suggestions.length) {
        // Wait for animation to complete
        setTimeout(() => {
          onSwipeComplete(likedIds, [...passedIds, suggestion.id]);
        }, 300);
      }
    },
    [currentIndex, suggestions.length, likedIds, passedIds, onSwipeComplete]
  );

  const handleSwipeRight = useCallback(
    (suggestion: SuggestedPlace) => {
      // Add to liked list
      setLikedIds((prev) => [...prev, suggestion.id]);

      // Move to next card
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);

      // Check if this was the last card
      if (newIndex >= suggestions.length) {
        // Wait for animation to complete
        setTimeout(() => {
          onSwipeComplete([...likedIds, suggestion.id], passedIds);
        }, 300);
      }
    },
    [currentIndex, suggestions.length, likedIds, passedIds, onSwipeComplete]
  );

  // Empty state
  if (suggestions.length === 0) {
    return (
      <View className="justify-center items-center py-8">
        <Text className="text-muted-foreground">Nessun suggerimento disponibile</Text>
      </View>
    );
  }

  // All cards swiped - loading state
  if (currentIndex >= suggestions.length) {
    return (
      <Animated.View entering={FadeIn} className="justify-center items-center py-8">
        <Text className="text-lg font-semibold text-foreground">Analisi completata!</Text>
        <Text className="text-sm text-muted-foreground mt-2">
          Elaborazione delle tue scelte...
        </Text>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, { height: containerHeight + 40 }]}>
      {/* Progress indicator */}
      <View className="mb-3 px-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-muted-foreground">
            {currentIndex + 1} di {suggestions.length}
          </Text>
          <View className="flex-row gap-1">
            {suggestions.map((_, index) => (
              <View
                key={index}
                className={`h-1.5 rounded-full ${
                  index < currentIndex
                    ? 'bg-primary w-6'
                    : index === currentIndex
                    ? 'bg-primary w-8'
                    : 'bg-muted w-4'
                }`}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Card stack */}
      <View style={styles.stackContainer}>
        {/* Render cards in reverse order (bottom to top) */}
        {visibleCards
          .slice()
          .reverse()
          .map((suggestion, reversedIndex) => {
            const index = visibleCards.length - 1 - reversedIndex;
            const isTop = index === 0;

            // Calculate scale and offset for stacking effect
            const scale = 1 - index * 0.05;
            const translateY = index * -10;

            return (
              <Animated.View
                key={suggestion.id}
                style={[
                  styles.cardContainer,
                  {
                    zIndex: MAX_VISIBLE_CARDS - index,
                    transform: [{ scale }, { translateY }],
                  },
                ]}
                pointerEvents={isTop ? 'auto' : 'none'}
              >
                <ChatSwipeCard
                  suggestion={suggestion}
                  onSwipeLeft={() => handleSwipeLeft(suggestion)}
                  onSwipeRight={() => handleSwipeRight(suggestion)}
                  isActive={isTop}
                  containerHeight={containerHeight}
                />
              </Animated.View>
            );
          })}
      </View>

      {/* Instructions */}
      <View className="mt-4 px-4">
        <Text className="text-center text-xs text-muted-foreground">
          Scorri a sinistra per saltare · Scorri a destra per mi piace
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  stackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardContainer: {
    position: 'absolute',
  },
});
