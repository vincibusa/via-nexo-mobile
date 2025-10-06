import '../global.css';

// Import React Native Reanimated at the top of the app
import 'react-native-reanimated';

import { AuthProvider } from '../lib/contexts/auth';
import { SettingsProvider } from '../lib/contexts/settings';
import { FavoritesProvider } from '../lib/contexts/favorites';
import { NAV_THEME } from '../lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { notificationsService } from '../lib/services/notifications';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    // Configure notification handling on app start
    const cleanup = notificationsService.configureNotifications();
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <AuthProvider>
        <SettingsProvider>
          <FavoritesProvider>
            <StatusBar 
              style={colorScheme === 'dark' ? 'light' : 'dark'} 
              backgroundColor={NAV_THEME[colorScheme ?? 'light'].colors.background}
              translucent={false}
            />
            <Stack screenOptions={{
              headerShown: false,
              headerBackTitle: ''
            }} />
            <PortalHost />
          </FavoritesProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
