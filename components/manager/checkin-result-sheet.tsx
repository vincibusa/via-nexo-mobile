/**
 * Check-in Result Bottom Sheet
 * Shows reservation details after QR scan and allows check-in
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { CheckCircle, XCircle, Users, Calendar } from 'lucide-react-native';
import type { Reservation } from '../../lib/services/reservations';

interface CheckinResultSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  reservation: Reservation | null;
  isLoading: boolean;
  onCheckIn: () => void;
  onClose: () => void;
}

export function CheckinResultSheet({
  bottomSheetRef,
  reservation,
  isLoading,
  onCheckIn,
  onClose,
}: CheckinResultSheetProps) {
  const snapPoints = useMemo(() => ['60%'], []);

  const isAlreadyCheckedIn = reservation?.status === 'checked_in';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: '#1a1a1a' }}
      handleIndicatorStyle={{ backgroundColor: '#666' }}
    >
      <BottomSheetView className="flex-1 px-4">
        {reservation ? (
          <>
            {/* Header */}
            <View className="items-center mb-6">
              {isAlreadyCheckedIn ? (
                <View className="w-16 h-16 rounded-full bg-yellow-500/20 items-center justify-center mb-3">
                  <CheckCircle size={32} className="text-yellow-500" />
                </View>
              ) : (
                <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-3">
                  <CheckCircle size={32} className="text-green-500" />
                </View>
              )}
              <Text className="text-xl font-bold text-foreground text-center">
                {isAlreadyCheckedIn ? 'Già Effettuato Check-in' : 'Prenotazione Valida'}
              </Text>
            </View>

            {/* User Info */}
            <View className="bg-muted rounded-xl p-4 mb-4">
              <View className="flex-row items-center mb-3">
                {reservation.owner?.avatar_url ? (
                  <Image
                    source={{ uri: reservation.owner.avatar_url }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-3">
                    <Text className="text-primary-foreground font-bold text-lg">
                      {reservation.owner?.display_name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-lg">
                    {reservation.owner?.display_name || 'Utente'}
                  </Text>
                  {reservation.owner?.email && (
                    <Text className="text-muted-foreground text-sm">
                      {reservation.owner.email}
                    </Text>
                  )}
                </View>
              </View>

              {/* Event Info */}
              {reservation.event && (
                <View className="border-t border-border pt-3">
                  <View className="flex-row items-center mb-2">
                    <Calendar size={16} className="text-muted-foreground mr-2" />
                    <Text className="text-foreground font-medium">
                      {reservation.event.title}
                    </Text>
                  </View>
                  <Text className="text-muted-foreground text-sm">
                    {new Date(reservation.event.start_datetime).toLocaleString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Guests Count */}
            <View className="bg-muted rounded-xl p-4 mb-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Users size={20} className="text-muted-foreground mr-2" />
                  <Text className="text-foreground font-medium">Ospiti Totali</Text>
                </View>
                <Text className="text-foreground font-bold text-lg">
                  {reservation.total_guests}
                </Text>
              </View>
            </View>

            {/* Check-in Time */}
            {isAlreadyCheckedIn && reservation.checked_in_at && (
              <View className="bg-yellow-500/10 rounded-xl p-4 mb-6">
                <Text className="text-yellow-600 dark:text-yellow-400 font-medium text-center">
                  Check-in effettuato il{' '}
                  {new Date(reservation.checked_in_at).toLocaleString('it-IT', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              onPress={isAlreadyCheckedIn ? onClose : onCheckIn}
              disabled={isLoading}
              className={`py-4 rounded-xl items-center ${
                isAlreadyCheckedIn ? 'bg-muted' : 'bg-primary'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className={`font-semibold text-lg ${
                  isAlreadyCheckedIn ? 'text-foreground' : 'text-primary-foreground'
                }`}>
                  {isAlreadyCheckedIn ? 'Chiudi' : 'Conferma Check-in'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-3">
              <XCircle size={32} className="text-red-500" />
            </View>
            <Text className="text-xl font-bold text-foreground mb-2">
              QR Code Non Valido
            </Text>
            <Text className="text-muted-foreground text-center mb-6">
              Il QR code scansionato non corrisponde a nessuna prenotazione valida
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="bg-muted px-6 py-3 rounded-lg"
            >
              <Text className="text-foreground font-semibold">Chiudi</Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
