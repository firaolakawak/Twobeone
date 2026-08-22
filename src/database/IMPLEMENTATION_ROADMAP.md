# TwoBeOne Database Implementation Roadmap

**Status:** 🚧 In Progress  
**Goal:** Full UI ↔ Database Integration  
**Target Completion:** [Set your date]

---

## 📋 QUICK SUMMARY

**Current State:**
- ✅ 12 core tables exist with proper structure
- ⚠️ 8 tables missing (moods, notifications, questions, etc.)
- ⚠️ 35+ columns need to be added to existing tables
- ❌ Backend API routes not implemented
- ❌ TypeScript types don't match database schema
- ❌ No data validation or error handling

**What This Means:**
Your UI is beautiful and functional, but it's using mock/local data. To make it production-ready, you need to:
1. Fix database schema
2. Implement backend APIs
3. Connect UI to real database
4. Add error handling

---

## 🎯 IMPLEMENTATION PHASES

### PHASE 1: Database Schema Setup (2-3 hours)

**Priority:** 🔴 CRITICAL - Do this first!

#### Step 1.1: Update Existing Tables
```bash
# Run in Supabase SQL Editor
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of /database/schema_updates.sql
4. Click "Run"
5. Verify success message
```

**What This Does:**
- Adds 35+ missing columns to existing tables
- Updates `users`, `journal_entries`, `prayer_requests`, etc.
- Creates indexes for better performance

**Time:** ~15 minutes

---

#### Step 1.2: Create Missing Tables
```bash
# Run in Supabase SQL Editor
1. Open SQL Editor
2. Copy contents of /database/create_missing_tables.sql
3. Click "Run"
4. Verify all 8 tables created
```

**What This Does:**
- Creates `daily_moods` table for mood tracking
- Creates `notifications` table for in-app notifications
- Creates `questions` & `question_responses` for Q&A
- Creates `devotional_completions` for streak tracking
- Creates `streaks` table for gamification
- Creates `journal_comments` for comments
- Creates `prayer_updates` for prayer journey

**Time:** ~10 minutes

---

#### Step 1.3: Verify Schema
```bash
# Run verification script
1. Open SQL Editor
2. Copy contents of /database/verify_schema.sql
3. Click "Run"
4. Check output for ✅ or ❌
```

**Time:** ~5 minutes

---

### PHASE 2: TypeScript Types Update (1 hour)

**Priority:** 🔴 CRITICAL

#### Step 2.1: Update Type Definitions

**Action:**
1. Replace `/types/index.ts` with `/types/database.ts` contents
2. Update all imports across the app
3. Fix type errors

**Files to Update:**
- `CoupleDashboard.tsx` - Update User, Couple types
- `EnhancedJournal.tsx` - Update JournalEntry type
- `PrayerBoard.tsx` - Update PrayerRequest type
- `ProfileSettings.tsx` - Update User type
- All quiz components - Update Quiz types
- All other components using types

**Time:** ~45 minutes

---

### PHASE 3: Backend API Implementation (6-8 hours)

**Priority:** 🔴 CRITICAL - Most complex phase

#### Step 3.1: Mood Tracker API

Create in `/supabase/functions/server/index.tsx`:

```typescript
// GET today's mood
app.get('/make-server-6d579fee/moods/today', async (c) => {
  const userId = c.req.header('X-User-Id');
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_moods')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// POST new mood
app.post('/make-server-6d579fee/moods', async (c) => {
  const { user_id, couple_id, mood } = await c.req.json();
  
  const { data, error } = await supabase
    .from('daily_moods')
    .upsert({
      user_id,
      couple_id,
      mood,
      date: new Date().toISOString().split('T')[0]
    }, {
      onConflict: 'user_id,date'
    })
    .select()
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});
```

**Time:** ~1 hour

---

#### Step 3.2: Milestones API

```typescript
// GET couple's milestones
app.get('/make-server-6d579fee/milestones/:coupleId', async (c) => {
  const coupleId = c.req.param('coupleId');
  
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('couple_id', coupleId)
    .order('date', { ascending: false });
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// POST new milestone
app.post('/make-server-6d579fee/milestones', async (c) => {
  const milestone = await c.req.json();
  
  const { data, error } = await supabase
    .from('milestones')
    .insert(milestone)
    .select()
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// DELETE milestone
app.delete('/make-server-6d579fee/milestones/:id', async (c) => {
  const id = c.req.param('id');
  
  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', id);
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true });
});
```

**Time:** ~1 hour

---

#### Step 3.3: Journal & Comments API

```typescript
// GET couple's journal entries
app.get('/make-server-6d579fee/journal/:coupleId', async (c) => {
  const coupleId = c.req.param('coupleId');
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select(`
      *,
      author:users!author_id(id, full_name, avatar_url),
      comments:journal_comments(
        *,
        user:users(full_name, avatar_url)
      )
    `)
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// POST new journal entry
app.post('/make-server-6d579fee/journal', async (c) => {
  const entry = await c.req.json();
  
  const { data, error } = await supabase
    .from('journal_entries')
    .insert(entry)
    .select()
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// POST comment on journal
app.post('/make-server-6d579fee/journal/:entryId/comments', async (c) => {
  const entryId = c.req.param('entryId');
  const { user_id, content } = await c.req.json();
  
  const { data, error } = await supabase
    .from('journal_comments')
    .insert({
      journal_entry_id: entryId,
      user_id,
      content
    })
    .select(`
      *,
      user:users(full_name, avatar_url)
    `)
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});
```

**Time:** ~1.5 hours

---

#### Step 3.4: Prayer Requests API

```typescript
// GET couple's prayer requests
app.get('/make-server-6d579fee/prayers/:coupleId', async (c) => {
  const coupleId = c.req.param('coupleId');
  
  const { data, error } = await supabase
    .from('prayer_requests')
    .select(`
      *,
      author:users!author_id(full_name, avatar_url),
      updates:prayer_updates(
        *,
        user:users(full_name, avatar_url)
      )
    `)
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// POST new prayer
app.post('/make-server-6d579fee/prayers', async (c) => {
  const prayer = await c.req.json();
  
  const { data, error } = await supabase
    .from('prayer_requests')
    .insert(prayer)
    .select()
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// POST prayer update
app.post('/make-server-6d579fee/prayers/:prayerId/updates', async (c) => {
  const prayerId = c.req.param('prayerId');
  const update = await c.req.json();
  
  const { data, error } = await supabase
    .from('prayer_updates')
    .insert({
      ...update,
      prayer_request_id: prayerId
    })
    .select()
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// PATCH mark as answered
app.patch('/make-server-6d579fee/prayers/:id/answer', async (c) => {
  const id = c.req.param('id');
  
  const { data, error } = await supabase
    .from('prayer_requests')
    .update({
      is_answered: true,
      answered_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});
```

**Time:** ~1.5 hours

---

#### Step 3.5: Devotionals & Streaks API

```typescript
// GET today's devotional
app.get('/make-server-6d579fee/devotionals/today', async (c) => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('devotions')
    .select('*')
    .eq('published_date', today)
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// POST complete devotional
app.post('/make-server-6d579fee/devotionals/:id/complete', async (c) => {
  const devotionId = c.req.param('id');
  const { user_id, notes } = await c.req.json();
  
  // Mark completion
  const { data: completion, error: completionError } = await supabase
    .from('devotional_completions')
    .insert({
      user_id,
      devotion_id: devotionId,
      notes
    })
    .select()
    .single();
    
  if (completionError) return c.json({ error: completionError.message }, 400);
  
  // Update streak
  await updateStreak(user_id, 'devotional');
  
  return c.json(completion);
});

// Helper function to update streaks
async function updateStreak(userId: string, type: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', type)
    .single();
    
  if (!existing) {
    // Create new streak
    await supabase.from('streaks').insert({
      user_id: userId,
      streak_type: type,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today
    });
  } else {
    const lastDate = new Date(existing.last_activity_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    
    let newStreak = 1;
    if (diffDays === 1) {
      newStreak = existing.current_streak + 1;
    } else if (diffDays === 0) {
      newStreak = existing.current_streak;
    }
    
    await supabase.from('streaks').update({
      current_streak: newStreak,
      longest_streak: Math.max(existing.longest_streak, newStreak),
      last_activity_date: today
    }).eq('id', existing.id);
  }
}

// GET user's streaks
app.get('/make-server-6d579fee/streaks/:userId', async (c) => {
  const userId = c.req.param('userId');
  
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId);
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});
```

**Time:** ~1.5 hours

---

#### Step 3.6: Questions & Responses API

```typescript
// GET questions by category
app.get('/make-server-6d579fee/questions/:category', async (c) => {
  const category = c.req.param('category');
  
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('question_order');
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// POST answer to question
app.post('/make-server-6d579fee/questions/:questionId/respond', async (c) => {
  const questionId = c.req.param('questionId');
  const { user_id, couple_id, response, is_private } = await c.req.json();
  
  const { data, error } = await supabase
    .from('question_responses')
    .upsert({
      user_id,
      couple_id,
      question_id: questionId,
      response,
      is_private,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,question_id'
    })
    .select()
    .single();
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// GET couple's responses
app.get('/make-server-6d579fee/questions/responses/:coupleId', async (c) => {
  const coupleId = c.req.param('coupleId');
  
  const { data, error } = await supabase
    .from('question_responses')
    .select(`
      *,
      question:questions(*),
      user:users(id, full_name, avatar_url)
    `)
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
    
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});
```

**Time:** ~1 hour

---

### PHASE 4: Frontend Integration (8-10 hours)

**Priority:** 🟡 HIGH

#### Step 4.1: Update CoupleDashboard Component

**Changes Needed:**
1. Replace mock mood data with API calls
2. Replace mock milestone data with API calls
3. Fetch devotional streak from database
4. Add error handling and loading states

**Example:**
```typescript
// Before (mock data)
const [todaysMood, setTodaysMood] = useState<any>(null);

// After (real data)
const [todaysMood, setTodaysMood] = useState<DailyMood | null>(null);
const [isLoadingMood, setIsLoadingMood] = useState(true);
const [moodError, setMoodError] = useState<string | null>(null);

useEffect(() => {
  fetchTodaysMood();
}, []);

const fetchTodaysMood = async () => {
  try {
    setIsLoadingMood(true);
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/moods/today`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Id': profile?.id
        }
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch mood');
    
    const data = await response.json();
    setTodaysMood(data);
  } catch (error) {
    setMoodError(error.message);
    console.error('Error fetching mood:', error);
  } finally {
    setIsLoadingMood(false);
  }
};

const handleMoodUpdate = async (mood: string) => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/moods`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: profile?.id,
          couple_id: coupleData?.id,
          mood
        })
      }
    );
    
    if (!response.ok) throw new Error('Failed to update mood');
    
    const data = await response.json();
    setTodaysMood(data);
    toast.success('Mood updated!');
  } catch (error) {
    toast.error('Failed to update mood');
    console.error('Error updating mood:', error);
  }
};
```

**Time:** ~2 hours

---

#### Step 4.2: Update Journal Components

Similar pattern for:
- `EnhancedJournal.tsx`
- `CollaborativeJournal.tsx`
- Add comment functionality
- Media upload to Supabase Storage

**Time:** ~3 hours

---

#### Step 4.3: Update Prayer Components

- `PrayerBoard.tsx`
- `PrayerSection.tsx`
- Add prayer updates feature

**Time:** ~2 hours

---

#### Step 4.4: Update All Other Components

- Profile Settings
- Quizzes
- Questions/Responses
- Groups
- Notifications

**Time:** ~3 hours

---

### PHASE 5: Testing & Debugging (4-6 hours)

**Priority:** 🟡 HIGH

#### Step 5.1: Manual Testing
- Follow `/database/TEST_PLAN.md`
- Test each user flow
- Document bugs

**Time:** ~2 hours

---

#### Step 5.2: Fix Bugs
- Fix type errors
- Fix API errors
- Fix UI/UX issues

**Time:** ~2-4 hours

---

### PHASE 6: Performance & Polish (2-3 hours)

**Priority:** 🟢 MEDIUM

#### Step 6.1: Add Loading States
- Skeleton loaders
- Spinner indicators
- Progress bars

**Time:** ~1 hour

---

#### Step 6.2: Error Boundaries
- Graceful error displays
- Retry buttons
- Fallback UI

**Time:** ~1 hour

---

#### Step 6.3: Optimization
- Cache frequently accessed data
- Implement pagination
- Optimize queries

**Time:** ~1 hour

---

## 📈 PROGRESS TRACKING

### Checklist

**Database Schema:**
- [ ] Run schema_updates.sql
- [ ] Run create_missing_tables.sql
- [ ] Run verify_schema.sql
- [ ] All tables show ✅

**TypeScript Types:**
- [ ] Update types/index.ts
- [ ] Fix all type errors
- [ ] Test builds successfully

**Backend APIs:**
- [ ] Mood tracker endpoints
- [ ] Milestones endpoints
- [ ] Journal & comments endpoints
- [ ] Prayer requests endpoints
- [ ] Devotionals & streaks endpoints
- [ ] Questions & responses endpoints
- [ ] Notifications endpoints (optional)

**Frontend Integration:**
- [ ] CoupleDashboard
- [ ] Profile Settings
- [ ] Journal components
- [ ] Prayer components
- [ ] Quiz components
- [ ] Questions components
- [ ] Groups components

**Testing:**
- [ ] Manual testing complete
- [ ] All critical bugs fixed
- [ ] Performance acceptable

**Polish:**
- [ ] Loading states added
- [ ] Error handling complete
- [ ] UI/UX smooth

---

## 🚀 QUICK START

**If you have 2-3 hours right now:**

1. Run schema updates (15 min)
2. Run create missing tables (10 min)
3. Update TypeScript types (30 min)
4. Implement mood tracker API (1 hour)
5. Connect mood tracker UI (30 min)

This will give you ONE fully working feature end-to-end!

---

## 💡 TIPS FOR SUCCESS

1. **Do one feature at a time** - Don't try to do everything at once
2. **Test frequently** - Test after each small change
3. **Use console.log** - Debug with console logs
4. **Check Supabase logs** - View logs in Supabase dashboard
5. **Backup data** - Export your schema before major changes
6. **Ask for help** - If stuck, ask questions!

---

## 📞 SUPPORT

If you encounter issues:
1. Check Supabase SQL Editor logs
2. Check browser console for errors
3. Review the audit document: `/database/UI_SCHEMA_AUDIT.md`
4. Review test plan: `/database/TEST_PLAN.md`

---

**Good luck! You've got this! 🙏💪**
