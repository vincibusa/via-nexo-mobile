/**
 * Profile Reservations Component
 * Shows recent reservations in a compact list format
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { Reservation, reservationsService } from '../../lib/services/reservations';
import { formatDate, getEventStatus } from '../../lib/utils/date';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react-native';

interface ProfileReservationsProps {
  maxItems?: number;
  userId?: string; // If provided, fetch this user's reservations; otherwise fetch current user's
}

export function ProfileReservations({ maxItems = 5, userId }: ProfileReservationsProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get dynamic colors
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      // If userId is provided, fetch that user's reservations; otherwise fetch current user's
      const { data, error } = userId
        ? await reservationsService.getUserReservations(userId, 0, 50)
        : await reservationsService.getMyReservations(0, 50);

      if (!error && data) {
        // Sort by created_at descending (most recent first)
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        setReservations(sorted);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchReservations();
    }, [fetchReservations])
  );

  const handleViewAll = () => {
    router.push('/(app)/reservations' as any);
  };

  const handleReservationPress = (reservation: Reservation) => {
    router.push(`/(app)/reservations/${reservation.id}` as any);
  };

  if (isLoading) {
    return (
      <View className="px-4 py-4 items-center justify-center">
        <ActivityIndicator size="small" color={themeColors.foreground} />
      </View>
    );
  }

  if (reservations.length === 0) {
    return null; // Don't show anything if no reservations
  }

  const displayReservations = reservations.slice(0, maxItems);

  return (
    <View className="mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-lg font-semibold text-foreground">
          {userId ? 'Prenotazioni' : 'Le mie prenotazioni'}
        </Text>
        {reservations.length > maxItems && !userId && (
          <Pressable onPress={handleViewAll}>
            <Text className="text-sm text-primary font-medium">
              Vedi tutte
            </Text>
          </Pressable>
        )}
      </View>

      {/* Reservations List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {displayReservations.map((reservation) => {
          const eventStatus = reservation.event?.start_datetime
            ? getEventStatus(reservation.event.start_datetime)
            : 'upcoming';

          const statusColors = {
            upcoming: 'border-primary/30 bg-primary/10',
            happening: 'border-green-500/30 bg-green-500/10',
            past: 'border-muted bg-muted/50',
          };

          return (
            <Pressable
              key={reservation.id}
              onPress={userId ? undefined : () => handleReservationPress(reservation)}
              disabled={!!userId}
              className={`w-72 rounded-lg border overflow-hidden ${statusColors[eventStatus]}`}
            >
              {/* Event Image */}
              <View className="relative w-full h-32 bg-muted">
                {reservation.event?.cover_image_url ? (
                  <Image
                    source={{ uri: reservation.event.cover_image_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="w-full h-full items-center justify-center"
                    style={{ backgroundColor: themeColors.muted }}
                  >
                    <Calendar size={32} color={themeColors.mutedForeground} />
                  </View>
                )}
                {reservation.status === 'checked_in' && (
                  <View className="absolute top-2 right-2 px-2 py-1 rounded-full bg-green-500">
                    <Text className="text-xs font-semibold text-primary-foreground">
                      ✓ Registrato
                    </Text>
                  </View>
                )}
              </View>

              {/* Event Info */}
              <View className="p-3">
                <Text
                  className="text-base font-semibold text-foreground mb-1"
                  numberOfLines={1}
                >
                  {reservation.event?.title || 'Evento'}
                </Text>

                {/* Date */}
                {reservation.event?.start_datetime && (
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Calendar size={12} color={themeColors.mutedForeground} />
                    <Text className="text-xs text-muted-foreground">
                      {formatDate(reservation.event.start_datetime)}
                    </Text>
                  </View>
                )}

                {/* Location */}
                {reservation.event?.place?.name && (
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <MapPin size={12} color={themeColors.mutedForeground} />
                    <Text
                      className="text-xs text-muted-foreground flex-1"
                      numberOfLines={1}
                    >
                      {reservation.event.place.name}
                    </Text>
                  </View>
                )}

                {/* Guest Count and Reservation Date */}
                <View className="flex-row items-center justify-between pt-2 border-t border-border/50">
                  <View className="flex-row items-center gap-1.5">
                    <Users size={12} color={themeColors.mutedForeground} />
                    <Text className="text-xs text-muted-foreground">
                      {reservation.total_guests} {reservation.total_guests === 1 ? 'persona' : 'persone'}
                    </Text>
                  </View>
                  {/* Only show chevron for own profile (clickable) */}
                  {!userId && <ChevronRight size={14} color={themeColors.mutedForeground} />}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* View All Button (if more than maxItems) */}
      {reservations.length > maxItems && (
        <View className="px-4 mt-2">
          <Pressable
            onPress={handleViewAll}
            className="py-2 rounded-lg border border-input items-center"
          >
            <Text className="text-sm font-medium text-foreground">
              Vedi tutte le prenotazioni ({reservations.length})
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

