import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, FlatList, Alert, RefreshControl, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Text } from '../../../components/ui/text';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../../../lib/contexts/auth';
import MessagingService from '../../../lib/services/messaging';
import type { Conversation } from '../../../lib/types/messaging';
import { MessageCircle, Plus, Search, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { ConversationListItem } from '../../../components/messaging/ConversationListItem';
import { THEME } from '../../../lib/theme';
import { useSettings } from '../../../lib/contexts/settings';
import { useConversationsRealtime } from '../../../lib/hooks/useConversationsRealtime';

export default function MessagesScreen() {
  const { session, user } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const userName = conv.other_user?.displayName?.toLowerCase() ||
                      conv.other_user?.email?.toLowerCase() || '';
      const lastMessageContent = conv.last_message?.content?.toLowerCase() || '';

      return userName.includes(query) || lastMessageContent.includes(query);
    });
  }, [conversations, searchQuery]);

  const loadConversations = useCallback(async (reset: boolean = false) => {
    if (!session?.accessToken) return;

    try {
      const currentOffset = reset ? 0 : offset;
      const response = await MessagingService.getConversations(50, currentOffset);

      if (reset) {
        setConversations(response.conversations);
      } else {
        setConversations((prev) => [...prev, ...response.conversations]);
      }

      setHasMore(response.conversations.length === 50);
      setOffset(currentOffset + response.conversations.length);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Errore', 'Impossibile caricare le conversazioni');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.accessToken, offset]);

  // Initial load - depends on session for authentication
  useEffect(() => {
    if (!session?.accessToken) return;
    loadConversations(true);
  }, [session?.accessToken, loadConversations]);

  // Stable callback for Realtime - now truly stable with memoized loadConversations
  const handleRealtimeUpdate = useCallback(() => {
    console.log('[Messages] Realtime triggered, refreshing conversations');
    loadConversations(true);
  }, [loadConversations]); // Depends on memoized loadConversations

  // Setup Supabase Realtime listener - replaces polling!
  // This subscribes to INSERT events on messages table
  // When a new message arrives, the conversations list refreshes automatically
  // CRITICAL: Passes accessToken to authenticate Realtime with RLS
  useConversationsRealtime(session?.accessToken, handleRealtimeUpdate);

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

  const handleConversationPress = (conversation: Conversation) => {
    router.push(`/(app)/conversation/${conversation.id}` as any);
  };

  const handleNewConversation = () => {
    router.push('/(app)/new-conversation' as any);
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <MessageCircle size={64} color={themeColors.mutedForeground} />
      <Text className="text-xl font-semibold text-center mb-2 mt-4">
        Nessun messaggio
      </Text>
      <Text className="text-center text-muted-foreground">
        Inizia una conversazione con altri utenti
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || conversations.length === 0) return null;
    return (
      <View className="py-4">
        <ActivityIndicator color={themeColors.foreground} />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Messaggi',
          headerShown: true,
          headerBackTitle: ' ',
        }}
      />

      {/* Search Bar and New Conversation Button */}
      <View className="px-4 py-3 flex-row items-center gap-3">
        <View className="flex-1 flex-row items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
          <Search size={18} color={themeColors.mutedForeground} />
          <TextInput
            placeholder="Cerca conversazioni"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={themeColors.mutedForeground}
            className="flex-1 py-0 text-base text-foreground leading-5"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={themeColors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={handleNewConversation}
          className="w-10 h-10 items-center justify-center rounded-xl bg-primary"
        >
          <Plus size={22} color={themeColors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {loading && conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.foreground} />
          <Text className="mt-4 text-muted-foreground">
            Caricamento conversazioni...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={({ item }) => (
            <ConversationListItem
              conversation={item}
              onPress={() => handleConversationPress(item)}
              currentUserId={user?.id || ''}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            flexGrow: 1,
          }}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor={themeColors.foreground}
              colors={[themeColors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
