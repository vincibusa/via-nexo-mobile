import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Text } from '../../../components/ui/text';
import { Switch } from '../../../components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { useAuth } from '../../../lib/contexts/auth';
import { useSettings } from '../../../lib/contexts/settings';
import { useFavorites } from '../../../lib/contexts/favorites';
import { usePushNotifications } from '../../../lib/hooks/usePushNotifications';
import { Alert, View, ScrollView, Linking, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Heart, Bell, Globe, Moon, Sun, MapPin, Info, FileText, Shield, MessageSquare, Grid3x3, Settings } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { useColorScheme } from 'nativewind';
import { useEffect, useCallback, useState } from 'react';
import { API_CONFIG } from '../../../lib/config';
import { THEME } from '../../../lib/theme';
import { cn } from '../../../lib/utils';

export default function ProfileScreen() {
  const { user, logout, updateUserProfile } = useAuth();
  const router = useRouter();

  // Load initial profile data when user is available
  useEffect(() => {
    if (user?.id) {
      refreshProfile();
    }
  }, [user?.id]);

  // Refresh profile when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        refreshProfile();
      }
    }, [user?.id])
  );

  const refreshProfile = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/social/profiles/${user.id}`);
      if (response.ok) {
        const profileData = await response.json();
        console.log('Refreshed profile data:', profileData);

        // Update context with fresh data
        await updateUserProfile({
          displayName: profileData.display_name,
          email: profileData.email,
          avatarUrl: profileData.avatar_url,
        });

        // Update followers and following counts
        setFollowersCount(profileData.followers_count || 0);
        setFollowingCount(profileData.following_count || 0);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  useEffect(() => {
    console.log('ProfileScreen - user updated:', user);
    console.log('ProfileScreen - user.avatarUrl:', user?.avatarUrl);
  }, [user]);

  const { settings, isLoading, updateSettings } = useSettings();
  const { places, events } = useFavorites();
  const {
    hasPermission,
    isLoading: notificationsLoading,
    toggleNotifications
  } = usePushNotifications();
  const { colorScheme } = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  
  const totalFavorites = places.length + events.length;

  const handleLogout = () => {
    Alert.alert('Logout', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esci',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const handleTogglePushNotifications = async () => {
    try {
      const success = await toggleNotifications();
      if (!success && !hasPermission) {
        Alert.alert(
          'Permessi Notifiche',
          'Per ricevere notifiche, devi abilitare i permessi nelle impostazioni del dispositivo.',
          [
            { text: 'OK', style: 'default' },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiornare le impostazioni delle notifiche');
    }
  };

  const handleChangeLanguage = () => {
    Alert.alert('Lingua', 'Seleziona la lingua dell\'app', [
      {
        text: 'Italiano',
        onPress: async () => {
          try {
            await updateSettings({ language: 'it' });
          } catch (error) {
            Alert.alert('Errore', 'Impossibile cambiare lingua');
          }
        },
      },
      {
        text: 'English',
        onPress: async () => {
          try {
            await updateSettings({ language: 'en' });
          } catch (error) {
            Alert.alert('Errore', 'Impossibile cambiare lingua');
          }
        },
      },
      { text: 'Annulla', style: 'cancel' },
    ]);
  };

  const handleChangeRadius = () => {
    Alert.alert('Distanza Predefinita', 'Seleziona il raggio di ricerca predefinito', [
      {
        text: '2 km',
        onPress: async () => {
          try {
            await updateSettings({ default_radius_km: 2 });
          } catch (error) {
            Alert.alert('Errore', 'Impossibile aggiornare la distanza');
          }
        },
      },
      {
        text: '5 km',
        onPress: async () => {
          try {
            await updateSettings({ default_radius_km: 5 });
          } catch (error) {
            Alert.alert('Errore', 'Impossibile aggiornare la distanza');
          }
        },
      },
      {
        text: '10 km',
        onPress: async () => {
          try {
            await updateSettings({ default_radius_km: 10 });
          } catch (error) {
            Alert.alert('Errore', 'Impossibile aggiornare la distanza');
          }
        },
      },
      {
        text: '20 km',
        onPress: async () => {
          try {
            await updateSettings({ default_radius_km: 20 });
          } catch (error) {
            Alert.alert('Errore', 'Impossibile aggiornare la distanza');
          }
        },
      },
      { text: 'Annulla', style: 'cancel' },
    ]);
  };

  const handleToggleTheme = async () => {
    try {
      const currentTheme = settings?.theme || 'system';
      let newTheme: 'light' | 'dark' | 'system';
      
      // Cycle through themes: light -> dark -> system -> light
      if (currentTheme === 'light') {
        newTheme = 'dark';
      } else if (currentTheme === 'dark') {
        newTheme = 'system';
      } else {
        newTheme = 'light';
      }
      
      await updateSettings({ theme: newTheme });
    } catch (error) {
      Alert.alert('Errore', 'Impossibile cambiare tema');
    }
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://nexo.app/privacy');
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://nexo.app/terms');
  };

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const getThemeDisplayText = () => {
    switch (settings?.theme) {
      case 'light':
        return 'Chiaro';
      case 'dark':
        return 'Scuro';
      case 'system':
      default:
        return 'Sistema';
    }
  };

  const getThemeIcon = () => {
    switch (settings?.theme) {
      case 'light':
        return <Sun size={20} color={themeColors.foreground} />;
      case 'dark':
        return <Moon size={20} color={themeColors.foreground} />;
      case 'system':
      default:
        return <Moon size={20} color={themeColors.foreground} />;
    }
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView
      className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')}
      edges={['top']}
    >
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={themeColors.foreground}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Text className="text-lg font-semibold">@{user?.email?.split('@')[0]}</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings' as any)}
          >
            <Settings size={24} color={themeColors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Profile Info Section */}
        <View className="p-6">
          {/* Avatar Row */}
          <View className="flex-row items-start gap-4 mb-6">
            {/* Large Avatar */}
            <View className="relative" key={user?.avatarUrl}>
              <Avatar
                className="h-24 w-24"
                alt={user?.displayName || 'User avatar'}
              >
                {user?.avatarUrl && (
                  <AvatarImage
                    source={{ uri: user.avatarUrl }}
                  />
                )}
                <AvatarFallback>
                  <Text className="text-2xl font-bold">
                    {getInitials()}
                  </Text>
                </AvatarFallback>
              </Avatar>
            </View>

            {/* Stats Row (Mini - accanto avatar) */}
            <View className="flex-1 flex-row justify-around pt-4">
              <View className="items-center">
                <Text className="text-xl font-bold">0</Text>
                <Text className="text-xs text-muted-foreground">Storie</Text>
              </View>
              <TouchableOpacity
                className="items-center"
                onPress={() => router.push(`/(app)/profile/${user?.id}/followers` as any)}
              >
                <Text className="text-xl font-bold">{followersCount}</Text>
                <Text className="text-xs text-muted-foreground">Follower</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="items-center"
                onPress={() => router.push(`/(app)/profile/${user?.id}/following` as any)}
              >
                <Text className="text-xl font-bold">{followingCount}</Text>
                <Text className="text-xs text-muted-foreground">Seguiti</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Name & Username */}
          <View className="mb-4">
            <Text className="text-lg font-bold mb-0.5">{user?.displayName || 'Utente'}</Text>
            <Text className="text-sm text-muted-foreground">
              @{user?.email?.split('@')[0]}
            </Text>
          </View>

          {/* Bio Section */}
          <View className="gap-2 mb-6">
            <Text className="text-sm leading-relaxed text-muted-foreground">
              {user?.bio || 'Nessuna bio ancora'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => router.push('/(app)/edit-profile' as any)}
            >
              <Text className="font-semibold">Modifica Profilo</Text>
            </Button>
            <Button variant="outline" className="px-4">
              <Settings size={20} color={themeColors.foreground} />
            </Button>
          </View>
        </View>

        {/* Empty Stories Section */}
        <View className="border-t border-border">
          {/* Tabs Header */}
          <View className="border-b border-border">
            <View className="flex-row">
              <TouchableOpacity
                className="flex-1 py-3 items-center border-b-2 border-foreground"
                disabled
              >
                <Grid3x3 size={20} color={themeColors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Empty State */}
          <View className="py-16 items-center">
            <View className="rounded-full bg-muted p-6 mb-4">
              <Grid3x3 size={48} color={themeColors.mutedForeground} />
            </View>
            <Text className="text-lg font-semibold mb-2">Nessuna storia ancora</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Quando creerai delle storie,{`\n`}le vedrai qui.
            </Text>
          </View>
        </View>

        {/* Settings Section (Collapsible) */}
        <View className="border-t border-border p-6">
          <Text className="text-lg font-semibold mb-4">Impostazioni</Text>

          {/* Quick Settings */}
          <View className="gap-4">
            {/* Favorites */}
            <TouchableOpacity
              onPress={() => router.push('/favorites' as any)}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-row items-center gap-3">
                <Heart size={20} color={themeColors.foreground} fill={themeColors.foreground} />
                <Text className="font-medium">I Miei Preferiti</Text>
              </View>
              <ChevronRight size={20} color={themeColors.mutedForeground} />
            </TouchableOpacity>

            {/* Chat History */}
            <TouchableOpacity
              onPress={() => router.push('/chat-history' as any)}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-row items-center gap-3">
                <MessageSquare size={20} color={themeColors.foreground} />
                <Text className="font-medium">Storico Chat</Text>
              </View>
              <ChevronRight size={20} color={themeColors.mutedForeground} />
            </TouchableOpacity>

            {/* Notifications */}
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center gap-3 flex-1">
                <Bell size={20} color={themeColors.foreground} />
                <View className="flex-1">
                  <Text className="font-medium">Notifiche Push</Text>
                  <Text className="text-xs text-muted-foreground">
                    {hasPermission
                      ? (settings?.push_enabled ? 'Attive' : 'Disattivate')
                      : 'Permessi richiesti'
                    }
                  </Text>
                </View>
              </View>
              {notificationsLoading ? (
                <ActivityIndicator size="small" color={themeColors.foreground} />
              ) : (
                <Switch
                  checked={!!(settings?.push_enabled && hasPermission)}
                  onCheckedChange={handleTogglePushNotifications}
                  disabled={!hasPermission && !!settings?.push_enabled}
                />
              )}
            </View>

            {/* Theme */}
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center gap-3 flex-1">
                {getThemeIcon()}
                <View className="flex-1">
                  <Text className="font-medium">Tema</Text>
                  <Text className="text-xs text-muted-foreground">
                    {getThemeDisplayText()}
                  </Text>
                </View>
              </View>
              <Switch
                checked={settings?.theme === 'dark'}
                onCheckedChange={handleToggleTheme}
              />
            </View>

            {/* Logout */}
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-between py-3 border-t border-border mt-4 pt-4"
            >
              <Text className="text-destructive font-medium">Esci</Text>
              <ChevronRight size={20} color={themeColors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
