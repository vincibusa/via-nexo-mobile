import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { NAV_THEME } from '../../lib/theme';

export default function AuthLayout() {
  const { colorScheme } = useColorScheme();
  const theme = NAV_THEME[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
