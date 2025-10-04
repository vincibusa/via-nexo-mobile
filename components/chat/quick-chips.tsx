import { Badge } from '../../components/ui/badge';
import { Text } from '../../components/ui/text';
import { View, ScrollView, Pressable } from 'react-native';

interface QuickChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function QuickChips({ suggestions, onSelect }: QuickChipsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4"
      >
        {suggestions.map((suggestion, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="px-4 py-2"
            asChild
          >
            <Pressable onPress={() => onSelect(suggestion)}>
              <Text className="text-sm">{suggestion}</Text>
            </Pressable>
          </Badge>
        ))}
      </ScrollView>
    </View>
  );
}
