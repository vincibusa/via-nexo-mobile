import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Text } from '../../../components/ui/text';
import { useAuth } from '../../../lib/contexts/auth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { useColorScheme } from 'nativewind';
import { API_CONFIG } from '../../../lib/config';
import { THEME } from '../../../lib/theme';
import { useSettings } from '../../../lib/contexts/settings';
import { RaveIdHeader } from '../../../components/profile/rave-id-header';
import { ProfileContentTabsNew } from '../../../components/profile/profile-content-tabs-new';
import type { RaveScore } from '../../../lib/types/rave-score';
import MessagingService from '../../../lib/services/messaging';

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  followers_count: number;
  following_count: number;
  is_verified: boolean;
  is_followed: boolean;
  role?: 'user' | 'admin' | 'manager';
}

interface ProfileApiResponse {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  followers_count?: number;
  following_count?: number;
  is_verified?: boolean;
  is_followed?: boolean;
  role?: 'user' | 'admin' | 'manager';
}

export default function UserProfileScreen() {
  const { user: currentUser, session } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const { userId } = useLocalSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [raveScore, setRaveScore] = useState<RaveScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [openingConversation, setOpeningConversation] = useState(false);

  const isOwnProfile = userId === currentUser?.id;

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  useEffect(() => {
    fetchProfile();
    fetchRaveScore();
  }, [userId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/social/profiles/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = (await response.json()) as ProfileApiResponse;
      setProfile({
        id: data.id,
        display_name: data.display_name,
        email: data.email,
        avatar_url: data.avatar_url,
        bio: data.bio,
        location: data.location,
        website: data.website,
        followers_count: data.followers_count || 0,
        following_count: data.following_count || 0,
        is_verified: data.is_verified || false,
        is_followed: data.is_followed || false,
        role: data.role || 'user',
      });
      setIsFollowing(data.is_followed || false);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRaveScore = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/rave-score/${userId}`,
        {
          headers: session?.accessToken ? {
            Authorization: `Bearer ${session.accessToken}`,
          } : {},
        }
      );

      if (!response.ok) {
        console.warn('Failed to fetch RAVE score');
        return;
      }

      const data = (await response.json()) as RaveScore;
      setRaveScore(data);
    } catch (error) {
      console.error('Error fetching RAVE score:', error);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        const url = `${API_CONFIG.BASE_URL}/api/social/follows?followingId=${userId}`;
        const response = await fetch(url, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to unfollow');
      } else {
        const url = `${API_CONFIG.BASE_URL}/api/social/follows`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followingId: userId }),
        });

        if (!response.ok) throw new Error('Failed to follow');
      }

      setIsFollowing(!isFollowing);
      // Update local state optimistically
      setProfile(prev => prev ? {
        ...prev,
        is_followed: !prev.is_followed,
        followers_count: prev.is_followed
          ? prev.followers_count - 1
          : prev.followers_count + 1
      } : null);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleMessage = async () => {
    if (!currentUser?.id || !profile?.id || openingConversation) return;

    setOpeningConversation(true);

    try {
      let conversationId: string | null = null;

      // First, try to find existing conversation with this user
      try {
        const conversationsResponse = await MessagingService.getConversations(50, 0);
        const existingConversation = conversationsResponse.conversations.find(
          (conv) => conv.other_user?.id === profile.id && conv.type === 'direct'
        );

        if (existingConversation) {
          conversationId = existingConversation.id;
        }
      } catch (searchError) {
        // If searching fails, we'll just create a new conversation
        // The API will handle if it already exists
        console.log('Could not search existing conversations, will create new one');
      }

      // If no existing conversation found, create one
      // The API will return existing conversation if it already exists
      if (!conversationId) {
        const response = await MessagingService.createConversation({
          other_user_id: profile.id,
        });
        conversationId = response.conversation_id;
      }

      // Navigate to the conversation using replace to avoid duplicate screens
      if (conversationId) {
        router.replace(`/(app)/conversation/${conversationId}` as any);
      }
    } catch (error) {
      console.error('Error opening conversation:', error);
      Alert.alert('Errore', 'Impossibile aprire la conversazione');
      setOpeningConversation(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchRaveScore()]);
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')}
        edges={['top']}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.foreground} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView
        className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')}
        edges={['top']}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-muted-foreground">Profilo non trovato</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')}
      edges={['top']}
    >
      {/* Header Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={themeColors.foreground} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">@{profile.email.split('@')[0]}</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.foreground}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* RAVE ID Header with Follow Buttons */}
        <RaveIdHeader
          user={{
            id: profile.id,
            email: profile.email,
            role: profile.role || 'user',
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
          }}
          raveScore={raveScore}
          variant="external"
          isFollowing={isFollowing}
          onFollowPress={handleFollow}
          onMessagePress={handleMessage}
        />

        {/* Content Tabs - Eventi Prenotati / Archivio Storie */}
        <ProfileContentTabsNew userId={profile.id} />

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
