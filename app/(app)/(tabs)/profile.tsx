import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/contexts/auth';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 gap-6 p-6">
        <Text className="text-2xl font-bold">Profilo</Text>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Account</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">Email</Text>
              <Text className="font-medium">{user?.email}</Text>
            </View>
            {user?.displayName && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Nome</Text>
                <Text className="font-medium">{user.displayName}</Text>
              </View>
            )}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">Ruolo</Text>
              <Text className="font-medium capitalize">{user?.role}</Text>
            </View>
          </CardContent>
        </Card>

        {/* Settings Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Impostazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-sm text-muted-foreground">
              Le impostazioni saranno disponibili nelle prossime versioni
            </Text>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button variant="destructive" onPress={handleLogout}>
          <Text>Esci</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
