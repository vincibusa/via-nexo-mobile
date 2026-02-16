import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import { TrendingUp } from 'lucide-react-native';
import { GlassView } from '../glass/glass-view';

export interface TrendingSearch {
  query: string;
  count: number;
}

interface TrendingSearchesProps {
  data: TrendingSearch[];
  onSelect: (query: string) => void;
  isLoading?: boolean;
  isDark?: boolean;
}

export function TrendingSearches({ data, onSelect, isLoading, isDark = true }: TrendingSearchesProps) {
  if (isLoading) {
    return (
      <View className="px-4 py-4">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-4 h-4 rounded bg-muted" />
          <View className="w-16 h-4 rounded bg-muted" />
        </View>
        <View className="flex-row flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="h-7 w-20 rounded-full bg-muted" />
          ))}
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View className="px-4 py-4">
      <View className="flex-row items-center gap-2 mb-3">
        <TrendingUp size={16} color="#f97316" />
        <Text className="font-semibold">Trending</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {data.map((item, index) => (
          <GlassView
            key={index}
            intensity={isDark ? 'light' : 'regular'}
            tint={isDark ? 'dark' : 'light'}
            style={{ borderRadius: 999, marginRight: 8, marginBottom: 8 }}
          >
            <TouchableOpacity
              onPress={() => onSelect(item.query)}
              activeOpacity={0.7}
              className="px-3 py-1.5 rounded-full bg-orange-500/10"
            >
              <Text className="text-sm font-medium" style={{ color: '#f97316' }}>
                {item.query}
              </Text>
            </TouchableOpacity>
          </GlassView>
        ))}
      </View>
    </View>
  );
}
