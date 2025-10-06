import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { API_CONFIG } from '../config';

export interface PushTokenRegistration {
  push_token: string;
  platform: 'ios' | 'android';
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
        // TODO: Navigate to event screen
        console.log('Navigate to event:', data.entity_id);
      }
    } else if (data?.type === 'favorite_event_reminder') {
      // Navigate to favorite event
      if (data.entity_id && data.entity_type === 'event') {
        // TODO: Navigate to event screen
        console.log('Navigate to favorite event:', data.entity_id);
      }
    } else if (data?.type === 'manager_approved') {
      // Navigate to manager dashboard or place
      if (data.entity_id && data.entity_type === 'place') {
        // TODO: Navigate to place screen
        console.log('Navigate to approved place:', data.entity_id);
      }
    }

    // Handle deep links
    if (data?.deep_link) {
      // TODO: Handle deep linking
      console.log('Deep link:', data.deep_link);
    }
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
}

export const notificationsService = new NotificationsService();