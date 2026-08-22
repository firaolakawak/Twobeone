import { Hono } from 'npm:hono@4.6.14';
import * as kv from './kv_store.tsx';

const pushRoutes = new Hono();

// VAPID keys (these should match the public key in pwa.ts)
// Generated using: npx web-push generate-vapid-keys
function getVapidKeys() {
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!publicKey || !privateKey) throw new Error('VAPID secrets are not configured');
  return { publicKey, privateKey };
}

type PushNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
};

async function sendPushPayload(recipientId: string, payload: PushNotificationPayload) {
  const subscription = await kv.get(`push_subscription:${recipientId}`);

  if (!subscription) {
    return { sent: false, reason: 'no-subscription' };
  }

  try {
    const webpush = await import('npm:web-push@3.6.7');

    const vapid = getVapidKeys();
    webpush.setVapidDetails(
      'mailto:support@twobeone.app',
      vapid.publicKey,
      vapid.privateKey
    );

    const message = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      data: payload.data || {},
      url: payload.url || '/',
      tag: payload.tag
    });

    await webpush.sendNotification(subscription, message);
    return { sent: true };
  } catch (pushError: any) {
    if (pushError.statusCode === 410 || pushError.statusCode === 404) {
      await kv.del(`push_subscription:${recipientId}`);
    }
    throw pushError;
  }
}

export async function sendWebPushToUser(recipientId: string, payload: PushNotificationPayload) {
  return sendPushPayload(recipientId, payload);
}

export async function sendWebPushToPartner(userId: string, payload: PushNotificationPayload) {
  const userProfile = await kv.get(`profile:${userId}`);
  if (!userProfile?.partnerId) {
    return { sent: false, reason: 'no-partner' };
  }

  return sendPushPayload(userProfile.partnerId, payload);
}

// Helper function to get user ID from auth header
async function getUserFromToken(authHeader: string | null, supabase: any): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch (err) {
    console.error('[Push] Error getting user from token:', err);
    return null;
  }
}

// Save push subscription
pushRoutes.post('/push-subscription', async (c) => {
  try {
    const supabase = c.get('supabase');
    const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { subscription } = await c.req.json();
    
    if (!subscription) {
      return c.json({ error: 'Missing subscription data' }, 400);
    }

    // Store subscription in KV store
    await kv.set(`push_subscription:${userId}`, subscription);
    
    console.log('[Push] Subscription saved for user:', userId);
    
    return c.json({ 
      success: true,
      message: 'Push subscription saved successfully' 
    });
  } catch (error) {
    console.error('[Push] Error saving subscription:', error);
    return c.json({ error: 'Failed to save subscription' }, 500);
  }
});

// Get push subscription
pushRoutes.get('/push-subscription', async (c) => {
  try {
    const supabase = c.get('supabase');
    const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const subscription = await kv.get(`push_subscription:${userId}`);
    
    return c.json({ subscription });
  } catch (error) {
    console.error('[Push] Error getting subscription:', error);
    return c.json({ error: 'Failed to get subscription' }, 500);
  }
});

// Delete push subscription
pushRoutes.delete('/push-subscription', async (c) => {
  try {
    const supabase = c.get('supabase');
    const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await kv.del(`push_subscription:${userId}`);
    
    console.log('[Push] Subscription deleted for user:', userId);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[Push] Error deleting subscription:', error);
    return c.json({ error: 'Failed to delete subscription' }, 500);
  }
});

// Send push notification to a user
pushRoutes.post('/send-push', async (c) => {
  try {
    const supabase = c.get('supabase');
    const senderId = await getUserFromToken(c.req.header('Authorization'), supabase);
    
    if (!senderId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { recipientId, title, body, data, icon } = await c.req.json();
    
    if (!recipientId || !title || !body) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    try {
      const result = await sendWebPushToUser(recipientId, {
        title,
        body,
        icon,
        data: data || {},
        url: data?.url || '/'
      });

      if (!result.sent) {
        console.log('[Push] No subscription found for recipient:', recipientId);
        return c.json({
          success: false,
          message: 'Recipient has not enabled push notifications'
        });
      }

      console.log('[Push] Notification sent successfully to:', recipientId);
      return c.json({ success: true });
    } catch (pushError: any) {
      console.error('[Push] Error sending notification:', pushError);
      return c.json({
        success: false,
        error: 'Failed to send push notification'
      }, 500);
    }
  } catch (error) {
    console.error('[Push] Error in send-push:', error);
    return c.json({ error: 'Failed to send push notification' }, 500);
  }
});

// Send push notification to partner
pushRoutes.post('/send-push-to-partner', async (c) => {
  try {
    const supabase = c.get('supabase');
    const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, body, data } = await c.req.json();
    
    if (!title || !body) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get user's profile to find partner
    const userProfile = await kv.get(`profile:${userId}`);
    
    if (!userProfile || !userProfile.partnerId) {
      return c.json({ 
        success: false, 
        message: 'No partner connected' 
      });
    }

    const partnerId = userProfile.partnerId;

    try {
      const result = await sendWebPushToPartner(userId, {
        title,
        body,
        data: data || {},
        url: data?.url || '/',
        tag: data?.tag || 'partner-notification'
      });

      if (!result.sent) {
        console.log('[Push] Partner has not enabled push notifications:', partnerId);
        return c.json({
          success: false,
          message: 'Partner has not enabled push notifications'
        });
      }

      console.log('[Push] Notification sent to partner:', partnerId);
      return c.json({ success: true });
    } catch (pushError: any) {
      console.error('[Push] Error sending notification to partner:', pushError);
      return c.json({
        success: false,
        error: 'Failed to send push notification to partner'
      }, 500);
    }
  } catch (error) {
    console.error('[Push] Error in send-push-to-partner:', error);
    return c.json({ error: 'Failed to send push notification' }, 500);
  }
});

export default pushRoutes;
