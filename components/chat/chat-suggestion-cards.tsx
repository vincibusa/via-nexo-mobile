import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { View, Image, Pressable } from 'react-native';
import { MapPin, Phone, Globe, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { SuggestedPlace } from '@/lib/types/suggestion';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ChatSuggestionCardsProps {
  suggestions: SuggestedPlace[];
}

export function ChatSuggestionCards({ suggestions }: ChatSuggestionCardsProps) {
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
  const router = useRouter();

  const handlePress = () => {
    router.push(`/(app)/places/${place.id}` as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="overflow-hidden rounded-xl border border-border bg-card active:opacity-90"
    >
      {/* Image */}
      {place.cover_image && (
        <Image
          source={{ uri: place.cover_image }}
          className="h-40 w-full bg-muted"
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View className="gap-3 p-4">
        {/* Title & Type */}
        <View className="gap-1">
          <Text className="text-lg font-bold">{place.name}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm capitalize text-muted-foreground">
              {place.category?.replace('_', ' ')}
            </Text>
            {place.price_range && (
              <>
                <Text className="text-muted-foreground">•</Text>
                <Text className="text-sm font-semibold text-primary">{place.price_range}</Text>
              </>
            )}
            {place.verified && (
              <>
                <Text className="text-muted-foreground">•</Text>
                <Text className="text-sm">✓ Verificato</Text>
              </>
            )}
          </View>
        </View>

        {/* AI Reason */}
        {place.ai_reason && (
          <View className="rounded-lg bg-primary/10 p-3">
            <Text className="text-sm italic leading-relaxed text-foreground">
              "{place.ai_reason}"
            </Text>
          </View>
        )}

        {/* Info Row */}
        <View className="gap-2">
          {place.address && (
            <View className="flex-row items-center gap-2">
              <MapPin size={14} className="text-muted-foreground" />
              <Text className="flex-1 text-sm text-muted-foreground" numberOfLines={1}>
                {place.address}, {place.city}
              </Text>
            </View>
          )}
          {place.phone && (
            <View className="flex-row items-center gap-2">
              <Phone size={14} className="text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">{place.phone}</Text>
            </View>
          )}
          {place.website && (
            <View className="flex-row items-center gap-2">
              <Globe size={14} className="text-muted-foreground" />
              <Text className="text-sm text-primary" numberOfLines={1}>
                {place.website}
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {(place.ambience_tags || place.music_genre) && (
          <View className="flex-row flex-wrap gap-2">
            {place.ambience_tags?.slice(0, 3).map((tag) => (
              <View key={tag} className="rounded-full bg-muted px-2 py-1">
                <Text className="text-xs text-muted-foreground capitalize">{tag}</Text>
              </View>
            ))}
            {place.music_genre?.slice(0, 2).map((genre) => (
              <View key={genre} className="rounded-full bg-muted px-2 py-1">
                <Text className="text-xs text-muted-foreground">🎵 {genre}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-2">
          <Button onPress={handlePress} className="flex-1">
            <Text className="font-semibold">Dettagli</Text>
          </Button>
          <Button variant="outline" className="px-4">
            <Heart size={18} className="text-foreground" />
          </Button>
        </View>
      </View>
    </Pressable>
  );
}
