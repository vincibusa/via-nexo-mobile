/**
 * Profile Screen - Instagram Style Redesign
 * Modern Instagram-like layout with header, story highlights, tabs, and content grid
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

// Import new components
import { ProfileHeader } from '../../../components/profile/profile-header';
import { StoryHighlights } from '../../../components/profile/story-highlights';
import { ProfileReservations } from '../../../components/profile/profile-reservations';
import { ProfileContentTabs } from '../../../components/profile/profile-content-tabs';
import { ProfileSettings } from '../../../components/profile/profile-settings';
import { NotificationsSheet } from '../../../components/profile/notifications-sheet';
import { useProfileData } from '../../../lib/hooks/useProfileData';
import { API_CONFIG } from '../../../lib/config';

export default function ProfileScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const { user, logout, session } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Use dark theme (single theme for the app)
  const themeColors = THEME.dark;
  const isDark = true;

  // Use custom hook for data management
  const { refreshing, error, refreshProfile, posts, isLoadingPosts } = useProfileData();

  // Refresh profile when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        refreshProfile();
        loadUnreadNotificationsCount();
      }
    }, [user?.id, refreshProfile])
  );

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

  const handleEditProfile = () => {
    router.push('/edit-profile' as any);
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

  const handleCreateStory = () => {
    router.push('/(app)/create-story' as any);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProfile}
            tintColor={themeColors.foreground}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* Error message */}
        {error && (
          <View className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <Text className="text-destructive text-sm">
              {error}
            </Text>
          </View>
        )}

        {/* Profile Header - Instagram Style */}
        <ProfileHeader
          user={user}
          isDark={isDark}
          onEditProfile={handleEditProfile}
          onSettingsPress={() => setSettingsOpen(true)}
          onNotificationsPress={() => setNotificationsOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* Story Highlights */}
        <StoryHighlights onCreatePress={handleCreateStory} />

        {/* Reservations Section */}
        <ProfileReservations maxItems={5} />

        {/* Content Tabs with Grid */}
        <View className="mt-2">
          <ProfileContentTabs posts={posts} isLoading={isLoadingPosts} />
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Settings Bottom Sheet */}
      <ProfileSettings
        isDark={isDark}
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
