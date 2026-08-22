# Phase 3: Backend API Implementation

## 🎯 Goal
Implement backend API routes that connect UI to Supabase database

**Time Required:** 6-8 hours  
**Difficulty:** Advanced (requires backend knowledge)

---

## 📋 Prerequisites

✅ Phase 1 complete (database schema updated)  
✅ Phase 2 complete (types aligned with database)  
✅ Basic understanding of REST APIs  
✅ Familiarity with Supabase/PostgreSQL

---

## 🔍 Current State

Your server already has:
- ✅ Basic authentication (signup, profile)
- ✅ Partner linking (email/invite code)
- ✅ Journal CRUD (using KV store)
- ✅ Prayer CRUD (using KV store)

**Problem:** Everything uses KV store, not the actual Supabase database!

---

## 🎯 Phase 3 Goals

### Migrate to Database
Replace KV store operations with Supabase queries:
- ✅ Users → `users` table
- ✅ Couples → `couples` table
- ✅ Journal → `journal_entries` table
- ✅ Prayers → `prayer_requests` table

### Add Missing APIs
Implement routes for new features:
- 🆕 Daily Moods API
- 🆕 Notifications API
- 🆕 Devotional Completions API
- 🆕 Streaks API
- 🆕 Questions & Responses API
- 🆕 Milestones API
- 🆕 Journal Comments API
- 🆕 Prayer Updates API

---

## 📚 Implementation Order

### Stage 1: Core Data Migration (2-3 hours)
1. Users & Couples
2. Journal Entries
3. Prayer Requests
4. Devotions

### Stage 2: New Features (3-4 hours)
5. Daily Moods
6. Notifications
7. Questions & Responses
8. Streaks
9. Devotional Completions

### Stage 3: Advanced Features (1-2 hours)
10. Journal Comments
11. Prayer Updates
12. Milestones
13. Progress Tracking

---

## 🚀 Stage 1: Core Data Migration

### 1.1 Update User Profile Routes

**Current Issue:** Uses KV store  
**Solution:** Use `users` table

#### GET /profile
```typescript
app.get('/make-server-6d579fee/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]';
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Query users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Create profile if doesn't exist
      if (profileError.code === 'PGRST116') {
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.name || null,
          created_at: new Date().toISOString()
        };
        
        const { data: created, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single();
          
        if (createError) {
          return c.json({ error: 'Failed to create profile' }, 500);
        }
        
        return c.json({ profile: created, partner: null });
      }
      
      return c.json({ error: profileError.message }, 500);
    }

    // Get partner if linked
    let partner = null;
    if (profile.partner_id) {
      const { data: partnerData } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url')
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
```

#### POST /profile (Update Profile)
```typescript
app.post('/make-server-6d579fee/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    
    // Update users table
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        full_name: updates.full_name,
        avatar_url: updates.avatar_url,
        bio: updates.bio,
        phone: updates.phone,
        location: updates.location,
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
```

---

### 1.2 Update Couple Linking Routes

#### POST /link-by-code
```typescript
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

    // Check if user is trying to link with themselves
    if (couple.partner_one === user.id) {
      return c.json({ error: 'Cannot link with yourself' }, 400);
    }

    // Link as partner_two
    const { data: updated, error: updateError } = await supabase
      .from('couples')
      .update({
        partner_two: user.id,
        linked_at: new Date().toISOString()
      })
      .eq('id', couple.id)
      .select()
      .single();

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }

    // Update user's partner_id
    await supabase
      .from('users')
      .update({ partner_id: couple.partner_one })
      .eq('id', user.id);

    // Update partner's partner_id
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
      couple: updated,
      partner 
    });
  } catch (error) {
    console.error('Link by code error:', error);
    return c.json({ error: 'Failed to link with partner' }, 500);
  }
});
```

---

### 1.3 Update Journal Routes

#### POST /journal (Create Entry)
```typescript
app.post('/make-server-6d579fee/journal', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    
    // Get user's couple_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', user.id)
      .single();

    // Get or create couple
    let coupleId = null;
    if (userProfile?.partner_id) {
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
        .single();
      
      coupleId = couple?.id;
    }

    // Insert journal entry
    const { data: entry, error: insertError } = await supabase
      .from('journal_entries')
      .insert({
        couple_id: coupleId,
        author_id: user.id,
        title: body.title,
        content: body.content,
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
```

#### GET /journal (Get Entries)
```typescript
app.get('/make-server-6d579fee/journal', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's couple_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', user.id)
      .single();

    // Query journal entries
    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('author_id', user.id);

    // Also get partner's shared entries if they have a partner
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
```

---

### 1.4 Update Prayer Routes

#### POST /prayer (Create Prayer)
```typescript
app.post('/make-server-6d579fee/prayer', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    
    // Get couple_id
    let coupleId = null;
    const { data: userProfile } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', user.id)
      .single();

    if (userProfile?.partner_id) {
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
        .single();
      
      coupleId = couple?.id;
    }

    // Insert prayer request
    const { data: prayer, error: insertError } = await supabase
      .from('prayer_requests')
      .insert({
        couple_id: coupleId,
        author_id: user.id,
        title: body.title,
        description: body.description,
        is_answered: body.isAnswered || body.is_answered || false,
        is_shared: body.isShared || body.is_shared || true
      })
      .select()
      .single();

    if (insertError) {
      return c.json({ error: insertError.message }, 500);
    }

    return c.json({ success: true, prayer });
  } catch (error) {
    console.error('Create prayer error:', error);
    return c.json({ error: 'Failed to create prayer request' }, 500);
  }
});
```

#### GET /prayer (Get Prayers)
```typescript
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

    // Include partner's prayers if they have a partner
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
```

---

## 🚀 Stage 2: New Features

### 2.1 Daily Moods API

#### POST /moods (Create Mood)
```typescript
app.post('/make-server-6d579fee/moods', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { mood, note, date } = await c.req.json();

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
        note,
        date: date || new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();

    if (upsertError) {
      return c.json({ error: upsertError.message }, 500);
    }

    return c.json({ success: true, mood: moodEntry });
  } catch (error) {
    console.error('Create mood error:', error);
    return c.json({ error: 'Failed to save mood' }, 500);
  }
});
```

#### GET /moods (Get Moods)
```typescript
app.get('/make-server-6d579fee/moods', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const days = parseInt(c.req.query('days') || '30');

    // Get moods for user and partner
    const { data: userProfile } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('daily_moods')
      .select('*')
      .eq('user_id', user.id);

    if (userProfile?.partner_id) {
      query = supabase
        .from('daily_moods')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.eq.${userProfile.partner_id}`);
    }

    const { data: moods, error: queryError } = await query
      .order('date', { ascending: false })
      .limit(days * 2); // *2 for both users

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    return c.json({ moods });
  } catch (error) {
    console.error('Get moods error:', error);
    return c.json({ error: 'Failed to get moods' }, 500);
  }
});
```

---

### 2.2 Notifications API

#### POST /notifications (Create Notification)
```typescript
app.post('/make-server-6d579fee/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user_id, type, title, message, link, metadata } = await c.req.json();

    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: user_id || user.id,
        type,
        title,
        message,
        link,
        metadata
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
```

#### GET /notifications
```typescript
app.get('/make-server-6d579fee/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: notifications, error: queryError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    return c.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Failed to get notifications' }, 500);
  }
});
```

#### PATCH /notifications/:id/read (Mark as Read)
```typescript
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
```

---

### 2.3 Questions & Responses API

#### GET /questions (Get Questions by Category)
```typescript
app.get('/make-server-6d579fee/questions', async (c) => {
  try {
    const category = c.req.query('category');

    let query = supabase
      .from('questions')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: questions, error: queryError } = await query
      .order('question_order', { ascending: true });

    if (queryError) {
      return c.json({ error: queryError.message }, 500);
    }

    return c.json({ questions });
  } catch (error) {
    console.error('Get questions error:', error);
    return c.json({ error: 'Failed to get questions' }, 500);
  }
});
```

#### POST /question-responses (Submit Response)
```typescript
app.post('/make-server-6d579fee/question-responses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { question_id, response, is_private } = await c.req.json();

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
        is_private: is_private || false
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
```

#### GET /question-responses (Get Responses)
```typescript
app.get('/make-server-6d579fee/question-responses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');

    // Get user's responses
    let userQuery = supabase
      .from('question_responses')
      .select('*, questions(*)')
      .eq('user_id', user.id);

    if (category) {
      userQuery = userQuery.eq('questions.category', category);
    }

    const { data: userResponses, error: userError } = await userQuery;

    if (userError) {
      return c.json({ error: userError.message }, 500);
    }

    // Get partner's non-private responses
    const { data: userProfile } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', user.id)
      .single();

    let partnerResponses = [];
    if (userProfile?.partner_id) {
      let partnerQuery = supabase
        .from('question_responses')
        .select('*, questions(*)')
        .eq('user_id', userProfile.partner_id)
        .eq('is_private', false);

      if (category) {
        partnerQuery = partnerQuery.eq('questions.category', category);
      }

      const { data: partnerData } = await partnerQuery;
      partnerResponses = partnerData || [];
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
```

---

## ✅ Verification Checklist

After implementing each route:

- [ ] Route compiles without errors
- [ ] Auth token is validated
- [ ] Database query is correct
- [ ] Error handling is in place
- [ ] Response format matches frontend expectations
- [ ] Tested with Postman/Thunder Client
- [ ] RLS policies don't block the query
- [ ] Field names match Phase 2 types

---

## 🐛 Common Issues

### Issue: "permission denied for table"
**Cause:** RLS policy blocking access  
**Solution:** Check RLS policies, ensure auth.uid() is passed correctly

### Issue: "column does not exist"
**Cause:** Field name mismatch  
**Solution:** Use snake_case (created_at not createdAt)

### Issue: "null value in column violates not-null constraint"
**Cause:** Missing required field  
**Solution:** Check table schema, provide all NOT NULL fields

### Issue: "duplicate key value"
**Cause:** Unique constraint violation  
**Solution:** Use upsert or check if record exists first

---

## ⏱️ Time Breakdown

```
Stage 1: Core Migration        → 2-3 hours
  - Users & Couples            → 30 min
  - Journal Routes             → 45 min
  - Prayer Routes              → 45 min
  - Testing                    → 30 min

Stage 2: New Features          → 3-4 hours
  - Daily Moods                → 30 min
  - Notifications              → 45 min
  - Questions & Responses      → 60 min
  - Streaks & Devotions        → 60 min
  - Testing                    → 30 min

Stage 3: Advanced              → 1-2 hours
  - Journal Comments           → 30 min
  - Prayer Updates             → 30 min
  - Milestones                 → 30 min
  - Testing                    → 30 min
--------------------------------
Total:                           6-9 hours
```

---

## 📚 Next Steps

After Phase 3, proceed to:
- **Phase 4:** Connect UI components to APIs
- **Phase 5:** Test all features end-to-end
- **Phase 6:** Performance optimization

See `/database/IMPLEMENTATION_ROADMAP.md` for details.

---

**Ready to implement? Start with Stage 1! 🚀**
