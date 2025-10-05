import React from 'react';
import { View, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Input } from '../ui/input';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar = React.memo(({ value, onChangeText, placeholder }: SearchBarProps) => {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  return (
    <View className="relative px-4 mb-3">
      <View className="absolute left-7 top-0 bottom-0 justify-center z-10">
        <Search size={18} color={iconColor} />
      </View>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Cerca...'}
        className="pl-10 pr-10"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          className="absolute right-7 top-0 bottom-0 justify-center z-10"
        >
          <X size={18} color={iconColor} />
        </Pressable>
      )}
    </View>
  );
});

SearchBar.displayName = 'SearchBar';
