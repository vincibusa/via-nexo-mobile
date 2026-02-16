import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, FlatList, Alert, RefreshControl, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter } from 'expo-router';
import { Text } from '../../../components/ui/text';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../../../lib/contexts/auth';
import MessagingService from '../../../lib/services/messaging';
import type { Conversation } from '../../../lib/types/messaging';
import { MessageCircle, Plus, Search, X } from 'lucide-react-native';
import { SwipeableConversationItem } from '../../../components/messaging/SwipeableConversationItem';
import { THEME } from '../../../lib/theme';
import { useConversationsRealtime } from '../../../lib/hooks/useConversationsRealtime';
import { useColorScheme } from 'nativewind';
import { GlassSurface } from '../../../components/glass';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export default function MessagesScreen() {
  const { session, user } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const searchInputRef = useRef<TextInput>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const themeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const isDark = themeMode === 'dark';
  const themeColors = THEME[themeMode];

  // Animation values
  const borderOpacity = useSharedValue(0);
  const bgOpacity = useSharedValue(isDark ? 0.3 : 0.12);
  const borderRgb = isDark ? '148, 163, 184' : '30, 41, 59';
  const bgRgb = isDark ? '71, 85, 105' : '148, 163, 184';
  const searchSurfaceStyle = isDark
    ? styles.searchSurface
    : { ...styles.searchSurface, ...styles.searchSurfaceLight };

  // Animated styles for search bar
  const animatedSearchBarStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(${borderRgb}, ${borderOpacity.value})`,
    backgroundColor: `rgba(${bgRgb}, ${bgOpacity.value})`,
  }));

  // Handle focus animation
  useEffect(() => {
    if (isFocused || searchQuery.length > 0) {
      borderOpacity.value = withTiming(isDark ? 0.38 : 0.22, { duration: 200, easing: Easing.out(Easing.ease) });
      bgOpacity.value = withTiming(isDark ? 0.4 : 0.18, { duration: 200, easing: Easing.out(Easing.ease) });
    } else {
      borderOpacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
      bgOpacity.value = withTiming(isDark ? 0.3 : 0.12, { duration: 200, easing: Easing.out(Easing.ease) });
    }
  }, [isDark, isFocused, searchQuery, borderOpacity, bgOpacity]);

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

  const handleCancel = () => {
    setSearchQuery('');
    setIsFocused(false);
    searchInputRef.current?.blur();
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    Alert.alert(
      'Elimina conversazione',
      `Sei sicuro di voler eliminare la conversazione con ${conversation.other_user?.displayName || 'questo utente'}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await MessagingService.deleteConversation(conversation.id);
              setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Errore', 'Impossibile eliminare la conversazione');
            }
          },
        },
      ]
    );
  };

  const handleArchiveConversation = async (conversation: Conversation) => {
    try {
      await MessagingService.archiveConversation(conversation.id);
      setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
      Alert.alert('Archiviata', 'Conversazione archiviata con successo');
    } catch (error) {
      console.error('Error archiving conversation:', error);
      Alert.alert('Errore', 'Impossibile archiviare la conversazione');
    }
  };

  const handleMuteConversation = async (conversation: Conversation) => {
    try {
      const isMuted = conversation.is_muted;
      await MessagingService.muteConversation(conversation.id, !isMuted);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, is_muted: !isMuted } : c
        )
      );
      Alert.alert(
        isMuted ? 'Notifiche attivate' : 'Silenziata',
        isMuted
          ? 'Riceverai notifiche per questa conversazione'
          : 'Non riceverai notifiche per questa conversazione'
      );
    } catch (error) {
      console.error('Error muting conversation:', error);
      Alert.alert('Errore', 'Impossibile modificare le notifiche');
    }
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


      {/* Search Bar and New Conversation Button */}
      <View className="px-4 py-3 flex-row items-center gap-3">
        <GlassSurface
          variant="card"
          intensity={isDark ? 'regular' : 'light'}
          tint={isDark ? 'extraLight' : 'light'}
          style={searchSurfaceStyle}
        >
          <Animated.View
            style={[animatedSearchBarStyle]}
            className="flex-row items-center gap-2 rounded-full px-4 py-3 border"
          >
            <Search size={18} color={themeColors.mutedForeground} />
            <TextInput
              ref={searchInputRef}
              placeholder="Cerca conversazioni"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholderTextColor={themeColors.mutedForeground}
              className="flex-1 py-0 text-base text-foreground leading-5"
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            )}
          </Animated.View>
        </GlassSurface>
        {(isFocused || searchQuery.length > 0) && (
          <TouchableOpacity onPress={handleCancel}>
            <Text className="text-base font-medium text-primary">Annulla</Text>
          </TouchableOpacity>
        )}
        {!(isFocused || searchQuery.length > 0) && (
          <GlassSurface
            variant="card"
            intensity={isDark ? 'regular' : 'light'}
            tint={isDark ? 'dark' : 'light'}
            style={{ borderRadius: 12, padding: 0 }}
          >
            <TouchableOpacity
              onPress={handleNewConversation}
              className="w-10 h-10 items-center justify-center rounded-xl bg-primary"
            >
              <Plus size={22} color={themeColors.primaryForeground} />
            </TouchableOpacity>
          </GlassSurface>
        )}
      </View>

      {loading && conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.foreground} />
          <Text className="mt-4 text-muted-foreground">
            Caricamento conversazioni...
          </Text>
        </View>
      ) : (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <FlatList
            data={filteredConversations}
            renderItem={({ item }) => (
              <SwipeableConversationItem
                conversation={item}
                currentUserId={user?.id || ''}
                onPress={() => handleConversationPress(item)}
                onDelete={() => handleDeleteConversation(item)}
                onArchive={() => handleArchiveConversation(item)}
                onMute={() => handleMuteConversation(item)}
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
        </GestureHandlerRootView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchSurface: {
    flex: 1,
    borderRadius: 999,
    padding: 4,
    borderWidth: 0,
    borderColor: 'rgba(255,255,255,0.12)',
    height: 52,
  },
  searchSurfaceLight: {
    borderColor: 'rgba(15,23,42,0.08)',
  },
});
