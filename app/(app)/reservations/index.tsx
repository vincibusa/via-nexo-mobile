import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSettings } from '../../../lib/contexts/settings';
import { THEME } from '../../../lib/theme';
import { ChevronLeft } from 'lucide-react-native';
import { Reservation, reservationsService } from '../../../lib/services/reservations';
import { ReservationCard } from '../../../components/reservations/reservation-card';
import { QRCodeModal } from '../../../components/reservations/qr-code-modal';
import { useAuth } from '../../../lib/contexts/auth';
import { useColorScheme } from 'nativewind';

export default function ReservationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { colorScheme } = useColorScheme();

  // Get effective theme based on user settings
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : settings?.theme === 'dark'
    ? 'dark'
    : 'light';
  const themeColors = THEME[effectiveTheme];
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const loadReservations = useCallback(async () => {
    try {
      const { data, error } = await reservationsService.getMyReservations(0, 50);
      if (!error && data) {
        setReservations(data);
      }
    } catch (error) {
      console.error('Load reservations error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReservations();
    }, [loadReservations])
  );

  const handleViewQR = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowQRModal(true);
  };

  const handleCancelReservation = async (reservationId: string) => {
    setIsDeletingId(reservationId);
    try {
      const { error } = await reservationsService.cancelReservation(
        reservationId
      );
      if (!error) {
        setReservations((prev) =>
          prev.filter((r) => r.id !== reservationId)
        );
      }
    } catch (error) {
      console.error('Cancel reservation error:', error);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReservations();
  };

  // Separate reservations by status
  const upcomingReservations = reservations.filter(
    (r) =>
      r.event?.start_datetime &&
      new Date(r.event.start_datetime) > new Date()
  );

  const pastReservations = reservations.filter(
    (r) =>
      !r.event?.start_datetime ||
      new Date(r.event.start_datetime) <= new Date()
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={themeColors.foreground} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border bg-background">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={24} color={themeColors.foreground} />
        </Pressable>
        <Text className="flex-1 text-2xl font-bold text-foreground">
          Le mie prenotazioni
        </Text>
      </View>

      {/* Content */}
      {reservations.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-lg text-muted-foreground text-center mb-2">
            Non hai prenotazioni
          </Text>
          <Text className="text-sm text-muted-foreground text-center">
            Visita un evento e prenota un posto per te e i tuoi follower
          </Text>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)')}
            className="mt-4 px-4 py-2 rounded-lg bg-primary"
          >
            <Text className="text-primary-foreground font-semibold">
              Scopri eventi
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={
            upcomingReservations.length > 0
              ? upcomingReservations
              : pastReservations
          }
          renderItem={({ item }) => (
            <ReservationCard
              reservation={item}
              onViewQR={() => handleViewQR(item)}
              onCancel={() => handleCancelReservation(item.id)}
              isDeleting={isDeletingId === item.id}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          ListHeaderComponent={
            upcomingReservations.length > 0 && pastReservations.length > 0 ? (
              <View className="mb-4">
                <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  In arrivo
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            upcomingReservations.length > 0 && pastReservations.length > 0 ? (
              <View className="mt-6 mb-4">
                <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Passate
                </Text>
                <FlatList
                  data={pastReservations}
                  renderItem={({ item }) => (
                    <ReservationCard
                      reservation={item}
                      onViewQR={() => handleViewQR(item)}
                      onCancel={undefined}
                      isDeleting={isDeletingId === item.id}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            ) : null
          }
        />
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        reservation={selectedReservation}
      />
    </SafeAreaView>
  );
}
