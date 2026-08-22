# 🚀 Phase 3 Quick Start

**Goal:** Implement backend APIs connecting UI to Supabase  
**Time:** 6-8 hours  
**Difficulty:** Advanced

---

## 📋 Before You Start

✅ Phase 1 complete (database updated)  
✅ Phase 2 complete (types aligned)  
✅ Server already has basic routes  
✅ Supabase credentials configured

---

## 🎯 What You're Doing

### Current State (❌ Problem):
- Routes use KV store (temporary in-memory storage)
- Data lost on server restart
- Can't scale or query efficiently
- Missing routes for new features

### After Phase 3 (✅ Solution):
- Routes query Supabase database
- Data persists permanently
- Can scale to thousands of users
- All features have working APIs

---

## ⚡ Quick Implementation Path

### Step 1: Update User Profile Routes (30 min)

**File:** `/supabase/functions/server/index.tsx`

Find the `GET /profile` route and replace with:

```typescript
app.get('/make-server-6d579fee/profile', async (c) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (!user || error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Query database instead of KV store
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get partner
  let partner = null;
  if (profile?.partner_id) {
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', profile.partner_id)
      .single();
    partner = data;
  }

  return c.json({ profile, partner });
});
```

**Test:**
```bash
# In Thunder Client / Postman
GET http://localhost:54321/functions/v1/make-server-6d579fee/profile
Authorization: Bearer <your-access-token>
```

---

### Step 2: Update Journal Routes (45 min)

Replace POST /journal:

```typescript
app.post('/make-server-6d579fee/journal', async (c) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  
  const body = await c.req.json();
  
  // Get couple_id
  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
    .single();

  // Insert to database
  const { data: entry, error } = await supabase
    .from('journal_entries')
    .insert({
      couple_id: couple?.id,
      author_id: user.id,
      title: body.title,
      content: body.content,
      is_shared: body.isShared || false,
      entry_type: body.entryType || 'journal'
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true, entry });
});
```

Replace GET /journal:

```typescript
app.get('/make-server-6d579fee/journal', async (c) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  
  const { data: userProfile } = await supabase
    .from('users')
    .select('partner_id')
    .eq('id', user.id)
    .single();

  // Get own entries + partner's shared entries
  let query = supabase.from('journal_entries').select('*');
  
  if (userProfile?.partner_id) {
    query = query.or(`author_id.eq.${user.id},and(author_id.eq.${userProfile.partner_id},is_shared.eq.true)`);
  } else {
    query = query.eq('author_id', user.id);
  }

  const { data: entries } = await query.order('created_at', { ascending: false });

  const enriched = entries.map(e => ({
    ...e,
    isPartner: e.author_id !== user.id
  }));

  return c.json({ entries: enriched });
});
```

**Test:**
```bash
# Create entry
POST http://localhost:54321/functions/v1/make-server-6d579fee/journal
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Test Entry",
  "content": "Hello from database!",
  "isShared": true
}

# Get entries
GET http://localhost:54321/functions/v1/make-server-6d579fee/journal
Authorization: Bearer <token>
```

---

### Step 3: Add Moods API (30 min)

Add new route:

```typescript
// Create/update mood
app.post('/make-server-6d579fee/moods', async (c) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  
  const { mood, note } = await c.req.json();

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
    .single();

  // Upsert (update if exists, insert if not)
  const { data: moodEntry, error } = await supabase
    .from('daily_moods')
    .upsert({
      user_id: user.id,
      couple_id: couple?.id,
      mood,
      note,
      date: new Date().toISOString().split('T')[0]
    }, {
      onConflict: 'user_id,date'
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true, mood: moodEntry });
});

// Get moods
app.get('/make-server-6d579fee/moods', async (c) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  
  const { data: userProfile } = await supabase
    .from('users')
    .select('partner_id')
    .eq('id', user.id)
    .single();

  let query = supabase.from('daily_moods').select('*');
  
  if (userProfile?.partner_id) {
    query = query.or(`user_id.eq.${user.id},user_id.eq.${userProfile.partner_id}`);
  } else {
    query = query.eq('user_id', user.id);
  }

  const { data: moods } = await query
    .order('date', { ascending: false })
    .limit(60);

  return c.json({ moods });
});
```

**Test:**
```bash
# Set mood
POST http://localhost:54321/functions/v1/make-server-6d579fee/moods
Authorization: Bearer <token>
Content-Type: application/json

{
  "mood": "great",
  "note": "Feeling blessed today!"
}

# Get moods
GET http://localhost:54321/functions/v1/make-server-6d579fee/moods
Authorization: Bearer <token>
```

---

### Step 4: Add Notifications API (30 min)

```typescript
// Get notifications
app.get('/make-server-6d579fee/notifications', async (c) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return c.json({ notifications });
});

// Mark as read
app.patch('/make-server-6d579fee/notifications/:id/read', async (c) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  
  const id = c.req.param('id');

  const { data: updated } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  return c.json({ success: true, notification: updated });
});
```

---

### Step 5: Add Questions API (45 min)

```typescript
// Get questions
app.get('/make-server-6d579fee/questions', async (c) => {
  const category = c.req.query('category');

  let query = supabase
    .from('questions')
    .select('*')
    .eq('is_active', true);

  if (category) {
    query = query.eq('category', category);
  }

  const { data: questions } = await query
    .order('question_order', { ascending: true });

  return c.json({ questions });
});

// Submit response
app.post('/make-server-6d579fee/question-responses', async (c) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  
  const { question_id, response, is_private } = await c.req.json();

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
    .single();

  const { data: result, error } = await supabase
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

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true, response: result });
});

// Get responses
app.get('/make-server-6d579fee/question-responses', async (c) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  
  const { data: userResponses } = await supabase
    .from('question_responses')
    .select('*, questions(*)')
    .eq('user_id', user.id);

  // Get partner's non-private responses
  const { data: userProfile } = await supabase
    .from('users')
    .select('partner_id')
    .eq('id', user.id)
    .single();

  let partnerResponses = [];
  if (userProfile?.partner_id) {
    const { data } = await supabase
      .from('question_responses')
      .select('*, questions(*)')
      .eq('user_id', userProfile.partner_id)
      .eq('is_private', false);
    partnerResponses = data || [];
  }

  return c.json({ userResponses, partnerResponses });
});
```

---

## ✅ Quick Testing Checklist

After implementing each section:

- [ ] Server restarts without errors
- [ ] Route responds (not 404)
- [ ] Auth token validates
- [ ] Data saves to database (check Supabase Table Editor)
- [ ] Data retrieves correctly
- [ ] Partner data works (if applicable)
- [ ] Errors are handled gracefully

---

## 🔧 Common Issues & Fixes

### Issue: "permission denied for table"
**Fix:** Check RLS policies in Supabase. Temporarily disable RLS on table to test, then re-enable and fix policies.

### Issue: "column does not exist"
**Fix:** You're using camelCase but database uses snake_case. Use `is_shared` not `isShared`.

### Issue: "null value in column violates not-null constraint"
**Fix:** Check table schema, provide all required (NOT NULL) fields.

### Issue: "No rows returned"
**Fix:** Check your query conditions. Use Supabase SQL Editor to test query manually.

---

## 📚 Full Documentation

- [PHASE_3_INSTRUCTIONS.md](PHASE_3_INSTRUCTIONS.md) - Complete guide
- [PHASE_3_CHECKLIST.md](PHASE_3_CHECKLIST.md) - Track progress
- [routes_new.tsx](../supabase/functions/server/routes_new.tsx) - Full route examples
- [routes_new_part2.tsx](../supabase/functions/server/routes_new_part2.tsx) - New features

---

## ⏱️ Time Estimate

```
User Profile Routes:      30 min
Journal Routes:           45 min
Prayer Routes:            30 min
Moods API:                30 min
Notifications API:        30 min
Questions API:            45 min
Devotionals API:          30 min
Milestones API:           30 min
Testing & Debugging:      60 min
--------------------------------
Total:                    ~5 hours (minimum)
                          ~8 hours (with issues)
```

---

## 🎯 Priority Order

If short on time, implement in this order:

1. **User Profile** (required for auth)
2. **Couple Linking** (required for partners)
3. **Journal** (core feature)
4. **Prayer** (core feature)
5. **Moods** (nice to have)
6. **Notifications** (can add later)
7. **Questions** (can add later)
8. **Everything else** (optional)

---

## 🚀 Ready to Start?

1. Open `/supabase/functions/server/index.tsx`
2. Find the route you want to update
3. Replace KV store code with database queries
4. Test with Postman/Thunder Client
5. Move to next route
6. Repeat!

---

**You've got this! Start with Step 1! 💪**

See you in Phase 4 with a fully functional backend!
