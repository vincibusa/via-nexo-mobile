import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { TextInput } from 'react-native';
import { X, Heart, Send } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../../lib/contexts/auth';
import { API_CONFIG } from '../../lib/config';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useColorScheme } from 'nativewind';
import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  likes_count: number;
  is_liked: boolean;
}

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  discoveryItemId: string;
}

export function CommentsSheet({ isOpen, onClose, discoveryItemId }: CommentsSheetProps) {
  const { session, user } = useAuth();
  const { settings } = useSettings();
  const { colorScheme } = useColorScheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Snap points: 45% and 70% of screen height
  const snapPoints = useMemo(() => [
    SCREEN_HEIGHT * 0.45,
    SCREEN_HEIGHT * 0.7,
  ], []);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.snapToIndex(0); // Start at 45%
      fetchComments();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen, discoveryItemId]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const fetchComments = useCallback(async () => {
    if (!session?.accessToken || !discoveryItemId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/discovery/${discoveryItemId}/comments?limit=50&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        const errorData = await response.json();
        console.error('Error fetching comments:', errorData);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, discoveryItemId]);

  const handlePostComment = useCallback(async () => {
    if (!newComment.trim() || !session?.accessToken) return;

    setIsPosting(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/discovery/${discoveryItemId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ content: newComment.trim() }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Add the new comment to the list optimistically
        if (data.comment) {
          setComments((prev) => [data.comment, ...prev]);
        }
        setNewComment('');
      } else {
        const errorData = await response.json();
        console.error('Error posting comment:', errorData);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsPosting(false);
    }
  }, [newComment, session?.accessToken, discoveryItemId, fetchComments]);

  const handleLikeComment = useCallback(async (commentId: string) => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/discovery/${discoveryItemId}/comments/${commentId}/like`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update the comment in the list optimistically
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? { ...comment, is_liked: data.is_liked, likes_count: data.likes_count }
              : comment
          )
        );
      } else {
        const errorData = await response.json();
        console.error('Error liking comment:', errorData);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  }, [session?.accessToken, discoveryItemId, fetchComments]);

  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'ora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const renderComment = useCallback(({ item }: { item: Comment }) => (
    <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: themeColors.border }}>
      <Avatar style={{ height: 40, width: 40 }}>
        <AvatarImage source={{ uri: item.user?.avatar_url || '' }} />
        <AvatarFallback>
          <Text style={{ fontSize: 12, fontWeight: '600' }}>
            {item.user?.username?.charAt(0).toUpperCase()}
          </Text>
        </AvatarFallback>
      </Avatar>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ fontWeight: '600', color: themeColors.foreground }}>
            {item.user?.username}
          </Text>
          <Text style={{ fontSize: 12, color: themeColors.mutedForeground }}>
            {timeAgo(item.created_at)}
          </Text>
        </View>
        <Text style={{ marginTop: 4, fontSize: 14, lineHeight: 20, color: themeColors.foreground }}>
          {item.content}
        </Text>
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity 
            onPress={() => handleLikeComment(item.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Heart 
              size={14} 
              color={item.is_liked ? themeColors.destructive : themeColors.mutedForeground}
              fill={item.is_liked ? themeColors.destructive : 'none'}
            />
            <Text style={{ fontSize: 12, color: themeColors.mutedForeground }}>
              {item.likes_count}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [themeColors, handleLikeComment]);

  if (!isOpen) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: themeColors.background }}
      handleIndicatorStyle={{ backgroundColor: themeColors.mutedForeground }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={{ flex: 1 }}>
        {/* Header - Always visible */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: themeColors.border }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: themeColors.foreground }}>
            Commenti
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={themeColors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Comments List - Scrollable area */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={themeColors.foreground} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
            style={{ flex: 1 }}
            ListEmptyComponent={
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: themeColors.mutedForeground, textAlign: 'center' }}>
                  Nessun commento ancora.{'\n'}Sii il primo a commentare!
                </Text>
              </View>
            }
          />
        )}

        {/* Comment Input - Always visible at bottom */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={{ borderTopWidth: 1, borderTopColor: themeColors.border, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: themeColors.background }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar style={{ height: 40, width: 40 }}>
                <AvatarImage source={{ uri: user?.avatar_url || '' }} />
                <AvatarFallback>
                  <Text style={{ fontSize: 12, fontWeight: '600' }}>
                    {user?.email?.charAt(0).toUpperCase()}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, borderWidth: 1, borderColor: themeColors.border, backgroundColor: themeColors.muted + '30', paddingHorizontal: 16, paddingVertical: 10 }}>
                <TextInput
                  placeholder="Aggiungi un commento..."
                  placeholderTextColor={themeColors.mutedForeground}
                  value={newComment}
                  onChangeText={setNewComment}
                  style={{ flex: 1, fontSize: 14, color: themeColors.foreground, padding: 0 }}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  onPress={handlePostComment}
                  disabled={!newComment.trim() || isPosting}
                >
                  {isPosting ? (
                    <ActivityIndicator size="small" color={themeColors.foreground} />
                  ) : (
                    <Send
                      size={18}
                      color={newComment.trim() ? themeColors.primary : themeColors.mutedForeground}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
}

