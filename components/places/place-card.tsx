import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import type { Place } from '../../lib/types/suggestion';
import { Card } from '../ui/card';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';

interface PlaceCardProps {
  place: Place & { distance_km?: number; events_count?: number };
}

export const PlaceCard = React.memo(({ place }: PlaceCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/place/${ place.id}` as any);
  };

  return (
    <Pressable onPress={handlePress} className="mb-3 active:opacity-80">
      <Card className="flex-row overflow-hidden p-0 border-0" style={{ height: 136 }}>
        {/* Image */}
        <View className="w-[160px] h-full">
          {place.cover_image ? (
            <Image
              source={{ uri: place.cover_image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-muted items-center justify-center">
              <Text className="text-4xl opacity-30">🏪</Text>
            </View>
          )}
          {place.verified && (
            <Badge variant="default" className="absolute top-2 left-2">
              <Text>✓ Verificato</Text>
            </Badge>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 p-3 justify-between">
          {/* Top section */}
          <View>
            <Text className="text-base font-semibold mb-1" numberOfLines={1}>
              {place.name}
            </Text>

            <View className="flex-row items-center mb-1">
              <Text variant="muted" className="capitalize">
                {place.category}
              </Text>
              {place.price_range && (
                <>
                  <Text variant="muted" className="mx-1">
                    •
                  </Text>
                  <Text variant="muted">{place.price_range}</Text>
                </>
              )}
            </View>

            {place.description && (
              <Text variant="muted" numberOfLines={2}>
                {place.description}
              </Text>
            )}
          </View>

          {/* Bottom section */}
          <View className="flex-row items-center justify-between">
            {place.distance_km !== undefined && (
              <View className="flex-row items-center">
                <MapPin size={12} className="text-muted-foreground" />
                <Text variant="muted" className="ml-1">
                  {place.distance_km < 1
                    ? `${Math.round(place.distance_km * 1000)} m`
                    : `${place.distance_km.toFixed(1)} km`}
                </Text>
              </View>
            )}

            {place.events_count !== undefined && place.events_count > 0 && (
              <Badge variant="secondary">
                <Text>
                  {place.events_count} {place.events_count === 1 ? 'evento' : 'eventi'}
                </Text>
              </Badge>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
});

PlaceCard.displayName = 'PlaceCard';
