import { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, Alert, NativeScrollEvent, NativeSyntheticEvent, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../../../lib/contexts/auth';
import MessagingService from '../../../lib/services/messaging';
import imageMessageService from '../../../lib/services/image-message';
import voiceMessageService from '../../../lib/services/voice-message';
import type { Message, Conversation } from '../../../lib/types/messaging';
import { MediaChatBubble } from '../../../components/chat/MediaChatBubble';
import { EnhancedChatInput } from '../../../components/chat/EnhancedChatInput';
import { Text } from '../../../components/ui/text';
import { THEME } from '../../../lib/theme';
import { useSettings } from '../../../lib/contexts/settings';
import { useMessagesRealtime } from '../../../lib/hooks/useMessagesRealtime';
import { getAuthenticatedClient } from '../../../lib/supabase/client';
import { ChevronLeft, User } from 'lucide-react-native';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { session, user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { settings } = useSettings();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const shouldScrollToBottomRef = useRef(true);

  // Use dark theme (single theme for the app)
  const themeColors = THEME.dark;

  // Get other user info for header
  const otherUser = conversation?.other_user;
  const headerTitle = conversation?.is_group
    ? (conversation.title || 'Gruppo')
    : (otherUser?.displayName || 'Chat');

  const loadMessages = useCallback(async (beforeMessageId?: string) => {
    if (!session?.accessToken || !conversationId) return;

    try {
      const response = await MessagingService.getMessages(
        conversationId as string,
        50,
        beforeMessageId
      );

      if (beforeMessageId) {
        // Loading older messages (pagination)
        setMessages((prev) => {
          // Deduplicate by creating a Map with message IDs as keys
          const messageMap = new Map<string, Message>();

          // Add existing messages
          prev.forEach(msg => messageMap.set(msg.id, msg));

          // Add new messages (older ones, so prepend)
          const newMessages = response.messages.filter(msg => !messageMap.has(msg.id));
          return [...newMessages, ...prev];
        });
      } else {
        // Initial load or polling - deduplicate with existing messages
        setMessages((prev) => {
          // Create a Map to deduplicate
          const messageMap = new Map<string, Message>();

          // Add existing messages first (to preserve any local optimistic updates)
          prev.forEach(msg => messageMap.set(msg.id, msg));

          // Add/update with fetched messages
          response.messages.forEach(msg => messageMap.set(msg.id, msg));

          // Convert back to array sorted by created_at
          return Array.from(messageMap.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

        // Mark as read (last message)
        if (response.messages.length > 0) {
          const lastMessage = response.messages[response.messages.length - 1];
          if (lastMessage.sender_id !== user?.id) {
            await MessagingService.markAsRead(conversationId as string, lastMessage.id);
          }
        }

        // Scroll to bottom after initial load - will be handled by onLayout/onContentSizeChange
      }

      setHasMore(response.pagination.has_more);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Errore', 'Impossibile caricare i messaggi');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, conversationId, user?.id]);

  // Fetch conversation details using Supabase directly
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || !session?.accessToken || !user?.id) return;

      try {
        const supabase = getAuthenticatedClient(session.accessToken);

        // Get conversation with participants
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('id, type, title, is_group, created_at, updated_at, last_message_at')
          .eq('id', conversationId)
          .single();

        if (convError) {
          console.error('Error fetching conversation:', convError);
          return;
        }

        // Get participants
        const { data: participants, error: partError } = await supabase
          .from('conversation_participants')
          .select('user_id, is_muted, unread_count')
          .eq('conversation_id', conversationId);

        if (partError) {
          console.error('Error fetching participants:', partError);
          return;
        }

        // Find the other user (not current user)
        const otherParticipant = participants?.find(p => p.user_id !== user.id);
        const currentParticipant = participants?.find(p => p.user_id === user.id);

        // For group chats, get the event image
        let groupImageUrl: string | undefined;
        if (convData.is_group || convData.type === 'group') {
          const { data: eventGroupChat } = await supabase
            .from('event_group_chats')
            .select(`
              events (
                cover_image_url
              )
            `)
            .eq('conversation_id', conversationId)
            .single();

          if (eventGroupChat?.events) {
            const event = Array.isArray(eventGroupChat.events)
              ? eventGroupChat.events[0]
              : eventGroupChat.events;
            groupImageUrl = event?.cover_image_url;
          }
        }

        // Get other user's profile for direct chats
        let otherUserProfile = null;
        if (otherParticipant && !convData.is_group) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', otherParticipant.user_id)
            .single();

          if (!profileError && profileData) {
            otherUserProfile = {
              id: profileData.id,
              displayName: profileData.display_name,
              avatarUrl: profileData.avatar_url,
              email: '',
              role: 'user' as const,
            };
          }
        }

        setConversation({
          id: convData.id,
          type: convData.type || 'direct',
          title: convData.title,
          is_group: convData.is_group || false,
          created_at: convData.created_at,
          updated_at: convData.updated_at,
          last_message_at: convData.last_message_at,
          last_message: null,
          unread_count: currentParticipant?.unread_count || 0,
          is_muted: currentParticipant?.is_muted || false,
          other_user: otherUserProfile,
          group_image_url: groupImageUrl,
        });
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };
    fetchConversation();
  }, [conversationId, session?.accessToken, user?.id]);

  // Initial load when conversation opens
  useEffect(() => {
    shouldScrollToBottomRef.current = true;
    loadMessages();
  }, [loadMessages]);

  // Stable callback for Realtime - now truly stable with memoized loadMessages
  const handleRealtimeMessage = useCallback(() => {
    console.log('[Conversation] Realtime triggered, refreshing messages');
    // Only auto-scroll if user was at bottom
    shouldScrollToBottomRef.current = isAtBottom;
    loadMessages();
  }, [loadMessages, isAtBottom]); // Depends on memoized loadMessages and isAtBottom

  // Setup Supabase Realtime listener - replaces polling!
  // This subscribes to INSERT events on messages table for this specific conversation
  // When a new message arrives, messages list refreshes automatically (< 1 second)
  // CRITICAL: Passes accessToken to authenticate Realtime with RLS
  useMessagesRealtime(session?.accessToken, conversationId as string, handleRealtimeMessage);

  const handleSendMessage = async (content: string) => {
    if (!conversationId || !user) return;

    setSending(true);

    try {
      const response = await MessagingService.sendMessage(conversationId as string, {
        content,
        message_type: 'text',
      });

      // Add new message to the list
      const newMessage: Message = {
        ...response.message,
        sender: {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        read_by: [],
        is_deleted: false,
      };

      setMessages((prev) => [...prev, newMessage]);
      // With inverted={true}, new messages appear automatically at the bottom
      setIsAtBottom(true);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Errore', 'Impossibile inviare il messaggio');
    } finally {
      setSending(false);
    }
  };

  const handleSendImages = async (imageUris: string[]) => {
    if (!conversationId || !user) return;

    setSending(true);

    try {
      const sentMessages = await imageMessageService.sendImageMessages(
        conversationId as string,
        imageUris,
        (completed, total) => {
          console.log(`[Conversation] Image upload progress: ${completed}/${total}`);
        }
      );

      // Add sent messages to the list
      const newMessages: Message[] = sentMessages.map(msg => ({
        ...msg,
        sender: {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        read_by: [],
        is_deleted: false,
      }));

      setMessages((prev) => [...prev, ...newMessages]);
      setIsAtBottom(true);
    } catch (error) {
      console.error('Error sending images:', error);
      Alert.alert('Errore', 'Impossibile inviare le immagini. Riprova.');
      throw error; // Re-throw to let EnhancedChatInput handle it
    } finally {
      setSending(false);
    }
  };

  const handleSendVoice = async (uri: string, duration: number) => {
    if (!conversationId || !user) return;

    setSending(true);

    try {
      // Estimate file size (approximately 16kbps for m4a audio)
      const estimatedSize = Math.round(duration * 16 * 128); // bytes

      const result = await voiceMessageService.sendVoiceMessage(
        conversationId as string,
        uri,
        duration,
        estimatedSize
      );

      // Add sent message to the list
      const newMessage: Message = {
        id: result.message_id,
        conversation_id: conversationId as string,
        sender_id: user.id,
        content: '',
        message_type: 'voice',
        media_url: result.media_url,
        media_duration: duration,
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        read_by: [],
        is_deleted: false,
      };

      setMessages((prev) => [...prev, newMessage]);
      setIsAtBottom(true);
    } catch (error) {
      console.error('Error sending voice message:', error);
      Alert.alert('Errore', 'Impossibile inviare il messaggio vocale. Riprova.');
      throw error; // Re-throw to let EnhancedChatInput handle it
    } finally {
      setSending(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && messages.length > 0) {
      // With inverted={true} and reversed array, oldest messages are at index 0 of original array
      const oldestMessage = messages[0];
      shouldScrollToBottomRef.current = false; // Don't scroll when loading older messages
      loadMessages(oldestMessage.id);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    const paddingToTop = 100; // Threshold for "at bottom" (with inverted, bottom is at offset 0)
    // With inverted={true}, being at bottom means contentOffset.y is near 0
    const isNearBottom = contentOffset.y <= paddingToTop;
    
    setIsAtBottom(isNearBottom);
  };


  const isGroupChat = conversation?.is_group || conversation?.type === 'group';

  const handleAvatarPress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender_id === user?.id;

    return (
      <MediaChatBubble
        message={item.content}
        isUser={isUser}
        timestamp={new Date(item.created_at)}
        messageType={item.message_type as 'text' | 'image' | 'voice' | undefined}
        mediaUrl={item.media_url}
        mediaThumbnailUrl={item.media_thumbnail_url}
        mediaDuration={item.media_duration}
        mediaSize={item.media_size}
        isGroupChat={isGroupChat}
        sender={item.sender ? {
          id: item.sender.id,
          displayName: item.sender.displayName,
          avatarUrl: item.sender.avatarUrl,
        } : undefined}
        onAvatarPress={handleAvatarPress}
      />
    );
  };

  const renderHeader = () => {
    if (!loading || messages.length === 0) return null;
    return (
      <View className="py-4">
        <ActivityIndicator />
      </View>
    );
  };

  // Custom header component
  const renderHeaderTitle = () => {
    // Determine which image to show
    const avatarUrl = isGroupChat
      ? conversation?.group_image_url
      : otherUser?.avatarUrl;

    return (
      <View className="flex-row items-center gap-3">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="w-9 h-9 rounded-full"
          />
        ) : (
          <View className="w-9 h-9 rounded-full bg-muted items-center justify-center">
            {isGroupChat ? (
              <Text className="text-sm">👥</Text>
            ) : (
              <User size={18} color={themeColors.mutedForeground} />
            )}
          </View>
        )}
        <View>
          <Text className="text-base font-semibold text-foreground">
            {headerTitle}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackTitle: ' ',
          headerTitle: renderHeaderTitle,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        {loading && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={themeColors.foreground} />
            <Text className="mt-4 text-muted-foreground">
              Caricamento messaggi...
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-1 relative">
              <FlatList
                ref={flatListRef}
                data={messages.slice().reverse()}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 8,
                }}
                ListHeaderComponent={renderHeader}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                inverted={true}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onScrollToIndexFailed={(info) => {
                  // Fallback if scrollToIndex fails - use scrollToEnd
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
              />
            </View>

            <EnhancedChatInput
              onSendText={handleSendMessage}
              onSendImages={handleSendImages}
              onSendVoice={handleSendVoice}
              placeholder="Scrivi un messaggio..."
              disabled={sending}
            />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
