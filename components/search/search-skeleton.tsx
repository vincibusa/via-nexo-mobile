import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SearchSkeletonProps {
  type: 'user' | 'place' | 'event';
  count?: number;
}

function SkeletonBox({ className }: { className?: string }) {
  return <View className={`bg-muted rounded ${className}`} />;
}

function UserSkeleton() {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border/30">
      <SkeletonBox className="w-12 h-12 rounded-full" />
      <View className="flex-1 gap-2">
        <SkeletonBox className="h-4 w-28" />
        <SkeletonBox className="h-3 w-40" />
      </View>
      <SkeletonBox className="h-8 w-20 rounded-full" />
    </View>
  );
}

function PlaceSkeleton() {
  return (
    <View className="w-1/2 p-1">
      <View className="rounded-xl overflow-hidden bg-muted/30">
        <SkeletonBox className="h-28 w-full rounded-none" />
        <View className="p-3 gap-2">
          <SkeletonBox className="h-4 w-3/4" />
          <SkeletonBox className="h-3 w-1/2" />
        </View>
      </View>
    </View>
  );
}

function EventSkeleton() {
  return (
    <View className="w-1/2 p-1">
      <View className="rounded-xl overflow-hidden bg-muted/30">
        <SkeletonBox className="h-28 w-full rounded-none" />
        <View className="p-3 gap-2">
          <SkeletonBox className="h-4 w-3/4" />
          <SkeletonBox className="h-3 w-1/2" />
          <SkeletonBox className="h-3 w-2/3" />
        </View>
      </View>
    </View>
  );
}

export function SearchSkeleton({ type, count = 3 }: SearchSkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderSkeletons = () => {
    const items = Array.from({ length: count }, (_, i) => i);

    switch (type) {
      case 'user':
        return items.map((i) => <UserSkeleton key={i} />);
      case 'place':
        return (
          <View className="flex-row flex-wrap px-2 pt-2">
            {items.map((i) => (
              <PlaceSkeleton key={i} />
            ))}
          </View>
        );
      case 'event':
        return (
          <View className="flex-row flex-wrap px-2 pt-2">
            {items.map((i) => (
              <EventSkeleton key={i} />
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      {renderSkeletons()}
    </Animated.View>
  );
}

export function SearchResultsSkeleton() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className="flex-1">
      {/* Users Section */}
      <View className="mb-4">
        <View className="px-4 py-3 border-b border-border/30">
          <View className="h-5 w-16 bg-muted rounded" />
        </View>
        <UserSkeleton />
        <UserSkeleton />
      </View>

      {/* Places Section */}
      <View className="mb-4">
        <View className="px-4 py-3 border-b border-border/30">
          <View className="h-5 w-16 bg-muted rounded" />
        </View>
        <View className="flex-row flex-wrap px-2 pt-2">
          <PlaceSkeleton />
          <PlaceSkeleton />
        </View>
      </View>

      {/* Events Section */}
      <View>
        <View className="px-4 py-3 border-b border-border/30">
          <View className="h-5 w-16 bg-muted rounded" />
        </View>
        <View className="flex-row flex-wrap px-2 pt-2">
          <EventSkeleton />
          <EventSkeleton />
        </View>
      </View>
    </Animated.View>
  );
}
