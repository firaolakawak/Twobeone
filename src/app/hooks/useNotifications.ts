import { useRef, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import api from '../utils/api';

/**
 * Custom hook for notification polling and toast display
 * Optimized to avoid unnecessary re-renders
 */
export function useNotifications() {
  const lastNotificationCheckRef = useRef(new Date().toISOString());

  const checkForNewNotifications = useCallback(async () => {
    try {
      const { notifications } = await api.notifications.list();
      
      // Find new unread notifications since last check
      const newNotifications = notifications.filter((n: any) => 
        !n.read && 
        new Date(n.createdAt) > new Date(lastNotificationCheckRef.current)
      );

      // Show toast for each new notification
      newNotifications.forEach((notification: any) => {
        if (notification.type === 'verse_shared') {
          toast.success(
            `${notification.data?.sharedBy || 'Your partner'} shared a verse with you!`,
            {
              description: notification.data?.reference,
              duration: 5000
            }
          );
        } else if (notification.type === 'profile_update' && notification.data?.relationshipStart) {
          const date = new Date(notification.data.relationshipStart).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          });
          toast.success(
            '💕 Relationship Date Set!',
            {
              description: `Your partner set your relationship start date to ${date}`,
              duration: 6000
            }
          );
        } else if (notification.type === 'mood_report') {
          toast.success(
            notification.title,
            {
              description: `${notification.data?.period || 'Your weekly mood report is ready!'}`,
              duration: 8000
            }
          );
        } else {
          toast.info(notification.title, {
            description: notification.message.substring(0, 100),
            duration: 4000
          });
        }
      });

      // Update last check time
      if (newNotifications.length > 0) {
        lastNotificationCheckRef.current = new Date().toISOString();
      }
    } catch (err: any) {
      // Only log actual errors, not auth/network issues
      if (err.message !== 'Failed to fetch' && err.message !== 'Unauthorized') {
        console.error('[Notifications] Failed to check:', err);
      }
    }
  }, []);

  return { checkForNewNotifications };
}
