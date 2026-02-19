import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, Alert, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../../../lib/contexts/auth';
import MessagingService from '../../../lib/services/messaging';
import imageMessageService from '../../../lib/services/image-message';
import voiceMessageService from '../../../lib/services/voice-message';
import type { Message, Conversation } from '../../../lib/types/messaging';
import { MediaChatBubble } from '../../../components/chat/MediaChatBubble';
import { SquircleAvatar } from '../../../components/ui/squircle-avatar';
import { EnhancedChatInput } from '../../../components/chat/EnhancedChatInput';
import { Text } from '../../../components/ui/text';
import { THEME } from '../../../lib/theme';
import { useSettings } from '../../../lib/contexts/settings';
import { useMessagesRealtime } from '../../../lib/hooks/useMessagesRealtime';
import { getAuthenticatedClient } from '../../../lib/supabase/client';
import { ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { GlassView } from '../../../components/glass/glass-view';
import { GlassView as ExpoGlassView } from 'expo-glass-effect';
import { TINT_COLORS_BY_THEME } from '../../../lib/glass/constants';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { session, user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { settings } = useSettings();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const shouldScrollToBottomRef = useRef(true);

  // Get effective theme based on user settings
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : settings?.theme === 'dark'
    ? 'dark'
    : 'light';
  const themeColors = THEME[effectiveTheme];

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

        // For group chats, get the event image and event_id
        let groupImageUrl: string | undefined;
        let eventId: string | undefined;
        if (convData.is_group || convData.type === 'group') {
          const { data: eventGroupChat } = await supabase
            .from('event_group_chats')
            .select(`
              event_id,
              events (
                cover_image_url
              )
            `)
            .eq('conversation_id', conversationId)
            .single();

          if (eventGroupChat) {
            eventId = eventGroupChat.event_id;
            const event = eventGroupChat.events
              ? (Array.isArray(eventGroupChat.events) ? eventGroupChat.events[0] : eventGroupChat.events)
              : null;
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
          event_id: eventId,
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

  const handleHeaderPress = () => {
    if (!conversation) return;
    if (isGroupChat && conversation.event_id) {
      router.push({ pathname: `/(app)/event/${conversation.event_id}` as any, params: { fromChat: '1' } });
    } else if (!isGroupChat && conversation.other_user?.id) {
      router.push(`/(app)/profile/${conversation.other_user.id}` as any);
    }
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

  const avatarUrl = isGroupChat
    ? conversation?.group_image_url
    : otherUser?.avatarUrl;
  const avatarInitial = (isGroupChat ? 'G' : (otherUser?.displayName || headerTitle || '?')[0] ?? '?').toUpperCase();

  const headerHeight = insets.top + 50;

  // ExpoGlassView nativo su iOS - stesso effetto dei pulsanti Home Overlay (Liquid Glass)
  const glassTintColor = TINT_COLORS_BY_THEME[effectiveTheme].extraLight.regular;
  const GlassButton = ({ children, style }: { children: React.ReactNode; style?: object }) =>
    Platform.OS === 'ios' ? (
      <ExpoGlassView
        glassEffectStyle="regular"
        tintColor={glassTintColor}
        isInteractive
        style={style}
      >
        {children}
      </ExpoGlassView>
    ) : (
      <GlassView intensity="regular" tint="extraLight" isInteractive style={style}>
        {children}
      </GlassView>
    );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false, title: 'Chat' }} />
      <SafeAreaView className="flex-1" edges={['bottom']}>

      {/* Back button staccato - Liquid Glass come Home Overlay */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={[styles.headerBackWrap, { top: insets.top + 6 }]}
      >
        <GlassButton style={styles.headerBackGlass}>
          <ChevronLeft size={22} color={themeColors.foreground} />
        </GlassButton>
      </Pressable>

      {/* Header bar - Liquid Glass, solo titolo, tap → profilo o evento */}
      <Pressable
        onPress={handleHeaderPress}
        style={[styles.headerGlass, { top: insets.top + 6 }]}
      >
        <GlassButton style={styles.headerGlassInner}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: themeColors.foreground }]} numberOfLines={1}>
              {headerTitle}
            </Text>
          </View>
        </GlassButton>
      </Pressable>

      {/* Avatar staccato - View semplice (GlassButton aggiunge padding che nasconde l'avatar) */}
      <Pressable
        onPress={handleHeaderPress}
        hitSlop={10}
        style={[styles.headerAvatarWrap, { top: insets.top + 6 }]}
      >
        <View style={styles.headerAvatarContainer}>
          <SquircleAvatar
            size={44}
            source={avatarUrl ? { uri: avatarUrl } : undefined}
            fallback={<Text style={styles.headerAvatarText}>{avatarInitial}</Text>}
            backgroundColor="#2CA5E0"
          />
        </View>
      </Pressable>

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
                  paddingBottom: 8 + headerHeight,
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
              placeholder="Messaggio"
              disabled={sending}
            />
          </>
        )}
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBackWrap: {
    position: 'absolute',
    left: 20,
    zIndex: 101,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 9,
  },
  headerGlass: {
    position: 'absolute',
    left: 72,
    right: 72,
    height: 44,
    zIndex: 100,
    overflow: 'hidden',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 9,
  },
  headerAvatarWrap: {
    position: 'absolute',
    right: 20,
    zIndex: 101,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 9,
  },
  headerAvatarContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 0,
  },
  headerGlassInner: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    flex: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
