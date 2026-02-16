import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { GlassSurface } from '../glass';

export function TypingIndicator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Stagger the animations
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1, // Infinite
      false
    );

    setTimeout(() => {
      dot2.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      );
    }, 150);

    setTimeout(() => {
      dot3.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      );
    }, 300);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot1.value * 0.7,
    transform: [{ translateY: -dot1.value * 4 }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot2.value * 0.7,
    transform: [{ translateY: -dot2.value * 4 }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot3.value * 0.7,
    transform: [{ translateY: -dot3.value * 4 }],
  }));

  return (
    <View className="mb-3 flex-row justify-start">
      <GlassSurface
        variant="card"
        intensity={isDark ? 'regular' : 'light'}
        tint={isDark ? 'dark' : 'light'}
        style={{ maxWidth: '80%', borderRadius: 16, padding: 0 }}
      >
        <View className="flex-row gap-1 px-4 py-3">
          <Animated.View style={dot1Style} className="h-2 w-2 rounded-full bg-muted-foreground" />
          <Animated.View style={dot2Style} className="h-2 w-2 rounded-full bg-muted-foreground" />
          <Animated.View style={dot3Style} className="h-2 w-2 rounded-full bg-muted-foreground" />
        </View>
      </GlassSurface>
    </View>
  );
}
