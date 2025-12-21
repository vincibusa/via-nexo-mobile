import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { useAuth } from '../../lib/contexts/auth';

export interface Follower {
  id: string;
  username?: string;
  full_name?: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  isFollowedByCurrentUser?: boolean;
}

interface FollowerSelectorModalProps {
  modalRef: React.RefObject<BottomSheetModal | null>;
  onSelect: (followerIds: string[]) => void;
  maxFollowers?: number;
  followers: Follower[];
  isLoading?: boolean;
}

export function FollowerSelectorModal({
  modalRef,
  onSelect,
  maxFollowers = 5,
  followers,
  isLoading = false,
}: FollowerSelectorModalProps) {
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    console.log('FollowerSelectorModal component mounted');
    console.log('modalRef current:', modalRef.current);
    console.log('followers count:', followers.length);
  }, []);

  const filteredFollowers = followers.filter((f) =>
    f.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (followerId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(followerId)) {
      newSelected.delete(followerId);
    } else if (newSelected.size < maxFollowers) {
      newSelected.add(followerId);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    onSelect(Array.from(selectedIds));
    modalRef.current?.close();
    setSelectedIds(new Set());
    setSearchQuery('');
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchQuery('');
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={['60%']}
      onDismiss={handleClose}
      backgroundStyle={{ backgroundColor: themeColors.card }}
      topInset={insets.top}
      bottomInset={insets.bottom}
    >
      <BottomSheetView>
        <View className="px-4" style={{ height: '100%' }}>
          {/* Header */}
          <View className="pb-4 border-b border-border pt-4">
            <Text className="text-lg font-semibold text-foreground mb-2">
              Aggiungi ospiti ({selectedIds.size}/{maxFollowers})
            </Text>
            <TextInput
              placeholder="Cerca fra i follower..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="border border-input rounded-lg px-3 py-2 text-foreground"
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>

          {/* Follower List */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={themeColors.foreground} />
            </View>
          ) : (
            <FlatList
              data={filteredFollowers}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleToggle(item.id)}
                  className="flex-row items-center py-3 border-b border-border"
                >
                  {/* Avatar */}
                  {item.avatar_url ? (
                    <View
                      className="w-10 h-10 rounded-full bg-muted mr-3"
                      style={{
                        backgroundImage: `url(${item.avatar_url})`,
                      }}
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-muted mr-3" />
                  )}

                  {/* Name and Bio */}
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">
                      {item.display_name}
                    </Text>
                    {item.bio && (
                      <Text className="text-xs text-muted-foreground">
                        {item.bio}
                      </Text>
                    )}
                  </View>

                  {/* Checkbox */}
                  {selectedIds.has(item.id) && (
                    <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                      <Check size={16} color={themeColors.primaryForeground} />
                    </View>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center">
                  <Text className="text-muted-foreground">
                    {followers.length === 0
                      ? 'Non hai follower'
                      : 'Nessun risultato'}
                  </Text>
                </View>
              }
            />
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 pt-4 pb-4 border-t border-border">
            <Pressable
              onPress={() => modalRef.current?.close()}
              className="flex-1 py-3 rounded-lg border border-input items-center"
            >
              <Text className="font-semibold text-foreground">Annulla</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={selectedIds.size === 0}
              className={`flex-1 py-3 rounded-lg items-center ${
                selectedIds.size === 0 ? 'bg-muted' : 'bg-primary'
              }`}
            >
              <Text className={`font-semibold ${
                selectedIds.size === 0 ? 'text-muted-foreground' : 'text-primary-foreground'
              }`}>
                Aggiungi ({selectedIds.size})
              </Text>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
