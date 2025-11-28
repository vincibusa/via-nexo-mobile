import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useColorScheme } from 'nativewind';

interface User {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

interface DiscoverSectionProps {
  title: string;
  users: User[];
  onFollow?: (userId: string) => Promise<void>;
}

export function DiscoverSection({
  title,
  users,
  onFollow,
}: DiscoverSectionProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  if (users.length === 0) {
    return null;
  }

  return (
    <View className="gap-3 px-4 py-4 border-t border-border">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold">{title}</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/(tabs)/search' as any)}
          className="flex-row items-center gap-1"
        >
          <Text className="text-sm font-medium text-primary">Vedi tutti</Text>
          <ChevronRight size={16} color={themeColors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="gap-3"
        contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
      >
        {users.map((user) => (
          <TouchableOpacity
            key={user.id}
            onPress={() => router.push(`/(app)/profile/${user.id}` as any)}
            className="w-32 gap-2"
          >
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage source={{ uri: user.avatar_url || '' }} />
              <AvatarFallback>
                <Text className="text-lg font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </Text>
              </AvatarFallback>
            </Avatar>

            <View className="items-center">
              <Text className="text-sm font-semibold text-center line-clamp-1">
                {user.full_name || user.username}
              </Text>
              {user.bio && (
                <Text className="text-xs text-muted-foreground text-center line-clamp-1">
                  {user.bio}
                </Text>
              )}
            </View>

            <Button
              onPress={() => onFollow?.(user.id)}
              className="w-full"
              size="sm"
            >
              <Text className="text-xs font-medium text-primary-foreground">
                Segui
              </Text>
            </Button>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
