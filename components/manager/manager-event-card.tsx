/**
 * Manager Event Card
 * Compact card for displaying events in the manager's events list
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Edit } from 'lucide-react-native';
import type { ManagerEvent } from '../../lib/types/manager';

interface ManagerEventCardProps {
  event: ManagerEvent;
}

export function ManagerEventCard({ event }: ManagerEventCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset image state when event changes (important for FlatList reuse)
  useEffect(() => {
    if (event.cover_image_url) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [event.cover_image_url, event.id]);

  // Format date
  const eventDate = new Date(event.start_datetime);
  const formattedDate = eventDate.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Determine if event is past
  const isPast = eventDate < new Date();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/manager/events/${event.id}/edit` as any)}
      className="bg-card rounded-xl overflow-hidden border border-border mb-3 active:opacity-70"
    >
      <View className="flex-row">
        {/* Cover Image */}
        <View className="w-24 h-24 bg-muted overflow-hidden">
          {event.cover_image_url && !imageError ? (
            <>
              {imageLoading && (
                <View className="absolute w-full h-full items-center justify-center bg-muted">
                  <ActivityIndicator size="small" color="#888" />
                </View>
              )}
              <Image
                key={`${event.id}-${event.cover_image_url}`}
                source={{ uri: event.cover_image_url }}
                className="w-full h-full"
                resizeMode="cover"
                onError={(error) => {
                  console.error('[ManagerEventCard] Image load error:', error.nativeEvent.error);
                  console.error('[ManagerEventCard] Failed URL:', event.cover_image_url);
                  setImageError(true);
                  setImageLoading(false);
                }}
                onLoad={() => {
                  console.log('[ManagerEventCard] Image loaded successfully');
                  setImageLoading(false);
                }}
                onLoadStart={() => {
                  setImageLoading(true);
                  setImageError(false);
                }}
              />
            </>
          ) : (
            <View className="w-full h-full bg-muted items-center justify-center">
              <Calendar size={32} color="#888" />
            </View>
          )}
        </View>

        {/* Event Info */}
        <View className="flex-1 p-3">
          {/* Title */}
          <Text
            className={`text-base font-semibold ${
              isPast ? 'text-muted-foreground' : 'text-foreground'
            } mb-1`}
            numberOfLines={1}
          >
            {event.title}
          </Text>

          {/* Date & Time */}
          <View className="flex-row items-center mb-1">
            <Calendar size={14} className="text-muted-foreground mr-1" />
            <Text className="text-sm text-muted-foreground">
              {formattedDate} • {formattedTime}
            </Text>
          </View>

          {/* Venue */}
          {event.place && (
            <View className="flex-row items-center mb-2">
              <MapPin size={14} className="text-muted-foreground mr-1" />
              <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                {event.place.name}, {event.place.city}
              </Text>
            </View>
          )}

          {/* Status Badges */}
          <View className="flex-row gap-2">
            {/* Published Status */}
            <View
              className={`px-2 py-1 rounded ${
                event.is_published ? 'bg-green-500/20' : 'bg-yellow-500/20'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  event.is_published ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}
              >
                {event.is_published ? 'Pubblicato' : 'Bozza'}
              </Text>
            </View>

            {/* Past Event Badge */}
            {isPast && (
              <View className="px-2 py-1 rounded bg-muted">
                <Text className="text-xs font-medium text-muted-foreground">
                  Passato
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Edit Icon */}
        <View className="p-3 justify-center">
          <Edit size={20} className="text-muted-foreground" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
