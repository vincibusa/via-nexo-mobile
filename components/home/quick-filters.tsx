import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { View, Pressable } from 'react-native';
import { useState } from 'react';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

export interface Filters {
  companionship: string[];
  mood: string[];
  budget: '€' | '€€' | '€€€';
  time: 'now' | 'tonight' | 'weekend';
}

interface QuickFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const COMPANIONSHIP_OPTIONS = [
  { value: 'alone', label: 'Solo 🧍', emoji: '🧍' },
  { value: 'partner', label: 'Coppia 💑', emoji: '💑' },
  { value: 'friends', label: 'Amici 👥', emoji: '👥' },
  { value: 'family', label: 'Famiglia 👨‍👩‍👧‍👦', emoji: '👨‍👩‍👧‍👦' },
];

const MOOD_OPTIONS = [
  { value: 'relaxed', label: 'Tranquillo 😌', emoji: '😌' },
  { value: 'energetic', label: 'Festa 🎉', emoji: '🎉' },
  { value: 'cultural', label: 'Culturale 🎭', emoji: '🎭' },
  { value: 'romantic', label: 'Romantico 💕', emoji: '💕' },
];

const BUDGET_OPTIONS: Array<'€' | '€€' | '€€€'> = ['€', '€€', '€€€'];

const TIME_OPTIONS: Array<{ value: 'now' | 'tonight' | 'weekend'; label: string }> = [
  { value: 'now', label: 'Adesso ⚡' },
  { value: 'tonight', label: 'Stasera 🌙' },
  { value: 'weekend', label: 'Weekend 📅' },
];

export function QuickFilters({ filters, onFiltersChange }: QuickFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    companionship: true,
    mood: true,
    budget: true,
    time: true,
  });

  const toggleCompanionship = (value: string) => {
    const newCompanionship = filters.companionship.includes(value)
      ? filters.companionship.filter((c) => c !== value)
      : [...filters.companionship, value];

    onFiltersChange({ ...filters, companionship: newCompanionship });
  };

  const toggleMood = (value: string) => {
    const newMood = filters.mood.includes(value)
      ? filters.mood.filter((m) => m !== value)
      : [...filters.mood, value];

    onFiltersChange({ ...filters, mood: newMood });
  };

  const selectBudget = (value: '€' | '€€' | '€€€') => {
    onFiltersChange({ ...filters, budget: value });
  };

  const selectTime = (value: 'now' | 'tonight' | 'weekend') => {
    onFiltersChange({ ...filters, time: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      companionship: [],
      mood: [],
      budget: '€€',
      time: 'tonight',
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFilterCount = filters.companionship.length + filters.mood.length;
  const hasActiveFilters = activeFilterCount > 0;

  // Animated Badge Component
  const AnimatedBadge = ({ isSelected, onPress, children, className = '' }: any) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: withSpring(isSelected ? 1.05 : 1.0, {
            stiffness: 300,
            damping: 20,
          }),
        },
      ],
    }));

    return (
      <Animated.View style={animatedStyle}>
        <Pressable onPress={onPress}>
          <Badge
            variant={isSelected ? 'default' : 'outline'}
            className={className}
          >
            {children}
          </Badge>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View className="gap-4">
      {/* Header with Clear All */}
      {hasActiveFilters && (
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">
            {activeFilterCount} {activeFilterCount === 1 ? 'filtro attivo' : 'filtri attivi'}
          </Text>
          <Button variant="ghost" size="sm" onPress={clearAllFilters}>
            <Text className="text-sm">Cancella tutto</Text>
          </Button>
        </View>
      )}

      {/* Companionship */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-medium">Compagnia</Text>
            {filters.companionship.length > 0 && (
              <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
                <Text className="text-xs font-bold text-primary-foreground">
                  {filters.companionship.length}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {COMPANIONSHIP_OPTIONS.map((option) => (
            <AnimatedBadge
              key={option.value}
              isSelected={filters.companionship.includes(option.value)}
              onPress={() => toggleCompanionship(option.value)}
              className="px-4 py-2"
            >
              <Text>{option.label}</Text>
            </AnimatedBadge>
          ))}
        </View>
      </View>

      {/* Mood */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-medium">Mood</Text>
            {filters.mood.length > 0 && (
              <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
                <Text className="text-xs font-bold text-primary-foreground">
                  {filters.mood.length}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {MOOD_OPTIONS.map((option) => (
            <AnimatedBadge
              key={option.value}
              isSelected={filters.mood.includes(option.value)}
              onPress={() => toggleMood(option.value)}
              className="px-4 py-2"
            >
              <Text>{option.label}</Text>
            </AnimatedBadge>
          ))}
        </View>
      </View>

      {/* Budget */}
      <View className="gap-2">
        <Text className="text-sm font-medium">Budget</Text>
        <View className="flex-row gap-2">
          {BUDGET_OPTIONS.map((option) => (
            <AnimatedBadge
              key={option}
              isSelected={filters.budget === option}
              onPress={() => selectBudget(option)}
              className="px-6 py-2"
            >
              <Text>{option}</Text>
            </AnimatedBadge>
          ))}
        </View>
      </View>

      {/* Time */}
      <View className="gap-2">
        <Text className="text-sm font-medium">Quando</Text>
        <View className="flex-row gap-2">
          {TIME_OPTIONS.map((option) => (
            <AnimatedBadge
              key={option.value}
              isSelected={filters.time === option.value}
              onPress={() => selectTime(option.value)}
              className="px-4 py-2 flex-1"
            >
              <Text className="text-center">{option.label}</Text>
            </AnimatedBadge>
          ))}
        </View>
      </View>
    </View>
  );
}
