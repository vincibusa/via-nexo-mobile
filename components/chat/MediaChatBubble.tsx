/**
 * Media Chat Bubble Component
 * Supports text, image, and voice message types
 */

import { useState, useEffect } from 'react';
import { View, Image, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '../ui/text';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../lib/theme';
import { VoiceMessagePlayer } from './voice-message-player';
import { ImagePreviewModal } from './ImagePreviewModal';
import { Play, User } from 'lucide-react-native';
import { SquircleAvatar } from '../ui/squircle-avatar';

type MessageType = 'text' | 'image' | 'voice';

interface SenderInfo {
  id: string;
  displayName?: string;
  avatarUrl?: string;
}

interface MediaChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  messageType?: MessageType;
  mediaUrl?: string;
  mediaThumbnailUrl?: string;
  mediaDuration?: number; // seconds for voice messages
  mediaSize?: number;
  // Group chat props
  isGroupChat?: boolean;
  sender?: SenderInfo;
  onAvatarPress?: (userId: string) => void;
}

export function MediaChatBubble({
  message,
  isUser,
  timestamp,
  messageType = 'text',
  mediaUrl,
  mediaThumbnailUrl,
  mediaDuration,
  isGroupChat = false,
  sender,
  onAvatarPress,
}: MediaChatBubbleProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = THEME[isDark ? 'dark' : 'light'];

  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Manage image loading state based on mediaUrl changes
  useEffect(() => {
    if (messageType === 'image' && mediaUrl) {
      setImageLoading(true);
      setImageError(false);

      // Fallback timeout: assume image loaded after 5 seconds
      // This prevents infinite loading for cached images that don't trigger onLoadEnd
      const timeout = setTimeout(() => {
        setImageLoading(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [mediaUrl, messageType]);

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTextMessage = () => (
    <Text className="text-base text-[#111111]">
      {message}
    </Text>
  );

  const renderImageMessage = () => {
    const imageUri = mediaThumbnailUrl || mediaUrl;

    if (!imageUri) {
      return (
        <View className="w-48 h-48 items-center justify-center bg-muted rounded-lg">
          <Text className="text-muted-foreground text-sm">
            Immagine non disponibile
          </Text>
        </View>
      );
    }

    return (
      <>
        <Pressable onPress={() => setImageModalVisible(true)}>
          <View className="relative">
            {imageLoading && (
              <View className="absolute inset-0 items-center justify-center bg-muted rounded-lg z-10">
                <ActivityIndicator size="small" color={themeColors.primary} />
              </View>
            )}
            {imageError ? (
              <View className="w-48 h-48 items-center justify-center bg-muted rounded-lg">
                <Text className="text-muted-foreground text-sm text-center px-2">
                  Impossibile caricare l'immagine
                </Text>
                <Pressable
                  onPress={() => {
                    setImageError(false);
                    setImageLoading(true);
                  }}
                  className="mt-2 px-3 py-1 bg-primary/20 rounded"
                >
                  <Text className="text-primary text-xs">Riprova</Text>
                </Pressable>
              </View>
            ) : (
              <Image
                source={{ uri: imageUri }}
                className="w-48 h-48 rounded-lg"
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            )}
          </View>
        </Pressable>

        {/* Full screen image preview modal */}
        <ImagePreviewModal
          visible={imageModalVisible}
          imageUrl={mediaUrl || imageUri}
          onClose={() => setImageModalVisible(false)}
        />
      </>
    );
  };

  const renderVoiceMessage = () => {
    if (!mediaUrl) {
      return (
        <View className="flex-row items-center gap-2 py-1">
          <View className="w-8 h-8 rounded-full bg-muted items-center justify-center">
            <Play size={16} color={themeColors.mutedForeground} />
          </View>
          <Text className="text-muted-foreground text-sm">
            Audio non disponibile
          </Text>
        </View>
      );
    }

    return (
      <VoiceMessagePlayer
        mediaUrl={mediaUrl}
        duration={mediaDuration}
        isOwnMessage={isUser}
        isDark={isDark}
      />
    );
  };

  const renderContent = () => {
    switch (messageType) {
      case 'image':
        return renderImageMessage();
      case 'voice':
        return renderVoiceMessage();
      case 'text':
      default:
        return renderTextMessage();
    }
  };

  // Telegram-style bubble colors and tail
  const getBubbleStyle = () => {
    const baseStyle = isUser
      ? 'bg-[#EFFDDE]'  // Telegram light green for sent
      : 'bg-white';    // Telegram white for received
    const tailClass = isUser ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm';

    switch (messageType) {
      case 'image':
        return `${baseStyle} ${tailClass} p-1`;
      case 'voice':
        return `${baseStyle} ${tailClass} px-2 py-2 min-w-[200px]`;
      case 'text':
      default:
        return `${baseStyle} ${tailClass} px-4 py-3`;
    }
  };

  // Show avatar for other users' messages in group chats
  const showAvatar = isGroupChat && !isUser;

  const handleAvatarPress = () => {
    if (sender?.id && onAvatarPress) {
      onAvatarPress(sender.id);
    }
  };

  const renderAvatar = () => {
    if (!showAvatar) return null;

    return (
      <Pressable onPress={handleAvatarPress} className="mr-2 self-end mb-1" style={{ padding: 0 }}>
        <SquircleAvatar
          size={32}
          source={sender?.avatarUrl ? { uri: sender.avatarUrl } : undefined}
          fallback={<User size={16} color={themeColors.mutedForeground} />}
          backgroundColor={themeColors.muted}
        />
      </Pressable>
    );
  };

  // Generate a consistent color for sender name based on their ID
  const getSenderNameColor = (senderId?: string): string => {
    if (!senderId) return 'text-primary';
    const colors = [
      'text-blue-500',
      'text-green-500',
      'text-purple-500',
      'text-orange-500',
      'text-pink-500',
      'text-teal-500',
      'text-indigo-500',
      'text-red-500',
    ];
    const hash = senderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar for group chat messages from others */}
      {renderAvatar()}

      <View className="max-w-[80%]">
        {/* Sender name for group chat messages from others */}
        {showAvatar && sender?.displayName && (
          <Pressable onPress={handleAvatarPress}>
            <Text className={`text-xs font-semibold mb-1 ml-1 ${getSenderNameColor(sender.id)}`}>
              {sender.displayName}
            </Text>
          </Pressable>
        )}

        <View className={`rounded-2xl ${getBubbleStyle()}`}>
          {renderContent()}

          {/* Timestamp */}
          {timestamp && (
            <Text
              className={`mt-1 text-xs ${
                messageType === 'image' ? 'px-2 pb-1' : ''
              } ${isUser ? 'text-[#6BA37A]' : 'text-[#999999]'}`}
            >
              {formatTimestamp(timestamp)}
            </Text>
          )}

          {/* Caption for images (if message text exists) */}
          {messageType === 'image' && message && message.trim() !== '' && (
            <View className="px-2 pb-2">
              <Text className="text-sm text-[#111111]">
                {message}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
