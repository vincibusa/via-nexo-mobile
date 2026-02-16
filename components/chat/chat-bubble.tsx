import { Text } from '../../components/ui/text';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GlassSurface } from '../glass';
import { useColorScheme } from 'nativewind';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
}

export function ChatBubble({ message, isUser, timestamp }: ChatBubbleProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {isUser ? (
        <View className="max-w-[80%] rounded-2xl bg-primary px-4 py-3">
          <Text className="text-base text-primary-foreground">{message}</Text>
          {timestamp && (
            <Text className="mt-1 text-xs text-primary-foreground/70">
              {timestamp.toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
      ) : (
        <GlassSurface
          variant="card"
          intensity={isDark ? 'regular' : 'light'}
          tint={isDark ? 'dark' : 'light'}
          style={{ maxWidth: '80%', borderRadius: 16, padding: 0 }}
        >
          <View className="px-4 py-3">
            <Text className="text-base text-foreground">{message}</Text>
            {timestamp && (
              <Text className="mt-1 text-xs text-muted-foreground">
                {timestamp.toLocaleTimeString('it-IT', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>
        </GlassSurface>
      )}
    </Animated.View>
  );
}
