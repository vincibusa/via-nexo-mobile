import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Home, User, Search, MessageCircle, Play } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useSettings } from '../../../lib/contexts/settings';
import { NAV_THEME } from '../../../lib/theme';
import MessagingService from '../../../lib/services/messaging';
import { useAuth } from '../../../lib/contexts/auth';

const BadgeIcon = ({ Icon, color, size, count }: { Icon: any; color: string; size: number; count?: number }) => (
  <View>
    <Icon size={size} color={color} />
    {count ? (
      <View className="absolute -top-1 -right-2 bg-destructive rounded-full w-5 h-5 flex items-center justify-center">
        <Text className="text-primary-foreground text-xs font-bold">
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    ) : null}
  </View>
);

export default function TabLayout() {
  const { session } = useAuth();
  // Use dark theme (single theme for the app)
  const theme = NAV_THEME.dark;
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!session?.accessToken) return;

      try {
        const messagingService = MessagingService;
        const count = await messagingService.getTotalUnreadCount();
        setUnreadMessages(count);
      } catch (error) {
        console.error('Error loading unread messages:', error);
      }
    };

    loadUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [session?.accessToken]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
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
        name="search"
        options={{
          title: 'Cerca',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          title: 'Discovery',
          tabBarIcon: ({ color, size }) => <Play size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messaggi',
          tabBarIcon: ({ color, size }) => (
            <BadgeIcon Icon={MessageCircle} color={color} size={size} count={unreadMessages} />
          ),
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
