import { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Text } from '../../components/ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { useAuth } from '../../lib/contexts/auth';
import MessagingService from '../../lib/services/messaging';
import { API_CONFIG } from '../../lib/config';
import { Search, X, Users, Check } from 'lucide-react-native';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useColorScheme } from 'nativewind';

interface User {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
}

export default function NewGroupConversationScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { settings } = useSettings();
  const { colorScheme } = useColorScheme();

  const [following, setFollowing] = useState<User[]>([]);
  const [filteredFollowing, setFilteredFollowing] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Get dynamic colors for icons
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

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

  const toggleUserSelection = (user: User) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const createGroupConversation = async () => {
    if (!user?.id || creating) return;
    if (selectedUsers.length < 2) {
      Alert.alert('Errore', 'Seleziona almeno 2 partecipanti per creare un gruppo');
      return;
    }
    if (!groupTitle.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per il gruppo');
      return;
    }

    setCreating(true);

    try {
      const participantIds = selectedUsers.map(u => u.id);
      // Include current user as participant
      const allParticipantIds = [...participantIds, user.id];

      const response = await MessagingService.createConversation({
        participant_ids: allParticipantIds,
        title: groupTitle.trim(),
        type: 'group',
      });

      // Navigate to the conversation
      router.replace(`/(app)/conversation/${response.conversation_id}` as any);
    } catch (error) {
      console.error('Error creating group conversation:', error);
      Alert.alert('Errore', 'Impossibile creare il gruppo');
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

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some(u => u.id === item.id);

    return (
      <TouchableOpacity
        onPress={() => toggleUserSelection(item)}
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
          <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            isSelected
              ? 'bg-primary border-primary'
              : 'bg-background border-muted-foreground'
          }`}>
            {isSelected && <Check size={14} color="white" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedUsers = () => {
    if (selectedUsers.length === 0) return null;

    return (
      <View className="px-4 py-3 border-b border-border">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-semibold">Partecipanti selezionati ({selectedUsers.length})</Text>
          <TouchableOpacity onPress={() => setSelectedUsers([])} disabled={creating}>
            <Text className="text-sm text-primary">Rimuovi tutti</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          {selectedUsers.map((user) => (
            <View key={user.id} className="items-center mr-3">
              <Avatar className="h-10 w-10" alt={user.display_name}>
                {user.avatar_url && (
                  <AvatarImage source={{ uri: user.avatar_url }} />
                )}
                <AvatarFallback>
                  <Text className="text-xs font-semibold">
                    {getInitials(user.display_name)}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <Text className="text-xs mt-1 max-w-16 text-center" numberOfLines={1}>
                {user.display_name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Text className="text-xl font-semibold text-center mb-2">
        {searchQuery.trim() ? 'Nessun risultato' : 'Nessun seguito'}
      </Text>
      <Text className="text-center text-muted-foreground">
        {searchQuery.trim()
          ? `Nessun seguito trovato con "${searchQuery}"`
          : 'Inizia a seguire altri utenti per creare un gruppo'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Crea gruppo',
          headerShown: true,
          headerBackTitle: ' ',
        }}
      />

      {/* Group Title Input */}
      <View className="px-4 py-3 border-b border-border">
        <Text className="text-sm font-medium mb-2">Nome del gruppo</Text>
        <TextInput
          placeholder="Inserisci un nome per il gruppo"
          value={groupTitle}
          onChangeText={setGroupTitle}
          placeholderTextColor={themeColors.mutedForeground}
          className={`py-2 px-3 rounded-lg border ${
            groupTitle.trim() ? 'border-primary' : 'border-border'
          } bg-background text-foreground`}
          maxLength={50}
          editable={!creating}
        />
      </View>

      {renderSelectedUsers()}

      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
          <Search size={18} color={themeColors.mutedForeground} />
          <TextInput
            placeholder="Cerca tra i tuoi seguiti"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={themeColors.mutedForeground}
            className="flex-1 py-0 text-base text-foreground leading-5"
            autoCapitalize="none"
            editable={!loading && !creating}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={themeColors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
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

      {/* Create Group Button */}
      {selectedUsers.length >= 2 && groupTitle.trim() && !creating && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <TouchableOpacity
            onPress={createGroupConversation}
            disabled={creating}
            className="bg-primary rounded-lg py-3 items-center"
          >
            <Text className="text-white font-semibold text-lg">
              Crea gruppo ({selectedUsers.length + 1} partecipanti)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {creating && (
        <View className="absolute inset-0 bg-background/80 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text className="mt-4 text-muted-foreground">
            Creazione gruppo...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}