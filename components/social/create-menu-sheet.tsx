import { View, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Text } from '../ui/text';
import { Camera, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuth } from '../../lib/contexts/auth';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { API_CONFIG } from '../../lib/config';
import { StoryViewer } from './story-viewer';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';

interface StoryGroup {
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

interface CreateMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateMenuSheet({
  isOpen,
  onClose,
}: CreateMenuSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const [userStories, setUserStories] = useState<StoryGroup | null>(null);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [isViewingStories, setIsViewingStories] = useState(false);

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  useEffect(() => {
    if (isOpen) {
      fetchUserStories();
    }
  }, [isOpen]);

  const fetchUserStories = async () => {
    if (!user?.id) return;

    setIsLoadingStories(true);
    try {
      const url = `${API_CONFIG.BASE_URL}/api/social/stories?user_id=${user.id}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch user stories: ${response.status}`);
      }

      const stories = await response.json();

      if (stories && stories.length > 0) {
        const storyGroup: StoryGroup = {
          user_id: user.id,
          user: {
            id: user.id,
            display_name: user.displayName,
            avatar_url: user.avatarUrl || undefined,
          },
          stories: stories,
          has_unseen: false,
        };
        setUserStories(storyGroup);
      } else {
        setUserStories(null);
      }
    } catch (error) {
      console.error('Error fetching user stories:', error);
      setUserStories(null);
    } finally {
      setIsLoadingStories(false);
    }
  };

  const handleCreateStory = () => {
    onClose();
    setIsViewingStories(false);
    router.push('/(app)/create-story' as any);
  };

  const handleViewStories = () => {
    setIsViewingStories(true);
  };

  // Show StoryViewer if viewing stories
  if (isViewingStories && userStories) {
    return (
      <StoryViewer
        storyGroup={userStories}
        isVisible={isViewingStories}
        onClose={() => {
          setIsViewingStories(false);
          // Refresh stories
          fetchUserStories();
        }}
      />
    );
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className={cn(
            'rounded-t-2xl px-4 py-6 gap-1',
            colorScheme === 'dark' ? 'bg-slate-950' : 'bg-white'
          )}
        >
          {/* Handle indicator */}
          <View className="items-center mb-2">
            <View className="h-1 w-12 rounded-full bg-muted" />
          </View>

          {/* Loading indicator */}
          {isLoadingStories ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color={themeColors.foreground} />
            </View>
          ) : (
            <>
              {/* Create Story Option */}
              <TouchableOpacity
                onPress={handleCreateStory}
                className="flex-row items-center gap-3 px-4 py-4"
              >
                <Camera size={24} color={themeColors.primary} />
                <View className="flex-1">
                  <Text className="font-semibold text-base">Crea Storia</Text>
                  <Text className="text-xs text-muted-foreground">
                    Scompare dopo 24 ore
                  </Text>
                </View>
              </TouchableOpacity>

              {/* View User Stories Option - only show if user has stories */}
              {userStories && (
                <TouchableOpacity
                  onPress={handleViewStories}
                  className="flex-row items-center gap-3 px-4 py-4"
                >
                  <Camera size={24} color={themeColors.primary} />
                  <View className="flex-1">
                    <Text className="font-semibold text-base">
                      Visualizza tua storia
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={onClose}
                className="flex-row items-center gap-3 px-4 py-4 mt-2"
              >
                <X size={24} color={themeColors.mutedForeground} />
                <Text className="font-semibold text-muted-foreground">
                  Annulla
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
