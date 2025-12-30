/**
 * Story Highlights Component - Instagram Style
 * Horizontal scrollable list of story highlights with add button
 */

import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Text } from '../ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/contexts/auth';
import { API_CONFIG } from '../../lib/config';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useColorScheme } from 'nativewind';

export interface StoryHighlight {
  id: string;
  title: string;
  cover_image?: string;
  story_count: number;
}

interface StoryHighlightsProps {
  onCreatePress?: () => void;
}

export function StoryHighlights({ onCreatePress }: StoryHighlightsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get dynamic colors
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  useEffect(() => {
    fetchHighlights();
  }, [user?.id]);

  const fetchHighlights = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch user's stories to create highlights
      const url = `${API_CONFIG.BASE_URL}/api/social/stories?user_id=${user.id}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        // Group stories by date or create default highlights
        // For now, create a simple highlight from recent stories
        if (data && data.length > 0) {
          const recentStories = data.slice(0, 5);
          const highlight: StoryHighlight = {
            id: 'recent',
            title: 'Recenti',
            cover_image: recentStories[0]?.media_url,
            story_count: recentStories.length,
          };
          setHighlights([highlight]);
        } else {
          setHighlights([]);
        }
      } else {
        setHighlights([]);
      }
    } catch (error) {
      console.error('Error fetching story highlights:', error);
      setHighlights([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePress = () => {
    if (onCreatePress) {
      onCreatePress();
    } else {
      router.push('/(app)/create-story' as any);
    }
  };

  const handleHighlightPress = (highlight: StoryHighlight) => {
    // Navigate to story viewer or highlight detail
    // For now, just navigate to create story
    router.push('/(app)/create-story' as any);
  };

  if (isLoading) {
    return (
      <View className="h-24 items-center justify-center">
        <ActivityIndicator size="small" color={themeColors.foreground} />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 12 }}
      className="mb-4"
    >
      {/* Add new highlight button */}
      <TouchableOpacity
        onPress={handleCreatePress}
        className="items-center justify-center gap-1.5"
        style={{ width: 70 }}
      >
        <View
          className="h-16 w-16 rounded-full items-center justify-center border-2 border-dashed"
          style={{
            borderColor: themeColors.mutedForeground,
            backgroundColor: themeColors.muted,
          }}
        >
          <Plus size={24} color={themeColors.mutedForeground} />
        </View>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          Nuovo
        </Text>
      </TouchableOpacity>

      {/* Story highlights */}
      {highlights.map((highlight) => (
        <TouchableOpacity
          key={highlight.id}
          onPress={() => handleHighlightPress(highlight)}
          className="items-center justify-center gap-1.5"
          style={{ width: 70 }}
        >
          <View
            className="h-16 w-16 rounded-full overflow-hidden border-2"
            style={{ borderColor: themeColors.primary }}
          >
            {highlight.cover_image ? (
              <Image
                source={{ uri: highlight.cover_image }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View
                className="h-full w-full items-center justify-center"
                style={{ backgroundColor: themeColors.muted }}
              >
                <Text className="text-xs font-semibold" style={{ color: themeColors.foreground }}>
                  {highlight.title.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-foreground" numberOfLines={1}>
            {highlight.title}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Empty state - show message if no highlights */}
      {highlights.length === 0 && !isLoading && (
        <View className="items-center justify-center px-4">
          <Text className="text-xs text-muted-foreground text-center">
            Crea la tua prima storia
          </Text>
        </View>
      )}
    </ScrollView>
  );
}










