/**
 * Chat Detail Screen - Real-Time Direct Messaging
 * FASE 3G: Integrare mobile app con WebSocket chat
 *
 * Schermata per messaggi diretti in tempo reale con WebSocket
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../lib/contexts/auth';
import { webSocketChatService } from '../../lib/services/websocket-chat';
import messagingService from '../../lib/services/messaging';
import type { Message } from '../../lib/types/messaging';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { CheckCircle, Clock, Mic, Paperclip, Search, X } from 'lucide-react-native';
import { VoiceMessageRecorder } from '../../components/chat/voice-message-recorder';
import { VoiceMessagePlayer } from '../../components/chat/voice-message-player';
import { MessageSearch } from '../../components/chat/message-search';
import { useTypingIndicator } from '../../lib/hooks/useTypingIndicator';
import { useLoadingState } from '../../lib/hooks/useLoadingStates';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { conversationId, userName } = useLocalSearchParams<{
    conversationId: string;
    userName: string;
  }>();
  const { settings } = useSettings();

  // Use dark theme (single theme for the app)
  const themeColors = THEME.dark;
  const isDark = true;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Typing indicator hook
  const { typingUsers, sendTyping } = useTypingIndicator(
    session?.accessToken,
    conversationId,
    user?.id,
    user?.displayName || 'User'
  );

  // Loading state for messages
  const messagesLoadingState = useLoadingState<Message[]>({
    initialData: [],
    showErrorAlert: false, // We'll handle errors in the UI
  });

  // Carica la cronologia conversazione
  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) {
        messagesLoadingState.setError('Missing conversation ID');
        setIsLoading(false);
        return;
      }

      messagesLoadingState.startLoading();
      setIsLoading(true);

      try {
        const response = await messagingService.getMessages(conversationId, 50);

        // Set initial messages
        if (response.messages) {
          setMessages(response.messages);
          messagesLoadingState.setData(response.messages);
        }

        setIsLoading(false);

        // Connect to WebSocket for real-time updates
        try {
          await webSocketChatService.connect(
            conversationId,
            handleNewMessage,
            handleConnectionChange,
            handleError
          );
        } catch (wsError) {
          console.warn('[ChatDetail] WebSocket connection failed, using polling mode:', wsError);
          // WebSocket is optional - the app will still work with REST API
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
        setError(errorMessage);
        messagesLoadingState.setError(errorMessage);
        setIsLoading(false);
      }
    };

    loadConversation();

    return () => {
      webSocketChatService.disconnect();
    };
  }, [conversationId]);

  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      setError('Connection lost. Reconnecting...');
    } else {
      setError(null);
    }
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    setIsSending(true);
    try {
      // Send typing stopped indicator
      await sendTyping(false);

      // Try to send via WebSocket first if connected
      if (isConnected) {
        await webSocketChatService.sendMessage(newMessage.trim());
      } else {
        // Fallback to REST API
        if (!conversationId) {
          throw new Error('Missing conversation ID');
        }

        const response = await messagingService.sendMessage(
          conversationId,
          {
            content: newMessage.trim(),
            message_type: 'text',
          }
        );

        setMessages((prev) => [...prev, response.message]);
      }

      setNewMessage('');
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing indicator
  const handleTextChange = (text: string) => {
    setNewMessage(text);
    if (text.length > 0) {
      sendTyping(true);
    } else {
      sendTyping(false);
    }
  };

  const handleVoiceMessageSent = (messageId: string) => {
    setShowVoiceRecorder(false);
    // The message will be added via real-time subscription
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text className="mt-4 text-foreground">Loading conversation...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (messagesLoadingState.hasError && !messagesLoadingState.hasData) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <Text className="text-destructive text-lg font-bold mb-4">Error Loading Messages</Text>
        <Text className="text-foreground text-center mb-6 px-4">
          {messagesLoadingState.error}
        </Text>
        <TouchableOpacity
          onPress={() => {
            messagesLoadingState.clearError();
            // Reload conversation
            const loadConversation = async () => {
              if (!conversationId) return;
              messagesLoadingState.startLoading();
              try {
                const response = await messagingService.getMessages(conversationId, 50);
                if (response.messages) {
                  setMessages(response.messages);
                  messagesLoadingState.setData(response.messages);
                }
              } catch (err) {
                messagesLoadingState.setError(err as Error);
              }
            };
            loadConversation();
          }}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-primary-foreground font-semibold">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-3 border-b border-border">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => {
              if (showSearch) {
                setShowSearch(false);
              } else {
                router.back();
              }
            }}>
              <Text className="text-primary">← Back</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">{userName || 'Chat'}</Text>
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
              <Search size={20} color={themeColors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Connection Status */}
          <View className="flex-row items-center mt-2">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-500' : 'bg-destructive'
              }`}
            />
            <Text className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Connecting...'}
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <Text className="text-destructive text-xs mt-1">{error}</Text>
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && !showSearch && (
            <View className="flex-row items-center mt-1">
              <Text className="text-xs text-muted-foreground">
                {typingUsers.length === 1
                  ? `${typingUsers[0].displayName} sta scrivendo...`
                  : `${typingUsers.length} persone stanno scrivendo...`}
              </Text>
            </View>
          )}
        </View>

        {/* Search or Messages */}
        {showSearch ? (
          <MessageSearch
            conversationId={conversationId}
            isDark={isDark}
            onResultPress={() => setShowSearch(false)}
          />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 py-3"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View className="flex-1 justify-center items-center py-8">
                <Text className="text-foreground text-center">
                  No messages yet. Start the conversation!
                </Text>
              </View>
            ) : (
              messages.map((message) => (
                <View
                  key={message.id}
                  className={`mb-3 ${
                    message.sender_id === user?.id ? 'items-end' : 'items-start'
                  }`}
                >
                  <View
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  >
                    {message.message_type === 'text' && (
                      <Text
                        className={
                          message.sender_id === user?.id ? 'text-primary-foreground' : 'text-foreground'
                        }
                      >
                        {message.content}
                      </Text>
                    )}
                    {message.message_type === 'image' && message.media_url && (
                      <Text
                        className={
                          message.sender_id === user?.id ? 'text-primary-foreground' : 'text-foreground'
                        }
                      >
                        [Image]
                      </Text>
                    )}
                    {message.message_type === 'voice' && message.media_url && (
                      <VoiceMessagePlayer
                        mediaUrl={message.media_url}
                        duration={message.media_duration}
                        isOwnMessage={message.sender_id === user?.id}
                        isDark={isDark}
                      />
                    )}
                  </View>
                  <View className="flex-row items-center mt-1 gap-1">
                    <Text className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </Text>
                    {message.sender_id === user?.id && (
                      <>
                        {message.read_by && message.read_by.length > 0 ? (
                          <CheckCircle size={12} color={themeColors.primary} />
                        ) : (
                          <Clock size={12} color={themeColors.mutedForeground} />
                        )}
                      </>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {!showSearch && (
          <>
            {/* Voice Recorder */}
            {showVoiceRecorder && conversationId && (
              <View className="px-4 py-3 border-t border-border">
                <VoiceMessageRecorder
                  conversationId={conversationId}
                  onSend={handleVoiceMessageSent}
                  onCancel={() => setShowVoiceRecorder(false)}
                  maxDuration={120}
                />
              </View>
            )}

            {/* Input Area */}
            <View className="px-4 py-3 border-t border-border">
              {!showVoiceRecorder && (
                <View className="flex-row items-end gap-2">
                  {/* Media Options Button */}
                  <TouchableOpacity
                    onPress={() => setShowMediaOptions(!showMediaOptions)}
                    disabled={!isConnected || isSending}
                    className="p-2 rounded-lg bg-muted"
                  >
                    <Paperclip size={20} color={themeColors.mutedForeground} />
                  </TouchableOpacity>

                  {/* Voice Message Button */}
                  <TouchableOpacity
                    onPress={() => setShowVoiceRecorder(true)}
                    disabled={!isConnected || isSending}
                    className="p-2 rounded-lg bg-muted"
                  >
                    <Mic size={20} color={themeColors.mutedForeground} />
                  </TouchableOpacity>

                  <TextInput
                    className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground"
                    placeholder="Type a message..."
                    placeholderTextColor={themeColors.mutedForeground}
                    value={newMessage}
                    onChangeText={handleTextChange}
                    multiline
                    maxLength={500}
                    editable={isConnected && !isSending}
                  />
                  <TouchableOpacity
                    onPress={sendMessage}
                    disabled={!isConnected || isSending || !newMessage.trim()}
                    className="pb-2"
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color={themeColors.primary} />
                    ) : (
                      <Text className="text-primary font-bold text-lg">↑</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Media Options Menu */}
              {showMediaOptions && !showVoiceRecorder && (
                <View className="mt-2 p-3 rounded-lg bg-muted">
                  <Text className="text-sm font-medium mb-2 text-foreground">
                    Send Media
                  </Text>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      onPress={() => {
                        setShowMediaOptions(false);
                        setShowVoiceRecorder(true);
                      }}
                      className="flex-1 p-3 rounded-lg items-center bg-secondary"
                    >
                      <Mic size={24} color={themeColors.foreground} />
                      <Text className="mt-1 text-xs text-foreground">
                        Voice
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        // TODO: Implement image picker
                        setShowMediaOptions(false);
                      }}
                      className="flex-1 p-3 rounded-lg items-center bg-secondary"
                    >
                      <Text className="text-lg text-foreground">📷</Text>
                      <Text className="mt-1 text-xs text-foreground">
                        Photo
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowMediaOptions(false)}
                      className="p-2"
                    >
                      <X size={20} color={themeColors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
