import { Tabs } from 'expo-router';
import { Home, Calendar, Heart, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
  const inactiveIconColor = colorScheme === 'dark' ? '#6b7280' : '#9ca3af';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: iconColor,
        tabBarInactiveTintColor: inactiveIconColor,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Eventi',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Preferiti',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilo',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
