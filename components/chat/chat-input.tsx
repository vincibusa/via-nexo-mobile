import { View, TextInput, Pressable } from 'react-native';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../lib/theme';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  placeholder = 'Scrivi un messaggio...',
  disabled = false,
}: ChatInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = THEME[isDark ? 'dark' : 'light'];

  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View className="flex-row items-center gap-2 bg-background p-4">
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder={placeholder}
        className="flex-1 rounded-full bg-muted px-4 py-3 text-base text-foreground placeholder:text-muted-foreground"
        multiline
        maxLength={500}
        editable={!disabled}
        onSubmitEditing={handleSend}
        returnKeyType="send"
      />
      <Pressable
        onPress={handleSend}
        disabled={!message.trim() || disabled}
        className={`h-12 w-12 items-center justify-center rounded-full ${
          message.trim() && !disabled ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <Send
          size={20}
          color={message.trim() && !disabled ? themeColors.primaryForeground : themeColors.mutedForeground}
        />
      </Pressable>
    </View>
  );
}
