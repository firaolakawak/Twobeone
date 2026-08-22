import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

export const webrtcRoutes = new Hono();

// Store WebRTC offer from broadcaster
webrtcRoutes.post('/live/:sessionId/offer', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const { offer } = await c.req.json();

    console.log(`[WebRTC] POST /live/${sessionId}/offer - Storing offer from broadcaster`);

    // Get user info
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    console.log('[WebRTC] Access token present:', !!accessToken);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError) {
      console.error('[WebRTC] Auth error:', authError);
    }
    
    if (!user?.id) {
      console.error('[WebRTC] Unauthorized - no user ID');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[WebRTC] Authenticated user:', user.id);

    // Verify this user is the broadcaster
    console.log(`[WebRTC] Looking for live session with key: live:${sessionId}`);
    const liveSession = await kv.get(`live:${sessionId}`);
    
    if (!liveSession) {
      console.error(`[WebRTC] ❌ Live session not found with key: live:${sessionId}`);
      
      // Debug: Try to list all live sessions
      const allLiveSessions = await kv.getByPrefix('live:');
      console.log('[WebRTC] All live sessions:', allLiveSessions.map(s => Object.keys(s)));
      
      return c.json({ error: 'Live session not found' }, 404);
    }
    
    console.log('[WebRTC] ✅ Live session found:', {
      sessionId: liveSession.id,
      userId: liveSession.userId,
      isActive: liveSession.isActive
    });
    
    if (liveSession.userId !== user.id) {
      console.error(`[WebRTC] User ${user.id} not authorized to broadcast session ${sessionId} (broadcaster: ${liveSession.userId})`);
      return c.json({ error: 'Not authorized to broadcast this session' }, 403);
    }

    // Store the offer
    await kv.set(`webrtc_offer_${sessionId}`, {
      offer,
      broadcasterId: user.id,
      timestamp: new Date().toISOString()
    });

    // Mark the live session as WebRTC ready
    if (liveSession) {
      liveSession.webrtcReady = true;
      await kv.set(`live:${sessionId}`, liveSession);
      console.log(`✅ [WebRTC] Live session marked as WebRTC ready:`, {
        sessionId,
        webrtcReady: true
      });
    }

    console.log(`✅ [WebRTC] Offer stored successfully for session ${sessionId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('[WebRTC] Error storing offer:', error);
    return c.json({ error: 'Failed to store offer' }, 500);
  }
});

// Get WebRTC offer for viewers
webrtcRoutes.get('/live/:sessionId/offer', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    const offerData = await kv.get(`webrtc_offer_${sessionId}`);
    
    if (!offerData) {
      return c.json({ error: 'No offer available' }, 404);
    }

    return c.json({ offer: offerData.offer });
  } catch (error) {
    console.error('Error getting WebRTC offer:', error);
    return c.json({ error: 'Failed to get offer' }, 500);
  }
});

// Store viewer's answer
webrtcRoutes.post('/live/:sessionId/answer/:viewerId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const viewerId = c.req.param('viewerId');
    const { answer } = await c.req.json();

    // Store the answer
    await kv.set(`webrtc_answer_${sessionId}_${viewerId}`, {
      answer,
      viewerId,
      timestamp: new Date().toISOString()
    });

    console.log(`WebRTC answer stored for session ${sessionId}, viewer ${viewerId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error storing WebRTC answer:', error);
    return c.json({ error: 'Failed to store answer' }, 500);
  }
});

// Get viewer answers for broadcaster
webrtcRoutes.get('/live/:sessionId/answers', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    // Get user info
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all answers for this session
    const answers = await kv.getByPrefix(`webrtc_answer_${sessionId}_`);

    return c.json({ answers });
  } catch (error) {
    console.error('Error getting WebRTC answers:', error);
    return c.json({ error: 'Failed to get answers' }, 500);
  }
});

// Store ICE candidate
webrtcRoutes.post('/live/:sessionId/ice/:peerId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const peerId = c.req.param('peerId');
    const { candidate } = await c.req.json();

    // Store ICE candidate
    const key = `webrtc_ice_${sessionId}_${peerId}_${Date.now()}`;
    await kv.set(key, {
      candidate,
      peerId,
      timestamp: new Date().toISOString()
    });

    console.log(`ICE candidate stored for session ${sessionId}, peer ${peerId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error storing ICE candidate:', error);
    return c.json({ error: 'Failed to store ICE candidate' }, 500);
  }
});

// Get ICE candidates for a peer
webrtcRoutes.get('/live/:sessionId/ice/:peerId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const peerId = c.req.param('peerId');

    // Get all ICE candidates for this peer
    const candidates = await kv.getByPrefix(`webrtc_ice_${sessionId}_${peerId}_`);

    // Delete retrieved candidates to avoid duplicates
    for (const candidate of candidates) {
      const key = Object.keys(candidate)[0];
      await kv.del(key);
    }

    return c.json({ candidates });
  } catch (error) {
    console.error('Error getting ICE candidates:', error);
    return c.json({ error: 'Failed to get ICE candidates' }, 500);
  }
});

// Clean up WebRTC data when session ends
export async function cleanupWebRTCSession(sessionId: string) {
  try {
    // Delete offer
    await kv.del(`webrtc_offer_${sessionId}`);
    
    // Delete all answers
    const answers = await kv.getByPrefix(`webrtc_answer_${sessionId}_`);
    for (const answer of answers) {
      const key = Object.keys(answer)[0];
      await kv.del(key);
    }
    
    // Delete all ICE candidates
    const candidates = await kv.getByPrefix(`webrtc_ice_${sessionId}_`);
    for (const candidate of candidates) {
      const key = Object.keys(candidate)[0];
      await kv.del(key);
    }
    
    console.log(`Cleaned up WebRTC data for session ${sessionId}`);
  } catch (error) {
    console.error('Error cleaning up WebRTC session:', error);
  }
}