/**
 * Profile Header Component - Instagram Style
 * Classic Instagram layout with avatar left, stats horizontal, expandable bio
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { Settings, ExternalLink, Check, Bell } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import type { User } from '../../lib/types/auth';

interface ProfileHeaderProps {
  user: User | null;
  isDark: boolean;
  onEditProfile: () => void;
  onSettingsPress?: () => void;
  onNotificationsPress?: () => void;
  unreadNotificationsCount?: number;
}

const MAX_BIO_LINES = 3;
const MAX_BIO_LENGTH = 150;

export function ProfileHeader({ 
  user, 
  isDark, 
  onEditProfile,
  onSettingsPress,
  onNotificationsPress,
  unreadNotificationsCount = 0
}: ProfileHeaderProps) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  const getUserInitials = () => {
    if (!user?.displayName) return 'U';
    return user.displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getBio = () => {
    return user?.bio || '';
  };

  const shouldShowExpandButton = () => {
    const bio = getBio();
    return bio.length > MAX_BIO_LENGTH || bio.split('\n').length > MAX_BIO_LINES;
  };

  const getDisplayBio = () => {
    const bio = getBio();
    if (!bioExpanded && shouldShowExpandButton()) {
      return bio.length > MAX_BIO_LENGTH 
        ? bio.substring(0, MAX_BIO_LENGTH) + '...'
        : bio.split('\n').slice(0, MAX_BIO_LINES).join('\n') + '...';
    }
    return bio;
  };

  const handleWebsitePress = () => {
    if (user?.website) {
      const url = user.website.startsWith('http') ? user.website : `https://${user.website}`;
      Linking.openURL(url).catch((err) => 
        console.error('Failed to open website:', err)
      );
    }
  };

  const postsCount = user?.postsCount ?? 0;
  const followersCount = user?.followersCount ?? 0;
  const followingCount = user?.followingCount ?? 0;

  return (
    <View className="px-4 pt-4 pb-2">
      {/* Top row: Settings icon, Notifications, and Username centered */}
      <View className="flex-row items-center justify-between mb-4 relative">
        {/* Settings icon */}
        {onSettingsPress && (
          <TouchableOpacity
            onPress={onSettingsPress}
            className="p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings 
              size={24} 
              color={themeColors.mutedForeground} 
            />
          </TouchableOpacity>
        )}
        
        {/* Username centered */}
        <View className="flex-1 flex-row items-center justify-center absolute left-0 right-0">
          <Text className="text-base font-semibold text-foreground mr-2">
            {getUserName()}
          </Text>
          {user?.isVerified && (
            <View className="bg-primary rounded-full p-0.5">
              <Check size={12} color={themeColors.primaryForeground} />
            </View>
          )}
        </View>
        
        {/* Notifications icon */}
        <View className="flex-row items-center">
          {onNotificationsPress && (
            <TouchableOpacity
              onPress={onNotificationsPress}
              className="p-2 relative"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bell 
                size={24} 
                color={themeColors.mutedForeground} 
              />
              {unreadNotificationsCount > 0 && (
                <View className="absolute -top-1 -right-2 bg-destructive rounded-full w-5 h-5 flex items-center justify-center">
                  <Text className="text-primary-foreground text-xs font-bold">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {/* Spacer to balance settings icon if notifications not shown */}
          {!onNotificationsPress && onSettingsPress && <View className="w-10" />}
        </View>
      </View>

      {/* Main header row: Avatar + Stats */}
      <View className="flex-row items-center mb-4">
        {/* Avatar with primary color border */}
        <View className="mr-4">
          <View 
            className="rounded-full"
            style={{
              width: 90,
              height: 90,
              padding: 2,
              backgroundColor: themeColors.primary,
            }}
          >
            <View className="bg-background rounded-full w-full h-full">
              <Avatar className="w-full h-full">
                <AvatarImage
                  source={{ uri: user?.avatarUrl }}
                  className="w-full h-full"
                />
                <AvatarFallback className="bg-muted">
                  <Text className="text-2xl font-bold text-foreground">
                    {getUserInitials()}
                  </Text>
                </AvatarFallback>
              </Avatar>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View className="flex-1 flex-row justify-around">
          <View className="items-center">
            <Text className="text-lg font-semibold text-foreground">
              {postsCount}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              post
            </Text>
          </View>

          <View className="items-center">
            <Text className="text-lg font-semibold text-foreground">
              {followersCount}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              follower
            </Text>
          </View>

          <View className="items-center">
            <Text className="text-lg font-semibold text-foreground">
              {followingCount}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              seguiti
            </Text>
          </View>
        </View>
      </View>

      {/* Bio section */}
      {getBio() && (
        <View className="mb-3">
          <Text className="text-sm text-foreground leading-5">
            {getDisplayBio()}
          </Text>
          {shouldShowExpandButton() && (
            <TouchableOpacity
              onPress={() => setBioExpanded(!bioExpanded)}
              className="mt-1"
            >
              <Text className="text-sm text-muted-foreground">
                {bioExpanded ? 'mostra meno' : 'mostra altro'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Website link */}
      {user?.website && (
        <TouchableOpacity
          onPress={handleWebsitePress}
          className="flex-row items-center mb-3"
        >
          <ExternalLink size={14} color={themeColors.primary} />
          <Text 
            className="text-sm ml-1 text-primary"
          >
            {user.website}
          </Text>
        </TouchableOpacity>
      )}

      {/* Edit Profile button */}
      <Button
        onPress={onEditProfile}
        variant="outline"
        className="w-full mt-1"
      >
        <Text className="text-sm font-semibold">Modifica profilo</Text>
      </Button>
    </View>
  );
}
