/**
 * TwoBeOne Admin Privilege Management Routes
 * Handles admin user management and privilege assignment
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { initializeAdminSystem } from './init_admins.tsx';

// Helper function to extract user ID from authorization token
async function getUserFromToken(authHeader: string | undefined, supabase: any): Promise<string | null> {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

// Helper function to check if a user is an admin
async function isAdmin(userId: string): Promise<boolean> {
  // Check if user is in the admin list
  const adminList = await kv.get('system:admins') || [];
  if (Array.isArray(adminList) && adminList.includes(userId)) {
    return true;
  }
  
  // Fallback: check if email contains 'admin' for backwards compatibility
  const profile = await kv.get(`user:${userId}`);
  if (profile?.email?.toLowerCase().includes('admin')) {
    return true;
  }
  
  return false;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function logPrivilegeAudit(
  event: 'admin.privilege_granted' | 'admin.privilege_revoked',
  actorId: string,
  targetId: string,
  targetEmail: string
): Promise<void> {
  try {
    const actor = await kv.get(`user:${actorId}`);
    const id = generateId();
    const timestamp = new Date().toISOString();
    const tsMs = Date.now();
    await kv.set(`auditlog:${tsMs}:${id}`, {
      id, event, category: 'admin',
      userId: actorId,
      userName: actor?.name || actor?.full_name || 'Admin',
      userEmail: actor?.email || '',
      metadata: { targetUserId: targetId, targetEmail },
      timestamp,
    });
    console.log(`[Audit] ✅ ${event} logged for actor ${actorId}`);
  } catch (err) {
    console.error('[Audit] ❌ Failed to write privilege audit entry:', err);
  }
}

const APPRECIATION_PUSH = {
  title: 'Thank you for being part of TwoBeOne 💕',
  body: 'We truly appreciate you using the TwoBeOne app. Share it with your friends, loved ones, and family.',
};

async function logPushAudit(actorId: string, title: string, delivery: Record<string, number>): Promise<void> {
  try {
    const actor = await kv.get(`user:${actorId}`);
    const id = generateId();
    const timestamp = new Date().toISOString();
    await kv.set(`auditlog:${Date.now()}:${id}`, {
      id,
      event: 'admin.push_broadcast_sent',
      category: 'admin',
      userId: actorId,
      userName: actor?.name || actor?.full_name || 'Admin',
      userEmail: actor?.email || '',
      metadata: { ...delivery, title },
      timestamp,
    });
  } catch (error) {
    console.error('[Audit] Failed to record push broadcast:', error);
  }
}

interface AdminPushMessage {
  title: string;
  body: string;
  url: string;
  templateId?: string;
}

async function deliverPushBroadcast(message: AdminPushMessage) {
  const users: any[] = await kv.getByPrefix('user:');
  const webpush = await import('npm:web-push@3.6.7');
  webpush.setVapidDetails(
    'mailto:support@twobeone.app',
    Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDCoXjbK3s9gE8ZCXzp8zQJZs8qI67y_NvZy7p3kk0z0',
    Deno.env.get('VAPID_PRIVATE_KEY') || 'sMIyJcgzS-OKkMHmQkfO9V5rNkVGXrQvZOJGm3I2QFk',
  );
  let totalSubscribers = 0, sent = 0, failed = 0, invalidSubscriptions = 0;

  for (let index = 0; index < users.length; index += 20) {
    await Promise.all(users.slice(index, index + 20).map(async (user: any) => {
      if (!user?.id) return;
      const subscription: any = await kv.get(`push_subscription:${user.id}`).catch(() => null);
      if (!subscription?.endpoint) return;
      totalSubscribers++;
      try {
        await webpush.sendNotification(subscription, JSON.stringify({
          title: message.title,
          body: message.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: `twobeone-${message.templateId || 'admin-message'}`,
          url: message.url,
          data: { type: 'admin_broadcast', templateId: message.templateId || null, url: message.url },
        }));
        sent++;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await kv.del(`push_subscription:${user.id}`);
          invalidSubscriptions++;
        } else {
          failed++;
          console.error(`[Admin Push] Delivery failed for ${user.id}:`, error?.message || error);
        }
      }
    }));
  }
  return { totalUsers: users.length, totalSubscribers, sent, failed, invalidSubscriptions };
}

export function setupAdminRoutes(app: Hono, supabase: any) {

  app.post('/make-server-6d579fee/admin/push/appreciation', async (c) => {
    try {
      const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);
      if (!(await isAdmin(userId))) return c.json({ error: 'Forbidden - Admin access required' }, 403);

      const delivery = await deliverPushBroadcast({ ...APPRECIATION_PUSH, url: '/', templateId: 'appreciation' });
      await logPushAudit(userId, APPRECIATION_PUSH.title, delivery);
      return c.json({ success: true, message: APPRECIATION_PUSH, ...delivery });
    } catch (error: any) {
      console.error('[Admin Push] Broadcast failed:', error);
      return c.json({ error: error?.message || 'Failed to send appreciation notification' }, 500);
    }
  });

  app.post('/make-server-6d579fee/admin/push/broadcast', async (c) => {
    try {
      const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);
      if (!(await isAdmin(userId))) return c.json({ error: 'Forbidden - Admin access required' }, 403);

      const payload = await c.req.json();
      const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
      const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
      const requestedUrl = typeof payload?.url === 'string' ? payload.url.trim() : '/';
      const templateId = typeof payload?.templateId === 'string' ? payload.templateId.slice(0, 50) : 'custom';
      if (!title || !body) return c.json({ error: 'Title and message are required' }, 400);
      if (title.length > 80) return c.json({ error: 'Title must be 80 characters or fewer' }, 400);
      if (body.length > 240) return c.json({ error: 'Message must be 240 characters or fewer' }, 400);
      if (!requestedUrl.startsWith('/') || requestedUrl.startsWith('//')) return c.json({ error: 'Destination must be an internal app path' }, 400);

      const message = { title, body, url: requestedUrl, templateId };
      const delivery = await deliverPushBroadcast(message);
      await logPushAudit(userId, title, delivery);
      return c.json({ success: true, message, ...delivery });
    } catch (error: any) {
      console.error('[Admin Push] Broadcast failed:', error);
      return c.json({ error: error?.message || 'Failed to send push notification' }, 500);
    }
  });

  // Persist the editorial MiniKanban order. The whole board is stored as one
  // versioned document so cross-column moves remain atomic.
  app.get('/make-server-6d579fee/admin/kanban', async (c) => {
    const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await isAdmin(userId))) return c.json({ error: 'Forbidden - Admin access required' }, 403);
    const state = await kv.get('admin:kanban:v1');
    return c.json(state || { columns: [] });
  });

  app.put('/make-server-6d579fee/admin/kanban', async (c) => {
    const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await isAdmin(userId))) return c.json({ error: 'Forbidden - Admin access required' }, 403);
    const payload = await c.req.json();
    if (!Array.isArray(payload?.columns) || payload.columns.length !== 3) {
      return c.json({ error: 'A three-column Kanban payload is required' }, 400);
    }
    const state = { columns: payload.columns, updatedAt: new Date().toISOString(), updatedBy: userId };
    await kv.set('admin:kanban:v1', state);
    return c.json(state);
  });

  // ============================================
  // ADMIN PRIVILEGE MANAGEMENT
  // ============================================

  // Get all admins
  app.get('/make-server-6d579fee/admin/privileges/list', async (c) => {
    try {
      const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if requester is admin
      const requesterIsAdmin = await isAdmin(userId);
      if (!requesterIsAdmin) {
        return c.json({ error: 'Forbidden - Admin access required' }, 403);
      }

      // Initialize admins if needed
      await initializeAdminSystem();
      
      // Get admin list
      const adminUserIds = await kv.get('system:admins') || [];
      
      // Get full user details for each admin
      const adminUsers = [];
      for (const adminId of adminUserIds) {
        const user = await kv.get(`user:${adminId}`);
        if (user) {
          adminUsers.push({
            id: user.id,
            email: user.email,
            name: user.name || user.full_name,
            addedAt: user.adminAddedAt || new Date().toISOString()
          });
        }
      }

      return c.json({ admins: adminUsers });
    } catch (error: any) {
      console.error('Get admins error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get all users (for admin assignment UI)
  app.get('/make-server-6d579fee/admin/privileges/users', async (c) => {
    try {
      const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if requester is admin
      const requesterIsAdmin = await isAdmin(userId);
      if (!requesterIsAdmin) {
        return c.json({ error: 'Forbidden - Admin access required' }, 403);
      }

      // Get all users
      const allUsers = await kv.getByPrefix('user:');
      const adminList = await kv.get('system:admins') || [];
      
      // Format user list with admin status
      const users = allUsers
        .filter((user: any) => user.id && user.email)
        .map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.name || user.full_name || 'Unknown',
          isAdmin: adminList.includes(user.id),
          hasPartner: !!user.partnerId,
          createdAt: user.createdAt || new Date().toISOString()
        }))
        .sort((a: any, b: any) => a.email.localeCompare(b.email));

      return c.json({ users });
    } catch (error: any) {
      console.error('Get users error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Check if current user is admin
  app.get('/make-server-6d579fee/admin/privileges/check', async (c) => {
    try {
      const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
      if (!userId) {
        return c.json({ isAdmin: false });
      }

      // Initialize admins if needed
      await initializeAdminSystem();
      
      const userIsAdmin = await isAdmin(userId);
      return c.json({ isAdmin: userIsAdmin });
    } catch (error: any) {
      console.error('Check admin status error:', error);
      return c.json({ isAdmin: false });
    }
  });

  // Grant admin privileges to a user
  app.post('/make-server-6d579fee/admin/privileges/grant', async (c) => {
    try {
      const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if requester is admin
      const requesterIsAdmin = await isAdmin(userId);
      if (!requesterIsAdmin) {
        return c.json({ error: 'Forbidden - Admin access required' }, 403);
      }

      const { targetUserId } = await c.req.json();
      if (!targetUserId) {
        return c.json({ error: 'Target user ID is required' }, 400);
      }

      // Get current admin list
      const adminList = await kv.get('system:admins') || [];
      
      // Check if already admin
      if (adminList.includes(targetUserId)) {
        return c.json({ error: 'User is already an admin' }, 400);
      }

      // Verify target user exists
      const targetUser = await kv.get(`user:${targetUserId}`);
      if (!targetUser) {
        return c.json({ error: 'Target user not found' }, 404);
      }

      // Add to admin list
      adminList.push(targetUserId);
      await kv.set('system:admins', adminList);

      // Update user profile with admin timestamp
      targetUser.adminAddedAt = new Date().toISOString();
      targetUser.adminAddedBy = userId;
      await kv.set(`user:${targetUserId}`, targetUser);

      // Log the action
      const requesterProfile = await kv.get(`user:${userId}`);
      console.log(`Admin privilege granted: ${requesterProfile?.email} granted admin to ${targetUser.email}`);
      await logPrivilegeAudit('admin.privilege_granted', userId, targetUserId, targetUser.email);

      return c.json({
        success: true,
        message: `Admin privileges granted to ${targetUser.email}`,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name || targetUser.full_name
        }
      });
    } catch (error: any) {
      console.error('Grant admin privilege error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Revoke admin privileges from a user
  app.post('/make-server-6d579fee/admin/privileges/revoke', async (c) => {
    try {
      const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if requester is admin
      const requesterIsAdmin = await isAdmin(userId);
      if (!requesterIsAdmin) {
        return c.json({ error: 'Forbidden - Admin access required' }, 403);
      }

      const { targetUserId } = await c.req.json();
      if (!targetUserId) {
        return c.json({ error: 'Target user ID is required' }, 400);
      }

      // Prevent self-revocation
      if (userId === targetUserId) {
        return c.json({ error: 'You cannot revoke your own admin privileges' }, 400);
      }

      // Get current admin list
      const adminList = await kv.get('system:admins') || [];
      
      // Check if user is admin
      if (!adminList.includes(targetUserId)) {
        return c.json({ error: 'User is not an admin' }, 400);
      }

      // Ensure at least one admin remains
      if (adminList.length <= 1) {
        return c.json({ error: 'Cannot revoke the last admin' }, 400);
      }

      // Remove from admin list
      const updatedAdminList = adminList.filter((id: string) => id !== targetUserId);
      await kv.set('system:admins', updatedAdminList);

      // Update user profile
      const targetUser = await kv.get(`user:${targetUserId}`);
      if (targetUser) {
        targetUser.adminRevokedAt = new Date().toISOString();
        targetUser.adminRevokedBy = userId;
        delete targetUser.adminAddedAt;
        delete targetUser.adminAddedBy;
        await kv.set(`user:${targetUserId}`, targetUser);
      }

      // Log the action
      const requesterProfile = await kv.get(`user:${userId}`);
      console.log(`Admin privilege revoked: ${requesterProfile?.email} revoked admin from ${targetUser?.email}`);
      await logPrivilegeAudit('admin.privilege_revoked', userId, targetUserId, targetUser?.email || '');

      return c.json({
        success: true,
        message: `Admin privileges revoked from ${targetUser?.email}`,
        user: {
          id: targetUser?.id,
          email: targetUser?.email,
          name: targetUser?.name || targetUser?.full_name
        }
      });
    } catch (error: any) {
      console.error('Revoke admin privilege error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get admin activity log
  app.get('/make-server-6d579fee/admin/privileges/activity-log', async (c) => {
    try {
      const userId = await getUserFromToken(c.req.header('Authorization'), supabase);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if requester is admin
      const requesterIsAdmin = await isAdmin(userId);
      if (!requesterIsAdmin) {
        return c.json({ error: 'Forbidden - Admin access required' }, 403);
      }

      // Get all users and check for admin activity
      const allUsers = await kv.getByPrefix('user:');
      const activityLog = [];

      for (const user of allUsers) {
        if (user.adminAddedAt) {
          const addedBy = user.adminAddedBy ? await kv.get(`user:${user.adminAddedBy}`) : null;
          activityLog.push({
            action: 'granted',
            targetUser: {
              id: user.id,
              email: user.email,
              name: user.name || user.full_name
            },
            performedBy: addedBy ? {
              id: addedBy.id,
              email: addedBy.email,
              name: addedBy.name || addedBy.full_name
            } : { email: 'System' },
            timestamp: user.adminAddedAt
          });
        }
        if (user.adminRevokedAt) {
          const revokedBy = user.adminRevokedBy ? await kv.get(`user:${user.adminRevokedBy}`) : null;
          activityLog.push({
            action: 'revoked',
            targetUser: {
              id: user.id,
              email: user.email,
              name: user.name || user.full_name
            },
            performedBy: revokedBy ? {
              id: revokedBy.id,
              email: revokedBy.email,
              name: revokedBy.name || revokedBy.full_name
            } : { email: 'System' },
            timestamp: user.adminRevokedAt
          });
        }
      }

      // Sort by timestamp (most recent first)
      activityLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return c.json({ activityLog });
    } catch (error: any) {
      console.error('Get admin activity log error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

}
