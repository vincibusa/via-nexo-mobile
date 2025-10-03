import { View, TextInput, Pressable, useColorScheme } from 'react-native';
import { Send } from 'lucide-react-native';
import { useState } from 'react';

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
  const [message, setMessage] = useState('');
  const colorScheme = useColorScheme();

  // Placeholder color based on theme
  const placeholderColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View className="flex-row items-center gap-2 border-t border-border bg-background p-4">
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-base text-foreground"
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
          className={message.trim() && !disabled ? 'text-primary-foreground' : 'text-muted-foreground'}
        />
      </Pressable>
    </View>
  );
}
