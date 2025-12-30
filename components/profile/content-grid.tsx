/**
 * Content Grid Component - Instagram Style
 * 3x3 grid layout for images with tap navigation
 */

import React from 'react';
import { View, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Text } from '../ui/text';
import { Grid3x3, Image as ImageIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useColorScheme } from 'nativewind';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 2;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export interface GridItem {
  id: string;
  imageUrl: string;
  type: 'place' | 'event' | 'post';
  title?: string;
}

interface ContentGridProps {
  items: GridItem[];
  isLoading?: boolean;
  onItemPress?: (item: GridItem) => void;
}

export function ContentGrid({ items, isLoading = false, onItemPress }: ContentGridProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();

  // Get dynamic colors
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  const handleItemPress = (item: GridItem) => {
    if (onItemPress) {
      onItemPress(item);
      return;
    }

    // Default navigation based on type
    if (item.type === 'place') {
      router.push(`/(app)/place/${item.id}` as any);
    } else if (item.type === 'event') {
      router.push(`/(app)/event/${item.id}` as any);
    } else if (item.type === 'post') {
      router.push(`/(app)/post/${item.id}` as any);
    }
  };

  if (isLoading) {
    return (
      <View className="py-12 items-center justify-center">
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="py-16 items-center justify-center px-4">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: themeColors.muted }}
        >
          <Grid3x3 size={32} color={themeColors.mutedForeground} />
        </View>
        <Text className="text-base font-semibold text-foreground mb-2">
          Nessun contenuto
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          I tuoi post, eventi salvati e luoghi visitati appariranno qui
        </Text>
      </View>
    );
  }

  // Create grid rows
  const rows: GridItem[][] = [];
  for (let i = 0; i < items.length; i += NUM_COLUMNS) {
    rows.push(items.slice(i, i + NUM_COLUMNS));
  }

  return (
    <View className="px-2">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row mb-1">
          {row.map((item, colIndex) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.8}
              style={{
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                marginLeft: colIndex > 0 ? GRID_PADDING : 0,
              }}
            >
              <View className="w-full h-full bg-muted overflow-hidden">
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="w-full h-full items-center justify-center"
                    style={{ backgroundColor: themeColors.muted }}
                  >
                    <ImageIcon size={24} color={themeColors.mutedForeground} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
          {/* Fill empty spaces in last row */}
          {row.length < NUM_COLUMNS && (
            Array.from({ length: NUM_COLUMNS - row.length }).map((_, index) => (
              <View
                key={`empty-${index}`}
                style={{
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  marginLeft: GRID_PADDING,
                }}
              />
            ))
          )}
        </View>
      ))}
    </View>
  );
}










