import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import { GlassView } from '../glass/glass-view';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'place' | 'event';
}

interface CategoryChipsProps {
  categories: Category[];
  onSelect: (category: Category) => void;
  isLoading?: boolean;
  isDark?: boolean;
}

export function CategoryChips({ categories, onSelect, isLoading, isDark = true }: CategoryChipsProps) {
  if (isLoading) {
    return (
      <View className="py-4">
        <View className="px-4 mb-3">
          <View className="w-32 h-4 rounded bg-muted" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="h-10 w-28 rounded-full bg-muted mr-2" />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <View className="py-4">
      <Text className="px-4 font-semibold mb-3">Esplora per categoria</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {categories.map((category) => (
          <GlassView
            key={category.id}
            intensity={isDark ? 'light' : 'regular'}
            tint={isDark ? 'dark' : 'light'}
            style={{ borderRadius: 999, marginRight: 8 }}
          >
            <TouchableOpacity
              onPress={() => onSelect(category)}
              activeOpacity={0.7}
              className="bg-muted/30 px-4 py-2.5 rounded-full flex-row items-center gap-2"
            >
              <Text className="text-base">{category.icon}</Text>
              <Text className="font-medium text-sm">{category.name}</Text>
            </TouchableOpacity>
          </GlassView>
        ))}
      </ScrollView>
    </View>
  );
}
