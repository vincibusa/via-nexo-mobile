import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSettings } from '../../../lib/contexts/settings';
import { THEME } from '../../../lib/theme';
import { ChevronLeft, Trash } from 'lucide-react-native';
import { Reservation, reservationsService } from '../../../lib/services/reservations';
import { QRCodeModal } from '../../../components/reservations/qr-code-modal';
import { formatDateTime } from '../../../lib/utils/date';

export default function ReservationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useSettings();
  
  // Use dark theme (single theme for the app)
  const themeColors = THEME.dark;
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReservation = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await reservationsService.getReservation(id);
      if (!error && data) {
        setReservation(data);
      }
    } catch (error) {
      console.error('Load reservation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadReservation();
    }, [loadReservation])
  );

  const handleCancelReservation = () => {
    if (!reservation) return;

    Alert.alert(
      'Cancella prenotazione',
      `Sei sicuro di voler cancellare la prenotazione per "${reservation.event?.title}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sì, cancella',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await reservationsService.cancelReservation(
                reservation.id
              );
              if (!error) {
                router.back();
              }
            } catch (error) {
              console.error('Cancel reservation error:', error);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={themeColors.foreground} />
      </SafeAreaView>
    );
  }

  if (!reservation) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ChevronLeft size={24} color={themeColors.foreground} />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-foreground">
            Prenotazione non trovata
          </Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">
            Questa prenotazione non esiste più
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const eventStatus =
    reservation.event?.start_datetime &&
    new Date(reservation.event.start_datetime) > new Date()
      ? 'upcoming'
      : 'past';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={24} color={themeColors.foreground} />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-foreground">
          Dettagli prenotazione
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Event Info */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            {reservation.event?.title}
          </Text>
          {reservation.event?.start_datetime && (
            <Text className="text-base text-muted-foreground mb-1">
              📅 {formatDateTime(reservation.event.start_datetime)}
            </Text>
          )}
          {reservation.event?.place?.name && (
            <Text className="text-base text-muted-foreground">
              📍 {reservation.event.place.name}
            </Text>
          )}
        </View>

        {/* Status and Details */}
        <View className="bg-muted/50 p-4 rounded-lg mb-6">
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-muted-foreground">
              Stato prenotazione
            </Text>
            <Text className="font-semibold text-foreground capitalize">
              {reservation.status === 'confirmed'
                ? 'Confermata'
                : reservation.status === 'checked_in'
                ? 'Registrato'
                : reservation.status}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-muted-foreground">
              Persone nel gruppo
            </Text>
            <Text className="font-semibold text-foreground">
              {reservation.total_guests}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">
              Data prenotazione
            </Text>
            <Text className="font-semibold text-foreground">
              {reservation.created_at
                ? new Date(reservation.created_at).toLocaleDateString('it-IT')
                : '-'}
            </Text>
          </View>
        </View>

        {/* QR Code Button */}
        <Pressable
          onPress={() => setShowQRModal(true)}
          className="w-full py-3 rounded-lg bg-primary items-center mb-6"
        >
          <Text className="font-semibold text-primary-foreground">
            Mostra QR code
          </Text>
        </Pressable>

        {/* Cancel Button */}
        {eventStatus === 'upcoming' && (
          <Pressable
            onPress={handleCancelReservation}
            disabled={isDeleting}
            className="w-full py-3 rounded-lg border border-destructive/30 bg-destructive/10 items-center flex-row justify-center gap-2"
          >
            <Trash size={18} color={themeColors.destructive} />
            <Text className="font-semibold text-destructive">
              Cancella prenotazione
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        reservation={reservation}
      />
    </SafeAreaView>
  );
}
