import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { View, Image, Pressable } from 'react-native';
import { MapPin,  Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { SuggestedPlace } from '../../lib/types/suggestion';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../lib/theme';

interface ChatSuggestionCardsProps {
  suggestions: SuggestedPlace[];
}

export function ChatSuggestionCards({ suggestions }: ChatSuggestionCardsProps) {
  const { colorScheme } = useColorScheme();
  const themeColors = THEME[colorScheme === 'dark' ? 'dark' : 'light'];

  const router = useRouter();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View className="mt-3 gap-3">
      {suggestions.map((place, index) => (
        <Animated.View
          key={place.id}
          entering={FadeInDown.delay(index * 150)
            .duration(400)
            .springify()}
        >
          <SuggestionCard place={place} />
        </Animated.View>
      ))}
    </View>
  );
}

function SuggestionCard({ place }: { place: SuggestedPlace }) {
  const { colorScheme } = useColorScheme();
  const themeColors = THEME[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const handlePress = () => {
    // Check if this is an event (marked with _isEvent flag)
    const isEvent = (place as any)._isEvent;
    
    if (isEvent) {
      // Navigate to event detail
      router.push({
        pathname: `/event/${place.id}` as any,
      });
    } else {
      // Navigate to place detail
      router.push({
        pathname: `/place/${place.id}` as any,
        params: {
          ai_reason: place.ai_reason,
        },
      });
    }
  };

  const handleFavorite = () => {
    // TODO: Implementare logica favoriti
    console.log('Add to favorites:', place.id);
  };

  // Determina se abbiamo un'immagine da mostrare
  const imageUrl = place.cover_image || place.gallery_images?.[0];

  return (
    <Pressable
      onPress={handlePress}
      className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-lg active:opacity-90"
    >
      {/* Image with gradient overlay */}
      {imageUrl ? (
        <View className="relative h-48 w-full">
          <Image
            source={{ uri: imageUrl }}
            className="h-full w-full"
            resizeMode="cover"
          />
          {/* Gradient overlay for better text visibility */}
          <View className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

          {/* Floating badge on image */}
          {place.verified && (
            <View className="absolute right-3 top-3 rounded-full bg-green-500 px-3 py-1">
              <Text className="text-xs font-bold text-primary-foreground">✓ Verificato</Text>
            </View>
          )}

          {/* Price badge */}
          {place.price_range && (
            <View className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1.5">
              <Text className="text-sm font-bold text-primary-foreground">{place.price_range}</Text>
            </View>
          )}
        </View>
      ) : (
        /* Placeholder quando non c'è immagine */
        <View className="h-48 w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          <Text className="text-6xl opacity-30">📍</Text>
          <Text className="mt-2 text-sm text-muted-foreground">Nessuna foto disponibile</Text>
        </View>
      )}

      {/* Content */}
      <View className="gap-4 p-4">
        {/* Title & Category */}
        <View className="gap-1.5">
          <Text className="text-xl font-bold leading-tight">{place.name}</Text>
          <Text className="text-sm capitalize text-muted-foreground">
            {place.category?.replace('_', ' ')}
          </Text>
        </View>

        {/* AI Reason - Highlighted */}
        {place.ai_reason && (
          <View className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary p-3">
            <Text className="text-sm font-medium leading-relaxed text-foreground">
              💭 {place.ai_reason}
            </Text>
          </View>
        )}

        {/* Location Info */}
        {place.address && (
          <View className="flex-row items-start gap-2">
            <MapPin size={16} color={themeColors.foreground} />
            <Text className="flex-1 text-sm text-foreground" numberOfLines={2}>
              {place.address}, {place.city}
            </Text>
          </View>
        )}

        {/* Tags */}
        {(place.ambience_tags || place.music_genre) && (
          <View className="flex-row flex-wrap gap-2">
            {place.ambience_tags?.slice(0, 3).map((tag) => (
              <View key={tag} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
                <Text className="text-xs font-medium text-foreground capitalize">{tag}</Text>
              </View>
            ))}
            {place.music_genre?.slice(0, 2).map((genre) => (
              <View key={genre} className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5">
                <Text className="text-xs font-medium text-purple-600 dark:text-purple-400">🎵 {genre}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-3 pt-2">
          <Button
            onPress={handlePress}
            className="flex-1 h-12 bg-primary"
          >
            <Text className="font-bold text-primary-foreground">Scopri di più</Text>
          </Button>
          <Pressable
            onPress={handleFavorite}
            className="h-12 w-12 items-center justify-center rounded-xl border-2 border-red-500/30 bg-red-500/10 active:bg-red-500/20"
          >
            <Heart size={22} color="#ef4444" fill="transparent" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
