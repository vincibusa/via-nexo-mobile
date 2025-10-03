import { useAuth } from '@/lib/contexts/auth';
import { Redirect } from 'expo-router';
import { View } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuth();

  // Show loading screen while checking auth
  if (isLoading) {
    return <View className="flex-1 bg-background" />;
  }

  // Redirect based on auth state
  if (user) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
