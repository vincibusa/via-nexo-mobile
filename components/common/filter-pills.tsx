import React from 'react';
import { ScrollView, Pressable } from 'react-native';
import { Badge } from '../ui/badge';
import { Text } from '../ui/text';

export interface FilterPill {
  id: string;
  label: string;
  value: any;
}

interface FilterPillsProps {
  filters: FilterPill[];
  selectedId?: string;
  onSelect: (pill: FilterPill) => void;
}

export const FilterPills = React.memo(({ filters, selectedId, onSelect }: FilterPillsProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row', gap: 8 }}
    >
      {filters.map((filter) => {
        const isSelected = filter.id === selectedId;
        return (
          <Pressable
            key={filter.id}
            onPress={() => {
              console.log('Pill pressed:', filter.label);
              onSelect(filter);
            }}
          >
            <Badge
              variant={isSelected ? 'default' : 'outline'}
              className="px-4 py-2"
              pointerEvents="none"
            >
              <Text>{filter.label}</Text>
            </Badge>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

FilterPills.displayName = 'FilterPills';
