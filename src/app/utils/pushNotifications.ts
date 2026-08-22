import { projectId } from './supabase/info';

interface SendPushNotificationParams {
  recipientId: string;
  title: string;
  body: string;
  data?: any;
  icon?: string;
  accessToken: string;
}

interface SendPushToPartnerParams {
  title: string;
  body: string;
  data?: any;
  accessToken: string;
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushNotification({
  recipientId,
  title,
  body,
  data,
  icon,
  accessToken
}: SendPushNotificationParams): Promise<boolean> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/send-push`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          title,
          body,
          data,
          icon
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[PushNotification] Failed to send:', error);
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('[PushNotification] Error sending notification:', error);
    return false;
  }
}

/**
 * Send a push notification to the user's partner
 */
export async function sendPushToPartner({
  title,
  body,
  data,
  accessToken
}: SendPushToPartnerParams): Promise<boolean> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/send-push-to-partner`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body,
          data
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[PushNotification] Failed to send to partner:', error);
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('[PushNotification] Error sending notification to partner:', error);
    return false;
  }
}

/**
 * Check if push notifications are enabled
 */
export function arePushNotificationsEnabled(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  
  return Notification.permission === 'granted';
}

/**
 * Get push subscription status
 */
export async function getPushSubscriptionStatus(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}> {
  const supported = 'Notification' in window && 'serviceWorker' in navigator;
  
  if (!supported) {
    return {
      supported: false,
      permission: 'denied',
      subscribed: false
    };
  }

  const permission = Notification.permission;
  let subscribed = false;

  if (permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      subscribed = !!subscription;
    } catch (error) {
      console.error('[PushNotification] Error checking subscription:', error);
    }
  }

  return {
    supported,
    permission,
    subscribed
  };
}

/**
 * Predefined notification templates for common events
 */
export const NotificationTemplates = {
  verseShared: (partnerName: string, reference: string) => ({
    title: `${partnerName} shared a verse`,
    body: `"${reference}" - Tap to read`,
    data: { type: 'verse_shared', reference }
  }),
  
  prayerRequest: (partnerName: string) => ({
    title: `${partnerName} needs prayer`,
    body: 'Your partner shared a new prayer request',
    data: { type: 'prayer_request', url: '/?tab=prayers' }
  }),
  
  devotionalComplete: (partnerName: string) => ({
    title: `${partnerName} completed today's devotional`,
    body: 'You can now discuss it together!',
    data: { type: 'devotional_complete', url: '/?tab=devotionals' }
  }),
  
  journalEntry: (partnerName: string) => ({
    title: `${partnerName} shared a journal entry`,
    body: 'See what's on their heart',
    data: { type: 'journal_entry', url: '/?tab=journal' }
  }),
  
  questionAnswered: (partnerName: string) => ({
    title: `${partnerName} answered a question`,
    body: 'Learn something new about your partner',
    data: { type: 'question_answered', url: '/?tab=questions' }
  }),
  
  milestone: (milestoneName: string) => ({
    title: '🎉 Milestone Achieved!',
    body: `You both reached: ${milestoneName}`,
    data: { type: 'milestone', url: '/?tab=progress' }
  }),
  
  dailyReminder: () => ({
    title: '📖 Daily Devotional Available',
    body: 'Start your day with God\'s Word together',
    data: { type: 'daily_reminder', url: '/?tab=devotionals' }
  }),
  
  encouragement: (partnerName: string) => ({
    title: `💕 ${partnerName} sent you encouragement`,
    body: 'Open the app to see their message',
    data: { type: 'encouragement', url: '/' }
  })
};
