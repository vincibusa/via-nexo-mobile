/**
 * Message Reactions Component
 * UI for displaying and interacting with message reactions
 */

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SmilePlus, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import type { Message, MessageReaction } from '../../lib/types/messaging';
import { useMessageReactions } from '../../lib/hooks/useMessageReactions';
import { useAuth } from '../../lib/contexts/auth';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

interface MessageReactionsProps {
  message: Message;
  isOwnMessage: boolean;
  isDark: boolean;
}

// Common emoji reactions
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

export function MessageReactions({ message, isOwnMessage, isDark }: MessageReactionsProps) {
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  const {
    reactions,
    isLoading,
    error,
    addReaction,
    removeReaction,
    loadReactions,
    clearError,
  } = useMessageReactions();

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactionDetails, setShowReactionDetails] = useState(false);
  const reactionPickerRef = useRef<BottomSheet>(null);
  const reactionDetailsRef = useRef<BottomSheet>(null);

  // Bottom sheet snap points
  const pickerSnapPoints = useMemo(() => ['60%'], []);
  const detailsSnapPoints = useMemo(() => ['60%'], []);

  // Handle reaction picker sheet changes
  useEffect(() => {
    if (showReactionPicker) {
      reactionPickerRef.current?.expand();
    } else {
      reactionPickerRef.current?.close();
    }
  }, [showReactionPicker]);

  // Handle reaction details sheet changes
  useEffect(() => {
    if (showReactionDetails) {
      reactionDetailsRef.current?.expand();
    } else {
      reactionDetailsRef.current?.close();
    }
  }, [showReactionDetails]);

  const handlePickerSheetChange = useCallback((index: number) => {
    if (index === -1) {
      setShowReactionPicker(false);
    }
  }, []);

  const handleDetailsSheetChange = useCallback((index: number) => {
    if (index === -1) {
      setShowReactionDetails(false);
    }
  }, []);

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

  // Group reactions by emoji
  const reactionsByEmoji = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  // Check if current user has reacted with each emoji
  const userReactions = reactions.filter(r => r.user_id === user?.id);

  const handleReactionPress = async (emoji: string) => {
    // Check if user already reacted with this emoji
    const existingReaction = userReactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      // Remove reaction
      await removeReaction(message.id, existingReaction.id);
    } else {
      // Add reaction
      await addReaction(message.id, emoji);
    }

    setShowReactionPicker(false);
  };

  const handleReactionLongPress = () => {
    loadReactions(message.id);
    setShowReactionDetails(true);
  };

  const ReactionBadge = ({ emoji, count }: { emoji: string; count: number }) => {
    const isUserReacted = userReactions.some(r => r.emoji === emoji);

    return (
      <TouchableOpacity
        onPress={() => handleReactionPress(emoji)}
        onLongPress={handleReactionLongPress}
        className={`px-2 py-1 rounded-full flex-row items-center space-x-1 ${
          isUserReacted
            ? isDark ? 'bg-blue-900/30' : 'bg-blue-100'
            : isDark ? 'bg-slate-800' : 'bg-slate-100'
        } border ${
          isUserReacted
            ? isDark ? 'border-blue-700' : 'border-blue-300'
            : isDark ? 'border-slate-700' : 'border-slate-300'
        }`}
      >
        <Text className="text-base">{emoji}</Text>
        <Text className={`text-xs ${
          isUserReacted
            ? isDark ? 'text-blue-300' : 'text-blue-700'
            : isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {count}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View className="mt-2 flex-row flex-wrap gap-1">
        {/* Add reaction button */}
        <TouchableOpacity
          onPress={() => setShowReactionPicker(true)}
          className="px-2 py-1 rounded-full flex-row items-center bg-muted border border-border"
        >
          <SmilePlus size={14} color={themeColors.mutedForeground} />
        </TouchableOpacity>

        {/* Reaction badges */}
        {Object.entries(reactionsByEmoji).map(([emoji, emojiReactions]) => (
          <ReactionBadge
            key={emoji}
            emoji={emoji}
            count={emojiReactions.length}
          />
        ))}
      </View>

      {/* Reaction Picker Bottom Sheet */}
      <BottomSheet
        ref={reactionPickerRef}
        index={showReactionPicker ? 0 : -1}
        snapPoints={pickerSnapPoints}
        onChange={handlePickerSheetChange}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: themeColors.card,
        }}
        handleIndicatorStyle={{
          backgroundColor: themeColors.mutedForeground,
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <View className="p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-medium text-foreground text-lg">
                Add Reaction
              </Text>
              <TouchableOpacity onPress={() => setShowReactionPicker(false)}>
                <X size={20} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap justify-center gap-3">
              {COMMON_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReactionPress(emoji)}
                  className="w-12 h-12 items-center justify-center rounded-full bg-muted"
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* Reaction Details Bottom Sheet */}
      <BottomSheet
        ref={reactionDetailsRef}
        index={showReactionDetails ? 0 : -1}
        snapPoints={detailsSnapPoints}
        onChange={handleDetailsSheetChange}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: themeColors.card,
        }}
        handleIndicatorStyle={{
          backgroundColor: themeColors.mutedForeground,
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-foreground">
                Reactions
              </Text>
              <TouchableOpacity onPress={() => setShowReactionDetails(false)}>
                <X size={24} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <Text className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Loading...
              </Text>
            ) : error ? (
              <View className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Text className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </Text>
              </View>
            ) : reactions.length === 0 ? (
              <Text className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                No reactions yet
              </Text>
            ) : (
              <ScrollView>
                {Object.entries(reactionsByEmoji).map(([emoji, emojiReactions]) => (
                  <View key={emoji} className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-2xl mr-2">{emoji}</Text>
                      <Text className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {emojiReactions.length}
                      </Text>
                    </View>

                    {emojiReactions.map((reaction) => (
                      <View
                        key={reaction.id}
                        className={`flex-row items-center py-2 ${
                          reaction.user_id === user?.id
                            ? isDark ? 'bg-blue-900/20' : 'bg-blue-50'
                            : ''
                        }`}
                      >
                        <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mr-3" />
                        <View className="flex-1">
                          <Text className={isDark ? 'text-white' : 'text-slate-900'}>
                            {reaction.user?.displayName || 'User'}
                          </Text>
                          <Text className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {new Date(reaction.created_at).toLocaleString()}
                          </Text>
                        </View>

                        {reaction.user_id === user?.id && (
                          <TouchableOpacity
                            onPress={() => removeReaction(message.id, reaction.id)}
                            className="ml-2"
                          >
                            <Text className="text-red-500 text-sm">Remove</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}