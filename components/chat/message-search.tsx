/**
 * Message Search Component
 * UI for searching messages within conversations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { Search, X, MessageSquare, User, Calendar } from 'lucide-react-native';
import { useMessageSearch } from '../../lib/hooks/useMessageSearch';
import type { SearchResult } from '../../lib/hooks/useMessageSearch';

interface MessageSearchProps {
  conversationId?: string; // Optional: search within specific conversation
  isDark: boolean;
  onResultPress?: (result: SearchResult) => void;
}

export function MessageSearch({ conversationId, isDark, onResultPress }: MessageSearchProps) {
  const { currentTheme } = useSettings();
  
  // Get dynamic colors based on currentTheme
  const themeColors = THEME[currentTheme];
  
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const {
    results,
    isLoading,
    error,
    totalResults,
    searchInConversation,
    searchAllConversations,
    clearResults,
    clearError,
  } = useMessageSearch();

  const handleSearch = async () => {
    if (!query.trim()) {
      clearResults();
      return;
    }

    setIsSearching(true);
    try {
      if (conversationId) {
        await searchInConversation(conversationId, query);
      } else {
        await searchAllConversations(query);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    clearResults();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const highlightText = (text: string, highlights: string[]) => {
    if (highlights.length === 0) return text;

    // Use the first highlight
    const highlight = highlights[0];
    return highlight;
  };

  return (
    <View className="flex-1">
      {/* Search Bar */}
      <View className="p-4 border-b border-border">
        <View className="flex-row items-center rounded-lg px-3 py-2 bg-muted">
          <Search size={20} color={themeColors.mutedForeground} />
          <TextInput
            className="flex-1 ml-2 text-foreground"
            placeholder={
              conversationId
                ? "Search in this conversation..."
                : "Search all messages..."
            }
            placeholderTextColor={themeColors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <X size={20} color={themeColors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Info */}
        {(isLoading || results.length > 0 || error) && (
          <View className="mt-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color={themeColors.primary} />
                  <Text className="ml-2 text-sm text-muted-foreground">
                    Searching...
                  </Text>
                </>
              ) : results.length > 0 ? (
                <Text className="text-sm text-muted-foreground">
                  {totalResults} result{totalResults !== 1 ? 's' : ''}
                </Text>
              ) : null}
            </View>

            {results.length > 0 && (
              <TouchableOpacity onPress={handleClear}>
                <Text className="text-sm text-primary">
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View className="mt-2 p-2 rounded-lg bg-destructive/10">
            <Text className="text-sm text-destructive">
              {error}
            </Text>
          </View>
        )}
      </View>

      {/* Search Results */}
      <ScrollView className="flex-1">
        {results.length === 0 && query.length > 0 && !isLoading && !error ? (
          <View className="flex-1 items-center justify-center py-12">
            <Search size={48} color={themeColors.mutedForeground} />
            <Text className="mt-4 text-lg font-medium text-foreground">
              No results found
            </Text>
            <Text className="mt-2 text-sm text-muted-foreground">
              Try different keywords
            </Text>
          </View>
        ) : (
          results.map((result, index) => (
            <TouchableOpacity
              key={`${result.message.id}-${index}`}
              onPress={() => onResultPress?.(result)}
              className="p-4 border-b border-border bg-card"
            >
              {/* Conversation Info */}
              {!conversationId && result.conversation?.other_user && (
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 rounded-full mr-2 bg-muted" />
                  <View>
                    <Text className="font-medium text-foreground">
                      {result.conversation.other_user.displayName || 'User'}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {formatDate(result.message.created_at)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Message Content */}
              <View className="flex-row">
                <View className={`w-8 h-8 rounded-full mr-3 items-center justify-center ${
                  result.message.sender_id === result.conversation?.other_user?.id
                    ? 'bg-primary/20'
                    : 'bg-muted'
                }`}>
                  {result.message.sender_id === result.conversation?.other_user?.id ? (
                    <User size={16} color={themeColors.primary} />
                  ) : (
                    <MessageSquare size={16} color={themeColors.mutedForeground} />
                  )}
                </View>

                <View className="flex-1">
                  {/* Sender Info */}
                  <View className="flex-row items-center mb-1">
                    <Text className="font-medium text-foreground">
                      {result.message.sender_id === result.conversation?.other_user?.id
                        ? result.conversation?.other_user?.displayName || 'User'
                        : 'You'}
                    </Text>
                    <Text className="text-xs ml-2 text-muted-foreground">
                      {formatDate(result.message.created_at)}
                    </Text>
                  </View>

                  {/* Message Preview */}
                  <Text className="text-foreground">
                    {highlightText(result.message.content, result.highlights)}
                  </Text>

                  {/* Message Type Indicator */}
                  {result.message.message_type !== 'text' && (
                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs text-muted-foreground">
                        {result.message.message_type === 'image' && '📷 Image'}
                        {result.message.message_type === 'voice' && '🎤 Voice message'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Search Tips */}
      {results.length === 0 && query.length === 0 && (
        <View className="p-4 border-t border-border">
          <Text className="font-medium mb-2 text-foreground">
            Search Tips
          </Text>
          <View className="space-y-1">
            <Text className="text-sm text-muted-foreground">
              • Search by keywords or phrases
            </Text>
            <Text className="text-sm text-muted-foreground">
              • Use quotes for exact matches
            </Text>
            <Text className="text-sm text-muted-foreground">
              • Search across all conversations
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}