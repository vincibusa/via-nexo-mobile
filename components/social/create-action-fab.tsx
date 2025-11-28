import { TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../../lib/utils';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useColorScheme } from 'nativewind';

interface CreateActionFABProps {
  onPress: () => void;
  visible?: boolean;
}

export function CreateActionFAB({
  onPress,
  visible = true,
}: CreateActionFABProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  if (!visible) return null;

  return (
    <View
      className="absolute right-4 z-50"
      style={{
        bottom: 80 + insets.bottom,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-80"
      >
        <Plus size={24} color={themeColors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}
