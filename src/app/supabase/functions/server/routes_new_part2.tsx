/**
 * TwoBeOne Backend API Routes - Part 2
 * New Features: Moods, Notifications, Questions, Streaks, etc.
 */

// ============================================
// DAILY MOODS
// ============================================

// Create or update mood
app.post('/make-server-6d579fee/moods', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { mood, note, date } = await c.req.json();

    if (!mood || !['great', 'good', 'okay', 'sad'].includes(mood)) {
      return c.json({ error: 'Invalid mood value' }, 400);
    }

    // Get couple_id
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
      .single();

    // Upsert mood (update if exists for today, insert if not)
    const { data: moodEntry, error: upsertError } = await supabase
      .from('daily_moods')
      .upsert({
        user_id: user.id,
        couple_id: couple?.id,
        mood,
        note: note || null,
        date: date || new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert mood error:', upsertError);
      return c.json({ error: upsertError.message }, 500);
    }

    return c.json({ success: true, mood: moodEntry });
  } catch (error) {
    console.error('Create mood error:', error);
    return c.json({ error: 'Failed to save mood' }, 500);
  }
});

// Get moods
app.get('/make-server-6d579fee/moods', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const days = parseInt(c.req.query('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's partner_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', user.id)
      .single();

    // Query moods
    let query = supabase
      .from('daily_moods')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0]);

    if (userProfile?.partner_id) {
      query = supabase
        .from('daily_moods')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.eq.${userProfile.partner_id}`)
        .gte('date', startDate.toISOString().split('T')[0]);
    }

    const { data: moods, error: queryError } = await query
      .order('date', { ascending: false });

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    return c.json({ moods });
  } catch (error) {
    console.error('Get moods error:', error);
    return c.json({ error: 'Failed to get moods' }, 500);
  }
});

// ============================================
// NOTIFICATIONS
// ============================================

// Create notification
app.post('/make-server-6d579fee/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user_id, type, title, message, link, metadata } = await c.req.json();

    const validTypes = ['devotional', 'prayer', 'journal', 'milestone', 'partner', 'group', 'quiz', 'system'];
    if (!validTypes.includes(type)) {
      return c.json({ error: 'Invalid notification type' }, 400);
    }

    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: user_id || user.id,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || null
      })
      .select()
      .single();

    if (insertError) {
      return c.json({ error: insertError.message }, 500);
    }

    return c.json({ success: true, notification });
  } catch (error) {
    console.error('Create notification error:', error);
    return c.json({ error: 'Failed to create notification' }, 500);
  }
});

// Get notifications
app.get('/make-server-6d579fee/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const unreadOnly = c.req.query('unread') === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error: queryError } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    return c.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Failed to get notifications' }, 500);
  }
});

// Mark notification as read
app.patch('/make-server-6d579fee/notifications/:id/read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');

    const { data: updated, error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }

    return c.json({ success: true, notification: updated });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// Mark all notifications as read
app.post('/make-server-6d579fee/notifications/read-all', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    return c.json({ error: 'Failed to mark all as read' }, 500);
  }
});

// Delete notification
app.delete('/make-server-6d579fee/notifications/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');

    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (deleteError) {
      return c.json({ error: deleteError.message }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

// ============================================
// QUESTIONS & RESPONSES
// ============================================

// Get questions
app.get('/make-server-6d579fee/questions', async (c) => {
  try {
    const category = c.req.query('category');
    const language = c.req.query('language'); // Get language filter
    const active = c.req.query('active') !== 'false'; // Default true

    console.log('[GET /questions] Request params:', { category, language, active });

    let query = supabase
      .from('questions')
      .select('*');

    if (active) {
      query = query.eq('is_active', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Add language filter
    if (language) {
      console.log('[GET /questions] Filtering by language:', language);
      query = query.eq('language', language);
    }

    const { data: questions, error: queryError } = await query
      .order('question_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (queryError) {
      console.error('[GET /questions] Query error:', queryError);
      return c.json({ error: queryError.message }, 500);
    }

    console.log('[GET /questions] Returning', questions?.length || 0, 'questions');
    if (questions && questions.length > 0) {
      console.log('[GET /questions] Question languages:', questions.map(q => ({ id: q.id, title: q.title?.substring(0, 30), language: q.language })));
    }

    return c.json({ questions });
  } catch (error) {
    console.error('Get questions error:', error);
    return c.json({ error: 'Failed to get questions' }, 500);
  }
});

// Submit or update response
app.post('/make-server-6d579fee/question-responses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { question_id, response, is_private } = await c.req.json();

    if (!question_id || !response) {
      return c.json({ error: 'question_id and response are required' }, 400);
    }

    // Get couple_id
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
      .single();

    // Upsert response
    const { data: questionResponse, error: upsertError } = await supabase
      .from('question_responses')
      .upsert({
        user_id: user.id,
        couple_id: couple?.id,
        question_id,
        response,
        is_private: is_private || false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,question_id'
      })
      .select()
      .single();

    if (upsertError) {
      return c.json({ error: upsertError.message }, 500);
    }

    return c.json({ success: true, response: questionResponse });
  } catch (error) {
    console.error('Submit response error:', error);
    return c.json({ error: 'Failed to submit response' }, 500);
  }
});

// Get responses
app.get('/make-server-6d579fee/question-responses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');

    // Get user's responses from KV store
    const allUserResponses = await kv.getByPrefix(`response:${user.id}:`);
    let userResponses = allUserResponses || [];
    
    // Filter by category if specified
    if (category) {
      userResponses = userResponses.filter((r: any) => r.category === category);
    }

    // Get partner's non-private responses
    const userProfile = await kv.get(`user:${user.id}`);
    let partnerResponses: any[] = [];
    
    if (userProfile?.partnerId) {
      const allPartnerResponses = await kv.getByPrefix(`response:${userProfile.partnerId}:`);
      partnerResponses = (allPartnerResponses || []).filter((r: any) => !r.isPrivate);
      
      // Filter by category if specified
      if (category) {
        partnerResponses = partnerResponses.filter((r: any) => r.category === category);
      }
    }

    return c.json({ 
      userResponses, 
      partnerResponses 
    });
  } catch (error) {
    console.error('Get responses error:', error);
    return c.json({ error: 'Failed to get responses' }, 500);
  }
});

// ============================================
// DEVOTIONALS & COMPLETIONS
// ============================================

// Get devotions
app.get('/make-server-6d579fee/devotions', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '7');
    const today = new Date().toISOString().split('T')[0];

    const { data: devotions, error: queryError } = await supabase
      .from('devotions')
      .select('*')
      .lte('published_date', today)
      .order('published_date', { ascending: false })
      .limit(limit);

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    return c.json({ devotions });
  } catch (error) {
    console.error('Get devotions error:', error);
    return c.json({ error: 'Failed to get devotions' }, 500);
  }
});

// Get today's devotion
app.get('/make-server-6d579fee/devotions/today', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: devotion, error: queryError } = await supabase
      .from('devotions')
      .select('*')
      .eq('published_date', today)
      .single();

    if (queryError) {
      // No devotion for today
      if (queryError.code === 'PGRST116') {
        return c.json({ devotion: null });
      }
      return c.json({ error: queryError.message }, 500);
    }

    return c.json({ devotion });
  } catch (error) {
    console.error('Get today devotion error:', error);
    return c.json({ error: 'Failed to get today\'s devotion' }, 500);
  }
});

// Mark devotion as completed
app.post('/make-server-6d579fee/devotional-completions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { devotion_id, notes } = await c.req.json();

    // Insert or update completion
    const { data: completion, error: upsertError } = await supabase
      .from('devotional_completions')
      .upsert({
        user_id: user.id,
        devotion_id,
        notes: notes || null,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,devotion_id'
      })
      .select()
      .single();

    if (upsertError) {
      return c.json({ error: upsertError.message }, 500);
    }

    // Update or create devotional streak
    await updateStreak(user.id, 'devotional');

    return c.json({ success: true, completion });
  } catch (error) {
    console.error('Complete devotion error:', error);
    return c.json({ error: 'Failed to mark devotion as completed' }, 500);
  }
});

// Get user's devotional completions
app.get('/make-server-6d579fee/devotional-completions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: completions, error: queryError } = await supabase
      .from('devotional_completions')
      .select('*, devotions(*)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    return c.json({ completions });
  } catch (error) {
    console.error('Get completions error:', error);
    return c.json({ error: 'Failed to get devotional completions' }, 500);
  }
});

// ============================================
// STREAKS
// ============================================

// Helper function to update streaks
async function updateStreak(userId: string, streakType: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get existing streak
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', streakType)
      .single();

    if (!streak) {
      // Create new streak
      await supabase
        .from('streaks')
        .insert({
          user_id: userId,
          streak_type: streakType,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today
        });
      return;
    }

    // Check if activity is consecutive
    const lastDate = new Date(streak.last_activity_date!);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    let newCurrentStreak = streak.current_streak;
    let newLongestStreak = streak.longest_streak;

    if (diffDays === 0) {
      // Same day, no change
      return;
    } else if (diffDays === 1) {
      // Consecutive day
      newCurrentStreak += 1;
      newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
    } else {
      // Streak broken
      newCurrentStreak = 1;
    }

    // Update streak
    await supabase
      .from('streaks')
      .update({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('id', streak.id);

  } catch (error) {
    console.error('Update streak error:', error);
  }
}

// Get user's streaks
app.get('/make-server-6d579fee/streaks', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: streaks, error: queryError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id);

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    return c.json({ streaks });
  } catch (error) {
    console.error('Get streaks error:', error);
    return c.json({ error: 'Failed to get streaks' }, 500);
  }
});

// ============================================
// MILESTONES
// ============================================

// Create milestone
app.post('/make-server-6d579fee/milestones', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, description, date, icon_type, media_url, category } = await c.req.json();

    // Get couple_id
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
      .single();

    const { data: milestone, error: insertError } = await supabase
      .from('milestones')
      .insert({
        couple_id: couple?.id,
        title,
        description: description || null,
        date: date || new Date().toISOString().split('T')[0],
        icon_type: icon_type || null,
        media_url: media_url || null,
        category: category || null
      })
      .select()
      .single();

    if (insertError) {
      return c.json({ error: insertError.message }, 500);
    }

    return c.json({ success: true, milestone });
  } catch (error) {
    console.error('Create milestone error:', error);
    return c.json({ error: 'Failed to create milestone' }, 500);
  }
});

// Get milestones
app.get('/make-server-6d579fee/milestones', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get couple's milestones
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
      .single();

    if (!couple) {
      return c.json({ milestones: [] });
    }

    const { data: milestones, error: queryError } = await supabase
      .from('milestones')
      .select('*')
      .eq('couple_id', couple.id)
      .order('date', { ascending: false });

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    return c.json({ milestones });
  } catch (error) {
    console.error('Get milestones error:', error);
    return c.json({ error: 'Failed to get milestones' }, 500);
  }
});

// Delete milestone
app.delete('/make-server-6d579fee/milestones/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const milestoneId = c.req.param('id');

    // Verify user owns this milestone (via couple)
    const { data: milestone } = await supabase
      .from('milestones')
      .select('couple_id, couples(partner_one, partner_two)')
      .eq('id', milestoneId)
      .single();

    if (!milestone) {
      return c.json({ error: 'Milestone not found' }, 404);
    }

    const couple = milestone.couples as any;
    if (couple.partner_one !== user.id && couple.partner_two !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const { error: deleteError } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId);

    if (deleteError) {
      return c.json({ error: deleteError.message }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete milestone error:', error);
    return c.json({ error: 'Failed to delete milestone' }, 500);
  }
});

// ============================================
// LOCATION TRACKING
// ============================================

// Update user location
app.post('/make-server-6d579fee/update-location', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { location, locationType } = await c.req.json();

    if (!location || !location.latitude || !location.longitude) {
      return c.json({ error: 'Invalid location data' }, 400);
    }

    if (!locationType || !['live', 'manual'].includes(locationType)) {
      return c.json({ error: 'Invalid location type' }, 400);
    }

    // Store location in KV store
    const locationData = {
      userId: user.id,
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city || null,
      country: location.country || null,
      locationType: locationType,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`location:${user.id}`, locationData);

    console.log('[Location] Location updated for user:', user.id, locationData);

    return c.json({ success: true, location: locationData });
  } catch (error) {
    console.error('Update location error:', error);
    return c.json({ error: 'Failed to update location' }, 500);
  }
});

// Get couple locations (user + partner)
app.get('/make-server-6d579fee/couple-locations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get partner ID from KV store
    const coupleData = await kv.get(`couple:${user.id}`);
    let partnerId = coupleData?.partnerId || null;

    // Get user location from KV store
    const userLocationData = await kv.get(`location:${user.id}`);

    // Get partner location if partner exists
    let partnerLocationData = null;
    if (partnerId) {
      partnerLocationData = await kv.get(`location:${partnerId}`);
    }

    // Format response
    const userLocation = userLocationData ? {
      userId: user.id,
      location: {
        latitude: userLocationData.latitude,
        longitude: userLocationData.longitude,
        city: userLocationData.city,
        country: userLocationData.country
      },
      locationType: userLocationData.locationType,
      updatedAt: userLocationData.updatedAt
    } : null;

    const partnerLocation = partnerLocationData ? {
      userId: partnerId,
      location: {
        latitude: partnerLocationData.latitude,
        longitude: partnerLocationData.longitude,
        city: partnerLocationData.city,
        country: partnerLocationData.country
      },
      locationType: partnerLocationData.locationType,
      updatedAt: partnerLocationData.updatedAt
    } : null;

    return c.json({
      userLocation,
      partnerLocation
    });
  } catch (error) {
    console.error('Get couple locations error:', error);
    return c.json({ error: 'Failed to get locations' }, 500);
  }
});

// Remove user location
app.delete('/make-server-6d579fee/update-location', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Delete location from KV store
    await kv.del(`location:${user.id}`);

    console.log('[Location] Location removed for user:', user.id);

    return c.json({ success: true });
  } catch (error) {
    console.error('Remove location error:', error);
    return c.json({ error: 'Failed to remove location' }, 500);
  }
});

// Export for use in main server file
export { updateStreak };