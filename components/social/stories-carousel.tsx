import { View, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '../ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/contexts/auth';
import { StoryViewer } from './story-viewer';
import { API_CONFIG } from '../../lib/config';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useColorScheme } from 'nativewind';

export interface StoryGroup {
  user_id: string;
  user: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
  stories: Array<{
    id: string;
    media_url: string;
    media_type: string;
    text_overlay?: string;
    created_at: string;
    is_viewed: boolean;
  }>;
  has_unseen: boolean;
}

interface StoriesCarouselProps {
  onCreatePress?: () => void;
  refreshTrigger?: number; // When this changes, stories will be refreshed
}

export function StoriesCarousel({
  onCreatePress,
  refreshTrigger,
}: StoriesCarouselProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<StoryGroup | null>(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  useEffect(() => {
    fetchStories();
  }, []);

  // Refresh stories when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('Refreshing stories, trigger:', refreshTrigger);
      fetchStories();
    }
  }, [refreshTrigger, user?.id]);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STORIES_FOLLOWING}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch stories: ${response.status}`);
      }

      const data = (await response.json()) as StoryGroup[];
      // Filter out user's own stories
      const filteredStories = data.filter((group: StoryGroup) => group.user_id !== user?.id);
      setStoryGroups(filteredStories || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStoryGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMyStoriesPress = () => {
    if (onCreatePress) {
      onCreatePress();
    }
  };

  const handleStoryPress = (group: StoryGroup) => {
    setSelectedStoryGroup(group);
    setIsViewerVisible(true);
  };

  return (
    <>
      {isLoading ? (
        <View className="h-24 items-center justify-center px-4">
          <ActivityIndicator size="small" color={themeColors.foreground} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="gap-2"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 12 }}
        >
          {/* Create Story Button / View My Stories */}
          <TouchableOpacity
            onPress={onCreatePress || handleMyStoriesPress}
            className="items-center justify-center gap-2"
          >
            <View className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-primary">
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  className="h-full w-full"
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-muted" />
              )}
            </View>
            <Text className="text-xs font-medium">La tua</Text>
          </TouchableOpacity>

          {/* Stories from followed users */}
          {storyGroups.map((group) => (
            <TouchableOpacity
              key={group.user_id}
              onPress={() => handleStoryPress(group)}
              className="gap-2"
            >
              <View
                className={`relative h-16 w-16 overflow-hidden rounded-full border-2 ${
                  group.has_unseen ? 'border-primary' : 'border-muted'
                }`}
              >
                <Image
                  source={{ uri: group.stories[0].media_url }}
                  className="h-full w-full"
                  resizeMode="cover"
                />

                {/* Avatar Overlay */}
                <View className="absolute bottom-0 right-0">
                  <Avatar className="h-6 w-6 border border-background" alt={group.user.display_name || 'User'}>
                    <AvatarImage
                      source={{ uri: group.user.avatar_url || '' }}
                    />
                    <AvatarFallback>
                      <Text className="text-xs font-semibold">
                        {(group.user.display_name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                </View>
              </View>
              <Text className="text-xs font-medium" numberOfLines={1}>
                {group.user.display_name || 'Unknown'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Story Viewer Modal */}
      {selectedStoryGroup && (
        <StoryViewer
          storyGroup={selectedStoryGroup}
          isVisible={isViewerVisible}
          onClose={() => {
            setIsViewerVisible(false);
            setSelectedStoryGroup(null);
            // Refresh stories to update viewed status
            fetchStories();
          }}
        />
      )}
    </>
  );
}
