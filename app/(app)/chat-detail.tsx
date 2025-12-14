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
import { useColorScheme } from 'nativewind';
import { CheckCircle, Clock } from 'lucide-react-native';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { conversationId, userName } = useLocalSearchParams<{
    conversationId: string;
    userName: string;
  }>();
  const { colorScheme } = useColorScheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const isDark = colorScheme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-black';
  const bgColor = isDark ? 'bg-slate-900' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';
  const inputBgColor = isDark ? 'bg-slate-800' : 'bg-slate-100';

  // Carica la cronologia conversazione
  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) {
        setError('Missing conversation ID');
        setIsLoading(false);
        return;
      }

      try {
        const response = await messagingService.getMessages(conversationId, 50);

        // Set initial messages
        if (response.messages) {
          setMessages(response.messages);
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
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
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

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center ${bgColor}`}>
        <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#1e40af'} />
        <Text className={`mt-4 ${textColor}`}>Loading conversation...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className={`px-4 py-3 border-b ${borderColor}`}>
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-500">← Back</Text>
            </TouchableOpacity>
            <Text className={`text-lg font-bold ${textColor}`}>{userName || 'Chat'}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Connection Status */}
          <View className="flex-row items-center mt-2">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <Text className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <Text className="text-red-500 text-xs mt-1">{error}</Text>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-3"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View className="flex-1 justify-center items-center py-8">
              <Text className={`${textColor} text-center`}>
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
                      ? 'bg-blue-500'
                      : isDark
                      ? 'bg-slate-700'
                      : 'bg-slate-200'
                  }`}
                >
                  {message.message_type === 'text' && (
                    <Text
                      className={
                        message.sender_id === user?.id ? 'text-white' : textColor
                      }
                    >
                      {message.content}
                    </Text>
                  )}
                  {message.message_type === 'image' && message.media_url && (
                    <Text
                      className={
                        message.sender_id === user?.id ? 'text-white' : textColor
                      }
                    >
                      [Image]
                    </Text>
                  )}
                  {message.message_type === 'voice' && (
                    <Text
                      className={
                        message.sender_id === user?.id ? 'text-white' : textColor
                      }
                    >
                      [Voice message]
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center mt-1 gap-1">
                  <Text
                    className={`text-xs ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString()}
                  </Text>
                  {message.sender_id === user?.id && (
                    <>
                      {message.read_by && message.read_by.length > 0 ? (
                        <CheckCircle size={12} color={isDark ? '#60a5fa' : '#3b82f6'} />
                      ) : (
                        <Clock size={12} color={isDark ? '#94a3b8' : '#cbd5e1'} />
                      )}
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input Area */}
        <View className={`px-4 py-3 border-t ${borderColor}`}>
          <View className="flex-row items-end gap-2">
            <TextInput
              className={`flex-1 px-3 py-2 rounded-lg ${inputBgColor} ${textColor}`}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? '#94a3b8' : '#94a3b8'}
              value={newMessage}
              onChangeText={setNewMessage}
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
                <ActivityIndicator size="small" color={isDark ? '#3b82f6' : '#1e40af'} />
              ) : (
                <Text className="text-blue-500 font-bold text-lg">↑</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
