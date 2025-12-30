import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md';
}

export function OnlineIndicator({ isOnline, size = 'md' }: OnlineIndicatorProps) {
  const scale = useSharedValue(1);

  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
  };

  const borderSizes = {
    sm: 'border',
    md: 'border-2',
  };

  useEffect(() => {
    if (isOnline) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isOnline, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="absolute bottom-0 right-0">
      <Animated.View
        style={animatedStyle}
        className={`
          ${sizeClasses[size]}
          ${borderSizes[size]}
          rounded-full
          border-background
          ${isOnline ? 'bg-green-500' : 'bg-muted-foreground'}
        `}
      />
    </View>
  );
}
