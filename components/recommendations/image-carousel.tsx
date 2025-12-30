import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Image,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselProps {
  images: string[];
  width?: number;
  height?: number;
}

export function ImageCarousel({
  images,
  width = SCREEN_WIDTH - 32,
  height = 450,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Fallback to placeholder if no images
  const displayImages = images.length > 0
    ? images
    : ['https://via.placeholder.com/400x500?text=No+Image'];

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      setActiveIndex(index);
    },
    [width]
  );

  const renderImage = useCallback(
    ({ item }: { item: string }) => (
      <Image
        source={{ uri: item }}
        style={{ width, height }}
        resizeMode="cover"
        className="bg-muted"
      />
    ),
    [width, height]
  );

  return (
    <View>
      <FlatList
        data={displayImages}
        renderItem={renderImage}
        keyExtractor={(item, index) => `${index}-${item}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="start"
      />

      {/* Pagination dots */}
      {displayImages.length > 1 && (
        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
          {displayImages.map((_, idx) => (
            <View
              key={idx}
              className={`h-2 rounded-full ${
                idx === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
