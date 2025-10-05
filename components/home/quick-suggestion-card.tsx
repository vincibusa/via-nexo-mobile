import { Text } from '../../components/ui/text';
import { Pressable, View, Image } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface QuickSuggestionCardProps {
  id: string;
  name: string;
  place_type: string;
  address: string;
  city: string;
  distance_km: number;
  photos?: Array<{ url: string; is_primary: boolean }>;
  badge?: string | null;
}

export function QuickSuggestionCard({
  id,
  name,
  place_type,
  address,
  city,
  distance_km,
  photos,
  badge,
}: QuickSuggestionCardProps) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, {
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

  const handlePress = () => {
    router.push(`/place/${id}` as any);
  };

  // Get primary photo or first photo
  const primaryPhoto = photos?.find((p) => p.is_primary) || photos?.[0];

  return (
    <Animated.View style={animatedStyle} className="w-44">
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="active:opacity-90"
      >
        {/* Image */}
        <View className="relative mb-2 h-32 w-full overflow-hidden rounded-xl bg-muted">
          {primaryPhoto ? (
            <Image
              source={{ uri: primaryPhoto.url }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Text className="text-muted-foreground">📍</Text>
            </View>
          )}

          {/* Badge */}
          {badge && (
            <View className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1">
              <Text className="text-xs font-semibold">{badge}</Text>
            </View>
          )}

          {/* Distance */}
          <View className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-full bg-background/90 px-2 py-1">
            <MapPin size={10} className="text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">{distance_km} km</Text>
          </View>
        </View>

        {/* Info */}
        <View className="gap-1">
          <Text className="font-semibold leading-tight" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-xs text-muted-foreground capitalize" numberOfLines={1}>
            {place_type.replace('_', ' ')}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
