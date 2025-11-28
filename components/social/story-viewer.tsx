import {
  View,
  Image,
  Modal,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { API_CONFIG } from '../../lib/config';

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

interface StoryViewerProps {
  storyGroup: StoryGroup;
  isVisible: boolean;
  onClose: () => void;
}

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

export function StoryViewer({ storyGroup, isVisible, onClose }: StoryViewerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const story = storyGroup.stories[currentIndex];
  const totalStories = storyGroup.stories.length;

  // Auto-advance story every 5 seconds
  useEffect(() => {
    if (!isVisible) return;

    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Mark as viewed
    markAsViewed(story.id);

    return () => clearTimeout(timer);
  }, [story.id, currentIndex, isVisible]);

  // Progress animation
  useEffect(() => {
    if (!isVisible || isLoading) return;

    let progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < totalStories - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
          } else {
            // All stories viewed, close viewer
            onClose();
          }
          return 0;
        }
        return prev + (100 / 50); // 5 second duration (50 increments)
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [isVisible, currentIndex, totalStories, isLoading]);

  const markAsViewed = async (storyId: string) => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STORY_VIEW(storyId)}`;
      await fetch(url, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalStories - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent={false}>
      <View 
        className="flex-1 bg-black"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Progress Bars */}
        <View className="flex-row gap-2 px-2 pt-2 z-50">
          {storyGroup.stories.map((_, index) => (
            <View
              key={index}
              className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
            >
              <View
                className="h-full bg-white"
                style={{
                  width:
                    index === currentIndex
                      ? `${progress}%`
                      : index < currentIndex
                        ? '100%'
                        : '0%',
                }}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-4 z-40" pointerEvents="box-none">
          <View className="flex-row items-center gap-2 flex-1" pointerEvents="box-none">
            <Avatar className="h-10 w-10" alt={storyGroup.user.display_name || 'User'}>
              <AvatarImage
                source={{ uri: storyGroup.user.avatar_url || '' }}
              />
              <AvatarFallback>
                <Text className="text-xs font-semibold text-white">
                  {(storyGroup.user.display_name || 'U').charAt(0).toUpperCase()}
                </Text>
              </AvatarFallback>
            </Avatar>

            <View className="flex-1">
              <Text className="text-white font-semibold" numberOfLines={1}>
                {storyGroup.user.display_name || 'Unknown'}
              </Text>
              <Text className="text-white/70 text-xs">
                {timeAgo(story.created_at)}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Media with Tap Zones */}
        <View className="flex-1 justify-center items-center relative">
          {isLoading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <>
              <Image
                source={{ uri: story.media_url }}
                className="flex-1 w-full"
                resizeMode="cover"
              />

              {/* Text Overlay */}
              {story.text_overlay && (
                <View className="absolute inset-0 items-center justify-center pointer-events-none">
                  <Text className="text-white text-2xl font-bold text-center px-4 bg-black/40 rounded-lg p-4">
                    {story.text_overlay}
                  </Text>
                </View>
              )}

              {/* Navigation Tap Zones - Instagram style */}
              <View className="absolute inset-0 flex-row" pointerEvents="box-none">
                {/* Left half - Previous story */}
                <Pressable
                  onPress={handlePrevious}
                  className="flex-1"
                  style={{ backgroundColor: 'transparent' }}
                  disabled={currentIndex === 0}
                />

                {/* Right half - Next story */}
                <Pressable
                  onPress={handleNext}
                  className="flex-1"
                  style={{ backgroundColor: 'transparent' }}
                  disabled={currentIndex === totalStories - 1}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
