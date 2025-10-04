import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

export interface GuidedFilters {
  companionship: ('alone' | 'partner' | 'friends' | 'family')[];
  mood: ('relaxed' | 'energetic' | 'cultural' | 'romantic')[];
  budget: '€' | '€€' | '€€€';
  time: 'morning' | 'afternoon' | 'evening' | 'night' | 'now' | 'tonight' | 'weekend';
}

interface FilterPanelProps {
  onSearch: (filters: GuidedFilters) => void;
  initialExpanded?: boolean;
}

const COMPANIONSHIP_OPTIONS = [
  { value: 'alone', label: 'Solo', emoji: '🧍' },
  { value: 'partner', label: 'Coppia', emoji: '❤️' },
  { value: 'friends', label: 'Amici', emoji: '👥' },
  { value: 'family', label: 'Famiglia', emoji: '👨‍👩‍👧' },
] as const;

const MOOD_OPTIONS = [
  { value: 'relaxed', label: 'Rilassato', emoji: '😌' },
  { value: 'energetic', label: 'Energico', emoji: '⚡' },
  { value: 'cultural', label: 'Culturale', emoji: '🎭' },
  { value: 'romantic', label: 'Romantico', emoji: '💕' },
] as const;

const BUDGET_OPTIONS = [
  { value: '€', label: 'Economico' },
  { value: '€€', label: 'Medio' },
  { value: '€€€', label: 'Alto' },
] as const;

const TIME_OPTIONS = [
  { value: 'now', label: 'Adesso' },
  { value: 'tonight', label: 'Stasera' },
  { value: 'morning', label: 'Mattina' },
  { value: 'afternoon', label: 'Pomeriggio' },
  { value: 'evening', label: 'Sera' },
  { value: 'weekend', label: 'Weekend' },
] as const;

export function FilterPanel({ onSearch, initialExpanded = true }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [filters, setFilters] = useState<GuidedFilters>({
    companionship: [],
    mood: [],
    budget: '€€',
    time: 'tonight',
  });

  const toggleCompanionship = (value: GuidedFilters['companionship'][number]) => {
    setFilters((prev) => ({
      ...prev,
      companionship: prev.companionship.includes(value)
        ? prev.companionship.filter((c) => c !== value)
        : [...prev.companionship, value],
    }));
  };

  const toggleMood = (value: GuidedFilters['mood'][number]) => {
    setFilters((prev) => ({
      ...prev,
      mood: prev.mood.includes(value)
        ? prev.mood.filter((m) => m !== value)
        : [...prev.mood, value],
    }));
  };

  const handleSearch = () => {
    if (filters.companionship.length === 0 && filters.mood.length === 0) {
      return; // Need at least one filter
    }
    onSearch(filters);
    setIsExpanded(false); // Collapse after search
  };

  const hasFilters = filters.companionship.length > 0 || filters.mood.length > 0;

  return (
    <View className="border-b border-border bg-card">
      {/* Header - Always visible */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-semibold">🎯 Ricerca Guidata</Text>
          {!isExpanded && hasFilters && (
            <View className="rounded-full bg-primary px-2 py-0.5">
              <Text className="text-xs font-semibold text-primary-foreground">
                {filters.companionship.length + filters.mood.length}
              </Text>
            </View>
          )}
        </View>
        {isExpanded ? (
          <ChevronUp size={20} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground" />
        )}
      </Pressable>

      {/* Filters - Collapsible */}
      {isExpanded && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(200)}
          className="gap-4 px-4 pb-4"
        >
          {/* Companionship */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-muted-foreground">Compagnia</Text>
            <View className="flex-row flex-wrap gap-2">
              {COMPANIONSHIP_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => toggleCompanionship(option.value)}
                  className={`rounded-full border px-3 py-2 ${
                    filters.companionship.includes(option.value)
                      ? 'border-primary bg-primary'
                      : 'border-border bg-background'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      filters.companionship.includes(option.value)
                        ? 'font-semibold text-primary-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {option.emoji} {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Mood */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-muted-foreground">Atmosfera</Text>
            <View className="flex-row flex-wrap gap-2">
              {MOOD_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => toggleMood(option.value)}
                  className={`rounded-full border px-3 py-2 ${
                    filters.mood.includes(option.value)
                      ? 'border-primary bg-primary'
                      : 'border-border bg-background'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      filters.mood.includes(option.value)
                        ? 'font-semibold text-primary-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {option.emoji} {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Budget & Time */}
          <View className="flex-row gap-3">
            {/* Budget */}
            <View className="flex-1 gap-2">
              <Text className="text-sm font-medium text-muted-foreground">Budget</Text>
              <View className="flex-row gap-2">
                {BUDGET_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setFilters((prev) => ({ ...prev, budget: option.value }))}
                    className={`flex-1 rounded-lg border px-3 py-2 ${
                      filters.budget === option.value
                        ? 'border-primary bg-primary'
                        : 'border-border bg-background'
                    }`}
                  >
                    <Text
                      className={`text-center text-sm ${
                        filters.budget === option.value
                          ? 'font-semibold text-primary-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {option.value}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Time */}
            <View className="flex-1 gap-2">
              <Text className="text-sm font-medium text-muted-foreground">Quando</Text>
              <View className="flex-row gap-2">
                {TIME_OPTIONS.slice(0, 3).map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setFilters((prev) => ({ ...prev, time: option.value }))}
                    className={`flex-1 rounded-lg border px-2 py-2 ${
                      filters.time === option.value
                        ? 'border-primary bg-primary'
                        : 'border-border bg-background'
                    }`}
                  >
                    <Text
                      className={`text-center text-xs ${
                        filters.time === option.value
                          ? 'font-semibold text-primary-foreground'
                          : 'text-foreground'
                      }`}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Search Button */}
          <Button
            onPress={handleSearch}
            disabled={!hasFilters}
            className="w-full"
          >
            <Text className="font-semibold">Cerca Suggerimenti</Text>
          </Button>
        </Animated.View>
      )}
    </View>
  );
}
