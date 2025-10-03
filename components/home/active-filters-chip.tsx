import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { View, ScrollView, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import type { Filters } from './quick-filters';

interface ActiveFiltersChipProps {
  filters: Filters;
  onRemoveFilter: (type: 'companionship' | 'mood', value: string) => void;
}

const COMPANIONSHIP_LABELS: Record<string, string> = {
  alone: 'Solo',
  partner: 'Coppia',
  friends: 'Amici',
  family: 'Famiglia',
};

const MOOD_LABELS: Record<string, string> = {
  relaxed: 'Tranquillo',
  energetic: 'Festa',
  cultural: 'Culturale',
  romantic: 'Romantico',
};

export function ActiveFiltersChip({ filters, onRemoveFilter }: ActiveFiltersChipProps) {
  const hasActiveFilters = filters.companionship.length > 0 || filters.mood.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutUp.duration(200)}
      className="border-t border-border bg-background py-3"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-2"
      >
        {/* Companionship Filters */}
        {filters.companionship.map((value) => (
          <Badge
            key={`comp-${value}`}
            variant="secondary"
            className="flex-row items-center gap-1 px-3 py-1.5"
            asChild
          >
            <Pressable onPress={() => onRemoveFilter('companionship', value)}>
              <Text className="text-sm">{COMPANIONSHIP_LABELS[value]}</Text>
              <X size={14} className="text-foreground" />
            </Pressable>
          </Badge>
        ))}

        {/* Mood Filters */}
        {filters.mood.map((value) => (
          <Badge
            key={`mood-${value}`}
            variant="secondary"
            className="flex-row items-center gap-1 px-3 py-1.5"
            asChild
          >
            <Pressable onPress={() => onRemoveFilter('mood', value)}>
              <Text className="text-sm">{MOOD_LABELS[value]}</Text>
              <X size={14} className="text-foreground" />
            </Pressable>
          </Badge>
        ))}

        {/* Budget & Time (non-removable, just info) */}
        <Badge variant="outline" className="px-3 py-1.5">
          <Text className="text-sm">{filters.budget}</Text>
        </Badge>

        {filters.time === 'now' && (
          <Badge variant="outline" className="px-3 py-1.5">
            <Text className="text-sm">Adesso</Text>
          </Badge>
        )}
        {filters.time === 'tonight' && (
          <Badge variant="outline" className="px-3 py-1.5">
            <Text className="text-sm">Stasera</Text>
          </Badge>
        )}
        {filters.time === 'weekend' && (
          <Badge variant="outline" className="px-3 py-1.5">
            <Text className="text-sm">Weekend</Text>
          </Badge>
        )}
      </ScrollView>
    </Animated.View>
  );
}
