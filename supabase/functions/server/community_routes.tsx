import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const app = new Hono();

// ==================== GROUPS ====================

// Create a new group
app.post('/groups', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, description, imageUrl, isPublic } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Group name is required' }, 400);
    }

    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const group = {
      id: groupId,
      name,
      description: description || '',
      imageUrl: imageUrl || '',
      isPublic: isPublic !== false, // Default to true
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      memberCount: 1
    };

    await kv.set(`group:${groupId}`, group);

    // Add creator as first member (admin)
    const membership = {
      groupId,
      userId: user.id,
      role: 'admin',
      joinedAt: new Date().toISOString()
    };
    await kv.set(`group:${groupId}:member:${user.id}`, membership);

    // Add to user's groups list
    const userGroups = await kv.get(`user:${user.id}:groups`) || [];
    userGroups.push(groupId);
    await kv.set(`user:${user.id}:groups`, userGroups);

    // Add to global groups list
    const allGroups = await kv.get('groups:all') || [];
    allGroups.push(groupId);
    await kv.set('groups:all', allGroups);

    return c.json({ group });
  } catch (error) {
    console.error('Error creating group:', error);
    return c.json({ error: 'Failed to create group' }, 500);
  }
});

// Get all public groups
app.get('/groups', async (c) => {
  try {
    const allGroupIds = await kv.get('groups:all') || [];
    const groups = await Promise.all(
      allGroupIds.map(async (groupId: string) => {
        const group = await kv.get(`group:${groupId}`);
        return group;
      })
    );

    // Filter out null groups and only return public ones
    const publicGroups = groups.filter(g => g && g.isPublic);

    return c.json({ groups: publicGroups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return c.json({ error: 'Failed to fetch groups' }, 500);
  }
});

// Get user's groups
app.get('/groups/my', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userGroupIds = await kv.get(`user:${user.id}:groups`) || [];
    const groups = await Promise.all(
      userGroupIds.map(async (groupId: string) => {
        const group = await kv.get(`group:${groupId}`);
        return group;
      })
    );

    return c.json({ groups: groups.filter(g => g) });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return c.json({ error: 'Failed to fetch groups' }, 500);
  }
});

// Get group details
app.get('/groups/:groupId', async (c) => {
  try {
    const { groupId } = c.req.param();
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    return c.json({ group });
  } catch (error) {
    console.error('Error fetching group:', error);
    return c.json({ error: 'Failed to fetch group' }, 500);
  }
});

// Join a group
app.post('/groups/:groupId/join', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId } = c.req.param();
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (!group.isPublic) {
      return c.json({ error: 'This group is private' }, 403);
    }

    // Check if already a member
    const existingMember = await kv.get(`group:${groupId}:member:${user.id}`);
    if (existingMember) {
      return c.json({ error: 'Already a member' }, 400);
    }

    // Add membership
    const membership = {
      groupId,
      userId: user.id,
      role: 'member',
      joinedAt: new Date().toISOString()
    };
    await kv.set(`group:${groupId}:member:${user.id}`, membership);

    // Update member count
    group.memberCount = (group.memberCount || 1) + 1;
    await kv.set(`group:${groupId}`, group);

    // Add to user's groups list
    const userGroups = await kv.get(`user:${user.id}:groups`) || [];
    if (!userGroups.includes(groupId)) {
      userGroups.push(groupId);
      await kv.set(`user:${user.id}:groups`, userGroups);
    }

    return c.json({ message: 'Joined group successfully', membership });
  } catch (error) {
    console.error('Error joining group:', error);
    return c.json({ error: 'Failed to join group' }, 500);
  }
});

// Leave a group
app.post('/groups/:groupId/leave', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId } = c.req.param();
    
    // Remove membership
    await kv.del(`group:${groupId}:member:${user.id}`);

    // Update member count
    const group = await kv.get(`group:${groupId}`);
    if (group) {
      group.memberCount = Math.max((group.memberCount || 1) - 1, 0);
      await kv.set(`group:${groupId}`, group);
    }

    // Remove from user's groups list
    const userGroups = await kv.get(`user:${user.id}:groups`) || [];
    const updatedGroups = userGroups.filter((id: string) => id !== groupId);
    await kv.set(`user:${user.id}:groups`, updatedGroups);

    return c.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Error leaving group:', error);
    return c.json({ error: 'Failed to leave group' }, 500);
  }
});

// Get group members
app.get('/groups/:groupId/members', async (c) => {
  try {
    const { groupId } = c.req.param();
    
    const members = await kv.getByPrefix(`group:${groupId}:member:`);

    // Fetch user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member: any) => {
        const userProfile = await kv.get(`user:${member.userId}`);
        return {
          ...member,
          name: userProfile?.name || 'Unknown',
          email: userProfile?.email || ''
        };
      })
    );

    return c.json({ members: membersWithDetails });
  } catch (error) {
    console.error('Error fetching members:', error);
    return c.json({ error: 'Failed to fetch members' }, 500);
  }
});

// ==================== GROUP CHAT ====================

// Send message to group
app.post('/groups/:groupId/messages', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId } = c.req.param();
    const { message } = await c.req.json();

    // Check if user is a member
    const membership = await kv.get(`group:${groupId}:member:${user.id}`);
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // Get user profile
    const userProfile = await kv.get(`user:${user.id}`);

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageData = {
      id: messageId,
      groupId,
      userId: user.id,
      userName: userProfile?.name || 'Unknown',
      message,
      createdAt: new Date().toISOString()
    };

    await kv.set(`group:${groupId}:message:${messageId}`, messageData);

    // Add to messages list
    const messagesList = await kv.get(`group:${groupId}:messages`) || [];
    messagesList.push(messageId);
    // Keep only last 1000 messages
    if (messagesList.length > 1000) {
      messagesList.shift();
    }
    await kv.set(`group:${groupId}:messages`, messagesList);

    return c.json({ message: messageData });
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get group messages
app.get('/groups/:groupId/messages', async (c) => {
  try {
    const { groupId } = c.req.param();
    const limit = parseInt(c.req.query('limit') || '50');

    const messagesList = await kv.get(`group:${groupId}:messages`) || [];
    const recentMessageIds = messagesList.slice(-limit);

    const messages = await Promise.all(
      recentMessageIds.map(async (msgId: string) => {
        return await kv.get(`group:${groupId}:message:${msgId}`);
      })
    );

    return c.json({ messages: messages.filter(m => m) });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// ==================== EVENTS & RSVP ====================

// Create event
app.post('/groups/:groupId/events', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId } = c.req.param();
    const { title, description, date, location } = await c.req.json();

    // Check if user is admin or member
    const membership = await kv.get(`group:${groupId}:member:${user.id}`);
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const event = {
      id: eventId,
      groupId,
      title,
      description: description || '',
      date,
      location: location || '',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      rsvpCount: 0
    };

    await kv.set(`group:${groupId}:event:${eventId}`, event);

    // Add to events list
    const eventsList = await kv.get(`group:${groupId}:events`) || [];
    eventsList.push(eventId);
    await kv.set(`group:${groupId}:events`, eventsList);

    return c.json({ event });
  } catch (error) {
    console.error('Error creating event:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

// Get group events
app.get('/groups/:groupId/events', async (c) => {
  try {
    const { groupId } = c.req.param();
    
    const eventsList = await kv.get(`group:${groupId}:events`) || [];
    const events = await Promise.all(
      eventsList.map(async (eventId: string) => {
        return await kv.get(`group:${groupId}:event:${eventId}`);
      })
    );

    return c.json({ events: events.filter(e => e) });
  } catch (error) {
    console.error('Error fetching events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// RSVP to event
app.post('/groups/:groupId/events/:eventId/rsvp', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId, eventId } = c.req.param();
    const { status } = await c.req.json(); // 'going', 'maybe', 'not-going'

    // Get user profile
    const userProfile = await kv.get(`user:${user.id}`);

    const rsvp = {
      eventId,
      groupId,
      userId: user.id,
      userName: userProfile?.name || 'Unknown',
      status,
      rsvpAt: new Date().toISOString()
    };

    await kv.set(`event:${eventId}:rsvp:${user.id}`, rsvp);

    // Update RSVP count
    const event = await kv.get(`group:${groupId}:event:${eventId}`);
    if (event) {
      const allRsvps = await kv.getByPrefix(`event:${eventId}:rsvp:`);
      event.rsvpCount = allRsvps.filter((r: any) => r?.status === 'going').length;
      await kv.set(`group:${groupId}:event:${eventId}`, event);
    }

    return c.json({ rsvp });
  } catch (error) {
    console.error('Error RSVP to event:', error);
    return c.json({ error: 'Failed to RSVP' }, 500);
  }
});

// Get event RSVPs
app.get('/groups/:groupId/events/:eventId/rsvps', async (c) => {
  try {
    const { eventId } = c.req.param();
    
    const rsvps = await kv.getByPrefix(`event:${eventId}:rsvp:`);
    const rsvpList = rsvps.filter(Boolean);

    return c.json({ rsvps: rsvpList });
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return c.json({ error: 'Failed to fetch RSVPs' }, 500);
  }
});

// ==================== GO LIVE ====================

// Start live session
app.post('/groups/:groupId/live', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      console.error('Auth error in start live:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    const { groupId } = c.req.param();
    const { title, description } = await c.req.json();

    // Check if user is a member
    const membership = await kv.get(`group:${groupId}:member:${userId}`);
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // Get user profile
    const userProfile = await kv.get(`user:${userId}`);
    const userName = userProfile?.name || 'Unknown';

    const liveId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const liveSession = {
      id: liveId,
      groupId,
      userId: userId,
      userName: userName,
      title: title || 'Live Session',
      description: description || '',
      startedAt: new Date().toISOString(),
      isActive: true,
      viewerCount: 0
    };

    await kv.set(`live:${liveId}`, liveSession);
    await kv.set(`group:${groupId}:live`, liveId); // Current live session

    // Add to global active live sessions
    const activeLive = await kv.get('live:active') || [];
    activeLive.push(liveId);
    await kv.set('live:active', activeLive);

    // Get group name
    const group = await kv.get(`group:${groupId}`);
    const groupName = group?.name || 'a group';

    // Notify all group members
    const members = await kv.getByPrefix(`group:${groupId}:member:`);
    for (const member of members) {
      const memberId = member?.userId;
      if (memberId && memberId !== userId) {
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: memberId,
          type: 'live_started',
          title: '🔴 Live Session Started',
          message: `${userName} is live in ${groupName}`,
          data: { liveId, groupId },
          createdAt: new Date().toISOString(),
          read: false
        };
        await kv.set(`notification:${notification.id}`, notification);
        
        const userNotifs = await kv.get(`user:${memberId}:notifications`) || [];
        userNotifs.unshift(notification.id);
        await kv.set(`user:${memberId}:notifications`, userNotifs);
      }
    }

    return c.json({ liveSession });
  } catch (error) {
    console.error('Error starting live session:', error);
    return c.json({ error: 'Failed to start live session' }, 500);
  }
});

// End live session
app.post('/live/:liveId/end', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { liveId } = c.req.param();
    const liveSession = await kv.get(`live:${liveId}`);

    if (!liveSession) {
      return c.json({ error: 'Live session not found' }, 404);
    }

    if (liveSession.userId !== user.id) {
      return c.json({ error: 'Not authorized to end this session' }, 403);
    }

    liveSession.isActive = false;
    liveSession.endedAt = new Date().toISOString();
    await kv.set(`live:${liveId}`, liveSession);

    // Remove from active live sessions
    const activeLive = await kv.get('live:active') || [];
    const updatedActive = activeLive.filter((id: string) => id !== liveId);
    await kv.set('live:active', updatedActive);

    // Remove from group's current live
    await kv.del(`group:${liveSession.groupId}:live`);

    // Clean up WebRTC signaling data
    try {
      const { cleanupWebRTCSession } = await import('./webrtc_routes.tsx');
      await cleanupWebRTCSession(liveId);
    } catch (error) {
      console.error('Error cleaning up WebRTC session:', error);
    }

    return c.json({ message: 'Live session ended' });
  } catch (error) {
    console.error('Error ending live session:', error);
    return c.json({ error: 'Failed to end live session' }, 500);
  }
});

// Get active live sessions
app.get('/live/active', async (c) => {
  try {
    const activeLiveIds = await kv.get('live:active') || [];
    
    // Clean up stale sessions (older than 24 hours)
    const now = new Date();
    const staleIds: string[] = [];
    
    const liveSessions = await Promise.all(
      activeLiveIds.map(async (liveId: string) => {
        const session = await kv.get(`live:${liveId}`);
        if (session && session.isActive) {
          // Check if session is stale (older than 24 hours)
          const startedAt = new Date(session.startedAt);
          const hoursSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceStart > 24) {
            // Mark as stale for cleanup
            staleIds.push(liveId);
            return null;
          }
          
          const group = await kv.get(`group:${session.groupId}`);
          return {
            ...session,
            groupName: group?.name || 'Unknown Group'
          };
        }
        // Session is null or inactive, mark for cleanup
        if (!session || !session.isActive) {
          staleIds.push(liveId);
        }
        return null;
      })
    );

    // Clean up stale sessions from active list
    if (staleIds.length > 0) {
      const cleanedActiveIds = activeLiveIds.filter((id: string) => !staleIds.includes(id));
      await kv.set('live:active', cleanedActiveIds);
      
      // Mark stale sessions as inactive
      await Promise.all(
        staleIds.map(async (liveId: string) => {
          const session = await kv.get(`live:${liveId}`);
          if (session) {
            session.isActive = false;
            session.endedAt = now.toISOString();
            await kv.set(`live:${liveId}`, session);
          }
        })
      );
    }

    // Filter out null and inactive sessions
    const activeSessionsOnly = liveSessions.filter(s => s && s.isActive);

    return c.json({ liveSessions: activeSessionsOnly });
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    return c.json({ error: 'Failed to fetch live sessions' }, 500);
  }
});

// Get group's current live session
app.get('/groups/:groupId/live', async (c) => {
  try {
    const { groupId } = c.req.param();
    const liveId = await kv.get(`group:${groupId}:live`);
    
    if (!liveId) {
      return c.json({ liveSession: null });
    }

    const liveSession = await kv.get(`live:${liveId}`);
    
    if (!liveSession || !liveSession.isActive) {
      return c.json({ liveSession: null });
    }

    return c.json({ liveSession });
  } catch (error) {
    console.error('Error fetching live session:', error);
    return c.json({ error: 'Failed to fetch live session' }, 500);
  }
});

// Join live session (increment viewer count)
app.post('/live/:liveId/join', async (c) => {
  try {
    const { liveId } = c.req.param();
    const liveSession = await kv.get(`live:${liveId}`);

    if (!liveSession) {
      return c.json({ error: 'Live session not found' }, 404);
    }

    liveSession.viewerCount = (liveSession.viewerCount || 0) + 1;
    await kv.set(`live:${liveId}`, liveSession);

    return c.json({ viewerCount: liveSession.viewerCount });
  } catch (error) {
    console.error('Error joining live session:', error);
    return c.json({ error: 'Failed to join live session' }, 500);
  }
});

// Get live session by ID
app.get('/live/:liveId', async (c) => {
  try {
    const { liveId } = c.req.param();
    const liveSession = await kv.get(`live:${liveId}`);

    if (!liveSession) {
      console.log(`[Live] Session ${liveId} not found`);
      return c.json({ liveSession: null }, 404);
    }

    // Only return if session is active
    if (!liveSession.isActive) {
      console.log(`[Live] Session ${liveId} is no longer active`);
      return c.json({ liveSession: null });
    }

    console.log(`[Live] Returning session ${liveId}:`, {
      isActive: liveSession.isActive,
      webrtcReady: liveSession.webrtcReady || false
    });

    return c.json({ 
      ...liveSession,
      webrtcReady: liveSession.webrtcReady || false
    });
  } catch (error) {
    console.error('Error fetching live session:', error);
    return c.json({ error: 'Failed to fetch live session' }, 500);
  }
});

export default app;