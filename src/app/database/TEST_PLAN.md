# TwoBeOne Database Integration Test Plan

**Purpose:** Validate complete UI ↔ Database data flow  
**Date:** November 10, 2025

---

## 🎯 TEST OBJECTIVES

1. ✅ Verify all UI components can read from database
2. ✅ Verify all UI components can write to database  
3. ✅ Validate data integrity and foreign key relationships
4. ✅ Test Row Level Security (RLS) policies
5. ✅ Confirm error handling and edge cases
6. ✅ Validate partner data sharing

---

## 👥 TEST USER SETUP

### Create Test Users & Couple

```sql
-- Test User 1: Sarah
INSERT INTO users (id, email, full_name, avatar_url, bio)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'sarah@test.com',
  'Sarah Johnson',
  'https://i.pravatar.cc/150?img=1',
  'Loves hiking and worship music'
);

-- Test User 2: David
INSERT INTO users (id, email, full_name, avatar_url, bio)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'david@test.com',
  'David Thompson',
  'https://i.pravatar.cc/150?img=12',
  'Guitar player and prayer warrior'
);

-- Create Couple
INSERT INTO couples (id, partner_one, partner_two, linked_at, invite_code, couple_name, anniversary_date)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  now(),
  'LOVE2024',
  'Sarah & David',
  '2024-01-15'
);
```

---

## 🧪 TEST CASES BY SCREEN

### 1. COUPLE DASHBOARD

#### Test 1.1: Display Couple Information
**Steps:**
1. Login as Sarah
2. Navigate to Dashboard
3. Verify couple header shows both avatars
4. Verify "Sarah & David" is displayed
5. Verify days together is calculated from `linked_at`

**Expected Result:**
- ✅ Both profile pictures visible
- ✅ Couple name displayed correctly
- ✅ Days together calculated accurately

**Database Query:**
```sql
SELECT c.*, 
       u1.full_name as partner_one_name, 
       u1.avatar_url as partner_one_avatar,
       u2.full_name as partner_two_name,
       u2.avatar_url as partner_two_avatar,
       CURRENT_DATE - DATE(c.linked_at) as days_together
FROM couples c
JOIN users u1 ON c.partner_one = u1.id
JOIN users u2 ON c.partner_two = u2.id
WHERE c.id = '33333333-3333-3333-3333-333333333333';
```

---

#### Test 1.2: Mood Tracker - Set Mood
**Steps:**
1. Login as Sarah
2. Click on "Great" mood button
3. Verify mood is saved
4. Login as David  
5. Verify David can see Sarah's mood

**Expected Result:**
- ✅ Sarah's mood saved to `daily_moods`
- ✅ David can view Sarah's mood
- ✅ Today's date used as mood date

**Database Validation:**
```sql
-- Insert Sarah's mood
INSERT INTO daily_moods (user_id, couple_id, mood, date)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'great',
  CURRENT_DATE
);

-- Verify David can see it (via RLS policy)
SELECT * FROM daily_moods 
WHERE couple_id = '33333333-3333-3333-3333-333333333333'
  AND date = CURRENT_DATE;
```

---

#### Test 1.3: Add Milestone
**Steps:**
1. Login as Sarah
2. Click "Add New" milestone button
3. Fill form: Title="Our First Date", Date="2023-12-01", Icon="heart"
4. Click "Add Milestone"
5. Verify milestone appears in list

**Expected Result:**
- ✅ Milestone saved to database
- ✅ Both partners can see it
- ✅ Date displays correctly

**Database Validation:**
```sql
-- Insert milestone
INSERT INTO milestones (couple_id, title, date, icon_type, description)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Our First Date',
  '2023-12-01',
  'heart',
  'Coffee at Starbucks'
);

-- Verify both can see it
SELECT * FROM milestones 
WHERE couple_id = '33333333-3333-3333-3333-333333333333'
ORDER BY date DESC;
```

---

#### Test 1.4: Devotional Streak
**Steps:**
1. Complete a devotional as Sarah
2. Verify streak count increases
3. Check again next day
4. Verify streak continues

**Expected Result:**
- ✅ Streak increments on completion
- ✅ Streak breaks if day is skipped
- ✅ Longest streak is tracked

**Database Validation:**
```sql
-- Mark devotional complete
INSERT INTO devotional_completions (user_id, devotion_id)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM devotions LIMIT 1)
);

-- Update streak
INSERT INTO streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'devotional',
  1,
  1,
  CURRENT_DATE
)
ON CONFLICT (user_id, streak_type)
DO UPDATE SET
  current_streak = CASE 
    WHEN DATE(streaks.last_activity_date) = CURRENT_DATE - 1 
    THEN streaks.current_streak + 1
    ELSE 1
  END,
  longest_streak = GREATEST(streaks.longest_streak, current_streak + 1),
  last_activity_date = CURRENT_DATE;
```

---

### 2. PROFILE SETTINGS

#### Test 2.1: Update Profile
**Steps:**
1. Login as Sarah
2. Navigate to Profile Settings
3. Update bio: "Passionate about ministry"
4. Update phone: "+1234567890"
5. Click Save

**Expected Result:**
- ✅ Profile updated in database
- ✅ `updated_at` timestamp refreshed
- ✅ Changes visible immediately

**Database Validation:**
```sql
UPDATE users
SET 
  bio = 'Passionate about ministry',
  phone = '+1234567890',
  updated_at = now()
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Verify
SELECT full_name, bio, phone, updated_at 
FROM users 
WHERE id = '11111111-1111-1111-1111-111111111111';
```

---

#### Test 2.2: Partner Connection
**Steps:**
1. Create new user without partner
2. Generate invite code
3. Partner enters code
4. Verify couple is linked

**Expected Result:**
- ✅ Invite code stored in couples table
- ✅ Partner linked when code entered
- ✅ Both users see each other

**Database Validation:**
```sql
-- User creates invite code
UPDATE couples
SET invite_code = 'CONNECT2024'
WHERE partner_one = '11111111-1111-1111-1111-111111111111';

-- Partner accepts
UPDATE couples
SET 
  partner_two = '22222222-2222-2222-2222-222222222222',
  linked_at = now()
WHERE invite_code = 'CONNECT2024';
```

---

### 3. JOURNAL / SHARED JOURNAL

#### Test 3.1: Create Journal Entry
**Steps:**
1. Login as Sarah
2. Click "New Entry"
3. Add title: "Grateful for today"
4. Add content: "God showed me..."
5. Toggle "Share with partner"
6. Add emoji: "🙏"
7. Save

**Expected Result:**
- ✅ Entry saved to `journal_entries`
- ✅ `is_shared = true`
- ✅ David can see it

**Database Validation:**
```sql
INSERT INTO journal_entries (
  couple_id, author_id, title, content, 
  is_shared, emoji, entry_type
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Grateful for today',
  'God showed me His faithfulness in our relationship...',
  true,
  '🙏',
  'journal'
);

-- Verify David can see it
SELECT * FROM journal_entries
WHERE couple_id = '33333333-3333-3333-3333-333333333333'
  AND is_shared = true
ORDER BY created_at DESC;
```

---

#### Test 3.2: Add Comment to Journal
**Steps:**
1. Login as David
2. View Sarah's shared journal entry
3. Add comment: "Amen! Love this"
4. Submit

**Expected Result:**
- ✅ Comment saved to `journal_comments`
- ✅ Sarah can see David's comment
- ✅ User name/avatar displayed

**Database Validation:**
```sql
INSERT INTO journal_comments (journal_entry_id, user_id, content)
VALUES (
  (SELECT id FROM journal_entries WHERE title = 'Grateful for today'),
  '22222222-2222-2222-2222-222222222222',
  'Amen! Love this ❤️'
);

-- Fetch with user info
SELECT jc.*, u.full_name, u.avatar_url
FROM journal_comments jc
JOIN users u ON jc.user_id = u.id
WHERE jc.journal_entry_id = (SELECT id FROM journal_entries WHERE title = 'Grateful for today')
ORDER BY jc.created_at ASC;
```

---

#### Test 3.3: Upload Media to Journal
**Steps:**
1. Create journal entry
2. Upload image file
3. Verify stored in Supabase Storage
4. Verify URL saved in `media_files` JSONB

**Expected Result:**
- ✅ File uploaded to Storage bucket
- ✅ Signed URL generated
- ✅ Metadata saved in JSONB

**Database Validation:**
```sql
UPDATE journal_entries
SET media_files = jsonb_build_array(
  jsonb_build_object(
    'type', 'image',
    'url', 'https://[project].supabase.co/storage/v1/object/sign/...',
    'name', 'sunset.jpg',
    'size', 245678
  )
)
WHERE id = [entry_id];
```

---

### 4. PRAYER CORNER

#### Test 4.1: Create Prayer Request
**Steps:**
1. Login as Sarah
2. Click "New Prayer"
3. Title: "Job interview"
4. Description: "Pray for wisdom"
5. Toggle "Share with partner"
6. Submit

**Expected Result:**
- ✅ Prayer saved to `prayer_requests`
- ✅ `author_id` set to Sarah
- ✅ David can see it

**Database Validation:**
```sql
INSERT INTO prayer_requests (
  couple_id, author_id, title, description, is_shared
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Job interview',
  'Pray for wisdom and peace during my upcoming interview',
  true
);
```

---

#### Test 4.2: Mark Prayer as Answered
**Steps:**
1. View prayer request
2. Click "Mark as Answered"
3. Add update: "Got the job! Praise God!"

**Expected Result:**
- ✅ `is_answered = true`
- ✅ `answered_at` timestamp set
- ✅ Update saved to `prayer_updates`

**Database Validation:**
```sql
-- Mark answered
UPDATE prayer_requests
SET 
  is_answered = true,
  answered_at = now(),
  updated_at = now()
WHERE id = [prayer_id];

-- Add praise update
INSERT INTO prayer_updates (prayer_request_id, user_id, update_text, update_type)
VALUES (
  [prayer_id],
  '11111111-1111-1111-1111-111111111111',
  'Got the job! Praise God! 🙏',
  'answered'
);
```

---

### 5. QUIZZES

#### Test 5.1: Take Quiz
**Steps:**
1. Login as Sarah
2. Open "Love Languages Quiz"
3. Answer all questions
4. Submit quiz

**Expected Result:**
- ✅ Result saved to `quiz_results`
- ✅ Answers saved in JSONB
- ✅ Result type calculated

**Database Validation:**
```sql
INSERT INTO quiz_results (
  user_id, quiz_id, score, result_type, 
  answers, result_details
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM quizzes WHERE title = 'Love Languages Quiz'),
  85,
  'Words of Affirmation',
  '{"q1": "a", "q2": "b", "q3": "a"}'::jsonb,
  '{"primary": "Words of Affirmation", "secondary": "Quality Time"}'::jsonb
);
```

---

#### Test 5.2: Compare Results with Partner
**Steps:**
1. Both Sarah and David complete quiz
2. View comparison screen
3. Verify both results displayed

**Expected Result:**
- ✅ Both results fetched
- ✅ Comparison chart displayed
- ✅ Scripture insights shown

**Database Validation:**
```sql
-- Fetch both results
SELECT qr.*, u.full_name, u.avatar_url
FROM quiz_results qr
JOIN users u ON qr.user_id = u.id
WHERE qr.quiz_id = (SELECT id FROM quizzes WHERE title = 'Love Languages Quiz')
  AND qr.user_id IN (
    SELECT partner_one FROM couples WHERE id = '33333333-3333-3333-3333-333333333333'
    UNION
    SELECT partner_two FROM couples WHERE id = '33333333-3333-3333-3333-333333333333'
  )
ORDER BY qr.completed_at DESC;
```

---

### 6. KNOW EACH OTHER (Q&A)

#### Test 6.1: Answer Question
**Steps:**
1. Login as Sarah
2. Select "Faith" category
3. Answer question: "What's your favorite Bible verse?"
4. Response: "Philippians 4:13"
5. Save

**Expected Result:**
- ✅ Response saved to `question_responses`
- ✅ Linked to couple
- ✅ Partner can view if not private

**Database Validation:**
```sql
-- First ensure question exists
INSERT INTO questions (category, question, question_order)
VALUES ('Faith', 'What is your favorite Bible verse?', 1);

-- Save response
INSERT INTO question_responses (
  user_id, couple_id, question_id, response, is_private
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  (SELECT id FROM questions WHERE question = 'What is your favorite Bible verse?'),
  'Philippians 4:13 - I can do all things through Christ who strengthens me',
  false
);
```

---

#### Test 6.2: View Partner's Responses
**Steps:**
1. Login as David
2. Navigate to "Know Each Other"
3. View Faith category
4. See Sarah's responses

**Expected Result:**
- ✅ David can see non-private responses
- ✅ Private responses hidden
- ✅ Responses displayed correctly

**Database Validation:**
```sql
-- Fetch all non-private responses from partner
SELECT qr.*, q.question, u.full_name
FROM question_responses qr
JOIN questions q ON qr.question_id = q.id
JOIN users u ON qr.user_id = u.id
WHERE qr.couple_id = '33333333-3333-3333-3333-333333333333'
  AND qr.is_private = false
  AND qr.user_id = '11111111-1111-1111-1111-111111111111' -- Sarah's responses
ORDER BY q.category, q.question_order;
```

---

### 7. COMMUNITY GROUPS

#### Test 7.1: Create Group
**Steps:**
1. Login as Sarah
2. Create new group: "Young Couples Bible Study"
3. Add description
4. Save

**Expected Result:**
- ✅ Group saved to `groups`
- ✅ Sarah set as creator
- ✅ Sarah auto-added as admin member

**Database Validation:**
```sql
-- Create group
INSERT INTO groups (name, description, creator_id)
VALUES (
  'Young Couples Bible Study',
  'Weekly study for couples growing in faith together',
  '11111111-1111-1111-1111-111111111111'
)
RETURNING id;

-- Add creator as admin
INSERT INTO group_members (group_id, user_id, role)
VALUES (
  [group_id],
  '11111111-1111-1111-1111-111111111111',
  'admin'
);
```

---

#### Test 7.2: Join Group
**Steps:**
1. Login as David
2. Browse groups
3. Click "Join" on Sarah's group

**Expected Result:**
- ✅ David added to `group_members`
- ✅ Role set to "member"
- ✅ Can see group content

**Database Validation:**
```sql
INSERT INTO group_members (group_id, user_id, role)
VALUES (
  [group_id],
  '22222222-2222-2222-2222-222222222222',
  'member'
);

-- Verify membership
SELECT g.*, gm.role, gm.joined_at
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
WHERE gm.user_id = '22222222-2222-2222-2222-222222222222';
```

---

### 8. NOTIFICATIONS

#### Test 8.1: Partner Activity Notification
**Steps:**
1. Sarah creates a journal entry
2. Verify David receives notification
3. David clicks notification
4. Navigates to journal entry

**Expected Result:**
- ✅ Notification created for David
- ✅ Type set correctly
- ✅ Link navigates to entry

**Database Validation:**
```sql
-- Create notification for partner
INSERT INTO notifications (
  user_id, type, title, message, link, metadata
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'journal',
  'New Journal Entry',
  'Sarah shared a new journal entry',
  '/journal/[entry_id]',
  jsonb_build_object('entry_id', [entry_id], 'author', 'Sarah')
);
```

---

#### Test 8.2: Mark Notification as Read
**Steps:**
1. View notification
2. Click to mark as read
3. Verify badge updates

**Expected Result:**
- ✅ `is_read = true`
- ✅ Unread count decreases
- ✅ UI updates

**Database Validation:**
```sql
UPDATE notifications
SET is_read = true
WHERE id = [notification_id]
  AND user_id = '22222222-2222-2222-2222-222222222222';

-- Count unread
SELECT COUNT(*) as unread_count
FROM notifications
WHERE user_id = '22222222-2222-2222-2222-222222222222'
  AND is_read = false;
```

---

### 9. DEVOTIONALS

#### Test 9.1: View Daily Devotional
**Steps:**
1. Login as Sarah
2. Navigate to Devotionals
3. View today's devotional

**Expected Result:**
- ✅ Devotional fetched by published_date
- ✅ Title, body, verse displayed
- ✅ Audio player if audio_url exists

**Database Validation:**
```sql
SELECT * FROM devotions
WHERE published_date = CURRENT_DATE
LIMIT 1;
```

---

#### Test 9.2: Complete Devotional
**Steps:**
1. Read devotional
2. Click "Mark Complete"
3. Add personal note

**Expected Result:**
- ✅ Completion saved
- ✅ Streak updated
- ✅ Progress tracked

**Database Validation:**
```sql
-- Mark complete
INSERT INTO devotional_completions (user_id, devotion_id, notes)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  [devotion_id],
  'This really spoke to me about patience in our relationship'
);

-- Update streak (see Test 1.4)
```

---

### 10. PRE-MARRIAGE GUIDANCE MODULES

#### Test 10.1: Start Module
**Steps:**
1. Login as Sarah
2. Click "Communication Basics" module
3. Start first lesson

**Expected Result:**
- ✅ Progress record created
- ✅ `started_at` timestamp set
- ✅ Progress shows 0%

**Database Validation:**
```sql
INSERT INTO module_progress (
  user_id, module_id, started_at, 
  completed_lessons, progress_percentage
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM guidance_modules WHERE title = 'Communication Basics'),
  now(),
  0,
  0.00
);
```

---

#### Test 10.2: Complete Lesson
**Steps:**
1. Complete lesson 1
2. Verify progress updates
3. Move to lesson 2

**Expected Result:**
- ✅ `completed_lessons` increments
- ✅ `progress_percentage` recalculated
- ✅ UI shows progress bar

**Database Validation:**
```sql
UPDATE module_progress
SET 
  completed_lessons = completed_lessons + 1,
  progress_percentage = (completed_lessons + 1) * 100.0 / [total_lessons],
  is_completed = CASE 
    WHEN (completed_lessons + 1) >= [total_lessons] THEN true 
    ELSE false 
  END,
  updated_at = now()
WHERE user_id = '11111111-1111-1111-1111-111111111111'
  AND module_id = [module_id];
```

---

## 🔐 ROW LEVEL SECURITY (RLS) TESTS

### Test RLS-1: User Can Only See Own Data
**Test:**
```sql
-- As Sarah, try to access David's journal
SET request.jwt.claims.sub = '11111111-1111-1111-1111-111111111111';

SELECT * FROM journal_entries
WHERE author_id = '22222222-2222-2222-2222-222222222222'
  AND is_shared = false;

-- Should return 0 rows
```

**Expected:** ❌ No access to private entries

---

### Test RLS-2: Partners Can See Shared Data
**Test:**
```sql
-- As David, view Sarah's shared journal
SET request.jwt.claims.sub = '22222222-2222-2222-2222-222222222222';

SELECT * FROM journal_entries
WHERE couple_id = '33333333-3333-3333-3333-333333333333'
  AND is_shared = true;

-- Should return Sarah's shared entries
```

**Expected:** ✅ Can see shared entries

---

### Test RLS-3: Cannot Modify Partner's Data
**Test:**
```sql
-- As David, try to update Sarah's journal
SET request.jwt.claims.sub = '22222222-2222-2222-2222-222222222222';

UPDATE journal_entries
SET content = 'Hacked!'
WHERE author_id = '11111111-1111-1111-1111-111111111111';

-- Should fail due to RLS
```

**Expected:** ❌ Permission denied

---

## 📊 ERROR HANDLING TESTS

### Test ERR-1: Handle Missing Data
**Scenario:** User has no partner  
**Expected:** Show "Add Partner" UI, not crash

---

### Test ERR-2: Handle Network Errors
**Scenario:** Database connection fails  
**Expected:** Show error message, retry button

---

### Test ERR-3: Handle Validation Errors
**Scenario:** Submit empty journal entry  
**Expected:** Show validation error, prevent submission

---

### Test ERR-4: Handle Duplicate Entries
**Scenario:** Submit quiz twice  
**Expected:** Update existing result, don't create duplicate

---

## ✅ ACCEPTANCE CRITERIA

All tests pass when:

- [ ] All database tables exist with correct schema
- [ ] All UI components can read from database
- [ ] All UI components can write to database
- [ ] Foreign keys maintain referential integrity
- [ ] RLS policies prevent unauthorized access
- [ ] Error states display gracefully
- [ ] Loading states show during data fetch
- [ ] Toast notifications confirm actions
- [ ] Partner data sharing works correctly
- [ ] Media uploads store in Supabase Storage
- [ ] Timestamps auto-populate correctly
- [ ] Computed fields calculate accurately

---

## 🚀 RUNNING THE TESTS

### Prerequisites
```bash
# 1. Run schema creation
psql -f database/create_schema.sql

# 2. Run schema updates
psql -f database/schema_updates.sql

# 3. Create missing tables
psql -f database/create_missing_tables.sql

# 4. Insert test users
psql -f database/test_data.sql
```

### Manual UI Testing
1. Open app in browser
2. Follow test cases sequentially
3. Verify expected results
4. Check database for data persistence
5. Document any failures

---

**End of Test Plan**
