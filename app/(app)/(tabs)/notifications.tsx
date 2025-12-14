import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Check, Trash2, User, Heart, MessageCircle, Calendar, Users } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { useAuth } from '../../../lib/contexts/auth';
import { API_CONFIG } from '../../../lib/config';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../../lib/theme';
import { useSettings } from '../../../lib/contexts/settings';

interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  type: string;
  entity_type?: string;
  entity_id?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  actor?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
}

export default function NotificationsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  const fetchNotifications = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/notifications?limit=50&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = (await response.json()) as { notifications?: Notification[]; unreadCount?: number; total?: number };
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Errore', 'Impossibile caricare le notifiche');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/notifications/read-all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setTotalCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read on press
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'new_follower':
        if (notification.actor_id) {
          router.push(`/(app)/profile/${notification.actor_id}` as any);
        }
        break;

      case 'post_like':
      case 'post_comment':
      case 'comment_like':
        if (notification.entity_id && notification.entity_type === 'post') {
          router.push(`/(app)/post/${notification.entity_id}` as any);
        }
        break;

      case 'message':
        if (notification.entity_id && notification.entity_type === 'conversation') {
          router.push(`/(app)/chat-detail?conversationId=${notification.entity_id}`);
        }
        break;

      case 'event_reminder':
      case 'friend_going_to_event':
        if (notification.entity_id && notification.entity_type === 'event') {
          router.push(`/(app)/event/${notification.entity_id}` as any);
        }
        break;

      case 'story_view':
      case 'story_created':
      case 'new_story':
      case 'story_engagement':
        if (notification.entity_id && notification.entity_type === 'story') {
          // Navigate to story viewer
          Alert.alert('Storia', 'Apri la storia per vedere i dettagli');
        }
        break;

      case 'daily_digest':
        // Show daily digest modal
        Alert.alert(
          'Daily Digest',
          notification.content || 'Attività dei tuoi amici nelle ultime 24 ore',
          [{ text: 'OK' }]
        );
        break;

      default:
        // Generic notification - just mark as read
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_follower':
        return <User size={20} color={themeColors.primary} />;

      case 'post_like':
      case 'comment_like':
        return <Heart size={20} color="#ef4444" />;

      case 'post_comment':
        return <MessageCircle size={20} color="#22c55e" />;

      case 'message':
        return <MessageCircle size={20} color="#a855f7" />;

      case 'event_reminder':
      case 'friend_going_to_event':
        return <Calendar size={20} color="#f97316" />;

      case 'story_view':
      case 'story_created':
      case 'new_story':
      case 'story_engagement':
        return <Users size={20} color="#ec4899" />;

      case 'daily_digest':
        return <Bell size={20} color="#eab308" />;

      default:
        return <Bell size={20} color={themeColors.mutedForeground} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;

    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
    });
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      className={`p-4 border-b border-border ${
        !item.is_read ? 'bg-muted/30' : ''
      }`}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        <View className="mr-3 mt-1">
          {getNotificationIcon(item.type)}
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-sm font-medium text-foreground flex-1 mr-2">
              {item.content || 'Nuova notifica'}
            </Text>

            <View className="flex-row space-x-2">
              {!item.is_read && (
                <TouchableOpacity
                  onPress={() => markAsRead(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Check size={16} color={themeColors.mutedForeground} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => deleteNotification(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={16} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {item.actor && (
            <Text className="text-xs text-muted-foreground mb-1">
              Da: {item.actor.display_name}
            </Text>
          )}

          <Text className="text-xs text-muted-foreground">
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.foreground} />
          <Text className="mt-4 text-muted-foreground">
            Caricamento notifiche...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 pt-4 pb-3 border-b border-border">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-foreground">
              Notifiche
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} non lette` : 'Tutte lette'} • {totalCount} totali
            </Text>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              className="px-3 py-1.5 bg-primary rounded-lg"
            >
              <Text className="text-primary-foreground text-sm font-medium">
                Segna tutte come lette
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Bell size={64} color={themeColors.mutedForeground} />
          <Text className="text-lg font-medium text-muted-foreground mb-2">
            Nessuna notifica
          </Text>
          <Text className="text-muted-foreground text-center">
            Quando riceverai nuove notifiche, le vedrai qui
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            totalCount > notifications.length ? (
              <View className="py-4 items-center">
                <Text className="text-muted-foreground text-sm">
                  {notifications.length} di {totalCount} notifiche
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
