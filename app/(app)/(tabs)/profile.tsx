/**
 * Profile Screen - RAVE ID Design
 * Profile card with stats, level progress, and content tabs
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Text,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../lib/contexts/auth';
import { useSettings } from '../../../lib/contexts/settings';
import { THEME } from '../../../lib/theme';
import { useColorScheme } from 'nativewind';

// Import components
import { RaveIdHeader } from '../../../components/profile/rave-id-header';
import { ProfileContentTabsNew } from '../../../components/profile/profile-content-tabs-new';
import { ProfileSettings } from '../../../components/profile/profile-settings';
import { NotificationsSheet } from '../../../components/profile/notifications-sheet';
import { ManagerToolsSection } from '../../../components/manager/manager-tools-section';
import { useRaveScore } from '../../../lib/hooks/useRaveScore';
import { API_CONFIG } from '../../../lib/config';
import { getFloatingTabBarScrollPadding } from '../../../lib/layout/floating-tab-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { colorScheme } = useColorScheme();
  const { user, logout, session } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  const isDark = effectiveTheme === 'dark';
  const contentBottomPadding = getFloatingTabBarScrollPadding(insets.bottom);

  // State for refresh
  const [refreshing, setRefreshing] = useState(false);

  // Load RAVE score
  const { score: raveScore } = useRaveScore(user?.id);

  // Refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadUnreadNotificationsCount();
      }
    }, [user?.id])
  );

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUnreadNotificationsCount();
    setRefreshing(false);
  };

  // Load unread notifications count
  const loadUnreadNotificationsCount = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/notifications?limit=1&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json() as { unreadCount?: number };
        setUnreadNotificationsCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading unread notifications count:', error);
    }
  };

  const handleNavigate = (screen: string) => {
    router.push(`/${screen}` as any);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login' as any);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading state if no user
  if (!user) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-background' : 'bg-background'}`}>
        <View className="flex-1 items-center justify-center">
          <View className="p-4 rounded-lg bg-muted">
            <Text className="text-foreground">
              Caricamento profilo...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 bg-background`}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.foreground}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* RAVE ID Header with Profile Card */}
        <RaveIdHeader
          user={user}
          raveScore={raveScore}
          onSettingsPress={() => setSettingsOpen(true)}
          onNotificationsPress={() => setNotificationsOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* Manager Tools Section - only visible for managers */}
        {user?.role === 'manager' && <ManagerToolsSection />}

        {/* Content Tabs - Eventi Prenotati / Archivio Storie */}
        <ProfileContentTabsNew />
      </ScrollView>

      {/* Settings Bottom Sheet */}
      <ProfileSettings
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Notifications Bottom Sheet */}
      <NotificationsSheet
        isOpen={notificationsOpen}
        onClose={() => {
          setNotificationsOpen(false);
          loadUnreadNotificationsCount(); // Refresh count when closing
        }}
      />
    </SafeAreaView>
  );
}
