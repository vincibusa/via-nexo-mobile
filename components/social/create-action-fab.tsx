import { TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../../lib/utils';

interface CreateActionFABProps {
  onPress: () => void;
  visible?: boolean;
}

export function CreateActionFAB({
  onPress,
  visible = true,
}: CreateActionFABProps) {
  const insets = useSafeAreaInsets();

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
        <Plus size={24} className="text-primary-foreground" />
      </TouchableOpacity>
    </View>
  );
}
