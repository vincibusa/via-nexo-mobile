import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Calendar } from 'lucide-react-native';
import type { EventListItem } from '../../lib/services/events-list';
import { Card } from '../ui/card';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';

interface EventCardProps {
  event: EventListItem;
}

export const EventCard = React.memo(({ event }: EventCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/event/${event.id}` as any);
  };

  const formatDate = (datetime: string) => {
    const date = new Date(datetime);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('it-IT', { month: 'short' }),
      time: date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const { day, month, time } = formatDate(event.start_datetime);

  return (
    <Pressable onPress={handlePress} className="mb-4 active:opacity-80">
      <Card className="overflow-hidden p-0 border-0">
        {/* Image with date overlay */}
        <View className="w-full aspect-[16/9] relative">
          {event.cover_image ? (
            <Image source={{ uri: event.cover_image }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-muted items-center justify-center">
              <Text className="text-6xl opacity-30">🎉</Text>
            </View>
          )}

          {/* Date badge overlay */}
          <View className="absolute top-3 left-3 bg-background/95 rounded-lg p-2 min-w-[56px] items-center">
            <Text className="text-2xl font-bold leading-tight">{day}</Text>
            <Text variant="muted" className="text-xs uppercase">
              {month}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-4">
          {/* Title */}
          <Text className="text-lg font-semibold mb-2" numberOfLines={2}>
            {event.title}
          </Text>

          {/* Time and event type */}
          <View className="flex-row items-center mb-2">
            <Calendar size={14} className="text-muted-foreground" />
            <Text variant="muted" className="ml-1.5">
              {time}
            </Text>
            <Text variant="muted" className="mx-1.5">
              •
            </Text>
            <Text variant="muted" className="capitalize">
              {event.event_type}
            </Text>
          </View>

          {/* Place */}
          {event.place && (
            <View className="flex-row items-center mb-3">
              <MapPin size={14} className="text-muted-foreground" />
              <Text variant="muted" className="ml-1.5" numberOfLines={1}>
                {event.place.name}
                {event.distance_km !== undefined &&
                  ` • ${
                    event.distance_km < 1
                      ? `${Math.round(event.distance_km * 1000)} m`
                      : `${event.distance_km.toFixed(1)} km`
                  }`}
              </Text>
            </View>
          )}

          {/* Price and music genre */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {event.ticket_price_min !== undefined && event.ticket_price_min !== null && (
                <Badge variant="outline">
                  <Text>
                    {event.ticket_price_min === 0
                      ? 'Gratis'
                      : event.ticket_price_max && event.ticket_price_max !== event.ticket_price_min
                        ? `€${event.ticket_price_min}-${event.ticket_price_max}`
                        : `€${event.ticket_price_min}`}
                  </Text>
                </Badge>
              )}
              {event.music_genre && event.music_genre.length > 0 && (
                <Badge variant="secondary">
                  <Text>{event.music_genre[0]}</Text>
                </Badge>
              )}
            </View>

            {event.place?.verified && (
              <Badge variant="default">
                <Text>✓</Text>
              </Badge>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
});

EventCard.displayName = 'EventCard';
