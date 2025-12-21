import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationsService } from './notifications';

export interface BatchedNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
  category: 'message' | 'social' | 'event' | 'system';
}

export interface NotificationBatch {
  notifications: BatchedNotification[];
  lastBatchTime: number;
  batchId: string;
}

export interface BatchingConfig {
  enabled: boolean;
  batchInterval: number; // milliseconds
  maxNotificationsPerBatch: number;
  highPriorityThreshold: number; // milliseconds before high priority notifications are sent immediately
  categories: {
    message: boolean;
    social: boolean;
    event: boolean;
    system: boolean;
  };
}

class NotificationBatchingService {
  private static readonly STORAGE_KEY = 'notification_batch_queue';
  private static readonly BATCH_CONFIG_KEY = 'notification_batching_config';
  private static readonly DEFAULT_CONFIG: BatchingConfig = {
    enabled: true,
    batchInterval: 30000, // 30 seconds
    maxNotificationsPerBatch: 5,
    highPriorityThreshold: 5000, // 5 seconds
    categories: {
      message: true,
      social: true,
      event: true,
      system: true,
    },
  };

  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  /**
   * Initialize notification batching
   */
  async initialize(): Promise<void> {
    const config = await this.getConfig();
    if (config.enabled) {
      this.startBatchTimer();
    }
  }

  /**
   * Queue a notification for batching
   */
  async queueNotification(
    title: string,
    body: string,
    data: any,
    options: {
      type?: string;
      priority?: 'high' | 'normal' | 'low';
      category?: 'message' | 'social' | 'event' | 'system';
    } = {}
  ): Promise<void> {
    const config = await this.getConfig();

    // Check if batching is enabled for this category
    const category = options.category || 'system';
    if (!config.categories[category]) {
      // Send immediately if category is disabled for batching
      await this.sendImmediateNotification(title, body, data);
      return;
    }

    // Check if high priority notification should be sent immediately
    const priority = options.priority || 'normal';
    if (priority === 'high') {
      await this.sendImmediateNotification(title, body, data);
      return;
    }

    // Queue the notification
    const notification: BatchedNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: options.type || 'generic',
      title,
      body,
      data,
      timestamp: Date.now(),
      priority,
      category,
    };

    await this.addToQueue(notification);

    // Check if we should send a batch now
    const queue = await this.getQueue();
    if (queue.length >= config.maxNotificationsPerBatch) {
      await this.processBatch();
    }
  }

  /**
   * Send an immediate notification (bypass batching)
   */
  private async sendImmediateNotification(title: string, body: string, data: any): Promise<void> {
    try {
      await notificationsService.scheduleLocalNotification(title, body, data);
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  /**
   * Add notification to queue
   */
  private async addToQueue(notification: BatchedNotification): Promise<void> {
    try {
      const queue = await this.getQueue();
      queue.push(notification);
      await AsyncStorage.setItem(
        NotificationBatchingService.STORAGE_KEY,
        JSON.stringify(queue)
      );
    } catch (error) {
      console.error('Error adding notification to queue:', error);
    }
  }

  /**
   * Get current notification queue
   */
  private async getQueue(): Promise<BatchedNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(NotificationBatchingService.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting notification queue:', error);
      return [];
    }
  }

  /**
   * Process and send a batch of notifications
   */
  async processBatch(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Sort by priority and timestamp
      queue.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.timestamp - b.timestamp;
      });

      // Group by category
      const groupedByCategory = this.groupNotificationsByCategory(queue);

      // Send batched notifications for each category
      for (const [category, notifications] of Object.entries(groupedByCategory)) {
        if (notifications.length > 0) {
          await this.sendBatchedNotification(category as any, notifications);
        }
      }

      // Clear the queue
      await AsyncStorage.removeItem(NotificationBatchingService.STORAGE_KEY);
    } catch (error) {
      console.error('Error processing notification batch:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Group notifications by category
   */
  private groupNotificationsByCategory(
    notifications: BatchedNotification[]
  ): Record<string, BatchedNotification[]> {
    const grouped: Record<string, BatchedNotification[]> = {
      message: [],
      social: [],
      event: [],
      system: [],
    };

    for (const notification of notifications) {
      if (grouped[notification.category]) {
        grouped[notification.category].push(notification);
      } else {
        grouped.system.push(notification);
      }
    }

    return grouped;
  }

  /**
   * Send a batched notification for a specific category
   */
  private async sendBatchedNotification(
    category: 'message' | 'social' | 'event' | 'system',
    notifications: BatchedNotification[]
  ): Promise<void> {
    if (notifications.length === 0) return;

    // Create a summary notification
    const summary = this.createSummaryNotification(category, notifications);

    try {
      await notificationsService.scheduleLocalNotification(
        summary.title,
        summary.body,
        {
          ...summary.data,
          is_batch: true,
          notification_count: notifications.length,
          original_notifications: notifications.map(n => ({
            id: n.id,
            type: n.type,
            data: n.data,
          })),
        }
      );
    } catch (error) {
      console.error('Error sending batched notification:', error);
    }
  }

  /**
   * Create a summary notification for a batch
   */
  private createSummaryNotification(
    category: 'message' | 'social' | 'event' | 'system',
    notifications: BatchedNotification[]
  ): { title: string; body: string; data: any } {
    const count = notifications.length;

    switch (category) {
      case 'message':
        return {
          title: 'Nuovi messaggi',
          body: count === 1
            ? `Hai un nuovo messaggio da ${notifications[0].data?.sender_name || 'qualcuno'}`
            : `Hai ${count} nuovi messaggi`,
          data: {
            type: 'message_batch',
            category: 'message',
            notification_count: count,
            conversation_ids: notifications
              .map(n => n.data?.conversation_id)
              .filter(Boolean),
          },
        };

      case 'social':
        const socialTypes = notifications.map(n => n.type);
        const hasNewFollower = socialTypes.includes('new_follower');
        const hasLike = socialTypes.includes('post_like');
        const hasComment = socialTypes.includes('post_comment');

        let body = '';
        if (hasNewFollower && hasLike && hasComment) {
          body = `Nuovi follower, like e commenti (${count} attività)`;
        } else if (hasNewFollower && hasLike) {
          body = `Nuovi follower e like (${count} attività)`;
        } else if (hasNewFollower) {
          body = count === 1
            ? 'Hai un nuovo follower'
            : `Hai ${count} nuovi follower`;
        } else if (hasLike) {
          body = count === 1
            ? 'Hai un nuovo like'
            : `Hai ${count} nuovi like`;
        } else if (hasComment) {
          body = count === 1
            ? 'Hai un nuovo commento'
            : `Hai ${count} nuovi commenti`;
        } else {
          body = `Hai ${count} nuove attività social`;
        }

        return {
          title: 'Attività social',
          body,
          data: {
            type: 'social_batch',
            category: 'social',
            notification_count: count,
            activity_types: socialTypes,
          },
        };

      case 'event':
        return {
          title: 'Eventi',
          body: count === 1
            ? `Nuovo evento: ${notifications[0].title}`
            : `Hai ${count} nuovi eventi`,
          data: {
            type: 'event_batch',
            category: 'event',
            notification_count: count,
            event_ids: notifications
              .map(n => n.data?.event_id)
              .filter(Boolean),
          },
        };

      default: // system
        return {
          title: 'Aggiornamenti',
          body: `Hai ${count} nuovi aggiornamenti`,
          data: {
            type: 'system_batch',
            category: 'system',
            notification_count: count,
          },
        };
    }
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(async () => {
      const queue = await this.getQueue();
      if (queue.length > 0) {
        await this.processBatch();
      }
    }, NotificationBatchingService.DEFAULT_CONFIG.batchInterval);
  }

  /**
   * Stop batch timer
   */
  stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Get batching configuration
   */
  async getConfig(): Promise<BatchingConfig> {
    try {
      const stored = await AsyncStorage.getItem(NotificationBatchingService.BATCH_CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return NotificationBatchingService.DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error getting batching config:', error);
      return NotificationBatchingService.DEFAULT_CONFIG;
    }
  }

  /**
   * Update batching configuration
   */
  async updateConfig(config: Partial<BatchingConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...config };

      await AsyncStorage.setItem(
        NotificationBatchingService.BATCH_CONFIG_KEY,
        JSON.stringify(newConfig)
      );

      // Restart timer if enabled state changed
      if (config.enabled !== undefined) {
        if (config.enabled) {
          this.startBatchTimer();
        } else {
          this.stopBatchTimer();
          // Process any pending notifications immediately
          await this.processBatch();
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating batching config:', error);
      return false;
    }
  }

  /**
   * Clear all queued notifications
   */
  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NotificationBatchingService.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing notification queue:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  }> {
    const queue = await this.getQueue();

    const byCategory: Record<string, number> = {};
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    for (const notification of queue) {
      byCategory[notification.category] = (byCategory[notification.category] || 0) + 1;

      if (!oldestTimestamp || notification.timestamp < oldestTimestamp) {
        oldestTimestamp = notification.timestamp;
      }
      if (!newestTimestamp || notification.timestamp > newestTimestamp) {
        newestTimestamp = notification.timestamp;
      }
    }

    return {
      total: queue.length,
      byCategory,
      oldestTimestamp,
      newestTimestamp,
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopBatchTimer();
  }
}

export const notificationBatchingService = new NotificationBatchingService();