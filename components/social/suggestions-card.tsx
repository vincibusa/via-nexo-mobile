import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { useRouter } from 'expo-router';

interface User {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  isFollowing?: boolean;
}

interface SuggestionsCardProps {
  title: string;
  description?: string;
  users: User[];
  onFollow?: (userId: string) => Promise<void>;
}

export function SuggestionsCard({
  title,
  description,
  users,
  onFollow,
}: SuggestionsCardProps) {
  const router = useRouter();

  return (
    <View className="gap-3">
      <View>
        <Text className="text-lg font-semibold">{title}</Text>
        {description && (
          <Text className="text-sm text-muted-foreground">{description}</Text>
        )}
      </View>

      <View className="gap-2">
        {users.slice(0, 3).map((user) => (
          <TouchableOpacity
            key={user.id}
            onPress={() => router.push(`/(app)/profile/${user.id}` as any)}
            className="flex-row items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
          >
            <View className="flex-row items-center gap-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage source={{ uri: user.avatar_url || '' }} />
                <AvatarFallback>
                  <Text className="text-xs font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </Text>
                </AvatarFallback>
              </Avatar>

              <View className="flex-1">
                <Text className="font-semibold" numberOfLines={1}>
                  {user.full_name || user.username}
                </Text>
                {user.bio && (
                  <Text className="text-xs text-muted-foreground line-clamp-1">
                    {user.bio}
                  </Text>
                )}
              </View>
            </View>

            <Button
              variant={user.isFollowing ? 'outline' : 'default'}
              onPress={() => onFollow?.(user.id)}
              className="px-3"
            >
              <Text
                className={`text-xs font-medium ${
                  user.isFollowing ? '' : 'text-primary-foreground'
                }`}
              >
                {user.isFollowing ? 'Seguendo' : 'Segui'}
              </Text>
            </Button>
          </TouchableOpacity>
        ))}
      </View>

      {users.length > 3 && (
        <TouchableOpacity
          onPress={() => router.push('/(app)/(tabs)/search' as any)}
          className="items-center justify-center py-2"
        >
          <Text className="text-sm font-medium text-primary">
            Visualizza tutti ({users.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
