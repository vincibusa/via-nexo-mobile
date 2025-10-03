import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { useState } from 'react';

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

  return (
    <View className="gap-4">
      {/* Companionship */}
      <View className="gap-2">
        <Text className="text-sm font-medium">Compagnia</Text>
        <View className="flex-row flex-wrap gap-2">
          {COMPANIONSHIP_OPTIONS.map((option) => (
            <Badge
              key={option.value}
              variant={filters.companionship.includes(option.value) ? 'default' : 'outline'}
              onPress={() => toggleCompanionship(option.value)}
              className="px-4 py-2"
            >
              <Text>{option.label}</Text>
            </Badge>
          ))}
        </View>
      </View>

      {/* Mood */}
      <View className="gap-2">
        <Text className="text-sm font-medium">Mood</Text>
        <View className="flex-row flex-wrap gap-2">
          {MOOD_OPTIONS.map((option) => (
            <Badge
              key={option.value}
              variant={filters.mood.includes(option.value) ? 'default' : 'outline'}
              onPress={() => toggleMood(option.value)}
              className="px-4 py-2"
            >
              <Text>{option.label}</Text>
            </Badge>
          ))}
        </View>
      </View>

      {/* Budget */}
      <View className="gap-2">
        <Text className="text-sm font-medium">Budget</Text>
        <View className="flex-row gap-2">
          {BUDGET_OPTIONS.map((option) => (
            <Badge
              key={option}
              variant={filters.budget === option ? 'default' : 'outline'}
              onPress={() => selectBudget(option)}
              className="px-6 py-2"
            >
              <Text>{option}</Text>
            </Badge>
          ))}
        </View>
      </View>

      {/* Time */}
      <View className="gap-2">
        <Text className="text-sm font-medium">Quando</Text>
        <View className="flex-row gap-2">
          {TIME_OPTIONS.map((option) => (
            <Badge
              key={option.value}
              variant={filters.time === option.value ? 'default' : 'outline'}
              onPress={() => selectTime(option.value)}
              className="px-4 py-2 flex-1"
            >
              <Text className="text-center">{option.label}</Text>
            </Badge>
          ))}
        </View>
      </View>
    </View>
  );
}
