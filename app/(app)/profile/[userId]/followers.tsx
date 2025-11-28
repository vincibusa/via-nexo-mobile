import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '../../../../components/ui/text';
import { Button } from '../../../../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../components/ui/avatar';
import { useAuth } from '../../../../lib/contexts/auth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { useColorScheme } from 'nativewind';
import { API_CONFIG } from '../../../../lib/config';
import { THEME } from '../../../../lib/theme';
import { useSettings } from '../../../../lib/contexts/settings';

interface Follower {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  isFollowedByCurrentUser: boolean;
}

export default function FollowersScreen() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const { userId } = useLocalSearchParams();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  const fetchFollowers = async (loadMore = false) => {
    try {
      const newOffset = loadMore ? offset + 50 : 0;
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/social/follows/followers?userId=${userId}&offset=${newOffset}&limit=50`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch followers');
      }

      const data = await response.json();

      if (loadMore) {
        setFollowers((prev) => [...prev, ...data.followers]);
        setOffset(newOffset);
      } else {
        setFollowers(data.followers);
        setOffset(0);
      }

      setHasMore(data.followers.length === 50);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (followerId: string, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/social/follows?followingId=${followerId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to unfollow');
      } else {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/social/follows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followingId: followerId }),
        });

        if (!response.ok) throw new Error('Failed to follow');
      }

      // Update local state
      setFollowers((prev) =>
        prev.map((f) =>
          f.id === followerId
            ? { ...f, isFollowedByCurrentUser: !isCurrentlyFollowing }
            : f
        )
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    await fetchFollowers(false);
    setRefreshing(false);
  };

  const renderFollower = ({ item }: { item: Follower }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/profile/${item.id}` as any)}
      className="flex-row items-center justify-between border-b border-border px-4 py-3"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Avatar className="h-12 w-12">
          <AvatarImage source={{ uri: item.avatar_url || '' }} />
          <AvatarFallback>
            <Text className="text-sm font-semibold">
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </AvatarFallback>
        </Avatar>

        <View className="flex-1">
          <Text className="font-semibold">{item.full_name || item.username}</Text>
          <Text className="text-xs text-muted-foreground">@{item.username}</Text>
          {item.bio && (
            <Text className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {item.bio}
            </Text>
          )}
        </View>
      </View>

      {currentUser?.id !== item.id && (
        <Button
          variant={item.isFollowedByCurrentUser ? 'outline' : 'default'}
          onPress={() =>
            handleFollow(item.id, item.isFollowedByCurrentUser)
          }
          className="px-4"
          size="sm"
        >
          <Text
            className={cn(
              'text-xs font-medium',
              !item.isFollowedByCurrentUser && 'text-primary-foreground'
            )}
          >
            {item.isFollowedByCurrentUser ? 'Seguendo' : 'Segui'}
          </Text>
        </Button>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')}
      edges={['top']}
    >
      <View className="flex-1 flex-col">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={themeColors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Follower</Text>
          <View className="w-6" />
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={themeColors.foreground} />
          </View>
        ) : followers.length > 0 ? (
          <FlatList
            data={followers}
            renderItem={renderFollower}
            keyExtractor={(item) => item.id}
            className="flex-1"
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={themeColors.foreground}
                colors={[themeColors.primary]}
              />
            }
            onEndReached={() => {
              if (hasMore) fetchFollowers(true);
            }}
            onEndReachedThreshold={0.8}
            ListFooterComponent={
              hasMore ? (
                <View className="py-4">
                  <ActivityIndicator size="small" color={themeColors.foreground} />
                </View>
              ) : null
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-muted-foreground">
              Nessun follower ancora
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
