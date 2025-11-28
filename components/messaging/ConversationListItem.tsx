import { View, Pressable } from 'react-native';
import { Text } from '../ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Conversation } from '../../lib/types/messaging';

interface ConversationListItemProps {
  conversation: Conversation;
  onPress: () => void;
  currentUserId: string;
}

export function ConversationListItem({
  conversation,
  onPress,
  currentUserId
}: ConversationListItemProps) {
  const otherUser = conversation.other_user;
  const lastMessage = conversation.last_message;

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessagePreview = () => {
    if (!lastMessage) return 'Nessun messaggio';

    const isCurrentUser = lastMessage.sender_id === currentUserId;
    const prefix = isCurrentUser ? 'Tu: ' : '';

    if (lastMessage.message_type === 'image') {
      return `${prefix}📷 Foto`;
    }

    if (lastMessage.message_type === 'voice') {
      return `${prefix}🎤 Messaggio vocale`;
    }

    return `${prefix}${lastMessage.content}`;
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: it,
      });
    } catch {
      return '';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-4 border-b border-border active:bg-muted"
    >
      <Avatar alt={otherUser?.displayName || 'User'} className="w-14 h-14 mr-3">
        {otherUser?.avatarUrl && (
          <AvatarImage source={{ uri: otherUser.avatarUrl }} />
        )}
        <AvatarFallback>
          <Text className="text-lg font-semibold">
            {getInitials(otherUser?.displayName || otherUser?.email)}
          </Text>
        </AvatarFallback>
      </Avatar>

      <View className="flex-1 justify-center">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-base font-semibold flex-1" numberOfLines={1}>
            {otherUser?.displayName || otherUser?.email || 'Utente sconosciuto'}
          </Text>
          {lastMessage && (
            <Text className="text-xs text-muted-foreground ml-2">
              {formatTime(lastMessage.created_at)}
            </Text>
          )}
        </View>

        <View className="flex-row items-center">
          <Text
            className={`text-sm flex-1 ${conversation.unread_count > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
            numberOfLines={1}
          >
            {formatMessagePreview()}
          </Text>

          {conversation.unread_count > 0 && (
            <View className="bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 ml-2">
              <Text className="text-xs font-semibold text-primary-foreground">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
