import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Text } from '../../../components/ui/text';
import { Switch } from '../../../components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { useAuth } from '../../../lib/contexts/auth';
import { useSettings } from '../../../lib/contexts/settings';
import { useFavorites } from '../../../lib/contexts/favorites';
import { Alert, View, ScrollView, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Heart, Bell, Globe, Moon, MapPin, Info, FileText, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { settings, isLoading, updateSettings } = useSettings();
  const { places, events } = useFavorites();
  const router = useRouter();
  
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
      await updateSettings({ push_enabled: !settings?.push_enabled });
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiornare le impostazioni');
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
                  <Heart className="text-primary" size={20} fill="rgb(239 68 68)" />
                  <View>
                    <Text className="font-medium">I Miei Preferiti</Text>
                    {totalFavorites > 0 && (
                      <Text className="text-xs text-muted-foreground">
                        {totalFavorites} {totalFavorites === 1 ? 'salvato' : 'salvati'}
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRight className="text-muted-foreground" size={20} />
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
                      <Bell className="text-foreground" size={20} />
                      <View className="flex-1">
                        <Text className="font-medium">Notifiche Push</Text>
                        <Text className="text-xs text-muted-foreground">
                          Ricevi aggiornamenti su eventi
                        </Text>
                      </View>
                    </View>
                    <Switch
                      checked={settings?.push_enabled ?? true}
                      onCheckedChange={handleTogglePushNotifications}
                    />
                  </View>

                  {/* Language */}
                  <TouchableOpacity
                    onPress={handleChangeLanguage}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Globe className="text-foreground" size={20} />
                      <View className="flex-1">
                        <Text className="font-medium">Lingua</Text>
                        <Text className="text-xs text-muted-foreground">
                          {settings?.language === 'it' ? 'Italiano' : 'English'}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight className="text-muted-foreground" size={20} />
                  </TouchableOpacity>

                  {/* Default Radius */}
                  <TouchableOpacity
                    onPress={handleChangeRadius}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <MapPin className="text-foreground" size={20} />
                      <View className="flex-1">
                        <Text className="font-medium">Distanza Predefinita</Text>
                        <Text className="text-xs text-muted-foreground">
                          {settings?.default_radius_km || 5} km
                        </Text>
                      </View>
                    </View>
                    <ChevronRight className="text-muted-foreground" size={20} />
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
                <Info className="text-foreground" size={20} />
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
                  <Shield className="text-foreground" size={20} />
                  <Text className="font-medium">Privacy Policy</Text>
                </View>
                <ChevronRight className="text-muted-foreground" size={20} />
              </TouchableOpacity>

              {/* Terms of Service */}
              <TouchableOpacity
                onPress={handleOpenTerms}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <FileText className="text-foreground" size={20} />
                  <Text className="font-medium">Termini di Servizio</Text>
                </View>
                <ChevronRight className="text-muted-foreground" size={20} />
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
