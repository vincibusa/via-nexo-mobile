import { View, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '../../../../components/ui/text';
import { Input } from '../../../../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../components/ui/avatar';
import { useAuth } from '../../../../lib/contexts/auth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, Send } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../../../lib/theme';
import { useSettings } from '../../../../lib/contexts/settings';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  likes_count: number;
  is_liked: boolean;
}

export default function CommentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const { id } = useLocalSearchParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  const fetchComments = async () => {
    // TODO: Fetch comments from API
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComments();
    setRefreshing(false);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      // TODO: Call API to create comment
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // TODO: Call API to like comment
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'ora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="flex-row gap-3 border-b border-border px-4 py-3">
      <Avatar className="h-10 w-10" alt={''}>
        <AvatarImage source={{ uri: item.user?.avatar_url || '' }} />
        <AvatarFallback>
          <Text className="text-xs font-semibold">
            {item.user?.username?.charAt(0).toUpperCase()}
          </Text>
        </AvatarFallback>
      </Avatar>

      <View className="flex-1">
        <View className="flex-row items-baseline gap-2">
          <Text className="font-semibold">{item.user?.username}</Text>
          <Text className="text-xs text-muted-foreground">
            {timeAgo(item.created_at)}
          </Text>
        </View>
        <Text className="mt-1 text-sm leading-relaxed">{item.content}</Text>
        <View className="mt-2 flex-row items-center gap-4">
          <TouchableOpacity className="flex-row items-center gap-1">
            <Heart size={14} color={themeColors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">
              {item.likes_count}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text className="text-xs font-medium text-muted-foreground">
              Rispondi
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => handleLikeComment(item.id)}>
        <Heart
          size={16}
          color={item.is_liked ? '#ef4444' : themeColors.mutedForeground}
          fill={item.is_liked ? '#ef4444' : 'none'}
        />
      </TouchableOpacity>
    </View>
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
            <X size={24} color={themeColors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Commenti</Text>
          <View className="w-6" />
        </View>

        {/* Comments List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={themeColors.foreground} />
          </View>
        ) : (
          <>
            <FlatList
              data={comments}
              renderItem={renderComment}
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
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                  <Text className="text-muted-foreground">
                    Nessun commento ancora.{'\n'}Sii il primo a commentare!
                  </Text>
                </View>
              }
            />

            {/* Comment Input */}
            <View className="border-t border-border px-4 py-3">
              <View className="flex-row items-center gap-3">
                <Avatar className="h-10 w-10" alt={''}>
                  <AvatarImage source={{ uri: '' }} />
                  <AvatarFallback>
                    <Text className="text-xs font-semibold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </Text>
                  </AvatarFallback>
                </Avatar>
                <View className="flex-1 flex-row items-center gap-2 rounded-full border border-border bg-muted/30 px-4 py-2">
                  <Input
                    placeholder="Aggiungi un commento..."
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholderTextColor="#999"
                    className="flex-1 border-0 bg-transparent p-0 text-sm"
                  />
                  <TouchableOpacity
                    onPress={handlePostComment}
                    disabled={!newComment.trim() || isPosting}
                  >
                    {isPosting ? (
                      <ActivityIndicator size="small" color={themeColors.foreground} />
                    ) : (
                      <Send
                        size={16}
                        color={newComment.trim() ? themeColors.primary : themeColors.mutedForeground}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
