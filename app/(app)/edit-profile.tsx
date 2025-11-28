import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { useAuth } from '../../lib/contexts/auth';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import { API_CONFIG } from '../../lib/config';

export default function EditProfileScreen() {
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/social/profiles/${user.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = (await response.json()) as {
        display_name?: string;
        email?: string;
        bio?: string;
        location?: string;
        website?: string;
        avatar_url?: string;
      };

      // Initialize form fields
      setDisplayName(data.display_name || '');
      setEmail(data.email || '');
      setBio(data.bio || '');
      setLocation(data.location || '');
      setWebsite(data.website || '');
      setAvatarUrl(data.avatar_url || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (localUri: string | null): Promise<string | null> => {
    if (!localUri || !user?.id) return null;

    try {
      // Check if it's already a remote URL (from Supabase)
      if (localUri.startsWith('https://')) {
        return localUri;
      }

      // Upload to Supabase storage using XMLHttpRequest (like stories do)
      const fileName = `avatar-${user.id}-${Date.now()}.jpg`;
      const formData = new FormData();

      // Append file directly from URI (React Native way)
      formData.append('file', {
        uri: localUri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
      formData.append('bucket', 'avatars');

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('Upload response:', response);
              resolve(response.url || null);
            } catch (error) {
              console.error('Invalid response from server:', error);
              reject(new Error('Invalid response from server'));
            }
          } else {
            console.error('Upload failed with status:', xhr.status);
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          console.error('Network error occurred');
          reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('timeout', () => {
          console.error('Upload timeout');
          reject(new Error('Upload timeout'));
        });

        xhr.open('POST', `${API_CONFIG.BASE_URL}/api/admin/upload`);
        xhr.timeout = 30000; // 30 seconds
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Upload avatar to storage if changed
      const uploadedAvatarUrl = await uploadAvatar(avatarUrl);
      console.log('uploadedAvatarUrl:', uploadedAvatarUrl);
      console.log('avatarUrl before:', avatarUrl);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/social/profiles/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          email,
          bio,
          location,
          website,
          avatar_url: uploadedAvatarUrl || avatarUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const finalAvatarUrl = uploadedAvatarUrl || avatarUrl;
      console.log('finalAvatarUrl:', finalAvatarUrl);

      // Update user profile in auth context
      await updateUserProfile({
        displayName,
        email,
        avatarUrl: finalAvatarUrl || undefined,
      });

      console.log('Updated user profile in context');

      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
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

  return (
    <SafeAreaView
      className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')}
      edges={['top']}
    >
      <View className="flex-1 flex-col">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Modifica Profilo</Text>
          <Button
            onPress={handleSave}
            disabled={isSaving}
            variant="ghost"
            className="px-3"
          >
            <Text className="font-semibold text-primary">
              {isSaving ? 'Salvataggio...' : 'Salva'}
            </Text>
          </Button>
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View className="items-center gap-3 px-4 py-6 border-b border-border">
            <Avatar className="h-32 w-32" alt={displayName || 'User avatar'}>
              <AvatarImage source={{ uri: avatarUrl || '' }} />
              <AvatarFallback>
                <Text className="text-4xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </AvatarFallback>
            </Avatar>

            <TouchableOpacity
              onPress={handlePickAvatar}
              className="flex-row items-center gap-2 rounded-lg bg-primary/10 px-4 py-2"
            >
              <Camera size={18} className="text-primary" />
              <Text className="text-sm font-semibold text-primary">
                Cambia foto
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="gap-4 px-4 py-6">
            {/* Display Name */}
            <View className="gap-2">
              <Text className="text-sm font-semibold">Nome Visualizzato</Text>
              <Input
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Il tuo nome"
                placeholderTextColor="#999"
              />
            </View>

            {/* Email */}
            <View className="gap-2">
              <Text className="text-sm font-semibold">Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
              />
            </View>

            {/* Bio */}
            <View className="gap-2">
              <Text className="text-sm font-semibold">Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Racconta qualcosa di te..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                className="rounded-lg border border-input bg-background p-3 text-foreground"
                style={{ textAlignVertical: 'top' }}
              />
              <Text className="text-xs text-muted-foreground">
                {bio.length} / 250 caratteri
              </Text>
            </View>

            {/* Location */}
            <View className="gap-2">
              <Text className="text-sm font-semibold">Ubicazione</Text>
              <Input
                value={location}
                onChangeText={setLocation}
                placeholder="Es: Palermo, Sicilia"
                placeholderTextColor="#999"
              />
            </View>

            {/* Website */}
            <View className="gap-2">
              <Text className="text-sm font-semibold">Sito Web</Text>
              <Input
                value={website}
                onChangeText={setWebsite}
                placeholder="https://example.com"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Save Button */}
          <View className="gap-2 px-4 pb-6">
            <Button
              onPress={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              <Text className="font-semibold text-primary-foreground">
                {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
              </Text>
            </Button>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
