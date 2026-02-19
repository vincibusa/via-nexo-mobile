import { View, Pressable } from 'react-native';
import { Text } from '../ui/text';
import { SquircleAvatar } from '../ui/squircle-avatar';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Conversation } from '../../lib/types/messaging';
import { useColorScheme } from 'nativewind';
import { GlassSurface } from '../glass';
import { THEME } from '../../lib/theme';

interface ConversationListItemProps {
  conversation: Conversation;
  onPress: () => void;
  currentUserId: string;
}

export function ConversationListItem({
  conversation,
  onPress,
  currentUserId,
}: ConversationListItemProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = THEME[isDark ? 'dark' : 'light'];
  const otherUser = conversation.other_user;
  const lastMessage = conversation.last_message;
  const isGroupChat = conversation.is_group || conversation.type === 'group';

  // For group chats, use title; for direct chats, use other user's name
  const displayName = isGroupChat
    ? (conversation.title || 'Chat di gruppo')
    : (otherUser?.displayName || otherUser?.email || 'Utente sconosciuto');

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
    <View className="px-3 py-1">
      <GlassSurface
        variant="card"
        intensity={isDark ? 'regular' : 'light'}
        tint={isDark ? 'dark' : 'dark'}
        style={{ borderRadius: 16, padding: 0, borderWidth: 0 }}
      >
        <Pressable
          onPress={onPress}
          className="flex-row items-center p-4 active:bg-muted/30"
        >
          <View className="relative mr-3" style={{ padding: 0 }}>
            <SquircleAvatar
              width={64}
              height={64}
              source={
                isGroupChat && conversation.group_image_url
                  ? { uri: conversation.group_image_url }
                  : !isGroupChat && otherUser?.avatarUrl
                    ? { uri: otherUser.avatarUrl }
                    : undefined
              }
              fallback={
                <Text className="text-lg font-semibold">
                  {isGroupChat ? '👥' : getInitials(otherUser?.displayName || otherUser?.email)}
                </Text>
              }
              backgroundColor={themeColors.muted}
            />
          </View>

          <View className="flex-1 justify-center">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-semibold flex-1" numberOfLines={1}>
                {displayName}
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
      </GlassSurface>
    </View>
  );
}
