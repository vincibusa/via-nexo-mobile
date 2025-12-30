import { View, Pressable, Dimensions } from 'react-native';
import { Text } from '../ui/text';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Trash2, Archive, BellOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ConversationListItem } from './ConversationListItem';
import type { Conversation } from '../../lib/types/messaging';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ACTION_WIDTH = 80;
const ACTIONS_THRESHOLD = ACTION_WIDTH * 3;
const TRIGGER_THRESHOLD = 150;

interface SwipeableConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onMute?: () => void;
}

export function SwipeableConversationItem({
  conversation,
  currentUserId,
  onPress,
  onDelete,
  onArchive,
  onMute,
}: SwipeableConversationItemProps) {
  const translateX = useSharedValue(0);
  const isActive = useSharedValue(false);
  const hasTriggeredHaptic = useSharedValue(false);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete?.();
  };

  const handleArchive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onArchive?.();
  };

  const handleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMute?.();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onStart(() => {
      isActive.value = true;
      hasTriggeredHaptic.value = false;
    })
    .onUpdate((event) => {
      // Only allow swipe left (negative values)
      const newValue = Math.min(0, Math.max(-ACTIONS_THRESHOLD, event.translationX));
      translateX.value = newValue;

      // Haptic feedback when crossing threshold
      if (Math.abs(newValue) >= TRIGGER_THRESHOLD && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      } else if (Math.abs(newValue) < TRIGGER_THRESHOLD && hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onEnd((event) => {
      isActive.value = false;

      // If swiped far enough, keep actions visible
      if (Math.abs(translateX.value) >= ACTION_WIDTH * 2) {
        translateX.value = withSpring(-ACTIONS_THRESHOLD, {
          damping: 20,
          stiffness: 200,
        });
      } else {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const actionsContainerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, ACTION_WIDTH],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          Math.abs(translateX.value),
          [0, ACTION_WIDTH * 3],
          [0.5, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const archiveButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          Math.abs(translateX.value),
          [0, ACTION_WIDTH * 2],
          [0.5, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const muteButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          Math.abs(translateX.value),
          [0, ACTION_WIDTH],
          [0.5, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const closeActions = () => {
    translateX.value = withTiming(0, { duration: 200 });
  };

  return (
    <View className="relative overflow-hidden">
      {/* Action buttons (behind the item) */}
      <Animated.View
        style={actionsContainerStyle}
        className="absolute right-0 top-0 bottom-0 flex-row"
      >
        {/* Mute button */}
        <Animated.View style={muteButtonStyle}>
          <Pressable
            onPress={() => {
              closeActions();
              handleMute();
            }}
            className="w-20 h-full bg-gray-500 items-center justify-center"
          >
            <BellOff size={24} color="white" />
            <Text className="text-white text-xs mt-1">Silenzia</Text>
          </Pressable>
        </Animated.View>

        {/* Archive button */}
        <Animated.View style={archiveButtonStyle}>
          <Pressable
            onPress={() => {
              closeActions();
              handleArchive();
            }}
            className="w-20 h-full bg-blue-500 items-center justify-center"
          >
            <Archive size={24} color="white" />
            <Text className="text-white text-xs mt-1">Archivia</Text>
          </Pressable>
        </Animated.View>

        {/* Delete button */}
        <Animated.View style={deleteButtonStyle}>
          <Pressable
            onPress={() => {
              closeActions();
              handleDelete();
            }}
            className="w-20 h-full bg-red-500 items-center justify-center"
          >
            <Trash2 size={24} color="white" />
            <Text className="text-white text-xs mt-1">Elimina</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* Swipeable content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle} className="bg-background">
          <ConversationListItem
            conversation={conversation}
            currentUserId={currentUserId}
            onPress={onPress}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
