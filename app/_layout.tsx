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
import { useEffect } from 'react';
import { notificationsService } from '../lib/services/notifications';
import { notificationBatchingService } from '../lib/services/notification-batching';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

function AppContent() {
  // Use dark theme (single theme for the app)
  const theme = 'dark';

  return (
    <ThemeProvider value={NAV_THEME[theme]}>
      <StatusBar 
        style="light" 
        backgroundColor={NAV_THEME[theme].colors.background}
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

    // Initialize notification batching
    notificationBatchingService.initialize();

    return () => {
      if (cleanup) {
        cleanup();
      }
      // Cleanup notification batching
      notificationBatchingService.cleanup();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SettingsProvider>
              <FavoritesProvider>
                <AppContent />
              </FavoritesProvider>
            </SettingsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
