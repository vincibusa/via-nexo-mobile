import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationsService } from '../services/notifications';
import { useAuth } from '../contexts/auth';
import { useSettings } from '../contexts/settings';

export interface PushNotificationsState {
  hasPermission: boolean;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const { session } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  const [state, setState] = useState<PushNotificationsState>({
    hasPermission: false,
    isRegistered: false,
    isLoading: false,
    error: null,
  });

  // Check permissions and register token on mount
  useEffect(() => {
    initializeNotifications();
  }, [session, settings?.push_enabled]);

  const initializeNotifications = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if push notifications are enabled in settings
      if (!settings?.push_enabled) {
        setState(prev => ({ 
          ...prev, 
          hasPermission: false, 
          isRegistered: false, 
          isLoading: false 
        }));
        return;
      }

      // Check permissions
      const hasPermission = await notificationsService.areNotificationsEnabled();
      
      if (!hasPermission) {
        setState(prev => ({ 
          ...prev, 
          hasPermission: false, 
          isRegistered: false, 
          isLoading: false 
        }));
        return;
      }

      setState(prev => ({ ...prev, hasPermission: true }));

      // Register push token if user is authenticated
      if (session?.accessToken) {
        const isRegistered = await notificationsService.registerPushToken(session.accessToken);
        setState(prev => ({ ...prev, isRegistered, isLoading: false }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize notifications', 
        isLoading: false 
      }));
    }
  };

  // Request permissions and enable notifications
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Request permissions
      const hasPermission = await notificationsService.requestPermissions();
      
      if (!hasPermission) {
        setState(prev => ({ 
          ...prev, 
          hasPermission: false, 
          isLoading: false,
          error: 'Notification permissions denied'
        }));
        return false;
      }

      setState(prev => ({ ...prev, hasPermission: true }));

      // Update settings to enable push
      if (session?.accessToken) {
        await updateSettings({ push_enabled: true });
        
        // Register push token
        const isRegistered = await notificationsService.registerPushToken(session.accessToken);
        setState(prev => ({ ...prev, isRegistered, isLoading: false }));
        return isRegistered;
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return true;
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to enable notifications', 
        isLoading: false 
      }));
      return false;
    }
  }, [session, updateSettings]);

  // Disable notifications
  const disableNotifications = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Update settings to disable push
      if (session?.accessToken) {
        await updateSettings({ push_enabled: false });
      }

      setState(prev => ({ 
        ...prev, 
        isRegistered: false, 
        isLoading: false 
      }));
      return true;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to disable notifications', 
        isLoading: false 
      }));
      return false;
    }
  }, [session, updateSettings]);

  // Toggle notifications
  const toggleNotifications = useCallback(async (): Promise<boolean> => {
    if (state.hasPermission && settings?.push_enabled) {
      return await disableNotifications();
    } else {
      return await enableNotifications();
    }
  }, [state.hasPermission, settings?.push_enabled, enableNotifications, disableNotifications]);

  // Refresh state
  const refresh = useCallback(async () => {
    await initializeNotifications();
  }, []);

  return {
    ...state,
    enableNotifications,
    disableNotifications,
    toggleNotifications,
    refresh,
  };
}