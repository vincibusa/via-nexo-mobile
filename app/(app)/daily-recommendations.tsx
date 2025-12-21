import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { ChevronLeft, Calendar, Sparkles } from 'lucide-react-native';
import { dailyRecommendationsService, type Recommendation } from '../../lib/services/daily-recommendations';
import { RecommendationCard } from '../../components/recommendations/recommendation-card';

export default function DailyRecommendationsScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  
  // Use dark theme (single theme for the app)
  const themeColors = THEME.dark;
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } =
        await dailyRecommendationsService.getDailyRecommendations(
          selectedDate
        );

      if (fetchError) {
        setError(fetchError);
        setRecommendations([]);
      } else {
        setRecommendations(data?.recommendations || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading recommendations');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleRecommendationPress = (rec: Recommendation) => {
    if (rec.entity_type === 'place') {
      router.push(`/place/${rec.entity_id}` as any);
    } else {
      router.push(`/event/${rec.entity_id}` as any);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();

      if (isToday) {
        return 'Oggi';
      }

      return date.toLocaleDateString('it-IT', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={themeColors.foreground} />
        </Pressable>

        <View className="flex-1 ml-2">
          <View className="flex-row items-center">
            <Sparkles size={20} color={themeColors.primary} />
            <Text className="ml-2 text-xl font-bold text-foreground">
              Consigliati del Giorno
            </Text>
          </View>
          <Text className="text-sm text-muted-foreground mt-1">
            {formatDisplayDate(selectedDate)}
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-destructive text-center">{error}</Text>
        </View>
      ) : recommendations.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <View className="bg-muted rounded-lg p-6 items-center">
            <Calendar size={48} color={themeColors.mutedForeground} />
            <Text className="mt-4 text-muted-foreground text-center font-medium">
              Nessun consiglio speciale per oggi
            </Text>
            <Text className="mt-2 text-muted-foreground text-center text-sm">
              Controlla più tardi per i consigliati della giornata
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          renderItem={({ item }) => (
            <RecommendationCard
              recommendation={item}
              onPress={() => handleRecommendationPress(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          scrollEnabled
        />
      )}
    </SafeAreaView>
  );
}
