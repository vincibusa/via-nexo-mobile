import { View, FlatList, Image, Dimensions, Pressable, Text } from 'react-native';
import { useState } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageGalleryProps {
  images: string[];
  height?: number;
}

export function ImageGallery({ images, height = 300 }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <View
        className="w-full items-center justify-center bg-muted"
        style={{ height }}
      >
        <View className="items-center justify-center">
          <Text className="text-6xl opacity-30">📷</Text>
        </View>
      </View>
    );
  }

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  return (
    <View className="relative" style={{ height }}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        renderItem={({ item }) => (
          <Pressable style={{ width: SCREEN_WIDTH, height }}>
            <Image
              source={{ uri: item }}
              style={{ width: SCREEN_WIDTH, height }}
              resizeMode="cover"
            />
          </Pressable>
        )}
        keyExtractor={(item, index) => `${item}-${index}`}
      />

      {/* Pagination Dots */}
      {images.length > 1 && (
        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
          {images.map((_, index) => (
            <View
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === activeIndex ? 'bg-foreground' : 'bg-foreground/50'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
