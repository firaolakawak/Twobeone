import { requestNotificationPermission } from './pwa';

interface SendNotificationParams {
  recipientId: string;
  type: 'devotional' | 'journal' | 'prayer' | 'question' | 'question_answered' | 'partner_link' | 'general';
  title: string;
  message: string;
  data?: any;
  accessToken: string;
  projectId: string;
  sendPush?: boolean;
}

export async function sendNotification({
  recipientId,
  type,
  title,
  message,
  data,
  accessToken,
  projectId,
  sendPush = true
}: SendNotificationParams): Promise<boolean> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/notifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          type,
          title,
          message,
          data
        })
      }
    );

    if (!response.ok) {
      console.error('Failed to send notification:', response.status, await response.text());
      return false;
    }

    if (sendPush) {
      try {
        const pushPayload = {
          recipientId,
          title,
          body: message,
          data: {
            type,
            url: data?.url || '/',
            ...data,
          },
          icon: data?.icon || '/icons/icon-192x192.png',
        };

        const pushResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/send-push`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(pushPayload)
          }
        );

        if (!pushResponse.ok) {
          const pushError = await pushResponse.text();
          console.warn('[Notifications] Push delivery failed:', pushError);
        }
      } catch (pushError) {
        console.warn('[Notifications] Push delivery error:', pushError);
      }
    }

    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body: message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            requireInteraction: true,
            renotify: true,
            data: {
              type,
              url: data?.url || '/',
              ...data,
            },
            tag: `twobeone-${type}`
          });
        }
      } catch (localNotificationError) {
        console.warn('[Notifications] Local notification failed:', localNotificationError);
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}