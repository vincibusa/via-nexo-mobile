import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { QrCode, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { Reservation } from '../../lib/services/reservations';
import { formatDateTime, getEventStatus } from '../../lib/utils/date';

interface ReservationCardProps {
  reservation: Reservation;
  onViewQR: () => void;
  onCancel?: () => void;
  isDeleting?: boolean;
}

export function ReservationCard({
  reservation,
  onViewQR,
  onCancel,
  isDeleting = false,
}: ReservationCardProps) {
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  
  const eventStatus = reservation.event?.start_datetime
    ? getEventStatus(reservation.event.start_datetime)
    : 'upcoming';

  const statusColors = {
    upcoming: 'bg-primary/20',
    happening: 'bg-green-500/20',
    past: 'bg-muted',
  };

  const statusTextColors = {
    upcoming: 'text-primary',
    happening: 'text-green-600 dark:text-green-400',
    past: 'text-muted-foreground',
  };

  const statusLabels = {
    upcoming: 'In arrivo',
    happening: 'In corso',
    past: 'Passato',
  };

  return (
    <View className="bg-card rounded-lg border border-border overflow-hidden mb-4">
      {/* Image and Status Badge */}
      <View className="relative w-full h-40 bg-muted">
        {reservation.event?.cover_image_url && (
          <Image
            source={{ uri: reservation.event.cover_image_url }}
            className="w-full h-full"
          />
        )}
        <View
          className={`absolute top-2 right-2 px-3 py-1 rounded-full ${
            statusColors[eventStatus]
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              statusTextColors[eventStatus]
            }`}
          >
            {statusLabels[eventStatus]}
          </Text>
        </View>

        {/* Reservation Status Badge */}
        {reservation.status === 'checked_in' && (
          <View className="absolute top-2 left-2 px-3 py-1 rounded-full bg-green-500">
            <Text className="text-xs font-semibold text-primary-foreground">
              ✓ Registrato
            </Text>
          </View>
        )}
      </View>

      {/* Event Info */}
      <View className="p-4">
        <Text className="text-lg font-semibold text-foreground mb-1">
          {reservation.event?.title}
        </Text>

        {/* Date and Location */}
        {reservation.event?.start_datetime && (
          <Text className="text-sm text-muted-foreground mb-1">
            📅 {formatDateTime(reservation.event.start_datetime)}
          </Text>
        )}
        {reservation.event?.place?.name && (
          <Text className="text-sm text-muted-foreground mb-3">
            📍 {reservation.event.place.name}
          </Text>
        )}

        {/* Guest Count */}
        <View className="flex-row items-center gap-4 py-2 border-y border-border">
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">
              Persone nel gruppo
            </Text>
            <Text className="font-semibold text-foreground">
              {reservation.total_guests}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">
              Data prenotazione
            </Text>
            <Text className="font-semibold text-foreground">
              {reservation.created_at
                ? new Date(reservation.created_at)
                    .toLocaleDateString('it-IT')
                : '-'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2 p-4 border-t border-border">
        <Pressable
          onPress={onViewQR}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-primary"
        >
          <QrCode size={18} color={themeColors.primaryForeground} />
          <Text className="font-semibold text-primary-foreground">Mostra QR</Text>
        </Pressable>

        {/* Cancel button - visible for non-past events */}
        {eventStatus !== 'past' && onCancel && (
          <Pressable
            onPress={onCancel}
            disabled={isDeleting}
            className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg border border-destructive/30 bg-destructive/10"
          >
            <X size={18} color={themeColors.destructive} />
            <Text className="font-semibold text-destructive">Cancella</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
