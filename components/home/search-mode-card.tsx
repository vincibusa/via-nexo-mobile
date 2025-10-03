import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

interface SearchModeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress: () => void;
}

export function SearchModeCard({ icon: Icon, title, description, onPress }: SearchModeCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {
      stiffness: 400,
      damping: 20,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      stiffness: 400,
      damping: 20,
    });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="active:opacity-90"
      >
        <Card className="h-auto shadow-lg ">
          <CardContent className="flex-1 gap-3">
            {/* Icon */}
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Icon size={32} className="text-primary" />
            </View>

            {/* Title */}
            <CardTitle className="text-xl">{title}</CardTitle>

            {/* Description */}
            <CardDescription>{description}</CardDescription>
          </CardContent>
        </Card>
      </Pressable>
    </Animated.View>
  );
}
