import { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../../../lib/contexts/auth';
import MessagingService from '../../../lib/services/messaging';
import type { Message } from '../../../lib/types/messaging';
import { ChatBubble } from '../../../components/chat/chat-bubble';
import { ChatInput } from '../../../components/chat/chat-input';
import { Text } from '../../../components/ui/text';
import { THEME } from '../../../lib/theme';
import { useSettings } from '../../../lib/contexts/settings';
import { useMessagesRealtime } from '../../../lib/hooks/useMessagesRealtime';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { session, user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { settings } = useSettings();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const shouldScrollToBottomRef = useRef(true);

  // Use dark theme (single theme for the app)
  const themeColors = THEME.dark;

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


  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender_id === user?.id;

    return (
      <ChatBubble
        message={item.content}
        isUser={isUser}
        timestamp={new Date(item.created_at)}
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Conversazione',
          headerShown: true,
          headerBackTitle: ' ',
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

            <ChatInput
              onSend={handleSendMessage}
              placeholder="Scrivi un messaggio..."
              disabled={sending}
            />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
