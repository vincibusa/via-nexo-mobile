import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Calendar } from 'lucide-react-native';
import type { EventListItem } from '../../lib/services/events-list';
import { Card } from '../ui/card';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../lib/theme';

interface EventCardProps {
  event: EventListItem;
  variant?: 'list' | 'grid';
}

export const EventCard = React.memo(({ event, variant = 'list' }: EventCardProps) => {
  const { colorScheme } = useColorScheme();
  const themeColors = THEME[colorScheme === 'dark' ? 'dark' : 'light'];

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

  if (variant === 'grid') {
    return (
      <Pressable onPress={handlePress} className="flex-1 mb-3 active:opacity-80">
        <Card className="flex-col overflow-hidden p-0 border-0 h-[220px]">
          {/* Image with date overlay */}
          <View className="w-full h-[120px] relative">
            {event.cover_image ? (
              <Image source={{ uri: event.cover_image }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="w-full h-full bg-muted items-center justify-center">
                <Text className="text-4xl opacity-30">🎉</Text>
              </View>
            )}

            {/* Date badge overlay */}
            <View className="absolute top-2 left-2 bg-background/95 rounded-md p-1 min-w-[36px] items-center">
              <Text className="text-base font-bold leading-tight">{day}</Text>
              <Text variant="muted" className="text-[8px] uppercase leading-tight">
                {month}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1 p-2 justify-between">
            <View>
              <Text className="text-sm font-semibold mb-0.5" numberOfLines={2}>
                {event.title}
              </Text>
              <View className="flex-row items-center">
                <Calendar size={10} color={themeColors.mutedForeground} />
                <Text variant="muted" className="ml-1 text-[10px]">
                  {time}
                </Text>
              </View>
            </View>

            {event.place && (
              <View className="flex-row items-center mt-1">
                <MapPin size={10} color={themeColors.mutedForeground} />
                <Text variant="muted" className="ml-1 text-[10px]" numberOfLines={1}>
                  {event.place.name}
                </Text>
              </View>
            )}
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} className="mb-3 active:opacity-80">
      <Card className="flex-row overflow-hidden p-0 border-0" style={{ height: 136 }}>
        {/* Image with date overlay */}
        <View className="w-[160px] h-full relative">
          {event.cover_image ? (
            <Image source={{ uri: event.cover_image }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-muted items-center justify-center">
              <Text className="text-4xl opacity-30">🎉</Text>
            </View>
          )}

          {/* Date badge overlay */}
          <View className="absolute top-2 left-2 bg-background/95 rounded-lg p-1.5 min-w-[48px] items-center">
            <Text className="text-xl font-bold leading-tight">{day}</Text>
            <Text variant="muted" className="text-[10px] uppercase leading-tight">
              {month}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 p-3 justify-between">
          {/* Top section */}
          <View>
            <Text className="text-base font-semibold mb-1" numberOfLines={1}>
              {event.title}
            </Text>

            <View className="flex-row items-center mb-1">
              <Calendar size={12} color={themeColors.mutedForeground} />
              <Text variant="muted" className="ml-1 text-xs">
                {time}
              </Text>
              <Text variant="muted" className="mx-1 text-xs">
                •
              </Text>
              <Text variant="muted" className="capitalize text-xs">
                {event.event_type}
              </Text>
            </View>

            {event.place && (
              <View className="flex-row items-center">
                <MapPin size={12} color={themeColors.mutedForeground} />
                <Text variant="muted" className="ml-1 text-xs" numberOfLines={1}>
                  {event.place.name}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom section */}
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
            </View>

            {event.distance_km !== undefined && (
              <View className="flex-row items-center">
                <MapPin size={12} color={themeColors.mutedForeground} />
                <Text variant="muted" className="ml-1 text-xs">
                  {event.distance_km < 1
                    ? `${Math.round(event.distance_km * 1000)} m`
                    : `${event.distance_km.toFixed(1)} km`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
});

EventCard.displayName = 'EventCard';
