/**
 * QR Scanner Screen
 * Scans QR codes and performs check-in for reservations
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import BottomSheet from '@gorhom/bottom-sheet';
import { QRScannerOverlay } from '../../../components/manager/qr-scanner-overlay';
import { CheckinResultSheet } from '../../../components/manager/checkin-result-sheet';
import { reservationsService } from '../../../lib/services/reservations';
import { managerService } from '../../../lib/services/manager';
import type { Reservation } from '../../../lib/services/reservations';

export default function ScannerScreen() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scannedReservation, setScannedReservation] = useState<Reservation | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  // Request camera permission on mount
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Handle barcode scan
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!isScanning) return;

    try {
      // Pause scanning
      setIsScanning(false);

      // Parse QR code data
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch {
        Alert.alert('Errore', 'QR code non valido');
        Vibration.vibrate(200);
        setIsScanning(true);
        return;
      }

      // Validate QR code format
      if (
        !qrData ||
        qrData.type !== 'nexo_reservation' ||
        qrData.v !== 1 ||
        !qrData.token
      ) {
        Alert.alert('Errore', 'QR code non valido');
        Vibration.vibrate(200);
        setIsScanning(true);
        return;
      }

      // Verify QR token
      const { data: reservation, error } = await reservationsService.verifyQRCode(
        qrData.token
      );

      if (error || !reservation) {
        Alert.alert('Errore', error || 'Prenotazione non trovata');
        Vibration.vibrate(200);
        setIsScanning(true);
        return;
      }

      // Success vibration
      Vibration.vibrate(100);

      // Show result in bottom sheet
      setScannedReservation(reservation);
      bottomSheetRef.current?.expand();
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante la scansione');
      Vibration.vibrate(200);
      setIsScanning(true);
    }
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!scannedReservation) return;

    try {
      setIsCheckingIn(true);

      const { error } = await managerService.checkInReservation(
        scannedReservation.id
      );

      if (error) {
        Alert.alert('Errore', error);
        return;
      }

      // Success!
      Vibration.vibrate([100, 50, 100]);
      Alert.alert(
        'Successo',
        'Check-in effettuato con successo!',
        [
          {
            text: 'OK',
            onPress: handleCloseSheet,
          },
        ]
      );
    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il check-in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Handle bottom sheet close
  const handleCloseSheet = () => {
    bottomSheetRef.current?.close();
    setScannedReservation(null);
    setIsScanning(true);
  };

  // Permission not granted
  if (!permission?.granted) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-foreground text-xl font-bold mb-4 text-center">
          Accesso alla Fotocamera Richiesto
        </Text>
        <Text className="text-muted-foreground text-center mb-8">
          Consenti l'accesso alla fotocamera per scansionare i QR code
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Camera View */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashEnabled}
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      {/* Scanner Overlay */}
      <QRScannerOverlay
        onClose={() => router.back()}
        onToggleFlash={() => setFlashEnabled(!flashEnabled)}
        flashEnabled={flashEnabled}
      />

      {/* Check-in Result Sheet */}
      <CheckinResultSheet
        bottomSheetRef={bottomSheetRef}
        reservation={scannedReservation}
        isLoading={isCheckingIn}
        onCheckIn={handleCheckIn}
        onClose={handleCloseSheet}
      />
    </View>
  );
}
