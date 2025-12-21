/**
 * Profile Stats Component
 * User statistics and activity
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Text } from '../ui/text';
import { Heart, MapPin, Grid3x3, MessageSquare } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { useFavorites } from '../../lib/contexts/favorites';

interface ProfileStatsProps {
  isDark: boolean;
  onNavigate: (screen: string) => void;
}

export function ProfileStats({ isDark, onNavigate }: ProfileStatsProps) {
  const { places, events } = useFavorites();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  const stats = [
    {
      icon: Heart,
      label: 'Favorites',
      value: (places?.length || 0) + (events?.length || 0),
      color: themeColors.destructive,
      onPress: () => onNavigate('favorites'),
    },
    {
      icon: MapPin,
      label: 'Places Visited',
      value: 0,
      color: themeColors.primary,
      onPress: () => onNavigate('places'),
    },
    {
      icon: Grid3x3,
      label: 'Posts',
      value: 0,
      color: themeColors.accent,
      onPress: () => onNavigate('posts'),
    },
    {
      icon: MessageSquare,
      label: 'Reviews',
      value: 0,
      color: themeColors.primary,
      onPress: () => onNavigate('reviews'),
    },
  ];

  return (
    <Card className="mx-4 mt-4">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row flex-wrap justify-between">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <TouchableOpacity
                key={index}
                onPress={stat.onPress}
                className="w-[48%] mb-4 p-3 rounded-lg bg-muted"
              >
                <View className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon size={20} color={stat.color} />
                  </View>
                  <View>
                    <Text className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {stat.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Activity */}
        <View className="mt-4 pt-4 border-t border-border">
          <Text className="text-sm font-medium mb-2 text-foreground">
            Recent Activity
          </Text>
          <View className="p-3 rounded-lg bg-muted">
            <Text className="text-sm text-muted-foreground">
              No recent activity
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}