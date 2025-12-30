/**
 * QR Scanner Overlay Component
 * UI overlay for the QR scanner with viewfinder and controls
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Flashlight } from 'lucide-react-native';

interface QRScannerOverlayProps {
  onClose: () => void;
  onToggleFlash: () => void;
  flashEnabled: boolean;
  message?: string;
}

export function QRScannerOverlay({
  onClose,
  onToggleFlash,
  flashEnabled,
  message = 'Inquadra il QR code per il check-in',
}: QRScannerOverlayProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Top Bar */}
      <View className="bg-black/50 p-4 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={onClose}
          className="w-10 h-10 items-center justify-center rounded-full bg-black/50"
        >
          <X size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-white font-semibold text-lg">Scanner QR</Text>

        <TouchableOpacity
          onPress={onToggleFlash}
          className={`w-10 h-10 items-center justify-center rounded-full ${
            flashEnabled ? 'bg-yellow-500' : 'bg-black/50'
          }`}
        >
          <Flashlight size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Viewfinder */}
      <View className="flex-1 items-center justify-center" pointerEvents="none">
        {/* Dark overlay with cutout */}
        <View style={StyleSheet.absoluteFill}>
          {/* Top overlay */}
          <View className="flex-1 bg-black/60" />

          {/* Middle row with cutout */}
          <View className="flex-row">
            <View className="flex-1 bg-black/60" />
            {/* Viewfinder cutout */}
            <View className="w-64 h-64 border-2 border-white rounded-2xl">
              {/* Corner brackets */}
              <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
              <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
              <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
              <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
            </View>
            <View className="flex-1 bg-black/60" />
          </View>

          {/* Bottom overlay */}
          <View className="flex-1 bg-black/60" />
        </View>

        {/* Instructions */}
        <View className="absolute bottom-20 items-center px-8">
          <Text className="text-white text-center text-base font-medium">
            {message}
          </Text>
        </View>
      </View>
    </View>
  );
}
