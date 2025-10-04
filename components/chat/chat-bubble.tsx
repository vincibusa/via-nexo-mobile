import { Text } from '../../components/ui/text';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
}

export function ChatBubble({ message, isUser, timestamp }: ChatBubbleProps) {
  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary'
            : 'border border-border bg-card'
        }`}
      >
        <Text
          className={`text-base ${
            isUser ? 'text-primary-foreground' : 'text-foreground'
          }`}
        >
          {message}
        </Text>
        {timestamp && (
          <Text
            className={`mt-1 text-xs ${
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}
          >
            {timestamp.toLocaleTimeString('it-IT', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
