/**
 * Profile Settings Component - Bottom Sheet Modal
 * Settings sheet accessed via gear icon
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { View, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
import { Text } from '../ui/text';
import { Switch } from '../ui/switch';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import {
  Bell,
  Globe,
  Moon,
  Sun,
  Info,
  FileText,
  Shield,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react-native';
import { useSettings } from '../../lib/contexts/settings';
import { usePushNotifications } from '../../lib/hooks/usePushNotifications';
import Constants from 'expo-constants';
import { THEME } from '../../lib/theme';

interface ProfileSettingsProps {
  isDark: boolean;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettings({
  isDark,
  onLogout,
  onNavigate,
  isOpen,
  onClose,
}: ProfileSettingsProps) {
  const { settings, toggleNotifications } = useSettings();
  const { hasPermission, requestPermission } = usePushNotifications();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Use dark theme (single theme for the app)
  const themeColors = THEME.dark;

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['60%'], []);

  // Handle sheet changes
  React.useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const handleNotificationsToggle = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permesso richiesto',
          'Per ricevere notifiche, abilita le notifiche nelle impostazioni del dispositivo.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    toggleNotifications();
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  const settingsItems = [
    {
      icon: Bell,
      label: 'Notifiche',
      value: settings.notificationsEnabled,
      onToggle: handleNotificationsToggle,
      type: 'switch' as const,
    },
    {
      icon: Globe,
      label: 'Lingua',
      value: 'Italiano',
      type: 'link' as const,
      onPress: () => onNavigate('language'),
    },
    {
      icon: Shield,
      label: 'Privacy',
      type: 'link' as const,
      onPress: () => onNavigate('privacy'),
    },
    {
      icon: FileText,
      label: 'Termini di servizio',
      type: 'link' as const,
      onPress: () =>
        handleOpenLink('https://example.com/terms'),
    },
    {
      icon: Info,
      label: 'Informazioni',
      type: 'link' as const,
      onPress: () =>
        handleOpenLink('https://example.com/about'),
    },
  ];

  const appVersion = Constants.expoConfig?.version || '1.0.0';

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

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
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
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3 border-b"
          style={{ borderBottomColor: themeColors.border }}
        >
          <Text className="text-lg font-semibold" style={{ color: themeColors.foreground }}>
            Impostazioni
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color={themeColors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Settings Items */}
          <View className="px-4 py-2">
            {settingsItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <View
                  key={index}
                  className={`flex-row items-center justify-between py-4 ${
                    index !== settingsItems.length - 1
                      ? 'border-b'
                      : ''
                  }`}
                  style={{
                    borderBottomColor: index !== settingsItems.length - 1 ? themeColors.border : 'transparent',
                  }}
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: themeColors.muted }}
                    >
                      <Icon size={20} color={themeColors.foreground} />
                    </View>
                    <Text style={{ color: themeColors.foreground }}>
                      {item.label}
                    </Text>
                  </View>

                  {item.type === 'switch' ? (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={item.onToggle}
                    />
                  ) : (
                    <TouchableOpacity onPress={item.onPress}>
                      <View className="flex-row items-center">
                        {item.value && (
                          <Text className="mr-2" style={{ color: themeColors.mutedForeground }}>
                            {item.value}
                          </Text>
                        )}
                        <ChevronRight
                          size={20}
                          color={themeColors.mutedForeground}
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Logout button */}
          <View className="px-4 py-4">
            <TouchableOpacity
              onPress={() => {
                onClose();
                onLogout();
              }}
              className="p-4 rounded-lg flex-row items-center justify-center bg-destructive/10"
            >
              <LogOut size={20} color={themeColors.destructive} />
              <Text
                className="ml-2 font-medium text-destructive"
              >
                Logout
              </Text>
            </TouchableOpacity>
          </View>

          {/* App version */}
          <View
            className="px-4 py-4 border-t"
            style={{ borderTopColor: themeColors.border }}
          >
            <Text
              className="text-center text-sm"
              style={{ color: themeColors.mutedForeground }}
            >
              Versione App {appVersion}
            </Text>
          </View>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}
