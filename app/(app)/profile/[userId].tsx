import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Card } from '../../../components/ui/card';
import { useAuth } from '../../../lib/contexts/auth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, MapPin, Grid3x3, MoreHorizontal, MoreVertical } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { useColorScheme } from 'nativewind';
import { API_CONFIG } from '../../../lib/config';

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
}

export default function UserProfileScreen() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { userId } = useLocalSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = userId === currentUser?.id;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/social/profiles/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
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
      });
      setIsFollowing(data.is_followed || false);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')}
        edges={['top']}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
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
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">@{profile.email.split('@')[0]}</Text>
          <TouchableOpacity>
            <MoreVertical size={24} className="text-foreground" />
          </TouchableOpacity>
        </View>

        {/* Profile Info Section */}
        <View className="p-6">
          {/* Avatar Row */}
          <View className="flex-row items-start gap-4 mb-6">
            {/* Large Avatar */}
            <View className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage source={{ uri: profile.avatar_url || '' }} />
                <AvatarFallback>
                  <Text className="text-2xl font-bold">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </Text>
                </AvatarFallback>
              </Avatar>

              {/* Verification Badge Overlay */}
              {profile.is_verified && (
                <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5">
                  <CheckCircle2 size={16} color="white" />
                </View>
              )}
            </View>

            {/* Stats Row (Mini - accanto avatar) */}
            <View className="flex-1 flex-row justify-around pt-4">
              <View className="items-center">
                <Text className="text-xl font-bold">0</Text>
                <Text className="text-xs text-muted-foreground">Post</Text>
              </View>
              <TouchableOpacity
                className="items-center"
                onPress={() => router.push(`/(app)/followers/${userId}` as any)}
              >
                <Text className="text-xl font-bold">{profile.followers_count}</Text>
                <Text className="text-xs text-muted-foreground">Follower</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="items-center"
                onPress={() => router.push(`/(app)/following/${userId}` as any)}
              >
                <Text className="text-xl font-bold">{profile.following_count}</Text>
                <Text className="text-xs text-muted-foreground">Seguiti</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Name & Username */}
          <View className="mb-4">
            <Text className="text-lg font-bold mb-0.5">{profile.display_name}</Text>
            <Text className="text-sm text-muted-foreground">
              @{profile.email.split('@')[0]}
            </Text>
          </View>

          {/* Bio Section */}
          {(profile.bio || profile.website || profile.location) && (
            <View className="gap-2 mb-6">
              {profile.bio && (
                <Text className="text-sm leading-relaxed">{profile.bio}</Text>
              )}
              {profile.website && (
                <TouchableOpacity>
                  <Text className="text-sm text-blue-500">{profile.website}</Text>
                </TouchableOpacity>
              )}
              {profile.location && (
                <View className="flex-row items-center gap-1.5">
                  <MapPin size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">{profile.location}</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            {isOwnProfile ? (
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => router.push('/(app)/edit-profile' as any)}
              >
                <Text className="font-semibold">Modifica Profilo</Text>
              </Button>
            ) : (
              <>
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  onPress={handleFollow}
                  className="flex-1"
                >
                  <Text className={cn(
                    'font-semibold',
                    isFollowing ? 'text-foreground' : 'text-primary-foreground'
                  )}>
                    {isFollowing ? 'Seguendo' : 'Segui'}
                  </Text>
                </Button>

                <Button variant="outline" className="flex-1">
                  <Text className="font-semibold">Messaggio</Text>
                </Button>

                <Button variant="outline" className="px-4">
                  <MoreHorizontal size={20} className="text-foreground" />
                </Button>
              </>
            )}
          </View>
        </View>

        {/* Empty Posts Section */}
        <View className="border-t border-border">
          {/* Tabs Header */}
          <View className="border-b border-border">
            <View className="flex-row">
              <TouchableOpacity
                className="flex-1 py-3 items-center border-b-2 border-foreground"
                disabled
              >
                <Grid3x3 size={20} className="text-foreground" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Empty State */}
          <View className="py-16 items-center">
            <View className="rounded-full bg-muted p-6 mb-4">
              <Grid3x3 size={48} className="text-muted-foreground" />
            </View>
            <Text className="text-lg font-semibold mb-2">Nessun post ancora</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Quando {profile.display_name.split(' ')[0]} condividerà foto,{`\n`}le vedrai qui.
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
