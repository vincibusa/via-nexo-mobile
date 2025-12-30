import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Image,
  Pressable,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Text } from '../ui/text';
import { X } from 'lucide-react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface ImagePreviewModalProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

export function ImagePreviewModal({
  visible,
  imageUrl,
  onClose,
}: ImagePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Manage loading state based on imageUrl changes
  useEffect(() => {
    if (imageUrl && visible) {
      setIsLoading(true);
      setHasError(false);

      // Fallback timeout: assume image loaded after 5 seconds
      // This prevents infinite loading for cached images that don't trigger onLoadEnd
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [imageUrl, visible]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetPosition = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const handleClose = () => {
    resetPosition();
    onClose();
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
        savedScale.value = MIN_SCALE;
      }
    });

  // Pan gesture for moving
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      } else {
        // Swipe down to close
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        // Close if swiped down enough
        if (event.translationY > 100) {
          runOnJS(handleClose)();
        } else {
          translateY.value = withSpring(0);
        }
      }
    });

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > 1) {
        // Zoom out
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in to tap position
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const composedGestures = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(doubleTapGesture, panGesture)
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const opacity = scale.value > 1 ? 1 : Math.max(0.3, 1 - Math.abs(translateY.value) / 300);
    return { opacity };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[{ flex: 1, backgroundColor: 'black' }, animatedBackgroundStyle]}
        >
          {/* Close button */}
          <View
            style={{ paddingTop: insets.top + 10 }}
            className="absolute top-0 left-0 right-0 z-10 px-4"
          >
            <Pressable
              onPress={handleClose}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <X size={24} color="white" />
            </Pressable>
          </View>

          {/* Image */}
          <GestureDetector gesture={composedGestures}>
            <View className="flex-1 items-center justify-center">
              {isLoading && (
                <View className="absolute inset-0 items-center justify-center">
                  <ActivityIndicator size="large" color="white" />
                </View>
              )}

              {hasError ? (
                <View className="items-center justify-center p-8">
                  <Text className="text-white text-center">
                    Impossibile caricare l'immagine
                  </Text>
                  <Pressable
                    onPress={() => {
                      setHasError(false);
                      setIsLoading(true);
                    }}
                    className="mt-4 px-4 py-2 bg-white/20 rounded-lg"
                  >
                    <Text className="text-white">Riprova</Text>
                  </Pressable>
                </View>
              ) : (
                <Animated.Image
                  source={{ uri: imageUrl }}
                  style={[
                    {
                      width: SCREEN_WIDTH,
                      height: SCREEN_HEIGHT,
                    },
                    animatedImageStyle,
                  ]}
                  resizeMode="contain"
                  onLoadStart={() => setIsLoading(true)}
                  onLoadEnd={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                  }}
                />
              )}
            </View>
          </GestureDetector>

          {/* Hint */}
          <View
            style={{ paddingBottom: insets.bottom + 20 }}
            className="absolute bottom-0 left-0 right-0 items-center"
          >
            <Text className="text-white/60 text-sm">
              Pizzica per ingrandire • Scorri in basso per chiudere
            </Text>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
