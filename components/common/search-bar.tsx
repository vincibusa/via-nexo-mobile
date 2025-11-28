import React from 'react';
import { View, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Input } from '../ui/input';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useColorScheme } from 'nativewind';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar = React.memo(({ value, onChangeText, placeholder }: SearchBarProps) => {
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  return (
    <View className="relative px-4 mb-3">
      <View className="absolute left-7 top-0 bottom-0 justify-center z-10">
        <Search size={18} color={themeColors.mutedForeground} />
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
          <X size={18} color={themeColors.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
});

SearchBar.displayName = 'SearchBar';
