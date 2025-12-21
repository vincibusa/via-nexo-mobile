/**
 * Home Stories Component
 * Stories carousel for social content
 */

import React from 'react';
import { View } from 'react-native';
import { StoriesCarousel } from '../social/stories-carousel';

interface HomeStoriesProps {
  refreshTrigger: number;
  isDark: boolean;
  topInset: number;
  onCreateStoryPress?: () => void;
}

export function HomeStories({ refreshTrigger, isDark, topInset, onCreateStoryPress }: HomeStoriesProps) {
  return (
    <View className="absolute left-4 right-4 z-10" style={{ marginTop: topInset + 16 }}>
      <StoriesCarousel
        key={`stories-${refreshTrigger}`}
        isDark={isDark}
        onStoryPress={(story) => {
          console.log('Story pressed:', story);
          // TODO: Navigate to story detail
        }}
        onCreatePress={onCreateStoryPress}
      />
    </View>
  );
}