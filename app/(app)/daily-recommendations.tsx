import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { Text } from '../../components/ui/text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { ChevronLeft, Sparkles, Heart } from 'lucide-react-native';
import { THEME } from '../../lib/theme';
import { useColorScheme } from 'nativewind';
import { GlassSurface } from '../../components/glass';
import {
  dailyRecommendationsService,
  type Recommendation,
} from '../../lib/services/daily-recommendations';
import { SwipeStack } from '../../components/recommendations/swipe-stack';
import { LikedEventsList } from '../../components/recommendations/liked-events-list';
import { storage } from '../../lib/storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 70; // Header height (py-3 + content + border)

export default function DailyRecommendationsScreen() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { colorScheme } = useColorScheme();
  const themeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const isDark = themeMode === 'dark';
  const themeColors = THEME[themeMode];
  const insets = useSafeAreaInsets();

  // State
  const [allRecommendations, setAllRecommendations] = useState<Recommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedEvents, setLikedEvents] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [autoExpandSheet, setAutoExpandSheet] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Calculate container height for fullscreen cards (excluding header)
  const containerHeight = SCREEN_HEIGHT - insets.top - insets.bottom - HEADER_HEIGHT;

  // Filter only events
  const eventRecommendations = useMemo(
    () => allRecommendations.filter((r) => r.entity_type === 'event'),
    [allRecommendations]
  );

  // Remaining recommendations to swipe
  const remainingRecommendations = useMemo(
    () => eventRecommendations.slice(currentIndex),
    [eventRecommendations, currentIndex]
  );

  // Get access token on mount
  useEffect(() => {
    const fetchToken = async () => {
      const session = await storage.getSession();
      setAccessToken(session?.accessToken || null);
    };
    fetchToken();
  }, []);

  // Check completion status on mount
  const checkCompletionStatus = useCallback(async () => {
    if (!accessToken) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await dailyRecommendationsService.checkCompletion(
        today,
        accessToken
      );

      if (error) {
        console.error('Error checking completion:', error);
        return;
      }

      if (data?.completed) {
        // Already completed - show liked events directly
        setIsCompleted(true);
        setLikedEvents(
          data.liked_events.map((event) => ({
            id: event.id,
            entity_type: 'event' as const,
            entity_id: event.id,
            featured_date: today,
            source: 'automatic' as const,
            priority: 0,
            score: 1,
            event: {
              id: event.id,
              title: event.title,
              cover_image_url: event.cover_image_url,
              start_datetime: event.start_datetime,
            },
          }))
        );
        setAutoExpandSheet(true);
      }
    } catch (err) {
      console.error('Error checking completion:', err);
    }
  }, [accessToken]);

  // Load filtered recommendations (exclude already swiped)
  const loadRecommendations = useCallback(async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } =
        await dailyRecommendationsService.getFilteredRecommendations(
          today,
          accessToken
        );

      if (error) {
        console.error('Error loading recommendations:', error);
        setAllRecommendations([]);
      } else {
        setAllRecommendations(data?.recommendations || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setAllRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Initial load
  useEffect(() => {
    if (!accessToken) return;

    const initLoad = async () => {
      await checkCompletionStatus();
      // Only load recommendations if not already completed
      if (!isCompleted) {
        await loadRecommendations();
      }
    };

    initLoad();
  }, [accessToken, checkCompletionStatus, loadRecommendations, isCompleted]);

  // Handle swipe with persistence
  const handleSwipe = useCallback(
    async (rec: Recommendation, actionType: 'like' | 'pass') => {
      if (!accessToken) return;

      const today = new Date().toISOString().split('T')[0];

      // Optimistic update
      const previousIndex = currentIndex;
      const previousLiked = likedEvents;

      setCurrentIndex((prev) => prev + 1);
      if (actionType === 'like') {
        setLikedEvents((prev) => [...prev, rec]);
      }

      // Save to DB
      const { data, error } = await dailyRecommendationsService.saveSwipe(
        {
          recommendation_id: rec.id,
          action_type: actionType,
          featured_date: today,
          event_id: rec.event?.id,
          event_type: rec.event?.title,
          place_id: rec.place?.id,
          place_type: rec.place?.place_type,
        },
        accessToken
      );

      if (error) {
        console.error('Error saving swipe:', error);
        // Rollback optimistic update
        setCurrentIndex(previousIndex);
        setLikedEvents(previousLiked);
        return;
      }

      // Check if completed
      if (data?.completion_status?.completed) {
        setIsCompleted(true);
      }
    },
    [accessToken, currentIndex, likedEvents]
  );

  // Handle swipe left (pass)
  const handleSwipeLeft = useCallback(
    (rec: Recommendation) => {
      handleSwipe(rec, 'pass');
    },
    [handleSwipe]
  );

  // Handle swipe right (like)
  const handleSwipeRight = useCallback(
    (rec: Recommendation) => {
      handleSwipe(rec, 'like');
    },
    [handleSwipe]
  );

  // Handle completion - auto-expand bottom sheet
  const handleComplete = useCallback(() => {
    setAutoExpandSheet(true);
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(2);
    }, 100);
  }, []);

  // Handle event press from liked list
  const handleEventPress = useCallback(
    (eventId: string) => {
      router.push(`/event/${eventId}` as any);
    },
    [router]
  );

  // Clear all liked events
  const handleClearAll = useCallback(() => {
    setLikedEvents([]);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        {/* Header */}
        <GlassSurface
          variant="card"
          intensity={isDark ? 'regular' : 'light'}
          tint={isDark ? 'extraLight' : 'light'}
          style={{ borderRadius: 0, padding: 0 }}
        >
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <View className="flex-row items-center flex-1">
            <Pressable
              onPress={() => router.back()}
              className="p-2 -ml-2"
              hitSlop={8}
            >
              <ChevronLeft size={24} color={themeColors.foreground} />
            </Pressable>

            <View className="ml-2">
              <View className="flex-row items-center">
                <Sparkles size={20} color={themeColors.primary} />
                <Text className="ml-2 text-xl font-bold text-foreground">
                  Per Te
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground">
                {isCompleted
                  ? 'Hai completato i raccomandati di oggi!'
                  : 'Swipa per scoprire eventi'}
              </Text>
            </View>
          </View>

          {/* Liked counter button */}
          <GlassSurface
            variant="card"
            intensity={isDark ? 'light' : 'regular'}
            tint={isDark ? 'dark' : 'light'}
            style={{ borderRadius: 999, padding: 0 }}
          >
            <Pressable
              onPress={() => bottomSheetRef.current?.expand()}
              className="flex-row items-center bg-primary/10 px-3 py-2 rounded-full"
            >
              <Heart
                size={18}
                color={themeColors.primary}
                fill={likedEvents.length > 0 ? themeColors.primary : 'transparent'}
              />
              {likedEvents.length > 0 && (
                <Text className="ml-1.5 font-bold text-primary">
                  {likedEvents.length}
                </Text>
              )}
            </Pressable>
          </GlassSurface>
        </View>
        </GlassSurface>

        {/* Swipe Stack */}
        <View className="flex-1">
          <SwipeStack
            recommendations={remainingRecommendations}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            isLoading={isLoading}
            onComplete={handleComplete}
            containerHeight={containerHeight}
          />
        </View>

        {/* Progress indicator */}
        {!isCompleted && eventRecommendations.length > 0 && (
          <View className="px-4 pb-2">
            <Text className="text-center text-xs text-muted-foreground">
              {currentIndex + 1} / {eventRecommendations.length} eventi
            </Text>
          </View>
        )}

        {/* Liked Events Bottom Sheet */}
        <LikedEventsList
          ref={bottomSheetRef}
          likedEvents={likedEvents}
          onEventPress={handleEventPress}
          onClearAll={handleClearAll}
          autoExpand={autoExpandSheet}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
