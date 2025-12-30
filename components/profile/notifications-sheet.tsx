import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Bell, Check, Trash2, User, Heart, MessageCircle, Calendar, Users, X } from 'lucide-react-native';
import { Text } from '../ui/text';
import { useAuth } from '../../lib/contexts/auth';
import { API_CONFIG } from '../../lib/config';
import { useRouter } from 'expo-router';
import { THEME } from '../../lib/theme';
import { useSettings } from '../../lib/contexts/settings';
import { useColorScheme } from 'nativewind';

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

interface NotificationsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsSheet({ isOpen, onClose }: NotificationsSheetProps) {
  const { session } = useAuth();
  const router = useRouter();
  const { settings } = useSettings();
  const { colorScheme } = useColorScheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const snapPoints = useMemo(() => ['60%', '90%'], []);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
      fetchNotifications();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

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
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

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
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

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
          onClose();
        }
        break;

      case 'story_view':
      case 'story_created':
      case 'new_story':
      case 'story_engagement':
        if (notification.entity_id && notification.entity_type === 'story') {
          Alert.alert('Storia', 'Apri la storia per vedere i dettagli');
        }
        break;

      case 'daily_digest':
        Alert.alert(
          'Daily Digest',
          notification.content || 'Attività dei tuoi amici nelle ultime 24 ore',
          [{ text: 'OK' }]
        );
        break;

      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_follower':
        return <User size={20} color={themeColors.primary} />;

      case 'post_like':
      case 'comment_like':
        return <Heart size={20} color={themeColors.destructive} />;

      case 'post_comment':
        return <MessageCircle size={20} color={themeColors.primary} />;

      case 'message':
        return <MessageCircle size={20} color={themeColors.accent} />;

      case 'event_reminder':
      case 'friend_going_to_event':
        return <Calendar size={20} color={themeColors.primary} />;

      case 'story_view':
      case 'story_created':
      case 'new_story':
      case 'story_engagement':
        return <Users size={20} color={themeColors.accent} />;

      case 'daily_digest':
        return <Bell size={20} color={themeColors.primary} />;

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

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
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
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
          <View className="px-4 pt-2 pb-4 border-b border-border">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">
                  Notifiche
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  {unreadCount > 0 ? `${unreadCount} non lette` : 'Tutte lette'} • {totalCount} totali
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} hitSlop={10} className="ml-4">
                <X size={24} color={themeColors.foreground} />
              </TouchableOpacity>
            </View>

            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                className="mt-3 px-3 py-1.5 bg-primary rounded-lg self-start"
              >
                <Text className="text-primary-foreground text-sm font-medium">
                  Segna tutte come lette
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View className="flex-1 py-8 items-center justify-center">
              <ActivityIndicator size="large" color={themeColors.foreground} />
            </View>
          ) : notifications.length === 0 ? (
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
            <BottomSheetFlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </SafeAreaView>
      </BottomSheetView>
    </BottomSheet>
  );
}







