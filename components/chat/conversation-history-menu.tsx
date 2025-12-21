import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { chatHistoryService } from '../../lib/services/chat-history';
import { useAuth } from '../../lib/contexts/auth';
import type { ChatConversation } from '../../lib/types/chat-history';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useColorScheme } from 'nativewind';

interface ConversationHistoryMenuProps {
  onClose: () => void;
  currentConversationId?: string;
  onSaveNewConversation?: () => void;
  canSaveNew: boolean;
}

export function ConversationHistoryMenu({
  onClose,
  currentConversationId,
  onSaveNewConversation,
  canSaveNew,
}: ConversationHistoryMenuProps) {
  const { session } = useAuth();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const response = await chatHistoryService.getConversations(session.accessToken, 20, 0);
      setConversations(response.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Errore', 'Impossibile caricare lo storico');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    onClose();
    // Navigate to chat screen with conversation_id
    router.push(`/chat-search?mode=free&conversation_id=${conversationId}` as any);
  };

  const handleDeleteConversation = async (conversationId: string, title: string) => {
    if (!session?.accessToken) return;

    Alert.alert(
      'Elimina conversazione',
      `Sei sicuro di voler eliminare "${title}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(conversationId);
              await chatHistoryService.deleteConversation(conversationId, session.accessToken);
              setConversations(conversations.filter((c) => c.id !== conversationId));
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Errore', 'Impossibile eliminare la conversazione');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Ieri';
    } else if (diffDays < 7) {
      return `${diffDays} giorni fa`;
    } else {
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  return (
    <View className="flex-row justify-end px-4 pt-2" pointerEvents="box-none">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="w-80 max-h-96 bg-card border border-border rounded-xl shadow-2xl"
        pointerEvents="auto"
        style={{
          shadowColor: themeColors.foreground,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
      {/* Header */}
      <View className="px-4 py-3 border-b border-border flex-row justify-between items-center bg-muted/30 rounded-t-xl">
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">💬</Text>
          <Text className="text-base font-semibold">Conversazioni</Text>
        </View>
        <Pressable onPress={onClose} className="p-1 active:bg-muted/50 rounded-md">
          <Text className="text-muted-foreground text-lg">✕</Text>
        </Pressable>
      </View>

      {/* Save New Button */}
      {canSaveNew && onSaveNewConversation && (
        <View className="px-4 py-2 border-b border-border">
          <Button
            variant="default"
            size="sm"
            onPress={() => {
              onSaveNewConversation();
              onClose();
            }}
            className="w-full"
          >
            <Text className="text-primary-foreground text-sm font-medium">
              💾 Salva conversazione corrente
            </Text>
          </Button>
        </View>
      )}

      {/* Conversations List */}
      <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator />
            <Text className="mt-2 text-muted-foreground text-sm">Caricamento...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View className="py-12 px-4 items-center">
            <Text className="text-muted-foreground text-center text-sm">
              Nessuna conversazione salvata
            </Text>
            <Text className="text-muted-foreground text-center text-xs mt-2">
              Le tue chat verranno salvate automaticamente dopo 3 messaggi
            </Text>
          </View>
        ) : (
          conversations.map((conversation) => {
            const isCurrentConversation = conversation.id === currentConversationId;
            const isDeleting = deletingId === conversation.id;

            return (
              <Pressable
                key={conversation.id}
                onPress={() => !isCurrentConversation && handleSelectConversation(conversation.id)}
                disabled={isCurrentConversation || isDeleting}
                className={`px-4 py-3 border-b border-border/50 ${
                  isCurrentConversation ? 'bg-muted/50' : 'active:bg-muted/30'
                }`}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-2">
                    <Text
                      className={`text-sm font-medium mb-1 ${
                        isCurrentConversation ? 'text-primary' : 'text-foreground'
                      }`}
                      numberOfLines={1}
                    >
                      {isCurrentConversation && '✓ '}
                      {conversation.title}
                    </Text>
                    {conversation.last_message_preview && (
                      <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                        {conversation.last_message_preview}
                      </Text>
                    )}
                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs text-muted-foreground">
                        {formatDate(conversation.updated_at)}
                      </Text>
                      {conversation.message_count && (
                        <Text className="text-xs text-muted-foreground ml-2">
                          • {conversation.message_count} messaggi
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Delete button */}
                  {!isCurrentConversation && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id, conversation.title);
                      }}
                      disabled={isDeleting}
                      className="p-2 active:bg-destructive/10 rounded-md"
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={themeColors.foreground} />
                      ) : (
                        <Text className="text-destructive text-base">🗑️</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      {conversations.length > 0 && (
        <View className="px-4 py-2 border-t border-border">
          <Text className="text-xs text-muted-foreground text-center">
            {conversations.length} di {conversations.length} conversazioni
          </Text>
        </View>
      )}
      </Animated.View>
    </View>
  );
}

