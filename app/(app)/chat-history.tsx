import { useState, useEffect } from 'react';
import { View, FlatList, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Text } from '../../components/ui/text';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../../lib/contexts/auth';
import { chatHistoryService } from '../../lib/services/chat-history';
import type { ChatConversation } from '../../lib/types/chat-history';
import { MessageSquare, Trash2, Calendar, MessageCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { cn } from '../../lib/utils';

export default function ChatHistoryScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadConversations = async (reset: boolean = false) => {
    if (!session?.accessToken) return;

    try {
      const currentOffset = reset ? 0 : offset;
      const response = await chatHistoryService.getConversations(
        session.accessToken,
        20,
        currentOffset
      );

      if (reset) {
        setConversations(response.conversations);
      } else {
        setConversations(prev => [...prev, ...response.conversations]);
      }

      setHasMore(response.hasMore);
      setOffset(currentOffset + response.conversations.length);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Errore', 'Impossibile caricare le conversazioni');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setOffset(0);
    loadConversations(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadConversations(false);
    }
  };

  const handleDeleteConversation = (conversation: ChatConversation) => {
    Alert.alert(
      'Elimina Conversazione',
      `Sei sicuro di voler eliminare "${conversation.title}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!session?.accessToken) return;
              
              await chatHistoryService.deleteConversation(
                conversation.id,
                session.accessToken
              );
              
              // Remove from local state
              setConversations(prev => 
                prev.filter(c => c.id !== conversation.id)
              );
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Errore', 'Impossibile eliminare la conversazione');
            }
          },
        },
      ]
    );
  };

  const handleContinueConversation = (conversationId: string) => {
    router.push({
      pathname: '/chat-search',
      params: { 
        conversation_id: conversationId,
        mode: 'free' 
      }
    } as any);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`;
    
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (session?.accessToken) {
      loadConversations(true);
    }
  }, [session?.accessToken]);

  const renderConversationCard = ({ item }: { item: ChatConversation }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="font-semibold text-lg mb-1" numberOfLines={1}>
              {item.title}
            </Text>
            {item.last_message_preview && (
              <Text className="text-muted-foreground text-sm mb-2" numberOfLines={2}>
                {item.last_message_preview}
              </Text>
            )}
          </View>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => handleDeleteConversation(item)}
            className="p-2"
          >
            <Trash2 size={16} className="text-foreground" />
          </Button>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <MessageSquare size={14} className="text-foreground" />
              <Text className="text-xs text-muted-foreground">
                {item.message_count} messaggi
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Calendar size={14} className="text-foreground" />
              <Text className="text-xs text-muted-foreground">
                {formatDate(item.updated_at)}
              </Text>
            </View>
          </View>
          
          <Button
            variant="default"
            size="sm"
            onPress={() => handleContinueConversation(item.id)}
          >
            <MessageCircle size={16} className="mr-1 text-foreground" />
            <Text className="text-xs">Continua</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center p-8">
      <MessageSquare size={64} className="text-foreground mb-4" />
      <Text className="text-xl font-semibold text-center mb-2">
        Nessuna conversazione
      </Text>
      <Text className="text-muted-foreground text-center mb-6">
        Le tue conversazioni con l'assistente AI appariranno qui
      </Text>
      <Button
        variant="default"
        onPress={() => router.push('/chat-search?mode=free' as any)}
      >
        <MessageCircle size={16} className="mr-2 text-foreground" />
        Inizia una nuova conversazione
      </Button>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Storico Chat',
          headerShown: true,
          headerBackTitle: ' ',
        }}
      />
      <SafeAreaView className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')} edges={['bottom']}>
        {loading && conversations.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-muted-foreground">Caricamento conversazioni...</Text>
          </View>
        ) : conversations.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversationCard}
            keyExtractor={(item) => item.id}
            contentContainerClassName="p-4"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              hasMore ? (
                <View className="py-4">
                  <ActivityIndicator />
                </View>
              ) : conversations.length > 10 ? (
                <View className="py-4">
                  <Text className="text-center text-muted-foreground">
                    Hai visto tutte le conversazioni
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}