import React, { useCallback, useMemo, forwardRef, useEffect } from 'react';
import { View, Pressable, Image, StyleSheet } from 'react-native';
import { Text } from '../ui/text';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Calendar, ChevronRight, Heart, Trash2 } from 'lucide-react-native';
import { THEME } from '../../lib/theme';
import type { Recommendation } from '../../lib/services/daily-recommendations';

interface LikedEventsListProps {
  likedEvents: Recommendation[];
  onEventPress: (eventId: string) => void;
  onClearAll?: () => void;
  autoExpand?: boolean;
}

export const LikedEventsList = forwardRef<BottomSheet, LikedEventsListProps>(
  ({ likedEvents, onEventPress, onClearAll, autoExpand }, ref) => {
    const themeColors = THEME.dark;

    // Snap points: collapsed (showing header), half, full
    const snapPoints = useMemo(() => ['12%', '50%', '90%'], []);

    // Auto-expand when autoExpand prop is true
    useEffect(() => {
      if (autoExpand && ref && typeof ref !== 'function') {
        ref.current?.snapToIndex(2); // Snap to 90% (full)
      }
    }, [autoExpand, ref]);

    const formatEventDate = (dateString?: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return '';
      }
    };

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={0}
          appearsOnIndex={1}
          opacity={0.5}
        />
      ),
      []
    );

    const renderItem = useCallback(
      ({ item }: { item: Recommendation }) => (
        <Pressable
          onPress={() => onEventPress(item.entity_id)}
          className="flex-row items-center p-4 border-b border-border active:bg-muted/50"
        >
          {/* Thumbnail */}
          <Image
            source={{
              uri:
                item.event?.cover_image_url ||
                'https://via.placeholder.com/80x80?text=Event',
            }}
            className="w-16 h-16 rounded-xl bg-muted"
            resizeMode="cover"
          />

          {/* Event info */}
          <View className="flex-1 ml-3">
            <Text className="font-semibold text-foreground" numberOfLines={1}>
              {item.event?.title || 'Evento'}
            </Text>
            <View className="flex-row items-center mt-1">
              <Calendar size={12} color={themeColors.mutedForeground} />
              <Text className="ml-1 text-xs text-muted-foreground">
                {formatEventDate(item.event?.start_datetime)}
              </Text>
            </View>
            {item.place?.name && (
              <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                📍 {item.place.name}
              </Text>
            )}
          </View>

          {/* Chevron */}
          <ChevronRight size={20} color={themeColors.mutedForeground} />
        </Pressable>
      ),
      [onEventPress, themeColors]
    );

    const renderHeader = useCallback(
      () => (
        <View className="px-4 py-3 border-b border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Heart size={20} color={themeColors.primary} fill={themeColors.primary} />
              <Text className="ml-2 text-lg font-bold text-foreground">
                I tuoi Like
              </Text>
              <View className="ml-2 bg-primary px-2 py-0.5 rounded-full">
                <Text className="text-xs font-bold text-primary-foreground">
                  {likedEvents.length}
                </Text>
              </View>
            </View>

            {likedEvents.length > 0 && onClearAll && (
              <Pressable
                onPress={onClearAll}
                className="flex-row items-center px-3 py-1.5 rounded-full bg-destructive/10 active:bg-destructive/20"
              >
                <Trash2 size={14} color={themeColors.destructive} />
                <Text className="ml-1 text-xs text-destructive font-medium">
                  Cancella
                </Text>
              </Pressable>
            )}
          </View>

          {likedEvents.length === 0 && (
            <Text className="text-sm text-muted-foreground mt-2">
              Swipa a destra sugli eventi che ti piacciono
            </Text>
          )}
        </View>
      ),
      [likedEvents.length, onClearAll, themeColors]
    );

    const renderEmpty = useCallback(
      () => (
        <View className="flex-1 justify-center items-center py-12">
          <Heart size={48} color={themeColors.mutedForeground} />
          <Text className="mt-4 text-muted-foreground text-center">
            Nessun evento salvato
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground text-center px-8">
            Gli eventi che ti piacciono appariranno qui
          </Text>
        </View>
      ),
      [themeColors]
    );

    return (
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: themeColors.mutedForeground }}
        backgroundStyle={{ backgroundColor: themeColors.background }}
        style={styles.bottomSheet}
      >
        {renderHeader()}
        <BottomSheetFlatList
          data={likedEvents}
          keyExtractor={(item: Recommendation) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            likedEvents.length === 0 ? styles.emptyContainer : undefined
          }
        />
      </BottomSheet>
    );
  }
);

LikedEventsList.displayName = 'LikedEventsList';

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  emptyContainer: {
    flex: 1,
  },
});
