import { Hono } from 'npm:hono@4';
import * as kv from './kv_store.tsx';

const newsletter = new Hono();

// Subscribe to newsletter
newsletter.post('/subscribe', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email || !email.includes('@')) {
      return c.json({ error: 'Valid email address required' }, 400);
    }

    // Store email in key-value store
    const key = `newsletter:${email.toLowerCase()}`;
    const existingSubscription = await kv.get(key);

    if (existingSubscription) {
      return c.json({ 
        message: 'Already subscribed',
        email 
      }, 200);
    }

    // Store subscription with timestamp
    await kv.set(key, {
      email: email.toLowerCase(),
      subscribedAt: new Date().toISOString(),
      source: 'landing_page',
      status: 'active'
    });

    console.log(`[Newsletter] New subscription: ${email}`);

    return c.json({ 
      message: 'Successfully subscribed to newsletter',
      email 
    }, 200);

  } catch (error: any) {
    console.error('[Newsletter] Subscription error:', error);
    return c.json({ error: 'Failed to subscribe to newsletter' }, 500);
  }
});

// Get all newsletter subscribers (admin only)
newsletter.get('/subscribers', async (c) => {
  try {
    const subscribers = await kv.getByPrefix('newsletter:');
    
    return c.json({ 
      count: subscribers.length,
      subscribers: subscribers.map(sub => ({
        email: sub.email,
        subscribedAt: sub.subscribedAt,
        status: sub.status
      }))
    }, 200);

  } catch (error: any) {
    console.error('[Newsletter] Get subscribers error:', error);
    return c.json({ error: 'Failed to get subscribers' }, 500);
  }
});

export default newsletter;
