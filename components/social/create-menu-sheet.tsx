import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  Pressable,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
} from 'react-native';
import { Text } from '../ui/text';
import { Camera, X, Images, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuth } from '../../lib/contexts/auth';
import { API_CONFIG } from '../../lib/config';
import { StoryViewer } from './story-viewer';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useModalContext } from '../../app/(app)/(tabs)/_layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '../glass/glass-surface';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

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
  canUseLiquidGlass?: boolean;
}

// Enhanced backdrop with INTENSE blur (iOS Control Center style)
function SheetBackdrop({
  isVisible,
  onPress,
}: {
  isVisible: boolean;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration: 250 });
  }, [isVisible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        style={[StyleSheet.absoluteFill, animatedStyle]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        {/* Blur layer - più leggero */}
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Dark overlay - più leggero */}
        <View style={styles.backdrop} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// Animated menu item with Pressable (compatible with Modal)
function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  isDestructive = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isDestructive?: boolean;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: `rgba(255, 255, 255, ${opacity.value})`,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
    opacity.value = withTiming(0.1, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.menuItem, animatedStyle]}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.textContainer}>
          <Text
            className={`font-semibold text-base ${
              isDestructive ? 'text-red-400' : 'text-foreground'
            }`}
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function CreateMenuSheet({
  isOpen,
  onClose,
  canUseLiquidGlass = false,
}: CreateMenuSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const { setIsModalOpen } = useModalContext();
  const [userStories, setUserStories] = useState<StoryGroup | null>(null);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [isViewingStories, setIsViewingStories] = useState(false);
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const modalTopPosition = screenHeight * 0.15; // 15% from top
  const translateY = useSharedValue(-500); // Start off-screen top

  const effectiveTheme =
    settings?.theme === 'system'
      ? colorScheme === 'dark'
        ? 'dark'
        : 'light'
      : settings?.theme === 'dark'
      ? 'dark'
      : 'light';
  const themeColors = THEME[effectiveTheme];

  // Animate modal sliding from top - MINIMAL animation
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isOpen) {
      setIsModalOpen(true);
      // Minimal timing animation (smooth e piacevole)
      translateY.value = withTiming(modalTopPosition, {
        duration: 350,
      });
    } else {
      translateY.value = withTiming(-500, {
        duration: 250,
      });
      // Delay closing modal context to allow animation
      timeoutId = setTimeout(() => setIsModalOpen(false), 250);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, translateY, setIsModalOpen, modalTopPosition]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Calculate modal height based on content
  const modalHeight = useMemo(() => {
    const baseHeight = 300; // Base height for menu items
    const loadingHeight = 200;
    const withStoriesHeight = 380;

    if (isLoadingStories) return loadingHeight;
    if (userStories) return withStoriesHeight;
    return baseHeight;
  }, [isLoadingStories, userStories]);

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
    // Delay navigation to let modal close animation finish (350ms animation + buffer)
    setTimeout(() => {
      try {
        router.push('/(app)/create-story' as any);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }, 400);
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
          fetchUserStories();
        }}
      />
    );
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Custom Backdrop */}
      <SheetBackdrop isVisible={isOpen} onPress={onClose} />

      {/* Modal sliding from top */}
      <Animated.View style={[styles.modalContainer, animatedStyle]}>
        <GlassSurface variant="modal" intensity="regular" tint="extraLight" style={[styles.sheetSurface, { height: modalHeight }]}>
          <View style={styles.contentContainer}>
            {/* Loading indicator */}
            {isLoadingStories ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={themeColors.foreground} />
              </View>
            ) : (
              <View style={styles.menuContainer}>
                {/* Create Story Option */}
                <MenuItem
                  icon={<Camera size={28} color={themeColors.primary} />}
                  title="Crea Storia"
                  subtitle="Scompare dopo 24 ore"
                  onPress={handleCreateStory}
                />

                {/* View User Stories Option */}
                {userStories && (
                  <MenuItem
                    icon={<Images size={28} color={themeColors.primary} />}
                    title="Visualizza tua storia"
                    onPress={handleViewStories}
                  />
                )}

                {/* Cancel Button */}
                <MenuItem
                  icon={<X size={28} color={themeColors.mutedForeground} />}
                  title="Annulla"
                  onPress={onClose}
                  isDestructive
                />
              </View>
            )}
          </View>
        </GlassSurface>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Overlay più leggero
    zIndex: 10,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  sheetSurface: {
    marginTop: 16,
  },
  glassContainer: {
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  fallbackSurface: {
    backgroundColor: 'rgba(22, 24, 30, 0.95)',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flex: 1,
    justifyContent: 'center', // Centro il contenuto verticalmente
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonInner: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  menuContainer: {
    gap: 12, // More spacing between items (iOS style)
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 20, // More rounded
  },
  iconContainer: {
    width: 52, // Larger icons like iOS Control Center
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
});
