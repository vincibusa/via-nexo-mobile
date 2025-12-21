import React from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { Sparkles, MapPin, Calendar } from 'lucide-react-native';
import { type Recommendation } from '../../lib/services/daily-recommendations';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onPress?: () => void;
}

export function RecommendationCard({
  recommendation,
  onPress,
}: RecommendationCardProps) {
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  
  const isPlace = recommendation.entity_type === 'place';
  const item = isPlace ? recommendation.place : recommendation.event;

  if (!item) {
    return null;
  }

  const imageUrl = item.cover_image_url || undefined;
  const displayName = isPlace ? (recommendation.place?.name) : (recommendation.event?.title);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 rounded-lg overflow-hidden bg-card shadow-sm"
      style={{
        shadowColor: themeColors.foreground,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      {/* Image Container */}
      {imageUrl && (
        <View className="relative h-40 w-full bg-muted">
          <Image
            source={{ uri: imageUrl }}
            className="h-full w-full"
            resizeMode="cover"
          />
          {/* Star Badge */}
          <View className="absolute top-3 right-3 bg-primary rounded-full p-2">
            <Sparkles size={16} color={themeColors.primaryForeground} />
          </View>
        </View>
      )}

      {/* Content Container */}
      <View className="p-4">
        {/* Title */}
        <Text
          className="text-lg font-semibold text-foreground mb-2"
          numberOfLines={2}
        >
          ⭐ {displayName}
        </Text>

        {/* Location or Date */}
        <View className="flex-row items-center mb-2">
          {isPlace ? (
            <>
              <MapPin size={16} color={themeColors.mutedForeground} />
              <Text className="ml-2 text-sm text-muted-foreground">
                {recommendation.place?.city}
              </Text>
            </>
          ) : (
            <>
              <Calendar size={16} color={themeColors.mutedForeground} />
              <Text className="ml-2 text-sm text-muted-foreground">
                {formatDate(recommendation.event?.start_datetime || '')}
              </Text>
            </>
          )}
        </View>

        {/* Category Badge */}
        <View className="flex-row items-center mb-3">
          <View
            className={`inline-flex px-3 py-1 rounded-full ${
              isPlace ? 'bg-primary/20' : 'bg-accent/20'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isPlace ? 'text-primary' : 'text-accent-foreground'
              }`}
            >
              {isPlace
                ? (recommendation.place?.place_type || 'Locale').toUpperCase()
                : 'EVENTO'}
            </Text>
          </View>
        </View>

        {/* Reason */}
        {recommendation.reason && (
          <Text className="text-sm text-foreground italic mb-3">
            {recommendation.reason}
          </Text>
        )}

        {/* Source Badge */}
        <View className="flex-row justify-between items-center">
          <View>
            {recommendation.source === 'admin' && (
              <Text className="text-xs text-primary font-medium">
                Selezionato manualmente
              </Text>
            )}
            {recommendation.source === 'automatic' && (
              <Text className="text-xs text-primary font-medium">
                Trending per te
              </Text>
            )}
          </View>
          <Text className="text-xs text-muted-foreground">
            {new Date(recommendation.featured_date).toLocaleDateString(
              'it-IT'
            )}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
