import { useState, useEffect } from 'react';
import { View, FlatList, Alert, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Text } from '../../components/ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { useAuth } from '../../lib/contexts/auth';
import MessagingService from '../../lib/services/messaging';
import { API_CONFIG } from '../../lib/config';
import { Search, X } from 'lucide-react-native';
import { THEME } from '../../lib/theme';
import { useColorScheme } from 'nativewind';
import { GlassSurface } from '../../components/glass';

interface User {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
}

export default function NewConversationScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const [following, setFollowing] = useState<User[]>([]);
  const [filteredFollowing, setFilteredFollowing] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Get dynamic colors for icons
  const themeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const isDark = themeMode === 'dark';
  const themeColors = THEME[themeMode];

  useEffect(() => {
    loadFollowing();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFollowing(following);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = following.filter((u) => {
      const name = u.display_name?.toLowerCase() || '';
      const email = u.email?.toLowerCase() || '';
      const bio = u.bio?.toLowerCase() || '';

      return name.includes(query) || email.includes(query) || bio.includes(query);
    });

    setFilteredFollowing(filtered);
  }, [searchQuery, following]);

  const loadFollowing = async () => {
    if (!user?.id) return;

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOLLOWING(user.id)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load following: ${response.status}`);
      }

      const data = await response.json() as Array<{
        id: string;
        display_name?: string;
        email: string;
        avatar_url?: string;
        bio?: string;
      }>;

      const users = data.map((u) => ({
        id: u.id,
        display_name: u.display_name || u.email?.split('@')[0] || 'Utente',
        email: u.email,
        avatar_url: u.avatar_url,
        bio: u.bio,
      }));

      setFollowing(users);
      setFilteredFollowing(users);
    } catch (error) {
      console.error('Error loading following:', error);
      Alert.alert('Errore', 'Impossibile caricare la lista di seguiti');
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = async (selectedUser: User) => {
    if (!user?.id || creating) return;

    setCreating(true);

    try {
      // Create or get existing conversation
      const response = await MessagingService.createConversation({
        other_user_id: selectedUser.id,
      });

      // Navigate to the conversation
      router.replace(`/(app)/conversation/${response.conversation_id}` as any);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Errore', 'Impossibile creare la conversazione');
      setCreating(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item)}
      disabled={creating}
      className="flex-row items-center justify-between border-b border-border px-4 py-3 active:bg-muted"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Avatar className="h-12 w-12" alt={item.display_name}>
          {item.avatar_url && (
            <AvatarImage source={{ uri: item.avatar_url }} />
          )}
          <AvatarFallback>
            <Text className="text-sm font-semibold">
              {getInitials(item.display_name)}
            </Text>
          </AvatarFallback>
        </Avatar>
        <View className="flex-1">
          <Text className="font-semibold">{item.display_name}</Text>
          <Text className="text-xs text-muted-foreground">{item.email}</Text>
          {item.bio && (
            <Text className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {item.bio}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Text className="text-xl font-semibold text-center mb-2">
        {searchQuery.trim() ? 'Nessun risultato' : 'Nessun seguito'}
      </Text>
      <Text className="text-center text-muted-foreground">
        {searchQuery.trim()
          ? `Nessun seguito trovato con "${searchQuery}"`
          : 'Inizia a seguire altri utenti per chattare con loro'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Nuova conversazione',
          headerShown: true,
          headerBackTitle: ' ',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(app)/new-group-conversation' as any)}
              className="mr-2 py-2 px-3 items-center justify-center"
            >
              <Text className="text-primary font-semibold">Gruppo</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Search Bar */}
      <View className="px-4 py-3">
        <GlassSurface
          variant="card"
          intensity={isDark ? 'regular' : 'light'}
          tint={isDark ? 'dark' : 'light'}
          style={{ borderRadius: 14, padding: 0 }}
        >
          <View className="flex-row items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
            <Search size={18} color={themeColors.mutedForeground} />
            <TextInput
              placeholder="Cerca tra i tuoi seguiti"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={themeColors.mutedForeground}
              className="flex-1 py-0 text-base text-foreground leading-5"
              autoCapitalize="none"
              editable={!loading}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </GlassSurface>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.foreground} />
          <Text className="mt-4 text-muted-foreground">
            Caricamento seguiti...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFollowing}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            flexGrow: 1,
          }}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {creating && (
        <View className="absolute inset-0 bg-background/80 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text className="mt-4 text-muted-foreground">
            Creazione conversazione...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
