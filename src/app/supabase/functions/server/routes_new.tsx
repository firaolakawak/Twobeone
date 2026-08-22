/**
 * TwoBeOne Backend API Routes
 * Database-connected routes (replacing KV store)
 * Phase 3 Implementation
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

export function setupRoutes(app: Hono, supabase: any) {

// ============================================
// AUTHENTICATION & PROFILE
// ============================================

// Health check
app.get('/make-server-6d579fee/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sign up - create a new user
app.post('/make-server-6d579fee/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true // Auto-confirm since no email server
    });

    if (error) {
      console.error('Sign up error:', error.message);
      return c.json({ error: error.message }, 400);
    }

    // Create user profile in database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        full_name: name
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // User created but profile failed - still return success
    }

    // Create couple record for this user
    const inviteCode = `COUPLE${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({
        partner_one: data.user.id,
        invite_code: inviteCode,
        relationship_status: 'single'
      })
      .select()
      .single();

    if (coupleError) {
      console.error('Couple creation error:', coupleError);
    }

    return c.json({ 
      success: true, 
      user: data.user,
      inviteCode 
    });
  } catch (error) {
    console.error('Sign up error:', error);
    return c.json({ error: 'Failed to sign up' }, 500);
  }
});

// Get user profile
app.get('/make-server-6d579fee/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token' }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Create profile if doesn't exist
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.name || null
          })
          .select()
          .single();
          
        if (createError) {
          return c.json({ error: 'Failed to create profile' }, 500);
        }
        
        return c.json({ profile: newProfile, partner: null });
      }
      
      return c.json({ error: profileError.message }, 500);
    }

    // Get partner if linked
    let partner = null;
    if (profile.partner_id) {
      const { data: partnerData } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url, bio')
        .eq('id', profile.partner_id)
        .single();
      
      partner = partnerData;
    }

    return c.json({ profile, partner });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Update user profile
app.post('/make-server-6d579fee/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        full_name: updates.full_name || updates.name,
        avatar_url: updates.avatar_url || updates.profilePicture,
        bio: updates.bio,
        phone: updates.phone,
        location: updates.location,
        relationship_start: updates.relationship_start || updates.relationshipStart,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }

    return c.json({ success: true, profile: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ============================================
// COUPLE LINKING
// ============================================

// Generate or get invite code
app.post('/make-server-6d579fee/profile/generate-code', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user already has a couple
    const { data: existingCouple } = await supabase
      .from('couples')
      .select('*')
      .eq('partner_one', user.id)
      .single();

    if (existingCouple?.invite_code) {
      return c.json({ 
        success: true, 
        inviteCode: existingCouple.invite_code,
        message: 'You already have an invite code' 
      });
    }

    // Create new couple with invite code
    const inviteCode = `COUPLE${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({
        partner_one: user.id,
        invite_code: inviteCode,
        relationship_status: 'single'
      })
      .select()
      .single();

    if (coupleError) {
      return c.json({ error: coupleError.message }, 500);
    }

    return c.json({ 
      success: true, 
      inviteCode: couple.invite_code,
      message: 'Invite code generated successfully' 
    });
  } catch (error) {
    console.error('Generate code error:', error);
    return c.json({ error: 'Failed to generate invite code' }, 500);
  }
});

// Link by invite code
app.post('/make-server-6d579fee/profile/link-by-code', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { code } = await c.req.json();
    
    if (!code) {
      return c.json({ error: 'Invite code is required' }, 400);
    }

    // Find couple by invite code
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('*')
      .eq('invite_code', code)
      .single();

    if (coupleError || !couple) {
      return c.json({ error: 'Invalid invite code' }, 404);
    }

    // Check if couple already has both partners
    if (couple.partner_one && couple.partner_two) {
      return c.json({ error: 'This couple is already complete' }, 400);
    }

    // Check if trying to link with self
    if (couple.partner_one === user.id) {
      return c.json({ error: 'Cannot link with yourself' }, 400);
    }

    // Link as partner_two
    const { data: updated, error: updateError } = await supabase
      .from('couples')
      .update({
        partner_two: user.id,
        linked_at: new Date().toISOString(),
        relationship_status: 'dating'
      })
      .eq('id', couple.id)
      .select()
      .single();

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }

    // Update both users' partner_id
    await supabase
      .from('users')
      .update({ partner_id: couple.partner_one })
      .eq('id', user.id);

    await supabase
      .from('users')
      .update({ partner_id: user.id })
      .eq('id', couple.partner_one);

    // Get partner details
    const { data: partner } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', couple.partner_one)
      .single();

    return c.json({ 
      success: true,
      message: 'Successfully linked with partner',
      couple: updated,
      partner 
    });
  } catch (error) {
    console.error('Link by code error:', error);
    return c.json({ error: 'Failed to link with partner' }, 500);
  }
});

// ============================================
// JOURNAL ENTRIES
// ============================================

// Create journal entry
app.post('/make-server-6d579fee/journal', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    
    // Get user's couple
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
      .single();

    // Insert journal entry
    const { data: entry, error: insertError } = await supabase
      .from('journal_entries')
      .insert({
        couple_id: couple?.id,
        author_id: user.id,
        title: body.title,
        content: body.content || '',
        is_shared: body.isShared || body.is_shared || false,
        entry_type: body.entryType || body.entry_type || 'journal',
        location: body.location,
        emoji: body.emoji,
        prompt_id: body.promptId || body.prompt_id,
        media_files: body.mediaFiles || body.media_files
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert journal error:', insertError);
      return c.json({ error: insertError.message }, 500);
    }

    return c.json({ success: true, entry });
  } catch (error) {
    console.error('Create journal entry error:', error);
    return c.json({ error: 'Failed to create journal entry' }, 500);
  }
});

// Get journal entries
app.get('/make-server-6d579fee/journal', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's partner_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', user.id)
      .single();

    // Build query - get own entries and partner's shared entries
    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('author_id', user.id);

    if (userProfile?.partner_id) {
      query = supabase
        .from('journal_entries')
        .select('*')
        .or(`author_id.eq.${user.id},and(author_id.eq.${userProfile.partner_id},is_shared.eq.true)`);
    }

    const { data: entries, error: queryError } = await query
      .order('created_at', { ascending: false });

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    // Mark which entries are from partner
    const enrichedEntries = entries.map(entry => ({
      ...entry,
      isPartner: entry.author_id !== user.id
    }));

    return c.json({ entries: enrichedEntries });
  } catch (error) {
    console.error('Get journal entries error:', error);
    return c.json({ error: 'Failed to get journal entries' }, 500);
  }
});

// Update journal entry
app.put('/make-server-6d579fee/journal/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const entryId = c.req.param('id');
    const updates = await c.req.json();
    
    const { data: updated, error: updateError } = await supabase
      .from('journal_entries')
      .update({
        title: updates.title,
        content: updates.content,
        is_shared: updates.isShared || updates.is_shared,
        entry_type: updates.entryType || updates.entry_type,
        location: updates.location,
        emoji: updates.emoji,
        media_files: updates.mediaFiles || updates.media_files,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .eq('author_id', user.id) // Security: only update own entries
      .select()
      .single();

    if (updateError) {
      return c.json({ error: updateError.message }, 404);
    }

    return c.json({ success: true, entry: updated });
  } catch (error) {
    console.error('Update journal entry error:', error);
    return c.json({ error: 'Failed to update journal entry' }, 500);
  }
});

// Delete journal entry
app.delete('/make-server-6d579fee/journal/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const entryId = c.req.param('id');
    
    const { error: deleteError } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('author_id', user.id); // Security: only delete own entries

    if (deleteError) {
      return c.json({ error: deleteError.message }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    return c.json({ error: 'Failed to delete journal entry' }, 500);
  }
});

// ============================================
// PRAYER REQUESTS
// ============================================

// Create prayer request
app.post('/make-server-6d579fee/prayer', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    
    // Get couple_id
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
      .single();

    // Insert prayer request
    const { data: prayer, error: insertError } = await supabase
      .from('prayer_requests')
      .insert({
        couple_id: couple?.id,
        author_id: user.id,
        title: body.title,
        description: body.description,
        is_answered: body.isAnswered || body.is_answered || false,
        is_shared: body.isShared || body.is_shared !== false // Default true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert prayer error:', insertError);
      return c.json({ error: insertError.message }, 500);
    }

    return c.json({ success: true, prayer });
  } catch (error) {
    console.error('Create prayer error:', error);
    return c.json({ error: 'Failed to create prayer request' }, 500);
  }
});

// Get prayer requests
app.get('/make-server-6d579fee/prayer', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's partner_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', user.id)
      .single();

    // Query prayer requests
    let query = supabase
      .from('prayer_requests')
      .select('*')
      .eq('author_id', user.id);

    if (userProfile?.partner_id) {
      query = supabase
        .from('prayer_requests')
        .select('*')
        .or(`author_id.eq.${user.id},author_id.eq.${userProfile.partner_id}`);
    }

    const { data: prayers, error: queryError } = await query
      .order('created_at', { ascending: false });

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    // Mark which prayers are from partner
    const enrichedPrayers = prayers.map(prayer => ({
      ...prayer,
      isPartner: prayer.author_id !== user.id
    }));

    return c.json({ prayers: enrichedPrayers });
  } catch (error) {
    console.error('Get prayers error:', error);
    return c.json({ error: 'Failed to get prayer requests' }, 500);
  }
});

// Update prayer request (mark as answered)
app.put('/make-server-6d579fee/prayer/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const prayerId = c.req.param('id');
    const updates = await c.req.json();
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.isAnswered !== undefined || updates.is_answered !== undefined) {
      updateData.is_answered = updates.isAnswered || updates.is_answered;
      if (updateData.is_answered) {
        updateData.answered_at = new Date().toISOString();
      }
    }

    if (updates.youPrayed !== undefined || updates.you_prayed !== undefined) {
      updateData.you_prayed = updates.youPrayed ?? updates.you_prayed;
    }

    if (updates.partnerPrayed !== undefined || updates.partner_prayed !== undefined) {
      updateData.partner_prayed = updates.partnerPrayed ?? updates.partner_prayed;
    }

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.isSharedWithPartner !== undefined || updates.is_shared_with_partner !== undefined) {
      updateData.is_shared_with_partner = updates.isSharedWithPartner ?? updates.is_shared_with_partner;
    }

    if (updates.isSharedWithCommunity !== undefined || updates.is_shared_with_community !== undefined) {
      updateData.is_shared_with_community = updates.isSharedWithCommunity ?? updates.is_shared_with_community;
    }

    const { data: updated, error: updateError } = await supabase
      .from('prayer_requests')
      .update(updateData)
      .eq('id', prayerId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return c.json({ error: updateError.message }, 500);
    }

    return c.json({ success: true, prayer: updated });
  } catch (error) {
    console.error('Update prayer error:', error);
    return c.json({ error: 'Failed to update prayer request' }, 500);
  }
});

// Delete prayer request
app.delete('/make-server-6d579fee/prayer/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const prayerId = c.req.param('id');
    
    const { error: deleteError } = await supabase
      .from('prayer_requests')
      .delete()
      .eq('id', prayerId)
      .eq('author_id', user.id);

    if (deleteError) {
      return c.json({ error: deleteError.message }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete prayer error:', error);
    return c.json({ error: 'Failed to delete prayer request' }, 500);
  }
});

// Continue with remaining routes...
// (See full implementation in server/index.tsx)

}