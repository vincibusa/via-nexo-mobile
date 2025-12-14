import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { API_CONFIG } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PushTokenRegistration {
  push_token: string;
  platform: 'ios' | 'android';
}

export interface NotificationSoundSettings {
  enabled: boolean;
  soundUri?: string;
  vibrationEnabled: boolean;
  messageNotifications: boolean;
  socialNotifications: boolean;
  eventNotifications: boolean;
}

class NotificationsService {
  /**
   * Request push notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get push notification token
   */
  async getPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        console.log('Push notification permission not granted');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '1f2e3e08-9638-4dc8-94f0-6c5929bd3bd5', // From app.json
      });

      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  async registerPushToken(accessToken: string): Promise<boolean> {
    try {
      const pushToken = await this.getPushToken();
      
      if (!pushToken) {
        console.log('No push token available');
        return false;
      }

      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS_REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          push_token: pushToken,
          platform,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as any;
        console.error('Error registering push token:', error);
        return false;
      }

      console.log('Push token registered successfully');
      return true;
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  /**
   * Configure notification handling
   */
  configureNotifications() {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Listen for incoming notifications
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for notification responses (user taps notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }

  /**
   * Handle notification response (user taps notification)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data;

    console.log('Handling notification response:', {
      actionIdentifier,
      data,
    });

    // Handle different notification types
    if (data?.type === 'new_event') {
      // Navigate to event details
      if (data.entity_id && data.entity_type === 'event') {
        this.navigateToDeepLink(`/(app)/event/${data.entity_id}`);
      }
    } else if (data?.type === 'favorite_event_reminder') {
      // Navigate to favorite event
      if (data.entity_id && data.entity_type === 'event') {
        this.navigateToDeepLink(`/(app)/event/${data.entity_id}`);
      }
    } else if (data?.type === 'manager_approved') {
      // Navigate to manager dashboard or place
      if (data.entity_id && data.entity_type === 'place') {
        this.navigateToDeepLink(`/(app)/place/${data.entity_id}`);
      }
    } else if (data?.type === 'new_follower') {
      // Navigate to follower profile
      if (data.user_id) {
        this.navigateToDeepLink(`/(app)/profile/${data.user_id}`);
      }
    } else if (data?.type === 'message' || data?.type === 'new_message') {
      // Navigate to conversation
      const conversationId = data.conversationId || data.conversation_id;
      if (conversationId) {
        this.navigateToDeepLink(`/(app)/conversation/${conversationId}`);
      }
    } else if (data?.type === 'story_view' || data?.type === 'story_reaction') {
      // Navigate to profile or story
      if (data.user_id) {
        this.navigateToDeepLink(`/(app)/profile/${data.user_id}`);
      }
    }

    // Handle generic deep links
    if (data?.deep_link) {
      this.navigateToDeepLink(data.deep_link);
    }
  }

  /**
   * Navigate using deep link (to be called by navigation handler)
   */
  private navigateToDeepLink(path: string) {
    // Store the deep link path for the auth context to handle
    // The auth context should check this path and navigate appropriately
    AsyncStorage.setItem('pending_notification_path', path).catch(err => {
      console.error('Error storing notification path:', err);
    });
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: {
        seconds: 5, // Show after 5 seconds
      } as any, // Type workaround for Expo Notifications
    });
  }

  /**
   * Get notification permissions status
   */
  async getPermissionsStatus(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const status = await this.getPermissionsStatus();
    return status === 'granted';
  }

  /**
   * Load notification sound settings from storage
   */
  async loadSoundSettings(): Promise<NotificationSoundSettings> {
    try {
      const stored = await AsyncStorage.getItem('notification_sound_settings');
      if (stored) {
        return JSON.parse(stored);
      }
      return this.getDefaultSoundSettings();
    } catch (error) {
      console.error('Error loading sound settings:', error);
      return this.getDefaultSoundSettings();
    }
  }

  /**
   * Save notification sound settings
   */
  async saveSoundSettings(settings: NotificationSoundSettings): Promise<boolean> {
    try {
      await AsyncStorage.setItem('notification_sound_settings', JSON.stringify(settings));

      // Update notification handler based on settings
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: settings.enabled,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      return true;
    } catch (error) {
      console.error('Error saving sound settings:', error);
      return false;
    }
  }

  /**
   * Get default sound settings
   */
  private getDefaultSoundSettings(): NotificationSoundSettings {
    return {
      enabled: true,
      vibrationEnabled: true,
      messageNotifications: true,
      socialNotifications: true,
      eventNotifications: true,
    };
  }

  /**
   * Toggle notification sound
   */
  async toggleNotificationSound(enabled: boolean): Promise<boolean> {
    const settings = await this.loadSoundSettings();
    settings.enabled = enabled;
    return this.saveSoundSettings(settings);
  }

  /**
   * Toggle vibration
   */
  async toggleVibration(enabled: boolean): Promise<boolean> {
    const settings = await this.loadSoundSettings();
    settings.vibrationEnabled = enabled;
    return this.saveSoundSettings(settings);
  }

  /**
   * Toggle category-specific notifications
   */
  async toggleNotificationCategory(category: 'messageNotifications' | 'socialNotifications' | 'eventNotifications', enabled: boolean): Promise<boolean> {
    const settings = await this.loadSoundSettings();
    settings[category] = enabled;
    return this.saveSoundSettings(settings);
  }
}

export const notificationsService = new NotificationsService();