import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Text } from '../../../components/ui/text';
import { Switch } from '../../../components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { useAuth } from '../../../lib/contexts/auth';
import { useSettings } from '../../../lib/contexts/settings';
import { useFavorites } from '../../../lib/contexts/favorites';
import { usePushNotifications } from '../../../lib/hooks/usePushNotifications';
import { Alert, View, ScrollView, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Heart, Bell, Globe, Moon, Sun, MapPin, Info, FileText, Shield, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../../lib/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { settings, isLoading, updateSettings } = useSettings();
  const { places, events } = useFavorites();
  const {
    hasPermission,
    isLoading: notificationsLoading,
    toggleNotifications
  } = usePushNotifications();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  // Get dynamic colors for icons
  const themeColors = THEME[colorScheme === 'dark' ? 'dark' : 'light'];
  
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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-6 p-6">
          <Text className="text-2xl font-bold">Profilo</Text>

          {/* User Info with Avatar */}
          <Card>
            <CardContent className="gap-4 pt-6">
              <View className="flex-row items-center gap-4">
                <Avatar alt="User Avatar" className="size-16">
                  <AvatarFallback>
                    <Text className="text-lg font-semibold">{getInitials()}</Text>
                  </AvatarFallback>
                </Avatar>
                <View className="flex-1">
                  {user?.displayName && (
                    <Text className="text-lg font-semibold">{user.displayName}</Text>
                  )}
                  <Text className="text-sm text-muted-foreground">{user?.email}</Text>
                  <Text className="text-xs text-muted-foreground capitalize mt-1">
                    {user?.role}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* I Miei Preferiti */}
          <TouchableOpacity
            onPress={() => router.push('/favorites' as any)}
          >
            <Card>
              <CardContent className="flex-row items-center justify-between py-4">
                <View className="flex-row items-center gap-3">
                  <Heart size={20} color={themeColors.foreground} fill={themeColors.foreground} />
                  <View>
                    <Text className="font-medium">I Miei Preferiti</Text>
                    {totalFavorites > 0 && (
                      <Text className="text-xs text-muted-foreground">
                        {totalFavorites} {totalFavorites === 1 ? 'salvato' : 'salvati'}
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color={themeColors.mutedForeground} />
              </CardContent>
            </Card>
          </TouchableOpacity>

          {/* Storico Conversazioni */}
          <TouchableOpacity
            onPress={() => router.push('/chat-history' as any)}
          >
            <Card>
              <CardContent className="flex-row items-center justify-between py-4">
                <View className="flex-row items-center gap-3">
                  <MessageSquare size={20} color={themeColors.foreground} />
                  <View>
                    <Text className="font-medium">Storico Chat</Text>
                    <Text className="text-xs text-muted-foreground">
                      Le tue conversazioni salvate
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={themeColors.mutedForeground} />
              </CardContent>
            </Card>
          </TouchableOpacity>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <>
                  {/* Push Notifications */}
                  <View className="flex-row items-center justify-between">
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
                      <ActivityIndicator size="small" />
                    ) : (
                      <Switch
                        checked={!!(settings?.push_enabled && hasPermission)}
                        onCheckedChange={handleTogglePushNotifications}
                        disabled={!hasPermission && !!settings?.push_enabled}
                      />
                    )}
                  </View>

                  {/* Language */}
                  <TouchableOpacity
                    onPress={handleChangeLanguage}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Globe size={20} color={themeColors.foreground} />
                      <View className="flex-1">
                        <Text className="font-medium">Lingua</Text>
                        <Text className="text-xs text-muted-foreground">
                          {settings?.language === 'it' ? 'Italiano' : 'English'}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={themeColors.mutedForeground} />
                  </TouchableOpacity>

                  {/* Theme */}
                  <View className="flex-row items-center justify-between">
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

                  {/* Default Radius */}
                  <TouchableOpacity
                    onPress={handleChangeRadius}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <MapPin size={20} color={themeColors.foreground} />
                      <View className="flex-1">
                        <Text className="font-medium">Distanza Predefinita</Text>
                        <Text className="text-xs text-muted-foreground">
                          {settings?.default_radius_km || 5} km
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={themeColors.mutedForeground} />
                  </TouchableOpacity>
                </>
              )}
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              {/* App Version */}
              <View className="flex-row items-center gap-3">
                <Info size={20} color={themeColors.foreground} />
                <View className="flex-1">
                  <Text className="font-medium">Versione App</Text>
                  <Text className="text-xs text-muted-foreground">{appVersion}</Text>
                </View>
              </View>

              {/* Privacy Policy */}
              <TouchableOpacity
                onPress={handleOpenPrivacyPolicy}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <Shield size={20} color={themeColors.foreground} />
                  <Text className="font-medium">Privacy Policy</Text>
                </View>
                <ChevronRight size={20} color={themeColors.mutedForeground} />
              </TouchableOpacity>

              {/* Terms of Service */}
              <TouchableOpacity
                onPress={handleOpenTerms}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <FileText size={20} color={themeColors.foreground} />
                  <Text className="font-medium">Termini di Servizio</Text>
                </View>
                <ChevronRight size={20} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            </CardContent>
          </Card>

          {/* Logout */}
          <Button variant="destructive" onPress={handleLogout}>
            <Text>Esci</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
