import { Hono } from 'npm:hono@4.6.14';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import * as kv from './kv_store.tsx';
import communityRoutes from './community_routes.tsx';
import { webrtcRoutes } from './webrtc_routes.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Initialize Supabase client
const getSupabase = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Get user ID from access token
async function getUserFromToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabase = getSupabase();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch (err) {
    console.error('Error getting user from token:', err);
    return null;
  }
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/make-server-6d579fee/health', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'TwoBeOne API is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// AUTHENTICATION
// ============================================

app.post('/make-server-6d579fee/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const supabase = getSupabase();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we don't have email server
      user_metadata: { name }
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // Handle specific error cases with user-friendly messages
      if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
        return c.json({ 
          error: 'This email is already registered. Please sign in instead or use a different email.' 
        }, 409); // 409 Conflict
      }
      
      if (authError.message.includes('Invalid email')) {
        return c.json({ error: 'Please enter a valid email address.' }, 400);
      }
      
      if (authError.message.includes('Password')) {
        return c.json({ error: 'Password must be at least 6 characters long.' }, 400);
      }
      
      return c.json({ error: authError.message }, 400);
    }

    const userId = authData.user.id;
    const inviteCode = generateInviteCode();

    // Create user profile in KV store
    const userProfile = {
      id: userId,
      email,
      name,
      inviteCode,
      partnerId: null,
      relationshipStart: null,
      bio: null,
      profilePicture: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, userProfile);
    await kv.set(`invite:${inviteCode}`, userId);

    console.log('User created:', { userId, email, name, inviteCode });

    return c.json({
      success: true,
      user: userProfile,
      inviteCode
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle unexpected errors
    if (error.message?.includes('already been registered') || error.code === 'email_exists') {
      return c.json({ 
        error: 'This email is already registered. Please sign in instead or use a different email.' 
      }, 409);
    }
    
    return c.json({ error: error.message || 'Signup failed. Please try again.' }, 500);
  }
});

// ============================================
// PROFILE
// ============================================

app.get('/make-server-6d579fee/profile', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let profile = await kv.get(`user:${userId}`);
    
    // AUTO-FIX: If profile doesn't exist but user is authenticated, create it
    if (!profile) {
      console.log(`[Profile] User ${userId} authenticated but no profile found. Creating profile...`);
      
      // Get user info from Supabase Auth
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
      
      if (error || !user) {
        console.error(`[Profile] Failed to get user info from auth:`, error);
        return c.json({ error: 'Profile not found and could not be created' }, 404);
      }
      
      // Create basic profile
      const inviteCode = generateInviteCode();
      profile = {
        id: userId,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        inviteCode: inviteCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await kv.set(`user:${userId}`, profile);
      await kv.set(`invite:${inviteCode}`, userId);
      
      console.log(`[Profile] ✅ Created profile for user ${userId}`);
    }

    let partner = null;
    if (profile.partnerId) {
      partner = await kv.get(`user:${profile.partnerId}`);
    }

    return c.json({ profile, partner });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-6d579fee/profile', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    const profile = await kv.get(`user:${userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, updatedProfile);

    // If relationshipStart is being set and user has a partner, sync it to partner
    if (updates.relationshipStart && profile.partnerId) {
      console.log('[POST /profile] Syncing relationshipStart to partner:', profile.partnerId);
      console.log('[POST /profile] New relationshipStart value:', updates.relationshipStart);
      
      try {
        const partner = await kv.get(`user:${profile.partnerId}`);
        if (partner) {
          console.log('[POST /profile] Partner found, current relationshipStart:', partner.relationshipStart);
          
          const updatedPartner = {
            ...partner,
            relationshipStart: updates.relationshipStart,
            updatedAt: new Date().toISOString()
          };
          await kv.set(`user:${profile.partnerId}`, updatedPartner);
          console.log('[POST /profile] ✅ Partner relationshipStart synced successfully to:', updates.relationshipStart);
          
          // Create a notification for the partner
          const notificationId = `notif:${profile.partnerId}:${Date.now()}`;
          const notification = {
            id: notificationId,
            userId: profile.partnerId,
            type: 'profile_update',
            title: '💕 Relationship Date Set!',
            message: `${updatedProfile.name || 'Your partner'} set your relationship start date. Check your profile!`,
            data: { relationshipStart: updates.relationshipStart },
            read: false,
            createdAt: new Date().toISOString()
          };
          await kv.set(notificationId, notification);
          console.log('[POST /profile] ✅ Notification created for partner');
        } else {
          console.log('[POST /profile] ⚠️ Partner not found with ID:', profile.partnerId);
        }
      } catch (partnerError) {
        console.error('[POST /profile] Failed to sync relationshipStart to partner:', partnerError);
        // Don't fail the request if partner sync fails
      }
    } else {
      if (!updates.relationshipStart) {
        console.log('[POST /profile] No relationshipStart in updates');
      }
      if (!profile.partnerId) {
        console.log('[POST /profile] No partner linked to this profile');
      }
    }

    return c.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT endpoint for profile updates (same as POST for compatibility)
app.put('/make-server-6d579fee/profile', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    console.log('[PUT /profile] Updating profile for user:', userId, 'with data:', updates);
    
    const profile = await kv.get(`user:${userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, updatedProfile);

    // If relationshipStart is being set and user has a partner, sync it to partner
    if (updates.relationshipStart && profile.partnerId) {
      console.log('[PUT /profile] Syncing relationshipStart to partner:', profile.partnerId);
      console.log('[PUT /profile] New relationshipStart value:', updates.relationshipStart);
      
      try {
        const partner = await kv.get(`user:${profile.partnerId}`);
        if (partner) {
          console.log('[PUT /profile] Partner found, current relationshipStart:', partner.relationshipStart);
          
          const updatedPartner = {
            ...partner,
            relationshipStart: updates.relationshipStart,
            updatedAt: new Date().toISOString()
          };
          await kv.set(`user:${profile.partnerId}`, updatedPartner);
          console.log('[PUT /profile] ✅ Partner relationshipStart synced successfully to:', updates.relationshipStart);
          
          // Create a notification for the partner
          const notificationId = `notif:${profile.partnerId}:${Date.now()}`;
          const notification = {
            id: notificationId,
            userId: profile.partnerId,
            type: 'profile_update',
            title: '💕 Relationship Date Set!',
            message: `${updatedProfile.name || 'Your partner'} set your relationship start date. Check your profile!`,
            data: { relationshipStart: updates.relationshipStart },
            read: false,
            createdAt: new Date().toISOString()
          };
          await kv.set(notificationId, notification);
          console.log('[PUT /profile] ✅ Notification created for partner');
        } else {
          console.log('[PUT /profile] ⚠️ Partner not found with ID:', profile.partnerId);
        }
      } catch (partnerError) {
        console.error('[PUT /profile] Failed to sync relationshipStart to partner:', partnerError);
        // Don't fail the request if partner sync fails
      }
    } else {
      if (!updates.relationshipStart) {
        console.log('[PUT /profile] No relationshipStart in updates');
      }
      if (!profile.partnerId) {
        console.log('[PUT /profile] No partner linked to this profile');
      }
    }

    console.log('[PUT /profile] Profile updated successfully');
    return c.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-6d579fee/profile/generate-code', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Delete old invite code mapping
    if (profile.inviteCode) {
      await kv.del(`invite:${profile.inviteCode}`);
    }

    const newCode = generateInviteCode();
    profile.inviteCode = newCode;
    profile.updatedAt = new Date().toISOString();

    await kv.set(`user:${userId}`, profile);
    await kv.set(`invite:${newCode}`, userId);

    return c.json({ success: true, inviteCode: newCode });
  } catch (error: any) {
    console.error('Generate code error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-6d579fee/profile/link-by-code', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { code } = await c.req.json();
    if (!code) {
      return c.json({ error: 'Invite code required' }, 400);
    }

    // Get partner ID from invite code
    const partnerId = await kv.get(`invite:${code}`);
    if (!partnerId) {
      return c.json({ error: 'Invalid invite code' }, 404);
    }

    if (partnerId === userId) {
      return c.json({ error: 'Cannot link to yourself' }, 400);
    }

    // Get both profiles
    const userProfile = await kv.get(`user:${userId}`);
    const partnerProfile = await kv.get(`user:${partnerId}`);

    if (!userProfile || !partnerProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Create couple record first
    const coupleId = generateId();
    const couple = {
      id: coupleId,
      partner1Id: userId,
      partner2Id: partnerId,
      relationshipStartDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    await kv.set(`couple:${coupleId}`, couple);

    // Link the profiles with BOTH partnerId AND coupleId
    userProfile.partnerId = partnerId;
    userProfile.coupleId = coupleId;  // ✅ ADD THIS!
    userProfile.updatedAt = new Date().toISOString();
    partnerProfile.partnerId = userId;
    partnerProfile.coupleId = coupleId;  // ✅ ADD THIS!
    partnerProfile.updatedAt = new Date().toISOString();

    await kv.set(`user:${userId}`, userProfile);
    await kv.set(`user:${partnerId}`, partnerProfile);

    console.log(`✅ Couple created! CoupleId: ${coupleId}, User1: ${userId}, User2: ${partnerId}`);

    return c.json({ success: true, partner: partnerProfile });
  } catch (error: any) {
    console.error('Link by code error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Upload profile picture
app.post('/make-server-6d579fee/profile/upload-picture', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { imageData, fileName } = await c.req.json();
    
    if (!imageData) {
      return c.json({ error: 'Image data required' }, 400);
    }

    console.log('[POST /profile/upload-picture] Uploading profile picture for user:', userId);

    // Get user profile
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Create a Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Ensure the bucket exists
    const bucketName = 'make-6d579fee-profile-pictures';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('[POST /profile/upload-picture] Creating bucket:', bucketName);
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880 // 5MB
      });
    }

    // Delete old profile picture if exists
    if (profile.profilePicture) {
      const oldFileName = profile.profilePicture.split('/').pop();
      if (oldFileName) {
        console.log('[POST /profile/upload-picture] Deleting old picture:', oldFileName);
        await supabase.storage.from(bucketName).remove([`${userId}/${oldFileName}`]);
      }
    }

    // Convert base64 to buffer
    const base64Data = imageData.split(',')[1] || imageData;
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate unique filename
    const timestamp = Date.now();
    const extension = fileName?.split('.').pop() || 'jpg';
    const newFileName = `profile-${timestamp}.${extension}`;
    const filePath = `${userId}/${newFileName}`;

    console.log('[POST /profile/upload-picture] Uploading to path:', filePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: `image/${extension}`,
        upsert: true
      });

    if (uploadError) {
      console.error('[POST /profile/upload-picture] Upload error:', uploadError);
      return c.json({ error: uploadError.message }, 500);
    }

    console.log('[POST /profile/upload-picture] Upload successful:', uploadData);

    // Get public URL (we'll use signed URL since bucket is private)
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10 years

    if (!signedUrlData?.signedUrl) {
      return c.json({ error: 'Failed to generate URL' }, 500);
    }

    const imageUrl = signedUrlData.signedUrl;
    console.log('[POST /profile/upload-picture] Generated signed URL');

    // Update profile with new picture URL
    profile.profilePicture = imageUrl;
    profile.updatedAt = new Date().toISOString();
    await kv.set(`user:${userId}`, profile);

    console.log('[POST /profile/upload-picture] ✅ Profile picture updated successfully');

    return c.json({ 
      success: true, 
      imageUrl,
      profile 
    });
  } catch (error: any) {
    console.error('[POST /profile/upload-picture] Error:', error);
    return c.json({ error: error.message || 'Failed to upload picture' }, 500);
  }
});

// Delete profile picture
app.delete('/make-server-6d579fee/profile/delete-picture', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[DELETE /profile/delete-picture] Deleting profile picture for user:', userId);

    // Get user profile
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    if (!profile.profilePicture) {
      return c.json({ error: 'No profile picture to delete' }, 400);
    }

    // Create a Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const bucketName = 'make-6d579fee-profile-pictures';
    
    // Extract filename from URL
    const fileName = profile.profilePicture.split('/').pop()?.split('?')[0];
    if (fileName) {
      const filePath = `${userId}/${fileName}`;
      console.log('[DELETE /profile/delete-picture] Deleting file:', filePath);
      
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (deleteError) {
        console.error('[DELETE /profile/delete-picture] Delete error:', deleteError);
        // Continue anyway - we'll clear the URL from profile
      }
    }

    // Update profile to remove picture URL
    profile.profilePicture = null;
    profile.updatedAt = new Date().toISOString();
    await kv.set(`user:${userId}`, profile);

    console.log('[DELETE /profile/delete-picture] ✅ Profile picture deleted successfully');

    return c.json({ 
      success: true,
      profile 
    });
  } catch (error: any) {
    console.error('[DELETE /profile/delete-picture] Error:', error);
    return c.json({ error: error.message || 'Failed to delete picture' }, 500);
  }
});

// Export user data
app.get('/make-server-6d579fee/profile/export-data', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[GET /profile/export-data] Exporting data for user:', userId);

    // Get user profile
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Get journal entries
    const journalEntries = await kv.getByPrefix(`journal:${userId}:`);

    // Get prayer requests
    const prayers = await kv.getByPrefix(`prayer:${userId}:`);

    // Get milestones
    const milestones = await kv.getByPrefix(`milestone:${userId}:`);

    // Get question responses
    const responses = await kv.getByPrefix(`response:${userId}:`);

    // Get devotional progress
    const devotionalProgress = await kv.getByPrefix(`devotional-progress:${userId}:`);

    // Get mood entries
    const moodEntries = await kv.getByPrefix(`mood:${userId}:`);

    // Get notifications
    const notifications = await kv.getByPrefix(`notification:${userId}:`);

    // Prepare export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        bio: profile.bio,
        phone: profile.phone,
        location: profile.location,
        relationshipStart: profile.relationshipStart,
        inviteCode: profile.inviteCode,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      },
      journalEntries: journalEntries.map((entry: any) => ({
        id: entry.id,
        content: entry.content,
        title: entry.title,
        mood: entry.mood,
        isShared: entry.isShared,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      })),
      prayers: prayers.map((prayer: any) => ({
        id: prayer.id,
        title: prayer.title,
        description: prayer.description,
        status: prayer.status,
        isShared: prayer.isShared,
        category: prayer.category,
        createdAt: prayer.createdAt,
        updatedAt: prayer.updatedAt
      })),
      milestones: milestones.map((milestone: any) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        date: milestone.date,
        category: milestone.category,
        createdAt: milestone.createdAt
      })),
      responses: responses.map((response: any) => ({
        id: response.id,
        questionId: response.questionId,
        answer: response.answer,
        category: response.category,
        createdAt: response.createdAt
      })),
      devotionalProgress: devotionalProgress,
      moodEntries: moodEntries.map((mood: any) => ({
        id: mood.id,
        mood: mood.mood,
        note: mood.note,
        createdAt: mood.createdAt
      })),
      notifications: notifications.map((notif: any) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: notif.isRead,
        createdAt: notif.createdAt
      })),
      stats: {
        totalJournalEntries: journalEntries.length,
        totalPrayers: prayers.length,
        totalMilestones: milestones.length,
        totalResponses: responses.length,
        totalMoodEntries: moodEntries.length,
        totalNotifications: notifications.length
      }
    };

    console.log('[GET /profile/export-data] ✅ Data exported successfully');

    return c.json(exportData);
  } catch (error: any) {
    console.error('[GET /profile/export-data] Error:', error);
    return c.json({ error: error.message || 'Failed to export data' }, 500);
  }
});

// ============================================
// JOURNAL ENTRIES
// ============================================

app.get('/make-server-6d579fee/journal', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Reduced timeout - fail fast
    const queryTimeout = 5000; // 5 seconds
    
    const fetchWithTimeout = async (promise: Promise<any>, context: string) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), queryTimeout);
      });
      
      try {
        return await Promise.race([promise, timeoutPromise]);
      } catch (error: any) {
        console.error(`[GET /journal] ${context}:`, error.message);
        throw error;
      }
    };

    // Fetch user profile with fallback
    let profile = null;
    try {
      profile = await fetchWithTimeout(kv.get(`user:${userId}`), 'Profile');
    } catch (error) {
      console.error('[GET /journal] Profile fetch failed, continuing');
    }
    
    // Fetch user entries - critical, return empty if fails
    let userEntries: any[] = [];
    try {
      userEntries = await fetchWithTimeout(kv.getByPrefix(`journal:${userId}:`), 'User entries');
      console.log(`[GET /journal] Found ${userEntries.length} user entries`);
    } catch (error) {
      console.error('[GET /journal] User entries fetch timeout, returning empty');
      return c.json({ entries: [], warning: 'Could not load entries. Try again.' });
    }
    
    // Partner entries - optional
    let partnerEntries: any[] = [];
    if (profile?.partnerId) {
      try {
        const allPartnerEntries = await fetchWithTimeout(
          kv.getByPrefix(`journal:${profile.partnerId}:`), 
          'Partner entries'
        );
        partnerEntries = allPartnerEntries
          .filter((e: any) => e.isShared)
          .map((e: any) => ({ ...e, isPartner: true }));
        console.log(`[GET /journal] Found ${partnerEntries.length} partner entries`);
      } catch (error: any) {
        console.error('[GET /journal] Partner entries timeout, continuing');
      }
    }

    // Combine and limit
    const entries = [...userEntries, ...partnerEntries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);

    console.log(`[GET /journal] ✅ Returning ${entries.length} entries`);
    return c.json({ entries });
  } catch (error: any) {
    console.error('[GET /journal] Error:', error);
    
    // Provide specific error messages
    if (error.message?.includes('timeout')) {
      return c.json({ 
        error: 'Request timeout: The database query took too long. Please try again.' 
      }, 504); // Gateway Timeout
    }
    
    return c.json({ 
      error: error.message || 'Failed to fetch journal entries' 
    }, 500);
  }
});

app.post('/make-server-6d579fee/journal', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, content, isShared, emoji, location, entryType, mediaFiles, createdAt } = await c.req.json();

    // Content is required for journal entries, but optional for events
    if (entryType !== 'event' && !content) {
      return c.json({ error: 'Content is required for journal entries' }, 400);
    }

    // Title is always required
    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const entryId = generateId();
    const entry = {
      id: entryId,
      userId,
      title,
      content: content || '',
      isShared: isShared || false,
      emoji: emoji || (entryType === 'event' ? '✨' : '📝'),
      location: location || null,
      entryType: entryType || 'journal',
      mediaFiles: mediaFiles || [],
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`journal:${userId}:${entryId}`, entry);

    return c.json({ success: true, entry });
  } catch (error: any) {
    console.error('Journal create error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/journal/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const entryId = c.req.param('id');
    const updates = await c.req.json();

    // Try to find entry in user's entries first
    let entry = await kv.get(`journal:${userId}:${entryId}`);
    let entryKey = `journal:${userId}:${entryId}`;
    let isOwnEntry = true;
    
    // If not found, check if it's a partner's entry (for comments)
    if (!entry) {
      const profile = await kv.get(`user:${userId}`);
      const partnerId = profile?.partnerId;
      
      if (partnerId) {
        const partnerEntry = await kv.get(`journal:${partnerId}:${entryId}`);
        if (partnerEntry) {
          entry = partnerEntry;
          entryKey = `journal:${partnerId}:${entryId}`;
          isOwnEntry = false;
        }
      }
    }

    if (!entry) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    // Only allow certain fields to be updated on partner entries (like comments)
    let updatedEntry;
    if (isOwnEntry) {
      // Can update everything on own entries
      updatedEntry = {
        ...entry,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Only allow updating comments on partner entries
      updatedEntry = {
        ...entry,
        comments: updates.comments || entry.comments,
        updatedAt: new Date().toISOString()
      };
    }

    await kv.set(entryKey, updatedEntry);

    return c.json({ success: true, entry: updatedEntry });
  } catch (error: any) {
    console.error('Journal update error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/journal/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const entryId = c.req.param('id');
    const entryKey = `journal:${userId}:${entryId}`;
    
    console.log('[DELETE /journal/:id] Attempting to delete:', { userId, entryId, entryKey });
    
    // Check if entry exists before deleting
    const existingEntry = await kv.get(entryKey);
    console.log('[DELETE /journal/:id] Entry exists:', !!existingEntry);
    
    if (!existingEntry) {
      console.log('[DELETE /journal/:id] Entry not found');
      return c.json({ error: 'Entry not found' }, 404);
    }
    
    await kv.del(entryKey);
    console.log('[DELETE /journal/:id] Entry deleted successfully');
    
    // Verify deletion
    const verifyDeleted = await kv.get(entryKey);
    if (verifyDeleted) {
      console.error('[DELETE /journal/:id] ⚠️ WARNING: Entry still exists after deletion!');
      return c.json({ error: 'Delete failed - entry still exists' }, 500);
    }
    
    console.log('[DELETE /journal/:id] ✅ Deletion verified');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Journal delete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// PRAYER REQUESTS
// ============================================

app.get('/make-server-6d579fee/prayer', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Reduced timeout
    const queryTimeout = 5000;
    const fetchWithTimeout = async (promise: Promise<any>, context: string) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), queryTimeout);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } catch (error: any) {
        console.error(`[GET /prayer] ${context}:`, error.message);
        throw error;
      }
    };

    let profile = null;
    try {
      profile = await fetchWithTimeout(kv.get(`user:${userId}`), 'Profile');
    } catch (error) {
      console.error('[GET /prayer] Profile fetch failed');
    }
    
    let userPrayers: any[] = [];
    try {
      userPrayers = await fetchWithTimeout(kv.getByPrefix(`prayer:${userId}:`), 'User prayers');
    } catch (error) {
      console.error('[GET /prayer] User prayers timeout, returning empty');
      return c.json({ prayers: [], hasCoupleConnection: !!profile?.partnerId, warning: 'Could not load prayers. Try again.' });
    }
    
    let partnerPrayers: any[] = [];
    if (profile?.partnerId) {
      try {
        partnerPrayers = await fetchWithTimeout(kv.getByPrefix(`prayer:${profile.partnerId}:`), 'Partner prayers');
        partnerPrayers = partnerPrayers.map((p: any) => ({ ...p, isPartner: true }));
      } catch (error) {
        console.error('[GET /prayer] Partner prayers timeout, continuing');
      }
    }

    const prayers = [...userPrayers, ...partnerPrayers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 200);

    return c.json({ prayers, hasCoupleConnection: !!profile?.partnerId });
  } catch (error: any) {
    console.error('[GET /prayer] Error:', error);
    if (error.message?.includes('timeout')) {
      return c.json({ error: 'Request timeout. Please try again.' }, 504);
    }
    return c.json({ error: error.message || 'Failed to fetch prayers' }, 500);
  }
});

app.post('/make-server-6d579fee/prayer', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, description, isShared } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const prayerId = generateId();
    const prayer = {
      id: prayerId,
      userId,
      title,
      description: description || '',
      isShared: isShared || false,
      isAnswered: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`prayer:${userId}:${prayerId}`, prayer);

    return c.json({ success: true, prayer });
  } catch (error: any) {
    console.error('Prayer create error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/prayer/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const prayerId = c.req.param('id');
    const updates = await c.req.json();

    const prayer = await kv.get(`prayer:${userId}:${prayerId}`);
    if (!prayer) {
      return c.json({ error: 'Prayer not found' }, 404);
    }

    const updatedPrayer = {
      ...prayer,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`prayer:${userId}:${prayerId}`, updatedPrayer);

    return c.json({ success: true, prayer: updatedPrayer });
  } catch (error: any) {
    console.error('Prayer update error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/prayer/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const prayerId = c.req.param('id');
    await kv.del(`prayer:${userId}:${prayerId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Prayer delete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// MOODS
// ============================================

app.post('/make-server-6d579fee/moods', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { mood, note } = await c.req.json();

    const moodId = generateId();
    const moodEntry = {
      id: moodId,
      userId,
      mood,
      note: note || '',
      createdAt: new Date().toISOString()
    };

    await kv.set(`mood:${userId}:${moodId}`, moodEntry);

    return c.json({ success: true, mood: moodEntry });
  } catch (error: any) {
    console.error('Mood save error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/moods', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Reduced timeout
    const queryTimeout = 5000;
    const fetchWithTimeout = async (promise: Promise<any>, context: string) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), queryTimeout);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } catch (error: any) {
        console.error(`[GET /moods] ${context}:`, error.message);
        throw error;
      }
    };

    let profile = null;
    try {
      profile = await fetchWithTimeout(kv.get(`user:${userId}`), 'Profile');
    } catch (error) {
      console.error('[GET /moods] Profile fetch failed');
    }
    
    let userMoods: any[] = [];
    try {
      userMoods = await fetchWithTimeout(kv.getByPrefix(`mood:${userId}:`), 'User moods');
    } catch (error) {
      console.error('[GET /moods] User moods timeout, returning empty');
      return c.json({ moods: [], warning: 'Could not load moods. Try again.' });
    }
    
    let partnerMoods: any[] = [];
    if (profile?.partnerId) {
      try {
        partnerMoods = await fetchWithTimeout(kv.getByPrefix(`mood:${profile.partnerId}:`), 'Partner moods');
      } catch (error) {
        console.error('[GET /moods] Partner moods timeout, continuing');
      }
    }

    const allMoods = [...userMoods, ...partnerMoods]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 500);

    return c.json({ moods: allMoods });
  } catch (error: any) {
    console.error('[GET /moods] Error:', error);
    if (error.message?.includes('timeout')) {
      return c.json({ error: 'Request timeout. Please try again.' }, 504);
    }
    return c.json({ error: error.message || 'Failed to fetch moods' }, 500);
  }
});

// AI Mood Analysis - Analyze mood patterns using OpenAI
app.post('/make-server-6d579fee/moods/analyze', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile?.partnerId) {
      return c.json({ error: 'Partner required for mood analysis' }, 400);
    }

    // Get moods from the last 7 days for both partners
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userMoods = await kv.getByPrefix(`mood:${userId}:`);
    const partnerMoods = await kv.getByPrefix(`mood:${profile.partnerId}:`);

    const recentUserMoods = userMoods.filter((m: any) => 
      new Date(m.createdAt) >= sevenDaysAgo
    );
    const recentPartnerMoods = partnerMoods.filter((m: any) => 
      new Date(m.createdAt) >= sevenDaysAgo
    );

    if (recentUserMoods.length === 0 && recentPartnerMoods.length === 0) {
      return c.json({ 
        error: 'Not enough mood data to analyze. Track your moods for a few days first!' 
      }, 400);
    }

    // Prepare mood data for AI analysis
    const moodSummary = {
      userName: profile.name,
      userMoods: recentUserMoods.map((m: any) => ({
        mood: m.mood,
        note: m.note,
        date: new Date(m.createdAt).toLocaleDateString()
      })),
      partnerName: (await kv.get(`user:${profile.partnerId}`))?.name || 'Partner',
      partnerMoods: recentPartnerMoods.map((m: any) => ({
        mood: m.mood,
        note: m.note,
        date: new Date(m.createdAt).toLocaleDateString()
      }))
    };

    // Call OpenAI for analysis
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return c.json({ error: 'AI analysis not available. Please configure OpenAI API key.' }, 500);
    }
    
    // Validate API key format
    if (!openaiApiKey.startsWith('sk-')) {
      console.error('OpenAI API key appears invalid - should start with sk-');
      return c.json({ error: 'Invalid OpenAI API key format. Please check your API key.' }, 500);
    }
    
    console.log('Making OpenAI API call for mood analysis...');

    const prompt = `You are a Christian relationship counselor analyzing mood patterns for a couple using the TwoBeOne app.

Mood Data (Last 7 Days):
${profile.name}'s Moods: ${JSON.stringify(moodSummary.userMoods, null, 2)}
${moodSummary.partnerName}'s Moods: ${JSON.stringify(moodSummary.partnerMoods, null, 2)}

Provide a compassionate, faith-based analysis including:
1. Overall emotional trends for each partner
2. Patterns or correlations between their moods
3. Positive observations and celebrations
4. Gentle suggestions for spiritual and emotional growth
5. Bible verse or principle that relates to their journey
6. Specific prayer points for the couple

Keep the tone warm, encouraging, and Christ-centered. Limit response to 300 words.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate Christian relationship counselor specializing in emotional wellness and spiritual growth for couples.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      
      // Try to parse the error for more details
      let errorMessage = 'Failed to generate mood analysis';
      try {
        const errorJson = JSON.parse(error);
        errorMessage = errorJson.error?.message || errorMessage;
        
        // Only log quota errors once with minimal detail
        if (errorJson.error?.code === 'insufficient_quota' || 
            errorMessage.includes('quota') || 
            errorMessage.includes('billing')) {
          console.error('[Mood Analysis] OpenAI quota exceeded (status:', openaiResponse.status + ')');
          errorMessage = 'OpenAI API quota exceeded. Please add credits to your OpenAI account at https://platform.openai.com/account/billing to continue using AI analysis features.';
        } else if (errorJson.error?.code === 'invalid_api_key') {
          console.error('[Mood Analysis] Invalid OpenAI API key');
          errorMessage = 'Invalid OpenAI API key. Please update your API key in the environment variables.';
        } else if (errorJson.error?.code === 'rate_limit_exceeded') {
          console.error('[Mood Analysis] OpenAI rate limit exceeded');
          errorMessage = 'OpenAI rate limit exceeded. Please try again in a few moments.';
        } else {
          // Log other errors with more detail
          console.error('[Mood Analysis] OpenAI API error:', errorJson);
        }
      } catch (e) {
        console.error('[Mood Analysis] OpenAI error (could not parse):', error);
      }
      
      return c.json({ error: errorMessage }, 500);
    }

    const aiData = await openaiResponse.json();
    const analysis = aiData.choices[0].message.content;

    // Calculate simple statistics
    const moodValues: Record<string, number> = { great: 4, good: 3, okay: 2, sad: 1 };
    const userAvg = recentUserMoods.length > 0 
      ? recentUserMoods.reduce((sum: number, m: any) => sum + (moodValues[m.mood] || 0), 0) / recentUserMoods.length
      : 0;
    const partnerAvg = recentPartnerMoods.length > 0
      ? recentPartnerMoods.reduce((sum: number, m: any) => sum + (moodValues[m.mood] || 0), 0) / recentPartnerMoods.length
      : 0;

    const analysisResult = {
      id: generateId(),
      userId,
      analysis,
      period: {
        start: sevenDaysAgo.toISOString(),
        end: new Date().toISOString()
      },
      statistics: {
        userMoodCount: recentUserMoods.length,
        partnerMoodCount: recentPartnerMoods.length,
        userAverageMood: userAvg.toFixed(2),
        partnerAverageMood: partnerAvg.toFixed(2),
        userMoodDistribution: {
          great: recentUserMoods.filter((m: any) => m.mood === 'great').length,
          good: recentUserMoods.filter((m: any) => m.mood === 'good').length,
          okay: recentUserMoods.filter((m: any) => m.mood === 'okay').length,
          sad: recentUserMoods.filter((m: any) => m.mood === 'sad').length
        },
        partnerMoodDistribution: {
          great: recentPartnerMoods.filter((m: any) => m.mood === 'great').length,
          good: recentPartnerMoods.filter((m: any) => m.mood === 'good').length,
          okay: recentPartnerMoods.filter((m: any) => m.mood === 'okay').length,
          sad: recentPartnerMoods.filter((m: any) => m.mood === 'sad').length
        }
      },
      createdAt: new Date().toISOString()
    };

    // Save analysis
    await kv.set(`mood-analysis:${userId}:${analysisResult.id}`, analysisResult);

    return c.json({ analysis: analysisResult });
  } catch (error: any) {
    console.error('Mood analysis error:', error);
    console.error('Error stack:', error.stack);
    const errorMessage = error.message || 'Failed to generate mood analysis';
    return c.json({ error: errorMessage }, 500);
  }
});

// Test OpenAI API key endpoint
app.get('/make-server-6d579fee/moods/test-openai', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return c.json({ 
        configured: false, 
        message: 'OpenAI API key is not configured' 
      });
    }
    
    if (!openaiApiKey.startsWith('sk-')) {
      return c.json({ 
        configured: true, 
        valid: false,
        message: 'OpenAI API key format appears invalid (should start with sk-)' 
      });
    }

    // Try a simple test call to OpenAI
    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        }
      });

      if (testResponse.ok) {
        return c.json({ 
          configured: true, 
          valid: true,
          message: 'OpenAI API key is working correctly!' 
        });
      } else {
        const error = await testResponse.text();
        return c.json({ 
          configured: true, 
          valid: false,
          message: `OpenAI API key test failed: ${testResponse.status}`,
          details: error
        });
      }
    } catch (fetchError: any) {
      return c.json({ 
        configured: true, 
        valid: false,
        message: 'Failed to connect to OpenAI API',
        details: fetchError.message
      });
    }
  } catch (error: any) {
    console.error('OpenAI test error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get mood analysis history
app.get('/make-server-6d579fee/moods/analysis', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const analyses = await kv.getByPrefix(`mood-analysis:${userId}:`);
    const sortedAnalyses = analyses.sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ analyses: sortedAnalyses });
  } catch (error: any) {
    console.error('Analysis fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Generate and send weekly mood report to both partners
app.post('/make-server-6d579fee/moods/weekly-report', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile?.partnerId) {
      return c.json({ error: 'Partner required for weekly reports' }, 400);
    }

    const partner = await kv.get(`user:${profile.partnerId}`);

    // Get moods from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userMoods = await kv.getByPrefix(`mood:${userId}:`);
    const partnerMoods = await kv.getByPrefix(`mood:${profile.partnerId}:`);

    const recentUserMoods = userMoods.filter((m: any) => 
      new Date(m.createdAt) >= sevenDaysAgo
    );
    const recentPartnerMoods = partnerMoods.filter((m: any) => 
      new Date(m.createdAt) >= sevenDaysAgo
    );

    if (recentUserMoods.length === 0 && recentPartnerMoods.length === 0) {
      return c.json({ 
        error: 'Not enough mood data for a weekly report. Keep tracking your moods!' 
      }, 400);
    }

    // Calculate statistics
    const moodValues: Record<string, number> = { great: 4, good: 3, okay: 2, sad: 1 };
    const userAvg = recentUserMoods.length > 0 
      ? recentUserMoods.reduce((sum: number, m: any) => sum + (moodValues[m.mood] || 0), 0) / recentUserMoods.length
      : 0;
    const partnerAvg = recentPartnerMoods.length > 0
      ? recentPartnerMoods.reduce((sum: number, m: any) => sum + (moodValues[m.mood] || 0), 0) / recentPartnerMoods.length
      : 0;

    // Generate AI analysis
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    let aiAnalysis = 'AI analysis unavailable. Please track moods and check back next week!';

    if (openaiApiKey) {
      const moodSummary = {
        userName: profile.name,
        userMoods: recentUserMoods.map((m: any) => ({
          mood: m.mood,
          note: m.note,
          date: new Date(m.createdAt).toLocaleDateString()
        })),
        partnerName: partner?.name || 'Partner',
        partnerMoods: recentPartnerMoods.map((m: any) => ({
          mood: m.mood,
          note: m.note,
          date: new Date(m.createdAt).toLocaleDateString()
        }))
      };

      const prompt = `Create a brief weekly mood report for a Christian couple:

${profile.name}: ${recentUserMoods.length} mood entries, average ${userAvg.toFixed(1)}/4
${partner?.name}: ${recentPartnerMoods.length} mood entries, average ${partnerAvg.toFixed(1)}/4

Recent moods:
${profile.name}: ${moodSummary.userMoods.map(m => `${m.mood} (${m.date})`).join(', ')}
${partner?.name}: ${moodSummary.partnerMoods.map(m => `${m.mood} (${m.date})`).join(', ')}

Provide:
1. A warm, encouraging summary (2-3 sentences)
2. One specific observation about their emotional journey
3. A relevant Bible verse or spiritual encouragement
4. One actionable suggestion for the week ahead

Keep it under 150 words, loving and Christ-centered.`;

      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a compassionate Christian counselor creating encouraging weekly mood reports for couples.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 300
          })
        });

        if (openaiResponse.ok) {
          const aiData = await openaiResponse.json();
          aiAnalysis = aiData.choices[0].message.content;
        } else {
          const error = await openaiResponse.text();
          
          // Try to parse error for specific messages
          try {
            const errorJson = JSON.parse(error);
            const errorMsg = errorJson.error?.message || '';
            
            // Only log quota errors once with minimal detail
            if (errorJson.error?.code === 'insufficient_quota' || 
                errorMsg.includes('quota') || 
                errorMsg.includes('billing')) {
              console.error('[Weekly Report] OpenAI quota exceeded (status:', openaiResponse.status + ')');
              aiAnalysis = '⚠️ AI analysis temporarily unavailable due to quota limits. Your mood statistics are still tracked below! To enable AI features, please add credits to your OpenAI account.';
            } else if (errorMsg.includes('rate_limit')) {
              console.error('[Weekly Report] OpenAI rate limit exceeded');
              aiAnalysis = 'AI analysis is experiencing high demand. Your mood statistics are available below. Try again in a few moments for AI insights.';
            } else {
              console.error('[Weekly Report] OpenAI API error:', errorJson);
            }
          } catch (e) {
            console.error('[Weekly Report] OpenAI error (could not parse):', error);
          }
        }
      } catch (error) {
        console.error('AI analysis generation failed:', error);
      }
    }

    // Create notifications for both partners
    const reportSummary = `Weekly Mood Report: ${profile.name} (${userAvg.toFixed(1)}/4) & ${partner?.name || 'Partner'} (${partnerAvg.toFixed(1)}/4)`;

    // Notification for user
    const userNotificationId = generateId();
    const userNotification = {
      id: userNotificationId,
      userId,
      type: 'mood_report',
      title: '💝 Weekly Mood Report',
      message: reportSummary,
      data: {
        analysis: aiAnalysis,
        userAverage: userAvg.toFixed(1),
        partnerAverage: partnerAvg.toFixed(1),
        period: `${sevenDaysAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`
      },
      read: false,
      createdAt: new Date().toISOString()
    };

    // Notification for partner
    const partnerNotificationId = generateId();
    const partnerNotification = {
      id: partnerNotificationId,
      userId: profile.partnerId,
      type: 'mood_report',
      title: '💝 Weekly Mood Report',
      message: reportSummary,
      data: {
        analysis: aiAnalysis,
        userAverage: partnerAvg.toFixed(1),
        partnerAverage: userAvg.toFixed(1),
        period: `${sevenDaysAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`
      },
      read: false,
      createdAt: new Date().toISOString()
    };

    await kv.set(`notification:${userId}:${userNotificationId}`, userNotification);
    await kv.set(`notification:${profile.partnerId}:${partnerNotificationId}`, partnerNotification);

    console.log(`[Weekly Report] Generated for ${profile.name} & ${partner?.name}`);

    return c.json({ 
      success: true, 
      report: {
        analysis: aiAnalysis,
        userAverage: userAvg.toFixed(1),
        partnerAverage: partnerAvg.toFixed(1),
        userMoodCount: recentUserMoods.length,
        partnerMoodCount: recentPartnerMoods.length
      }
    });
  } catch (error: any) {
    console.error('Weekly report error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// NOTIFICATIONS
// ============================================

app.get('/make-server-6d579fee/notifications', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notifications = await kv.getByPrefix(`notification:${userId}:`) || [];
    console.log('[Notifications] Raw notifications:', notifications);
    
    // Ensure notifications is an array and has valid data
    const validNotifications = Array.isArray(notifications) 
      ? notifications.filter(n => n && typeof n === 'object')
      : [];
    
    const sortedNotifications = validNotifications.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return c.json({ notifications: sortedNotifications });
  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    return c.json({ error: error.message || 'Failed to fetch notifications' }, 500);
  }
});

app.post('/make-server-6d579fee/notifications', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { recipientId, type, title, message, data } = await c.req.json();

    if (!recipientId || !type || !title || !message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const notificationId = generateId();
    const notification = {
      id: notificationId,
      recipientId,
      senderId: userId,
      type,
      title,
      message,
      data: data || null,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    await kv.set(`notification:${recipientId}:${notificationId}`, notification);

    return c.json({ success: true, notification });
  } catch (error: any) {
    console.error('Notification create error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Mark notification as read
app.patch('/make-server-6d579fee/notifications/:id/read', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    const notification = await kv.get(`notification:${userId}:${notificationId}`);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    const updatedNotification = {
      ...notification,
      isRead: true,
      readAt: new Date().toISOString()
    };

    await kv.set(`notification:${userId}:${notificationId}`, updatedNotification);

    return c.json({ success: true, notification: updatedNotification });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// Mark all notifications as read
app.post('/make-server-6d579fee/notifications/read-all', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notifications = await kv.getByPrefix(`notification:${userId}:`);
    
    for (const notification of notifications) {
      if (!notification.isRead) {
        const updated = {
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        };
        await kv.set(`notification:${userId}:${notification.id}`, updated);
      }
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    return c.json({ error: 'Failed to mark all notifications as read' }, 500);
  }
});

// Delete a notification
app.delete('/make-server-6d579fee/notifications/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    await kv.del(`notification:${userId}:${notificationId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

// ============================================
// QUESTIONS & ANSWERS
// ============================================

// Get today's daily question
app.get('/make-server-6d579fee/daily-question', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    const userResponses = await kv.getByPrefix(`response:${userId}:`);
    
    let partnerResponses: any[] = [];
    if (profile?.partnerId) {
      const allPartnerResponses = await kv.getByPrefix(`response:${profile.partnerId}:`);
      partnerResponses = allPartnerResponses.filter((r: any) => !r.isPrivate);
    }

    return c.json({ userResponses, partnerResponses });
  } catch (error: any) {
    console.error('Responses fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-6d579fee/question-responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { question_id, response, is_private } = await c.req.json();

    const responseId = generateId();
    const responseEntry = {
      id: responseId,
      userId,
      questionId: question_id,
      response,
      isPrivate: is_private || false,
      createdAt: new Date().toISOString()
    };

    await kv.set(`response:${userId}:${question_id}`, responseEntry);

    return c.json({ success: true, response: responseEntry });
  } catch (error: any) {
    console.error('Response save error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get question responses
app.get('/make-server-6d579fee/question-responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');

    // Reduced timeout
    const queryTimeout = 5000;
    const fetchWithTimeout = async (promise: Promise<any>, context: string) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), queryTimeout);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } catch (error: any) {
        console.error(`[GET /question-responses] ${context}:`, error.message);
        throw error;
      }
    };

    let userResponses: any[] = [];
    try {
      const allUserResponses = await fetchWithTimeout(kv.getByPrefix(`response:${userId}:`), 'User responses');
      userResponses = allUserResponses || [];
      
      // Filter by category if specified
      if (category) {
        userResponses = userResponses.filter((r: any) => r.category === category);
      }
    } catch (error) {
      console.error('[GET /question-responses] User responses timeout, returning empty');
      return c.json({ userResponses: [], partnerResponses: [], warning: 'Could not load responses. Try again.' });
    }

    let userProfile = null;
    try {
      userProfile = await fetchWithTimeout(kv.get(`user:${userId}`), 'Profile');
    } catch (error) {
      console.error('[GET /question-responses] Profile fetch failed');
    }
    
    let partnerResponses: any[] = [];
    if (userProfile?.partnerId) {
      try {
        const allPartnerResponses = await fetchWithTimeout(kv.getByPrefix(`response:${userProfile.partnerId}:`), 'Partner responses');
        partnerResponses = (allPartnerResponses || []).filter((r: any) => !r.isPrivate);
        
        if (category) {
          partnerResponses = partnerResponses.filter((r: any) => r.category === category);
        }
      } catch (error) {
        console.error('[GET /question-responses] Partner responses timeout, continuing');
      }
    }

    return c.json({ 
      userResponses, 
      partnerResponses 
    });
  } catch (error: any) {
    console.error('[GET /question-responses] Error:', error);
    if (error.message?.includes('timeout')) {
      return c.json({ error: 'Request timeout. Please try again.' }, 504);
    }
    return c.json({ error: error.message || 'Failed to fetch responses' }, 500);
  }
});

// ============================================
// QUESTION CHAT
// ============================================

// Get question chat messages
app.get('/make-server-6d579fee/question-chat/:questionId', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const questionId = c.req.param('questionId');
    console.log('Loading messages for questionId:', questionId);
    
    // Get user profile to check for partner
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      console.error('Profile not found for userId:', userId);
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Get all messages for this question chat
    const prefix = `question_chat:${questionId}:`;
    console.log('Searching with prefix:', prefix);
    const messages = await kv.getByPrefix(prefix);
    console.log('Raw messages from KV:', messages);
    
    const filteredMessages = messages
      .filter(msg => msg && msg.userId && msg.message) // Filter out any null or invalid messages
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log('Filtered and sorted messages:', filteredMessages);

    return c.json({ messages: filteredMessages });
  } catch (error: any) {
    console.error('Get question chat error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Send question chat message
app.post('/make-server-6d579fee/question-chat', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { question_id, message } = await c.req.json();
    console.log('Received question chat request:', { userId, question_id, message });
    
    if (!question_id || !message) {
      console.error('Missing fields:', { question_id, message });
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get user profile for name
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      console.error('Profile not found for userId:', userId);
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Create message object
    const messageId = generateId();
    const messageObj = {
      id: messageId,
      userId,
      userName: profile.name || 'Unknown',
      message,
      timestamp: new Date().toISOString()
    };

    // Store message
    const key = `question_chat:${question_id}:${messageId}`;
    console.log('Storing message with key:', key);
    await kv.set(key, messageObj);
    console.log('Message stored successfully:', messageObj);

    return c.json({ message: messageObj }, 201);
  } catch (error: any) {
    console.error('Send question chat message error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// DEVOTIONALS
// ============================================

// Get all devotionals (admin-created only)
app.get('/make-server-6d579fee/devotions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all devotionals from KV store (only admin-created ones)
    const allDevotionals = await kv.getByPrefix('devotional:');
    
    // Filter to only published devotionals
    const publishedDevotionals = allDevotionals.filter((d: any) => d.status === 'published');
    
    return c.json({ devotions: publishedDevotionals });
  } catch (error: any) {
    console.error('Devotions fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/devotions/today', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Get all published devotionals
    const allDevotionals = await kv.getByPrefix('devotional:');
    const publishedDevotionals = allDevotionals.filter((d: any) => d.status === 'published');
    
    // Find today's devotional by date, or return the most recent one
    const todayDevotional = publishedDevotionals.find((d: any) => d.date === today);
    const devotion = todayDevotional || publishedDevotionals[publishedDevotionals.length - 1] || null;
    
    return c.json({ devotion });
  } catch (error: any) {
    console.error('Today devotion fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-6d579fee/devotional-completions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { devotion_id, notes } = await c.req.json();
    
    const today = new Date().toISOString().split('T')[0];
    const completionId = generateId();
    const completion = {
      id: completionId,
      userId,
      devotionId: devotion_id,
      notes: notes || '',
      completedAt: new Date().toISOString()
    };

    // Store with date in key so we can have multiple completions of same devotional on different days
    await kv.set(`completion:${userId}:${today}:${devotion_id}`, completion);

    // Update or create devotional streak
    const streakKey = `streak:${userId}:devotional`;
    const existingStreak = await kv.get(streakKey);
    
    console.log('[Devotional Completion] Updating streak:', { 
      userId, 
      today, 
      existingStreak,
      streakKey 
    });

    if (!existingStreak) {
      // Create new streak
      const newStreak = {
        userId,
        streak_type: 'devotional',
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today
      };
      console.log('[Devotional Completion] Creating new streak:', newStreak);
      await kv.set(streakKey, newStreak);
    } else {
      // Update existing streak
      const lastDate = existingStreak.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCurrentStreak = existingStreak.current_streak;
      
      console.log('[Devotional Completion] Streak calculation:', {
        lastDate,
        today,
        yesterdayStr,
        isToday: lastDate === today,
        isYesterday: lastDate === yesterdayStr,
        currentStreak: existingStreak.current_streak
      });

      if (lastDate === today) {
        // Already completed today, don't increment
        newCurrentStreak = existingStreak.current_streak;
        console.log('[Devotional Completion] Already completed today, keeping streak:', newCurrentStreak);
      } else if (lastDate === yesterdayStr) {
        // Consecutive day
        newCurrentStreak = existingStreak.current_streak + 1;
        console.log('[Devotional Completion] Consecutive day! Incrementing streak to:', newCurrentStreak);
      } else {
        // Streak broken
        newCurrentStreak = 1;
        console.log('[Devotional Completion] Streak broken, resetting to 1');
      }

      const updatedStreak = {
        ...existingStreak,
        current_streak: newCurrentStreak,
        longest_streak: Math.max(newCurrentStreak, existingStreak.longest_streak || 0),
        last_activity_date: today
      };
      console.log('[Devotional Completion] Saving updated streak:', updatedStreak);
      await kv.set(streakKey, updatedStreak);
    }

    return c.json({ success: true, completion });
  } catch (error: any) {
    console.error('Completion save error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/devotional-completions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const completions = await kv.getByPrefix(`completion:${userId}:`);
    return c.json({ completions });
  } catch (error: any) {
    console.error('Completions fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// STREAKS
// ============================================

app.get('/make-server-6d579fee/streaks', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const streaks = await kv.getByPrefix(`streak:${userId}:`);
    return c.json({ streaks });
  } catch (error: any) {
    console.error('Streaks fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// MILESTONES
// ============================================

app.get('/make-server-6d579fee/milestones', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Reduced timeout
    const queryTimeout = 5000;
    const fetchWithTimeout = async (promise: Promise<any>, context: string) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), queryTimeout);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } catch (error: any) {
        console.error(`[GET /milestones] ${context}:`, error.message);
        throw error;
      }
    };

    let profile = null;
    try {
      profile = await fetchWithTimeout(kv.get(`user:${userId}`), 'Profile');
    } catch (error) {
      console.error('[GET /milestones] Profile fetch failed');
    }
    
    let userMilestones: any[] = [];
    try {
      userMilestones = await fetchWithTimeout(kv.getByPrefix(`milestone:${userId}:`), 'User milestones');
    } catch (error) {
      console.error('[GET /milestones] User milestones timeout, returning empty');
      return c.json({ milestones: [], warning: 'Could not load milestones. Try again.' });
    }
    
    let partnerMilestones: any[] = [];
    if (profile?.partnerId) {
      try {
        partnerMilestones = await fetchWithTimeout(kv.getByPrefix(`milestone:${profile.partnerId}:`), 'Partner milestones');
      } catch (error) {
        console.error('[GET /milestones] Partner milestones timeout, continuing');
      }
    }

    const milestones = [...userMilestones, ...partnerMilestones]
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .slice(0, 200);

    return c.json({ milestones });
  } catch (error: any) {
    console.error('[GET /milestones] Error:', error);
    if (error.message?.includes('timeout')) {
      return c.json({ error: 'Request timeout. Please try again.' }, 504);
    }
    return c.json({ error: error.message || 'Failed to fetch milestones' }, 500);
  }
});

app.post('/make-server-6d579fee/milestones', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, description, date, category } = await c.req.json();

    const milestoneId = generateId();
    const milestone = {
      id: milestoneId,
      userId,
      title,
      description: description || '',
      date: date || new Date().toISOString(),
      category: category || 'general',
      createdAt: new Date().toISOString()
    };

    await kv.set(`milestone:${userId}:${milestoneId}`, milestone);

    return c.json({ success: true, milestone });
  } catch (error: any) {
    console.error('Milestone create error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/milestones/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const milestoneId = c.req.param('id');
    await kv.del(`milestone:${userId}:${milestoneId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Milestone delete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// BIBLE HIGHLIGHTS
// ============================================

// Get all Bible highlights
app.get('/make-server-6d579fee/highlights', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userHighlights = await kv.getByPrefix(`highlight:${userId}:`);
    
    return c.json({ highlights: userHighlights });
  } catch (error: any) {
    console.error('Highlights fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save a Bible highlight
app.post('/make-server-6d579fee/highlight', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { reference, verseNumber, text, color, note } = await c.req.json();

    const highlightId = generateId();
    const highlight = {
      id: highlightId,
      userId,
      reference,
      verseNumber,
      text,
      color,
      note: note || null,
      createdAt: new Date().toISOString()
    };

    await kv.set(`highlight:${userId}:${highlightId}`, highlight);

    return c.json({ success: true, highlight });
  } catch (error: any) {
    console.error('Highlight save error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete a Bible highlight
app.delete('/make-server-6d579fee/highlight/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const highlightId = c.req.param('id');
    await kv.del(`highlight:${userId}:${highlightId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Highlight delete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Share verse with partner
app.post('/make-server-6d579fee/share-verse', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile?.partnerId) {
      return c.json({ error: 'No partner linked' }, 400);
    }

    const { reference, verseNumber, text, note } = await c.req.json();

    // Save highlight to partner's bookmarks
    const highlightId = generateId();
    const highlight = {
      id: highlightId,
      userId: profile.partnerId, // Save under partner's ID
      reference,
      verseNumber,
      text,
      color: 'yellow', // Default color for shared verses
      note: note || `Shared by ${profile.name}`,
      sharedBy: profile.name,
      sharedById: userId,
      createdAt: new Date().toISOString()
    };

    await kv.set(`highlight:${profile.partnerId}:${highlightId}`, highlight);

    // Create a notification for partner
    const notificationId = generateId();
    const notification = {
      id: notificationId,
      userId: profile.partnerId,
      type: 'verse_shared',
      title: `${profile.name} shared a verse with you`,
      message: `${reference} - "${text.substring(0, 100)}..."`,
      data: {
        reference,
        verseNumber,
        text,
        note,
        sharedBy: profile.name,
        highlightId // Include highlight ID so we can link to it
      },
      read: false,
      createdAt: new Date().toISOString()
    };

    await kv.set(`notification:${profile.partnerId}:${notificationId}`, notification);

    return c.json({ success: true, notification, highlight });
  } catch (error: any) {
    console.error('Share verse error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// PRAYER TOGETHER CHAT
// ============================================

// Get prayer chat messages for a devotional
app.get('/make-server-6d579fee/devotions/:devotionId/prayer-chat', async (c) => {
  try {
    const devotionId = c.req.param('devotionId');
    const userId = await getUserFromToken(c.req.header('Authorization'));

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user profile to check if they have a partner
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Get all messages for this devotional
    const allMessages = await kv.getByPrefix(`prayer-chat:${devotionId}:`);
    
    // Filter messages to only include those from the user and their partner
    const messages = allMessages
      .filter((msg: any) => 
        msg.userId === userId || 
        (profile.partnerId && msg.userId === profile.partnerId)
      )
      .sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    return c.json({ messages });
  } catch (error: any) {
    console.error('Get prayer chat error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Post a message to prayer chat
app.post('/make-server-6d579fee/devotions/:devotionId/prayer-chat', async (c) => {
  try {
    const devotionId = c.req.param('devotionId');
    const userId = await getUserFromToken(c.req.header('Authorization'));

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { message } = await c.req.json();

    if (!message || !message.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get user profile
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Create message
    const messageId = generateId();
    const prayerMessage = {
      id: messageId,
      devotionId,
      userId,
      userName: profile.name,
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    // Save message
    await kv.set(`prayer-chat:${devotionId}:${messageId}`, prayerMessage);

    // Send notification to partner if they exist
    if (profile.partnerId) {
      const notificationId = generateId();
      const notification = {
        id: notificationId,
        recipientId: profile.partnerId,
        senderId: userId,
        type: 'devotional',
        title: 'New Prayer Message',
        message: `${profile.name} shared a prayer thought`,
        data: { devotionId, messagePreview: message.substring(0, 50) },
        isRead: false,
        createdAt: new Date().toISOString()
      };

      await kv.set(`notification:${profile.partnerId}:${notificationId}`, notification);
    }

    return c.json({ message: prayerMessage });
  } catch (error: any) {
    console.error('Post prayer chat error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Get all users (admin only)
app.get('/make-server-6d579fee/admin/users', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // Fetch all users
    const allUsers = await kv.getByPrefix('user:');
    
    // Filter out system keys and format user data
    const users = allUsers
      .filter((u: any) => u.id && u.email)
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        partnerId: u.partnerId || null,
        partnerName: u.partnerName || null,
        createdAt: u.createdAt,
        relationshipStart: u.relationshipStart
      }));

    return c.json({ users });
  } catch (error: any) {
    console.error('Admin users fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete user (admin only)
app.delete('/make-server-6d579fee/admin/users/:userId', async (c) => {
  try {
    const adminUserId = await getUserFromToken(c.req.header('Authorization'));
    if (!adminUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const adminProfile = await kv.get(`user:${adminUserId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const userIdToDelete = c.req.param('userId');
    console.log('[DELETE /admin/users/:userId] Deleting user:', userIdToDelete);

    // Get user data before deletion
    const userToDelete = await kv.get(`user:${userIdToDelete}`);
    if (!userToDelete) {
      return c.json({ error: 'User not found' }, 404);
    }

    console.log('[DELETE /admin/users/:userId] User found:', userToDelete);

    // Delete all user-related data
    const keysToDelete = [];

    // 1. User profile
    keysToDelete.push(`user:${userIdToDelete}`);

    // 2. Invite code
    if (userToDelete.inviteCode) {
      keysToDelete.push(`invite:${userToDelete.inviteCode}`);
    }

    // 3. Couple relationship
    if (userToDelete.coupleId) {
      keysToDelete.push(`couple:${userToDelete.coupleId}`);
      
      // Update partner's profile to remove the link
      if (userToDelete.partnerId) {
        const partner = await kv.get(`user:${userToDelete.partnerId}`);
        if (partner) {
          await kv.set(`user:${userToDelete.partnerId}`, {
            ...partner,
            partnerId: null,
            coupleId: null,
            partnerName: null
          });
        }
      }
    }

    // 4. Journal entries
    const journalEntries = await kv.getByPrefix(`journal:${userIdToDelete}:`);
    journalEntries.forEach((entry: any) => {
      if (entry.id) {
        keysToDelete.push(`journal:${userIdToDelete}:${entry.id}`);
      }
    });

    // 5. Prayer requests
    const prayers = await kv.getByPrefix(`prayer:${userIdToDelete}:`);
    prayers.forEach((prayer: any) => {
      if (prayer.id) {
        keysToDelete.push(`prayer:${userIdToDelete}:${prayer.id}`);
      }
    });

    // 6. Milestones
    const milestones = await kv.getByPrefix(`milestone:${userIdToDelete}:`);
    milestones.forEach((milestone: any) => {
      if (milestone.id) {
        keysToDelete.push(`milestone:${userIdToDelete}:${milestone.id}`);
      }
    });

    // 7. Question responses
    const responses = await kv.getByPrefix(`response:${userIdToDelete}:`);
    responses.forEach((response: any) => {
      const key = `response:${userIdToDelete}:${response.questionId}`;
      keysToDelete.push(key);
    });

    // 8. Devotional completions
    const completions = await kv.getByPrefix(`completion:${userIdToDelete}:`);
    completions.forEach((completion: any) => {
      if (completion.devotionId && completion.completedAt) {
        const date = new Date(completion.completedAt).toISOString().split('T')[0];
        keysToDelete.push(`completion:${userIdToDelete}:${date}:${completion.devotionId}`);
      }
    });

    // 9. Streaks
    const streaks = await kv.getByPrefix(`streak:${userIdToDelete}:`);
    streaks.forEach((streak: any) => {
      if (streak.streak_type) {
        keysToDelete.push(`streak:${userIdToDelete}:${streak.streak_type}`);
      }
    });

    // 10. Notifications
    const notifications = await kv.getByPrefix(`notification:${userIdToDelete}:`);
    notifications.forEach((notification: any) => {
      if (notification.id) {
        keysToDelete.push(`notification:${userIdToDelete}:${notification.id}`);
      }
    });

    // 11. Scripture memory progress
    const scriptureProgress = await kv.getByPrefix(`scripture-progress:${userIdToDelete}:`);
    scriptureProgress.forEach((progress: any) => {
      if (progress.verseId) {
        keysToDelete.push(`scripture-progress:${userIdToDelete}:${progress.verseId}`);
      }
    });

    console.log('[DELETE /admin/users/:userId] Deleting', keysToDelete.length, 'keys');

    // Delete all keys
    await kv.mdel(keysToDelete);

    // Also delete from Supabase Auth if needed
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.admin.deleteUser(userIdToDelete);
      if (error) {
        console.error('[DELETE /admin/users/:userId] Supabase Auth deletion error:', error);
        // Continue even if auth deletion fails
      } else {
        console.log('[DELETE /admin/users/:userId] Supabase Auth user deleted');
      }
    } catch (authError) {
      console.error('[DELETE /admin/users/:userId] Auth deletion failed:', authError);
      // Continue even if auth deletion fails
    }

    console.log('[DELETE /admin/users/:userId] User deletion complete');

    return c.json({ 
      success: true, 
      message: `User ${userToDelete.name} (${userToDelete.email}) deleted successfully`,
      keysDeleted: keysToDelete.length
    });
  } catch (error: any) {
    console.error('Admin delete user error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get all devotionals (admin only)
app.get('/make-server-6d579fee/admin/devotionals', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // Fetch all devotional completions for stats
    const completions = await kv.getByPrefix('completion:');
    
    return c.json({ 
      devotionals: [], // Devotionals are stored in frontend data/devotionals.ts
      totalCompletions: completions.length
    });
  } catch (error: any) {
    console.error('Admin devotionals fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get all questions (admin only)
app.get('/make-server-6d579fee/admin/questions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // Fetch all question responses for stats
    const responses = await kv.getByPrefix('response:');
    
    return c.json({ 
      questions: [], // Questions are stored in frontend data
      totalResponses: responses.length
    });
  } catch (error: any) {
    console.error('Admin questions fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get recent activity (admin only)
app.get('/make-server-6d579fee/admin/recent-activity', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // Gather recent activities from different sources
    const activities: any[] = [];

    // Recent journal entries
    const journals = await kv.getByPrefix('journal:');
    journals.slice(0, 10).forEach((j: any) => {
      activities.push({
        action: 'Journal entry created',
        user: j.authorName || 'Unknown',
        time: formatTimeAgo(j.createdAt),
        timestamp: j.createdAt
      });
    });

    // Recent prayers
    const prayers = await kv.getByPrefix('prayer:');
    prayers.slice(0, 10).forEach((p: any) => {
      activities.push({
        action: 'Prayer request added',
        user: p.authorName || 'Unknown',
        time: formatTimeAgo(p.createdAt),
        timestamp: p.createdAt
      });
    });

    // Recent devotional completions
    const completions = await kv.getByPrefix('completion:');
    completions.slice(0, 10).forEach((c: any) => {
      activities.push({
        action: 'Devotional completed',
        user: c.userName || 'Unknown',
        time: formatTimeAgo(c.completedAt),
        timestamp: c.completedAt
      });
    });

    // Sort by timestamp and return top 20
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({ activities: activities.slice(0, 20) });
  } catch (error: any) {
    console.error('Admin activity fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Helper function to format time ago
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return then.toLocaleDateString();
}

// ============================================
// ADMIN CRUD ROUTES
// ============================================

// Devotionals Management
app.post('/make-server-6d579fee/admin/devotionals', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotional = await c.req.json();
    const devotionalId = devotional.id || generateId();
    
    const devotionalData = {
      ...devotional,
      id: devotionalId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[Devotional] Creating devotional: ${devotionalId}`);
    await kv.set(`devotional:${devotionalId}`, devotionalData);
    
    // Verify it was saved
    const saved = await kv.get(`devotional:${devotionalId}`);
    console.log(`[Devotional] ✅ Verified saved devotional: ${saved ? 'exists' : 'NOT FOUND'}`);

    return c.json({ success: true, devotionalId });
  } catch (error: any) {
    console.error('Admin create devotional error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/admin/devotionals/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotionalId = c.req.param('id');
    const updates = await c.req.json();
    
    console.log(`[Devotional] Updating devotional: ${devotionalId}`);
    const existing = await kv.get(`devotional:${devotionalId}`);
    if (!existing) {
      console.error(`[Devotional] ❌ Devotional not found: ${devotionalId}`);
      return c.json({ error: 'Devotional not found' }, 404);
    }

    const updatedData = {
      ...existing,
      ...updates,
      id: devotionalId,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`devotional:${devotionalId}`, updatedData);
    console.log(`[Devotional] ✅ Devotional updated: ${devotionalId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin update devotional error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/admin/devotionals/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotionalId = c.req.param('id');
    await kv.del(`devotional:${devotionalId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete devotional error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/admin/devotionals/list', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotionals = await kv.getByPrefix('devotional:');
    return c.json({ devotionals });
  } catch (error: any) {
    console.error('Admin list devotionals error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Questions Management
app.post('/make-server-6d579fee/admin/questions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const question = await c.req.json();
    const questionId = question.id || generateId();
    
    const questionData = {
      ...question,
      id: questionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Creating question with data:', JSON.stringify(questionData, null, 2));
    
    await kv.set(`question:${questionId}`, questionData);
    
    // Verify it was saved
    const saved = await kv.get(`question:${questionId}`);
    console.log('Verified saved question:', JSON.stringify(saved, null, 2));

    return c.json({ success: true, questionId });
  } catch (error: any) {
    console.error('Admin create question error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/admin/questions/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const questionId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`question:${questionId}`);
    if (!existing) {
      return c.json({ error: 'Question not found' }, 404);
    }

    await kv.set(`question:${questionId}`, {
      ...existing,
      ...updates,
      id: questionId,
      updatedAt: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin update question error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/admin/questions/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const questionId = c.req.param('id');
    await kv.del(`question:${questionId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete question error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/admin/questions/list', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const questions = await kv.getByPrefix('question:');
    return c.json({ questions });
  } catch (error: any) {
    console.error('Admin list questions error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Clear all questions and responses (admin only)
app.delete('/make-server-6d579fee/admin/questions/clear-all', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // Get all questions and responses
    const allQuestions = await kv.getByPrefix('question:');
    const allResponses = await kv.getByPrefix('question_response:');
    
    console.log(`Clearing ${allQuestions.length} questions and ${allResponses.length} responses`);
    
    // Delete all questions
    const questionKeys = allQuestions.map((q: any) => q.id);
    if (questionKeys.length > 0) {
      await kv.mdel(questionKeys.map((id: string) => `question:${id.replace('question:', '')}`));
    }
    
    // Delete all responses
    const responseKeys = allResponses.map((r: any) => r.id || `question_response:${r.questionId}:${r.userId}`);
    if (responseKeys.length > 0) {
      await kv.mdel(responseKeys);
    }
    
    return c.json({ 
      success: true, 
      message: `Cleared ${allQuestions.length} questions and ${allResponses.length} responses`,
      questionsDeleted: allQuestions.length,
      responsesDeleted: allResponses.length
    });
  } catch (error: any) {
    console.error('Clear all questions error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Modules Management
app.post('/make-server-6d579fee/admin/modules', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const module = await c.req.json();
    const moduleId = module.id || generateId();
    
    await kv.set(`module:${moduleId}`, {
      ...module,
      id: moduleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return c.json({ success: true, moduleId });
  } catch (error: any) {
    console.error('Admin create module error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/admin/modules/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const moduleId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`module:${moduleId}`);
    if (!existing) {
      return c.json({ error: 'Module not found' }, 404);
    }

    await kv.set(`module:${moduleId}`, {
      ...existing,
      ...updates,
      id: moduleId,
      updatedAt: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin update module error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/admin/modules/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const moduleId = c.req.param('id');
    await kv.del(`module:${moduleId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete module error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/admin/modules/list', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const modules = await kv.getByPrefix('module:');
    return c.json({ modules });
  } catch (error: any) {
    console.error('Admin list modules error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Get published modules
app.get('/make-server-6d579fee/modules', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allModules = await kv.getByPrefix('module:');
    // Filter to only published modules
    const publishedModules = allModules.filter((m: any) => m.status === 'published');
    
    return c.json({ modules: publishedModules });
  } catch (error: any) {
    console.error('Get modules error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Get single module with lessons
app.get('/make-server-6d579fee/modules/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const moduleId = c.req.param('id');
    const module = await kv.get(`module:${moduleId}`);
    
    if (!module) {
      return c.json({ error: 'Module not found' }, 404);
    }

    // Only allow access to published modules
    if (module.status !== 'published') {
      return c.json({ error: 'Module not available' }, 403);
    }

    return c.json({ module });
  } catch (error: any) {
    console.error('Get module error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Save lesson notes (couple-shareable)
app.post('/make-server-6d579fee/modules/:moduleId/lessons/:lessonId/notes', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await kv.get(`user:${userId}`);
    const moduleId = c.req.param('moduleId');
    const lessonId = c.req.param('lessonId');
    const { notes } = await c.req.json();

    if (!notes || typeof notes !== 'string') {
      return c.json({ error: 'Notes are required' }, 400);
    }

    // Verify module exists and is published
    const module = await kv.get(`module:${moduleId}`);
    if (!module || module.status !== 'published') {
      return c.json({ error: 'Module not found or not available' }, 404);
    }

    // If user is part of a couple, save at couple-level so both partners can see it
    // Otherwise, save at user-level
    const storageKey = user?.coupleId 
      ? `lesson-note:${user.coupleId}:${lessonId}`
      : `lesson-note:${userId}:${lessonId}`;
    
    const lessonNote = {
      coupleId: user?.coupleId || null,
      userId: user?.coupleId ? null : userId, // Only store userId if not in a couple
      moduleId,
      lessonId,
      notes,
      lastEditedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(storageKey, lessonNote);

    console.log(`Lesson note saved: ${storageKey}, module ${moduleId}, lesson ${lessonId}`);
    return c.json({ success: true, note: lessonNote });
  } catch (error: any) {
    console.error('Save lesson notes error:', error);
    return c.json({ error: error.message || 'Failed to save notes' }, 500);
  }
});

// User-facing: Get lesson notes (couple-shareable)
app.get('/make-server-6d579fee/modules/:moduleId/lessons/:lessonId/notes', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await kv.get(`user:${userId}`);
    const lessonId = c.req.param('lessonId');
    
    // Try couple-level first, then fall back to user-level
    const storageKey = user?.coupleId 
      ? `lesson-note:${user.coupleId}:${lessonId}`
      : `lesson-note:${userId}:${lessonId}`;
    
    const note = await kv.get(storageKey);

    return c.json({ note: note || null });
  } catch (error: any) {
    console.error('Get lesson notes error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Mark lesson as complete
app.post('/make-server-6d579fee/modules/:moduleId/lessons/:lessonId/complete', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const moduleId = c.req.param('moduleId');
    const lessonId = c.req.param('lessonId');

    // Verify module exists and is published
    const module = await kv.get(`module:${moduleId}`);
    if (!module || module.status !== 'published') {
      return c.json({ error: 'Module not found or not available' }, 404);
    }

    // Save lesson completion for this user
    const completion = {
      userId,
      moduleId,
      lessonId,
      completedAt: new Date().toISOString()
    };

    await kv.set(`lesson-completion:${userId}:${lessonId}`, completion);

    console.log(`Lesson completed: user ${userId}, module ${moduleId}, lesson ${lessonId}`);
    return c.json({ success: true, completion });
  } catch (error: any) {
    console.error('Mark lesson complete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Get module progress
app.get('/make-server-6d579fee/modules/:moduleId/progress', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const moduleId = c.req.param('moduleId');
    const module = await kv.get(`module:${moduleId}`);
    
    if (!module || module.status !== 'published') {
      return c.json({ error: 'Module not found or not available' }, 404);
    }

    // Get all completions for this user
    const allCompletions = await kv.getByPrefix(`lesson-completion:${userId}:`);
    
    // Filter completions for this module
    const moduleCompletions = allCompletions.filter((c: any) => c.moduleId === moduleId);
    
    const totalLessons = module.lessons?.length || 0;
    const completedLessons = moduleCompletions.length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return c.json({ 
      progress,
      completedLessons,
      totalLessons,
      completions: moduleCompletions
    });
  } catch (error: any) {
    console.error('Get module progress error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Get all active questions
app.get('/make-server-6d579fee/questions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');
    console.log('\n========== FETCHING QUESTIONS ==========');
    console.log('Category filter:', category);
    
    const allQuestions = await kv.getByPrefix('question:');
    console.log('Total questions from KV:', allQuestions.length);
    console.log('All questions:', JSON.stringify(allQuestions.map((q: any) => ({
      id: q.id,
      title: q.title,
      category: q.category,
      status: q.status,
      promptsCount: q.prompts?.length || 0
    })), null, 2));
    
    // Filter active questions
    let questions = allQuestions.filter((q: any) => q.status === 'active');
    console.log('Active questions:', questions.length);
    
    // Filter by category if provided
    if (category && category !== 'all') {
      questions = questions.filter((q: any) => q.category === category);
      console.log(`Questions in category "${category}":`, questions.length);
    }
    
    console.log('Final questions to return:', questions.length);
    console.log('========================================\n');

    return c.json({ questions });
  } catch (error: any) {
    console.error('Get questions error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug: View all questions in database (admin only)
app.get('/make-server-6d579fee/debug/questions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allQuestions = await kv.getByPrefix('question:');
    
    return c.json({ 
      count: allQuestions.length,
      questions: allQuestions 
    });
  } catch (error: any) {
    console.error('Debug questions error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Save question responses
app.post('/make-server-6d579fee/questions/:questionId/responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const questionId = c.req.param('questionId');
    const { answers } = await c.req.json();

    console.log(`[Save Q&A Response] User: ${userId}, Question: ${questionId}`);
    console.log(`[Save Q&A Response] Answers received:`, JSON.stringify(answers));

    if (!answers || typeof answers !== 'object') {
      return c.json({ error: 'Answers are required' }, 400);
    }

    // Verify question exists
    const question = await kv.get(`question:${questionId}`);
    if (!question) {
      return c.json({ error: 'Question not found' }, 404);
    }

    // Get user's couple ID if they're part of a couple
    const user = await kv.get(`user:${userId}`);
    console.log(`[Save Q&A Response] User data:`, {
      userId: user?.id,
      email: user?.email,
      coupleId: user?.coupleId
    });
    
    if (!user?.coupleId) {
      console.warn(`[Save Q&A Response] WARNING: User ${userId} has NO coupleId! Partner responses won't work.`);
    }
    
    // Create the storage key
    const responseKey = `question-response:${userId}:${questionId}`;
    
    // Save the response with the key as id
    const response = {
      id: responseKey, // Include the key as id for easy reference
      userId,
      questionId,
      coupleId: user?.coupleId || null,
      answers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(responseKey, response);

    console.log(`[Save Q&A Response] ✅ Saved successfully with key: ${responseKey}, coupleId: ${user?.coupleId || 'NULL'}`);
    return c.json({ success: true, response });
  } catch (error: any) {
    console.error('Save question response error:', error);
    return c.json({ error: error.message || 'Failed to save response' }, 500);
  }
});

// User-facing: Get question response (user's and partner's)
app.get('/make-server-6d579fee/questions/:questionId/responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const questionId = c.req.param('questionId');
    
    console.log(`\n========== [Q&A Responses] START ==========`);
    console.log(`[Q&A Responses] Question ID: ${questionId}`);
    console.log(`[Q&A Responses] Current User ID: ${userId}`);
    
    // Get user's response
    const userResponseKey = `question-response:${userId}:${questionId}`;
    const userResponse = await kv.get(userResponseKey);
    console.log(`[Q&A Responses] User response key: ${userResponseKey}`);
    console.log(`[Q&A Responses] User response:`, userResponse ? '✅ FOUND' : '❌ NOT FOUND');
    if (userResponse) {
      console.log(`[Q&A Responses] User response coupleId:`, userResponse.coupleId);
    }
    
    // Get partner's response if user is in a couple
    const user = await kv.get(`user:${userId}`);
    console.log(`[Q&A Responses] User coupleId from profile:`, user?.coupleId || 'NULL');
    
    let partnerResponse = null;
    
    if (user?.coupleId) {
      const couple = await kv.get(`couple:${user.coupleId}`);
      console.log(`[Q&A Responses] Couple found:`, couple ? '✅ YES' : '❌ NO');
      console.log(`[Q&A Responses] Couple partner1Id:`, couple?.partner1Id);
      console.log(`[Q&A Responses] Couple partner2Id:`, couple?.partner2Id);
      
      const partnerId = couple?.partner1Id === userId ? couple?.partner2Id : couple?.partner1Id;
      console.log(`[Q&A Responses] Identified Partner ID:`, partnerId);
      
      if (partnerId) {
        const partnerResponseKey = `question-response:${partnerId}:${questionId}`;
        partnerResponse = await kv.get(partnerResponseKey);
        console.log(`[Q&A Responses] Partner response key: ${partnerResponseKey}`);
        console.log(`[Q&A Responses] Partner response:`, partnerResponse ? '✅ FOUND' : '❌ NOT FOUND');
        if (partnerResponse) {
          console.log(`[Q&A Responses] Partner response coupleId:`, partnerResponse.coupleId);
          console.log(`[Q&A Responses] Partner response answers:`, Object.keys(partnerResponse.answers || {}));
        }
      }
    } else {
      console.log(`[Q&A Responses] ⚠️ User not in a couple`);
    }

    console.log(`[Q&A Responses] Final result:`, {
      hasUserResponse: !!userResponse,
      hasPartnerResponse: !!partnerResponse
    });
    console.log(`========== [Q&A Responses] END ==========\n`);

    return c.json({ 
      userResponse: userResponse || null,
      partnerResponse: partnerResponse || null
    });
  } catch (error: any) {
    console.error('Get question responses error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Get all user's question responses
app.get('/make-server-6d579fee/my-question-responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const responses = await kv.getByPrefix(`question-response:${userId}:`);
    
    return c.json({ responses: responses || [] });
  } catch (error: any) {
    console.error('Get my question responses error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint: List all question responses
app.get('/make-server-6d579fee/debug/all-responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all responses
    const allResponses = await kv.getByPrefix('question-response:');
    
    console.log('[Debug] All question responses in database:', allResponses.length);
    allResponses.forEach((resp: any) => {
      console.log('[Debug] Response:', {
        id: resp.id,
        userId: resp.userId,
        questionId: resp.questionId,
        coupleId: resp.coupleId,
        answersCount: Object.keys(resp.answers || {}).length
      });
    });
    
    return c.json({ 
      count: allResponses.length,
      responses: allResponses 
    });
  } catch (error: any) {
    console.error('Debug all responses error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint: List all users
app.get('/make-server-6d579fee/debug/users', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allUsers = await kv.getByPrefix('user:');
    
    return c.json({ 
      count: allUsers.length,
      users: allUsers 
    });
  } catch (error: any) {
    console.error('Debug users error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint: List all couples
app.get('/make-server-6d579fee/debug/couples', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allCouples = await kv.getByPrefix('couple:');
    
    return c.json({ 
      count: allCouples.length,
      couples: allCouples 
    });
  } catch (error: any) {
    console.error('Debug couples error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint: Clear all question responses
app.delete('/make-server-6d579fee/debug/clear-responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`[Debug] Clearing all question responses...`);
    
    const supabase = getSupabase();
    
    // Query directly to get keys AND values
    const { data, error } = await supabase
      .from('kv_store_6d579fee')
      .select('key, value')
      .like('key', 'question-response:%');
    
    if (error) {
      console.error('[Debug] Error fetching responses:', error);
      throw new Error(error.message);
    }
    
    console.log(`[Debug] Found ${data?.length || 0} responses to delete`);
    
    if (data && data.length > 0) {
      // Extract all keys
      const keys = data.map((row: any) => row.key);
      console.log(`[Debug] Deleting keys:`, keys);
      
      // Delete all at once using mdel
      await kv.mdel(keys);
      
      console.log(`[Debug] ✅ Successfully deleted ${data.length} responses`);
    }
    
    return c.json({ 
      success: true,
      deletedCount: data?.length || 0
    });
  } catch (error: any) {
    console.error('Debug clear responses error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint: Fix existing couples (add coupleId to user profiles)
app.post('/make-server-6d579fee/debug/fix-couples', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`[Debug] Fixing couple relationships...`);
    
    // Get all couples
    const couples = await kv.getByPrefix('couple:');
    console.log(`[Debug] Found ${couples.length} couple records`);
    
    let fixed = 0;
    let couplesCreated = 0;
    
    // STEP 1: Fix existing couples
    for (const couple of couples) {
      const partner1Id = couple.partner1Id || couple.user1Id; // Handle old field names
      const partner2Id = couple.partner2Id || couple.user2Id;
      
      if (!partner1Id || !partner2Id) {
        console.warn(`[Debug] Skipping invalid couple:`, couple.id);
        continue;
      }
      
      console.log(`[Debug] Processing couple ${couple.id}: ${partner1Id} <-> ${partner2Id}`);
      
      // Get both user profiles
      const user1 = await kv.get(`user:${partner1Id}`);
      const user2 = await kv.get(`user:${partner2Id}`);
      
      if (!user1 || !user2) {
        console.warn(`[Debug] Skipping couple ${couple.id} - user not found`);
        continue;
      }
      
      // Update user profiles with coupleId if missing
      if (!user1.coupleId) {
        user1.coupleId = couple.id;
        user1.updatedAt = new Date().toISOString();
        await kv.set(`user:${partner1Id}`, user1);
        console.log(`[Debug] ✅ Added coupleId to user ${partner1Id}`);
        fixed++;
      }
      
      if (!user2.coupleId) {
        user2.coupleId = couple.id;
        user2.updatedAt = new Date().toISOString();
        await kv.set(`user:${partner2Id}`, user2);
        console.log(`[Debug] ✅ Added coupleId to user ${partner2Id}`);
        fixed++;
      }
      
      // Update couple record to use consistent field names
      if (couple.user1Id || couple.user2Id) {
        const updatedCouple = {
          id: couple.id,
          partner1Id: partner1Id,
          partner2Id: partner2Id,
          relationshipStartDate: couple.relationshipStartDate,
          createdAt: couple.createdAt,
          updatedAt: new Date().toISOString()
        };
        await kv.set(`couple:${couple.id}`, updatedCouple);
        console.log(`[Debug] ✅ Updated couple record field names`);
      }
    }
    
    // STEP 2: Find users with partnerId but no coupleId and create couple records
    console.log(`[Debug] Looking for orphaned partnerships...`);
    const allUsers = await kv.getByPrefix('user:');
    const processedPairs = new Set<string>();
    
    for (const user of allUsers) {
      // Skip if user doesn't have a partner or already has a coupleId
      if (!user.partnerId || user.coupleId) continue;
      
      // Create unique pair identifier to avoid duplicates
      const pairId = [user.id, user.partnerId].sort().join('|');
      if (processedPairs.has(pairId)) continue;
      processedPairs.add(pairId);
      
      // Get partner
      const partner = await kv.get(`user:${user.partnerId}`);
      if (!partner) {
        console.warn(`[Debug] Partner ${user.partnerId} not found for user ${user.id}`);
        continue;
      }
      
      // Verify bidirectional link
      if (partner.partnerId !== user.id) {
        console.warn(`[Debug] Partner link mismatch: ${user.id} <-> ${user.partnerId}`);
        continue;
      }
      
      // Create couple record
      const newCoupleId = generateId();
      const newCouple = {
        id: newCoupleId,
        partner1Id: user.id,
        partner2Id: user.partnerId,
        relationshipStartDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      await kv.set(`couple:${newCoupleId}`, newCouple);
      console.log(`[Debug] ✅ Created couple record ${newCoupleId} for ${user.id} <-> ${user.partnerId}`);
      couplesCreated++;
      
      // Update both user profiles
      user.coupleId = newCoupleId;
      user.updatedAt = new Date().toISOString();
      await kv.set(`user:${user.id}`, user);
      
      partner.coupleId = newCoupleId;
      partner.updatedAt = new Date().toISOString();
      await kv.set(`user:${user.partnerId}`, partner);
      
      console.log(`[Debug] ✅ Added coupleId to users ${user.id} and ${user.partnerId}`);
      fixed += 2;
    }
    
    console.log(`[Debug] ✅ Created ${couplesCreated} new couples, fixed ${fixed} user profiles`);
    
    return c.json({ 
      success: true,
      couplesProcessed: couples.length,
      couplesCreated: couplesCreated,
      usersFixed: fixed
    });
  } catch (error: any) {
    console.error('Debug fix couples error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Groups Management
app.post('/make-server-6d579fee/admin/groups', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const group = await c.req.json();
    const groupId = group.id || generateId();
    
    await kv.set(`group:${groupId}`, {
      ...group,
      id: groupId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return c.json({ success: true, groupId });
  } catch (error: any) {
    console.error('Admin create group error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/admin/groups/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const groupId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`group:${groupId}`);
    if (!existing) {
      return c.json({ error: 'Group not found' }, 404);
    }

    await kv.set(`group:${groupId}`, {
      ...existing,
      ...updates,
      id: groupId,
      updatedAt: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin update group error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/admin/groups/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const groupId = c.req.param('id');
    await kv.del(`group:${groupId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete group error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/admin/groups/list', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const groups = await kv.getByPrefix('group:');
    return c.json({ groups });
  } catch (error: any) {
    console.error('Admin list groups error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get admin statistics
app.get('/make-server-6d579fee/admin/stats', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // Gather statistics
    const users = await kv.getByPrefix('user:');
    const devotionals = await kv.getByPrefix('devotional:');
    const questions = await kv.getByPrefix('question:');
    const modules = await kv.getByPrefix('module:');
    const journals = await kv.getByPrefix('journal:');
    const prayers = await kv.getByPrefix('prayer:');
    const completions = await kv.getByPrefix('completion:');

    const totalUsers = users.filter((u: any) => u.id && u.email).length;
    const activeCouples = users.filter((u: any) => u.partnerId).length / 2;
    
    // Calculate completion rate
    const totalPossibleCompletions = totalUsers * 30; // Assume 30 days of content
    const completionRate = totalPossibleCompletions > 0 
      ? Math.round((completions.length / totalPossibleCompletions) * 100)
      : 0;

    return c.json({ 
      stats: {
        totalUsers,
        activeCouples: Math.floor(activeCouples),
        totalDevotionals: devotionals.length,
        totalQuestions: questions.length,
        totalModules: modules.length,
        totalJournalEntries: journals.length,
        totalPrayers: prayers.length,
        completionRate
      }
    });
  } catch (error: any) {
    console.error('Admin stats fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// SCRIPTURE MEMORY ROUTES
// ============================================

// Get user's verse progress
app.get('/make-server-6d579fee/memory/progress', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    // Get all user verse progress
    const progressKeys = await kv.getByPrefix(`user-verse:${userId}:`);
    const progress = progressKeys.map((key: string) => {
      const value = kv.get(key);
      return value;
    });

    return c.json({ progress });
  } catch (error: any) {
    console.error('Get memory progress error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get memory stats
app.get('/make-server-6d579fee/memory/stats', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    // Get all user verse progress
    const progressKeys = await kv.getByPrefix(`user-verse:${userId}:`);
    const allProgress = progressKeys.map((key: string) => kv.get(key));

    const masteredVerses = allProgress.filter((p: any) => p?.status === 'mastered').length;
    const learningVerses = allProgress.filter((p: any) => p?.status === 'learning').length;

    // Get streak data
    const streakKey = `memory-streak:${userId}`;
    const streakData = await kv.get(streakKey) || {
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null
    };

    const stats = {
      totalVerses: allProgress.length,
      masteredVerses,
      learningVerses,
      currentStreak: streakData.currentStreak || 0,
      longestStreak: streakData.longestStreak || 0,
      lastPracticeDate: streakData.lastPracticeDate || null
    };

    return c.json({ stats });
  } catch (error: any) {
    console.error('Get memory stats error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Record practice session
app.post('/make-server-6d579fee/memory/practice', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { verseId, action, correct } = await c.req.json();
    
    if (!verseId) {
      return c.json({ error: 'verseId is required' }, 400);
    }

    const progressKey = `user-verse:${userId}:${verseId}`;
    let progress = await kv.get(progressKey) || {
      verseId,
      masteryLevel: 0,
      lastPracticed: new Date().toISOString(),
      timesReviewed: 0,
      consecutiveCorrect: 0,
      status: 'new'
    };

    const today = new Date().toISOString().split('T')[0];

    if (action === 'start') {
      // Just starting to learn - increment review count
      progress.timesReviewed++;
      progress.lastPracticed = new Date().toISOString();
      
      if (progress.status === 'new') {
        progress.status = 'learning';
      }
    } else if (action === 'answer') {
      // User answered in quiz mode
      progress.timesReviewed++;
      progress.lastPracticed = new Date().toISOString();

      if (correct) {
        progress.consecutiveCorrect++;
        // Increase mastery by 10-20 points
        progress.masteryLevel = Math.min(100, progress.masteryLevel + 15);
      } else {
        progress.consecutiveCorrect = 0;
        // Decrease mastery slightly
        progress.masteryLevel = Math.max(0, progress.masteryLevel - 5);
      }

      // Update status based on mastery level
      if (progress.masteryLevel >= 80 && progress.consecutiveCorrect >= 3) {
        progress.status = 'mastered';
      } else if (progress.masteryLevel > 0) {
        progress.status = 'learning';
      }
    }

    // Save progress
    await kv.set(progressKey, progress);

    // Update streak
    const streakKey = `memory-streak:${userId}`;
    let streakData = await kv.get(streakKey) || {
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null
    };

    const lastDate = streakData.lastPracticeDate;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!lastDate || lastDate === yesterday || lastDate === yesterdayStr) {
      // Continue or start streak
      if (lastDate !== today) {
        streakData.currentStreak++;
        if (streakData.currentStreak > streakData.longestStreak) {
          streakData.longestStreak = streakData.currentStreak;
        }
      }
    } else if (lastDate !== today) {
      // Streak broken
      streakData.currentStreak = 1;
    }

    streakData.lastPracticeDate = today;
    await kv.set(streakKey, streakData);

    // Recalculate stats
    const progressKeys = await kv.getByPrefix(`user-verse:${userId}:`);
    const allProgress = progressKeys.map((key: string) => kv.get(key));
    const masteredVerses = allProgress.filter((p: any) => p?.status === 'mastered').length;
    const learningVerses = allProgress.filter((p: any) => p?.status === 'learning').length;

    const stats = {
      totalVerses: allProgress.length,
      masteredVerses,
      learningVerses,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      lastPracticeDate: streakData.lastPracticeDate
    };

    return c.json({ progress, stats });
  } catch (error: any) {
    console.error('Record practice error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// AUDIO MANAGEMENT FOR DEVOTIONALS
// ============================================

// Initialize audio storage bucket
const initAudioBucket = async () => {
  const supabase = getSupabase();
  const bucketName = 'make-6d579fee-devotional-audio';
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('[Audio] Creating devotional audio bucket...');
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
      });
      
      if (error) {
        // If bucket already exists (race condition), that's fine
        if (error.message?.includes('already exists')) {
          console.log('[Audio] ✅ Devotional audio bucket already exists (race condition handled)');
        } else {
          console.error('[Audio] Failed to create bucket:', error);
        }
      } else {
        console.log('[Audio] ✅ Devotional audio bucket created successfully');
      }
    } else {
      console.log('[Audio] ✅ Devotional audio bucket already exists');
    }
  } catch (error: any) {
    // Ignore "already exists" errors
    if (error?.message?.includes('already exists')) {
      console.log('[Audio] ✅ Devotional audio bucket already exists (caught in exception)');
    } else {
      console.error('[Audio] Error initializing bucket:', error);
    }
  }
};

// Upload audio file for devotional
app.post('/make-server-6d579fee/admin/devotionals/:id/audio', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotionalId = c.req.param('id');
    console.log('[Audio] Upload request for devotional:', devotionalId);
    
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('[Audio] No audio file in FormData');
      return c.json({ error: 'No audio file provided' }, 400);
    }

    console.log('[Audio] File received:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Validate file type
    const allowedTypes = [
      'audio/mpeg',      // MP3
      'audio/mp3',       // Some browsers use this
      'audio/wav',       // WAV
      'audio/wave',      // Alternative WAV
      'audio/x-wav',     // Alternative WAV
      'audio/ogg',       // OGG
      'audio/mp4',       // M4A
      'audio/x-m4a',     // M4A alternative
      'audio/aac',       // AAC
      'audio/webm',      // WebM audio
      'audio/flac'       // FLAC
    ];
    if (!allowedTypes.includes(audioFile.type) && !audioFile.type.startsWith('audio/')) {
      return c.json({ error: `Invalid file type: ${audioFile.type}. Only audio files are allowed` }, 400);
    }

    // Validate file size (50MB max)
    if (audioFile.size > 50 * 1024 * 1024) {
      return c.json({ error: 'File too large. Maximum size is 50MB' }, 400);
    }

    const supabase = getSupabase();
    const bucketName = 'make-6d579fee-devotional-audio';
    
    // Create unique filename
    const fileExt = audioFile.name.split('.').pop();
    const fileName = `${devotionalId}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const arrayBuffer = await audioFile.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, arrayBuffer, {
        contentType: audioFile.type,
        upsert: true
      });

    if (uploadError) {
      console.error('[Audio] Upload error:', uploadError);
      return c.json({ 
        error: 'Failed to upload audio file', 
        details: uploadError.message 
      }, 500);
    }

    console.log('[Audio] File uploaded to storage:', uploadData?.path);

    // Create signed URL (valid for 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000); // 1 year

    if (urlError) {
      console.error('[Audio] Signed URL error:', urlError);
      return c.json({ 
        error: 'Failed to create audio URL', 
        details: urlError.message 
      }, 500);
    }

    console.log('[Audio] Signed URL created successfully');

    // Update devotional with audio URL
    console.log(`[Audio] Looking up devotional in KV store: devotional:${devotionalId}`);
    const devotional = await kv.get(`devotional:${devotionalId}`);
    if (!devotional) {
      console.error(`[Audio] ⚠️ Devotional not found in KV store: devotional:${devotionalId}`);
      console.error(`[Audio] ⚠️ This devotional may not have been created yet. Please create the devotional first in the Admin Panel.`);
      // Still return success since the file was uploaded successfully
      // The frontend will need to refresh to see the audio
      return c.json({ 
        success: true, 
        audioUrl: urlData.signedUrl,
        fileName: fileName,
        warning: 'Devotional not found in database. Audio uploaded to storage but not linked to devotional.'
      });
    }
    
    devotional.audioUrl = urlData.signedUrl;
    devotional.audioFileName = fileName;
    devotional.updatedAt = new Date().toISOString();
    await kv.set(`devotional:${devotionalId}`, devotional);

    console.log('[Audio] ✅ Audio uploaded successfully:', fileName);
    console.log('[Audio] ✅ Devotional updated with audio URL');
    console.log(`[Audio] ✅ Devotional "${devotional.title}" (ID: ${devotionalId}) now has audio`);

    return c.json({ 
      success: true, 
      audioUrl: urlData.signedUrl,
      fileName: fileName 
    });
  } catch (error: any) {
    console.error('[Audio] Upload error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete audio file for devotional
app.delete('/make-server-6d579fee/admin/devotionals/:id/audio', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminProfile = await kv.get(`user:${userId}`);
    if (!adminProfile?.email?.includes('admin')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotionalId = c.req.param('id');
    const devotional = await kv.get(`devotional:${devotionalId}`);

    if (!devotional || !devotional.audioFileName) {
      return c.json({ error: 'No audio file found for this devotional' }, 404);
    }

    const supabase = getSupabase();
    const bucketName = 'make-6d579fee-devotional-audio';

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([devotional.audioFileName]);

    if (deleteError) {
      console.error('[Audio] Delete error:', deleteError);
      return c.json({ error: 'Failed to delete audio file' }, 500);
    }

    // Update devotional
    delete devotional.audioUrl;
    delete devotional.audioFileName;
    devotional.updatedAt = new Date().toISOString();
    await kv.set(`devotional:${devotionalId}`, devotional);

    console.log('[Audio] ✅ Audio deleted successfully:', devotional.audioFileName);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Audio] Delete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get audio info for devotional
app.get('/make-server-6d579fee/admin/devotionals/:id/audio', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const devotionalId = c.req.param('id');
    const devotional = await kv.get(`devotional:${devotionalId}`);

    if (!devotional) {
      return c.json({ error: 'Devotional not found' }, 404);
    }

    return c.json({ 
      hasAudio: !!devotional.audioUrl,
      audioUrl: devotional.audioUrl || null,
      fileName: devotional.audioFileName || null
    });
  } catch (error: any) {
    console.error('[Audio] Get audio info error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// COMMUNITY ROUTES
// ============================================
app.route('/make-server-6d579fee', communityRoutes);

// ============================================
// WEBRTC ROUTES
// ============================================
app.route('/make-server-6d579fee', webrtcRoutes);

// ============================================
// START SERVER
// ============================================

// Initialize audio bucket on startup
initAudioBucket();

console.log('🚀 TwoBeOne API Server starting...');
console.log('📍 Base URL: /make-server-6d579fee');
console.log('🔑 Using KV Store for data persistence');
console.log('✅ All routes configured');
console.log('👥 Community features enabled');

Deno.serve(app.fetch);