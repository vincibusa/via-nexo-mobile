import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import QRCode from 'react-native-qrcode-svg';
import { X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { Reservation } from '../../lib/services/reservations';
import { formatDateTime } from '../../lib/utils/date';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  isLoading?: boolean;
}

export function QRCodeModal({
  visible,
  onClose,
  reservation,
  isLoading = false,
}: QRCodeModalProps) {
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  
  const [qrSize, setQrSize] = useState(250);

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['60%'], []);

  // Handle sheet changes
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );
  

  const handleShare = async () => {
    if (!reservation) return;

    try {
      await Share.share({
        message: `Unisciti a me all'evento "${reservation.event?.title}"! 🎉\n\nData: ${
          reservation.event?.start_datetime
            ? formatDateTime(reservation.event.start_datetime)
            : 'Data non specificata'
        }\nLuogo: ${reservation.event?.place?.name || 'Location'}`,
        title: `Invito - ${reservation.event?.title}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: themeColors.card,
      }}
      handleIndicatorStyle={{
        backgroundColor: themeColors.mutedForeground,
      }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <View className="flex-1 px-4">
          {/* Header */}
          <View className="pb-4 border-b border-border">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-foreground flex-1">
                Il tuo QR Code
              </Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <X size={24} color={themeColors.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          {isLoading ? (
            <View className="flex-1 py-8 items-center justify-center">
              <ActivityIndicator size="large" color={themeColors.foreground} />
            </View>
          ) : reservation ? (
            <ScrollView className="flex-1 p-4">
              {/* Event Info */}
              <View className="mb-6">
                <Text className="font-semibold text-foreground mb-2">
                  {reservation.event?.title}
                </Text>
                {reservation.event?.start_datetime && (
                  <Text className="text-sm text-muted-foreground mb-1">
                    📅 {formatDateTime(reservation.event.start_datetime)}
                  </Text>
                )}
                {reservation.event?.place?.name && (
                  <Text className="text-sm text-muted-foreground">
                    📍 {reservation.event.place.name}
                  </Text>
                )}
              </View>

              {/* QR Code */}
              <View className="items-center bg-muted p-4 rounded-lg mb-6">
                {reservation.qr_code_token ? (
                  <QRCode
                    value={JSON.stringify({
                      type: 'nexo_reservation',
                      token: reservation.qr_code_token,
                      v: 1,
                    })}
                    size={qrSize}
                    color={themeColors.foreground}
                    backgroundColor={themeColors.background}
                  />
                ) : (
                  <View className="items-center justify-center py-8">
                    <Text className="text-muted-foreground text-center">
                      QR Code non disponibile
                    </Text>
                  </View>
                )}
              </View>

              {/* Reservation Details */}
              <View className="bg-muted/50 p-3 rounded-lg mb-6">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs text-muted-foreground">
                    Persone nel gruppo
                  </Text>
                  <Text className="font-semibold text-foreground">
                    {reservation.total_guests}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">
                    Stato
                  </Text>
                  <Text className="font-semibold text-foreground capitalize">
                    {reservation.status === 'confirmed'
                      ? 'Confermata'
                      : reservation.status === 'checked_in'
                      ? 'Registrato'
                      : reservation.status}
                  </Text>
                </View>
              </View>

              {/* Instructions */}
              <View className="mb-6 p-3 bg-primary/10 rounded-lg">
                <Text className="text-xs font-semibold text-primary mb-2">
                  Come funziona
                </Text>
                <Text className="text-xs text-foreground leading-5">
                  Mostra questo QR code al personale del locale per il check-in
                  all'evento. Mantieni lo schermo luminoso per una migliore
                  scansione.
                </Text>
              </View>
            </ScrollView>
          ) : (
            <View className="flex-1 py-8 items-center justify-center">
              <Text className="text-muted-foreground">
                Nessuna prenotazione disponibile
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 pt-4 border-t border-border">
            <Pressable
              onPress={handleShare}
              disabled={!reservation}
              className="flex-1 py-3 rounded-lg border border-input items-center"
            >
              <Text className="font-semibold text-foreground">Condividi</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-lg bg-primary items-center"
            >
              <Text className="font-semibold text-primary-foreground">Chiudi</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
