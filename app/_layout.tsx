import '../global.css';

// Import React Native Reanimated at the top of the app
import 'react-native-reanimated';

import { AuthProvider } from '../lib/contexts/auth';
import { SettingsProvider, useSettings } from '../lib/contexts/settings';
import { FavoritesProvider } from '../lib/contexts/favorites';
import { NAV_THEME } from '../lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { notificationsService } from '../lib/services/notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

function AppContent() {
  const { currentTheme } = useSettings();
  const { colorScheme: systemColorScheme } = useColorScheme();

  // Use user's theme preference, fallback to system
  const effectiveTheme = currentTheme || systemColorScheme || 'light';

  return (
    <ThemeProvider value={NAV_THEME[effectiveTheme]}>
      <StatusBar 
        style={effectiveTheme === 'dark' ? 'light' : 'dark'} 
        backgroundColor={NAV_THEME[effectiveTheme].colors.background}
        translucent={false}
      />
      <Stack screenOptions={{
        headerShown: false,
        headerBackTitle: ''
      }} />
      <PortalHost />
    </ThemeProvider>
  );
}

export default function RootLayout() {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SettingsProvider>
          <FavoritesProvider>
            <AppContent />
          </FavoritesProvider>
        </SettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
