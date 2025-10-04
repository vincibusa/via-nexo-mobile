import '../global.css';

import { AuthProvider } from '../lib/contexts/auth';
import { NAV_THEME } from '../lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  );
}
