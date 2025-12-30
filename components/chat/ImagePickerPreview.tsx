import { View, Image, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '../ui/text';
import { X, Send } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../lib/theme';

interface ImagePickerPreviewProps {
  images: string[];
  onRemove: (index: number) => void;
  onCancel: () => void;
  onSend: () => void;
  isSending?: boolean;
  progress?: { completed: number; total: number };
}

export function ImagePickerPreview({
  images,
  onRemove,
  onCancel,
  onSend,
  isSending = false,
  progress,
}: ImagePickerPreviewProps) {
  const { colorScheme } = useColorScheme();
  const themeColors = THEME[colorScheme === 'dark' ? 'dark' : 'light'];

  if (images.length === 0) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(200)}
      exiting={SlideOutDown.duration(200)}
      className="border-t border-border bg-background px-4 py-3"
    >
      {/* Header with count and cancel */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm text-muted-foreground">
          {images.length} {images.length === 1 ? 'immagine selezionata' : 'immagini selezionate'}
        </Text>
        <Pressable
          onPress={onCancel}
          disabled={isSending}
          className="p-1"
        >
          <Text className="text-sm text-destructive">Annulla</Text>
        </Pressable>
      </View>

      {/* Image thumbnails */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        className="mb-3"
      >
        {images.map((uri, index) => (
          <Animated.View
            key={`${uri}-${index}`}
            entering={FadeIn.duration(200).delay(index * 50)}
            exiting={FadeOut.duration(150)}
            className="relative"
          >
            <Image
              source={{ uri }}
              className="w-20 h-20 rounded-lg"
              resizeMode="cover"
            />
            {!isSending && (
              <Pressable
                onPress={() => onRemove(index)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive items-center justify-center"
              >
                <X size={14} color="white" />
              </Pressable>
            )}
            {isSending && progress && index < progress.completed && (
              <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
                <Text className="text-white text-xs">✓</Text>
              </View>
            )}
            {isSending && progress && index === progress.completed && (
              <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
                <ActivityIndicator size="small" color="white" />
              </View>
            )}
          </Animated.View>
        ))}
      </ScrollView>

      {/* Progress bar when sending */}
      {isSending && progress && (
        <View className="mb-3">
          <View className="h-1 bg-muted rounded-full overflow-hidden">
            <View
              className="h-full bg-primary"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </View>
          <Text className="text-xs text-muted-foreground mt-1 text-center">
            Invio {progress.completed}/{progress.total}...
          </Text>
        </View>
      )}

      {/* Send button */}
      <Pressable
        onPress={onSend}
        disabled={isSending || images.length === 0}
        className={`flex-row items-center justify-center gap-2 py-3 rounded-xl ${
          isSending ? 'bg-muted' : 'bg-primary'
        }`}
      >
        {isSending ? (
          <>
            <ActivityIndicator size="small" color={themeColors.mutedForeground} />
            <Text className="text-muted-foreground font-semibold">
              Invio in corso...
            </Text>
          </>
        ) : (
          <>
            <Send size={18} color={themeColors.primaryForeground} />
            <Text className="text-primary-foreground font-semibold">
              Invia {images.length > 1 ? `(${images.length})` : ''}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
