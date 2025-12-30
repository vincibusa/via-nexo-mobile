import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { useAuth } from '../../lib/contexts/auth';
import { View } from 'react-native';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-1 items-center justify-center gap-6 p-6">
      <Text className="text-3xl font-bold">Benvenuto in Party Hub</Text>

      {user && (
        <View className="gap-2">
          <Text className="text-muted-foreground text-center">
            Logged in as: {user.email}
          </Text>
          {user.displayName && (
            <Text className="text-muted-foreground text-center">
              {user.displayName}
            </Text>
          )}
          <Text className="text-muted-foreground text-center text-sm">
            Role: {user.role}
          </Text>
        </View>
      )}

      <Button onPress={logout}>
        <Text>Logout</Text>
      </Button>
    </View>
  );
}
