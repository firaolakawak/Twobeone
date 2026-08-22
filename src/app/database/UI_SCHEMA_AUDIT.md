# TwoBeOne UI/UX ↔ Database Schema Audit Report

**Date:** November 10, 2025  
**Purpose:** Validate alignment between all UI components and Supabase database schema

---

## 📊 AUDIT SUMMARY

| Category | Status | Issues Found | Actions Required |
|----------|--------|--------------|------------------|
| Schema Alignment | ⚠️ Partial | 15 | Type mapping, field additions |
| Data Storage | ❌ Critical | 8 | Backend integration required |
| Data Fetching | ⚠️ Partial | 12 | API implementation needed |
| Error Handling | ⚠️ Partial | 10 | Add error states |
| Test Coverage | ❌ Missing | N/A | Create test suite |

---

## 🔍 DETAILED COMPONENT AUDIT

### 1. COUPLE DASHBOARD (`CoupleDashboard.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| Profile name | `users` | `full_name` | ⚠️ | Type mismatch: UI uses `name`, DB uses `full_name` |
| Profile avatar | `users` | `avatar_url` | ⚠️ | Type mismatch: UI uses `profilePicture`, DB uses `avatar_url` |
| Partner info | `couples` | `partner_one`, `partner_two` | ✅ | Aligned |
| Days together | `couples` | `linked_at` | ✅ | Calculated from timestamp |
| Invite code | `couples` | `invite_code` | ✅ | Aligned |
| Devotional streak | ❌ Missing | N/A | ❌ | No table for tracking streaks |
| Prayer count | `prayer_requests` | COUNT(*) | ⚠️ | Needs backend query |
| Journal count | `journal_entries` | COUNT(*) | ⚠️ | Needs backend query |
| Daily Bible verse | External API | N/A | ✅ | Not stored in DB |
| Today's mood | ❌ Missing | N/A | ❌ | No `moods` table |
| Partner's mood | ❌ Missing | N/A | ❌ | No `moods` table |
| Milestones | `milestones` | All fields | ✅ | Aligned |

**Issues:**
1. ❌ **CRITICAL**: No `moods` or `daily_moods` table for mood tracking feature
2. ❌ **CRITICAL**: No `streaks` or `devotional_progress` table for devotional streaks
3. ⚠️ **Field mismatch**: TypeScript types use different field names than DB schema
4. ⚠️ **Missing FK**: Mood tracker needs `user_id` and `couple_id` foreign keys

**Required Actions:**
- Create `daily_moods` table with columns: `id`, `user_id`, `couple_id`, `mood`, `date`, `created_at`
- Create `devotional_streaks` table with columns: `id`, `user_id`, `current_streak`, `longest_streak`, `last_completed_date`
- Update TypeScript interface to match DB schema
- Implement backend endpoints for mood CRUD operations

---

### 2. PROFILE SETTINGS (`ProfileSettings.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| User ID | `users` | `id` | ✅ | UUID matches |
| Email | `users` | `email` | ✅ | TEXT matches |
| Full name | `users` | `full_name` | ⚠️ | Type uses `name` |
| Avatar URL | `users` | `avatar_url` | ⚠️ | Type uses `profilePicture` |
| Bio | ❌ Missing | N/A | ❌ | No `bio` column in users table |
| Phone | ❌ Missing | N/A | ❌ | No `phone` column in users table |
| Location | ❌ Missing | N/A | ❌ | No `location` column in users table |
| Relationship start | `couples` | `linked_at` | ⚠️ | Different field name |
| Created at | `users` | `created_at` | ✅ | Aligned |

**Issues:**
1. ❌ **CRITICAL**: Missing columns in `users` table: `bio`, `phone`, `location`
2. ⚠️ **Type mismatch**: Interface uses different names than DB schema
3. ⚠️ **Missing updated_at**: Users table needs `updated_at` timestamp

**Required Actions:**
- Add columns to `users` table: `bio TEXT`, `phone TEXT`, `location TEXT`, `updated_at TIMESTAMP`
- Update TypeScript types to match DB schema
- Implement UPDATE user profile endpoint

---

### 3. JOURNAL / SHARED JOURNAL (`EnhancedJournal.tsx`, `CollaborativeJournal.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| Entry ID | `journal_entries` | `id` | ✅ | UUID matches |
| Couple ID | `journal_entries` | `couple_id` | ✅ | Aligned |
| Author ID | `journal_entries` | `author_id` | ✅ | Aligned |
| Title | ❌ Missing | N/A | ❌ | No `title` column in journal_entries |
| Content | `journal_entries` | `content` | ✅ | TEXT matches |
| Media files | `journal_entries` | `media_urls` | ⚠️ | Type mismatch: UI uses objects, DB uses TEXT[] |
| Is shared | `journal_entries` | `is_shared` | ✅ | BOOLEAN matches |
| Created at | `journal_entries` | `created_at` | ✅ | Aligned |
| Entry type | ❌ Missing | N/A | ❌ | No `entry_type` column |
| Location | ❌ Missing | N/A | ❌ | No `location` column |
| Emoji | ❌ Missing | N/A | ❌ | No `emoji` column |
| Comments | ❌ Missing | N/A | ❌ | No `comments` table/column |
| Prompt ID | ❌ Missing | N/A | ❌ | No `prompt_id` column |

**Issues:**
1. ❌ **CRITICAL**: Missing columns: `title`, `entry_type`, `location`, `emoji`, `prompt_id`, `updated_at`
2. ❌ **CRITICAL**: No `journal_comments` table for comment feature
3. ⚠️ **Data structure**: `media_urls` should store structured data (type, url, name), not just URLs
4. ⚠️ **Missing validation**: No backend validation for media file types

**Required Actions:**
- Add columns to `journal_entries`: `title TEXT`, `entry_type TEXT`, `location TEXT`, `emoji TEXT`, `prompt_id UUID`, `updated_at TIMESTAMP`
- Create `journal_comments` table with FK to `journal_entries`
- Change `media_urls TEXT[]` to `media_files JSONB` for structured storage
- Implement backend endpoints for journal CRUD + comments

---

### 4. PRAYER CORNER (`PrayerBoard.tsx`, `PrayerSection.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| Prayer ID | `prayer_requests` | `id` | ✅ | UUID matches |
| Couple ID | `prayer_requests` | `couple_id` | ✅ | Aligned |
| Title | `prayer_requests` | `title` | ✅ | TEXT matches |
| Description | `prayer_requests` | `description` | ✅ | TEXT matches |
| Is answered | `prayer_requests` | `is_answered` | ✅ | BOOLEAN matches |
| Is shared | `prayer_requests` | `is_shared` | ✅ | BOOLEAN matches |
| Created at | `prayer_requests` | `created_at` | ✅ | Aligned |
| User ID | ❌ Missing | N/A | ❌ | No `user_id` or `author_id` column |
| Updated at | ❌ Missing | N/A | ❌ | No `updated_at` column |
| Answer date | ❌ Missing | N/A | ❌ | No `answered_at` timestamp |

**Issues:**
1. ❌ **CRITICAL**: Missing `user_id` or `author_id` column to track who created the prayer
2. ⚠️ **Missing metadata**: No `updated_at` or `answered_at` timestamps
3. ⚠️ **Missing feature**: No prayer comments/updates table

**Required Actions:**
- Add `author_id UUID REFERENCES users(id)` to `prayer_requests`
- Add `updated_at TIMESTAMP` and `answered_at TIMESTAMP`
- Create `prayer_updates` table for tracking prayer journey
- Implement backend endpoints for prayer CRUD

---

### 5. QUIZZES (`QuizHub.tsx`, `LoveLanguagesQuiz.tsx`, `ConflictStyleQuiz.tsx`, `FaithJourneyQuiz.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| Quiz ID | `quizzes` | `id` | ✅ | UUID matches |
| Quiz title | `quizzes` | `title` | ✅ | TEXT matches |
| Description | `quizzes` | `description` | ✅ | TEXT matches |
| Questions | `quizzes` | `questions` | ✅ | JSONB matches |
| Created at | `quizzes` | `created_at` | ✅ | Aligned |
| Result ID | `quiz_results` | `id` | ✅ | UUID matches |
| User ID | `quiz_results` | `user_id` | ✅ | FK aligned |
| Quiz ID (FK) | `quiz_results` | `quiz_id` | ✅ | FK aligned |
| Score | `quiz_results` | `score` | ✅ | INTEGER matches |
| Scripture insights | `quiz_results` | `scripture_insights` | ✅ | TEXT matches |
| Completed at | `quiz_results` | `completed_at` | ✅ | Aligned |
| Answers | ❌ Missing | N/A | ❌ | No `answers` JSONB column |
| Result type | ❌ Missing | N/A | ❌ | No `result_type` column (e.g., "Physical Touch") |

**Issues:**
1. ⚠️ **Missing data**: `answers` JSONB field would be useful for review
2. ⚠️ **Missing metadata**: `result_type` would help display results

**Required Actions:**
- Add `answers JSONB` to `quiz_results` to store user's actual answers
- Add `result_type TEXT` to categorize quiz results
- Implement backend endpoints for quiz submission and comparison

---

### 6. DEVOTIONALS (`DailyDevotional.tsx`, `DailyDevotionsFeed.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| Devotion ID | `devotions` | `id` | ✅ | UUID matches |
| Title | `devotions` | `title` | ✅ | TEXT matches |
| Body/Content | `devotions` | `body` | ✅ | TEXT matches |
| Audio URL | `devotions` | `audio_url` | ✅ | TEXT matches |
| Memory verse | `devotions` | `memory_verse` | ✅ | TEXT matches |
| Created at | `devotions` | `created_at` | ✅ | Aligned |
| Verse reference | ❌ Missing | N/A | ⚠️ | Stored in memory_verse field |
| Date | ❌ Missing | N/A | ❌ | No `date` or `published_date` column |
| Reflection | ❌ Missing | N/A | ⚠️ | Stored in body field |
| Completion status | ❌ Missing | N/A | ❌ | No tracking table |

**Issues:**
1. ⚠️ **Missing column**: `published_date DATE` for scheduling devotionals
2. ❌ **CRITICAL**: No `devotional_completions` table to track user progress
3. ⚠️ **Structure**: Consider separating verse text and reference

**Required Actions:**
- Add `published_date DATE` to `devotions`
- Create `devotional_completions` table: `id`, `user_id`, `devotion_id`, `completed_at`
- Add `verse_text TEXT` and `verse_reference TEXT` separate columns
- Implement backend endpoints for marking devotionals complete

---

### 7. COMMUNITY GROUPS (`CommunityGroups.tsx`, `GroupDetailScreen.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| Group ID | `groups` | `id` | ✅ | UUID matches |
| Group name | `groups` | `name` | ✅ | TEXT matches |
| Description | `groups` | `description` | ✅ | TEXT matches |
| Is active | `groups` | `is_active` | ✅ | BOOLEAN matches |
| Created at | `groups` | `created_at` | ✅ | Aligned |
| Member ID | `group_members` | `id` | ✅ | UUID matches |
| Group ID (FK) | `group_members` | `group_id` | ✅ | FK aligned |
| User ID (FK) | `group_members` | `user_id` | ✅ | FK aligned |
| Joined at | `group_members` | `joined_at` | ✅ | Aligned |
| Creator ID | ❌ Missing | N/A | ❌ | No `creator_id` in groups table |
| Member count | ❌ Missing | N/A | ⚠️ | Calculated field |
| Member role | ❌ Missing | N/A | ❌ | No `role` column in group_members |
| Meeting schedule | ❌ Missing | N/A | ❌ | No `meeting_schedule` or `schedule` column |

**Issues:**
1. ❌ **CRITICAL**: Missing `creator_id UUID REFERENCES users(id)` in `groups`
2. ⚠️ **Missing feature**: No `role` in `group_members` (admin, moderator, member)
3. ⚠️ **Missing metadata**: No meeting schedule, location, or capacity fields

**Required Actions:**
- Add `creator_id UUID REFERENCES users(id)` to `groups`
- Add `role TEXT DEFAULT 'member'` to `group_members`
- Add `meeting_schedule TEXT`, `max_members INTEGER` to `groups`
- Implement backend endpoints for group management

---

### 8. PRE-MARRIAGE GUIDANCE (`PreMarriageGuidance.tsx`, `PreMarriageHub.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| Module ID | `guidance_modules` | `id` | ✅ | UUID matches |
| Title | `guidance_modules` | `title` | ✅ | TEXT matches |
| Description | `guidance_modules` | `description` | ✅ | TEXT matches |
| Module order | `guidance_modules` | `module_order` | ✅ | INTEGER matches |
| Duration | `guidance_modules` | `duration_minutes` | ✅ | INTEGER matches |
| Content | `guidance_modules` | `content` | ✅ | JSONB matches |
| Is active | `guidance_modules` | `is_active` | ✅ | BOOLEAN matches |
| Created at | `guidance_modules` | `created_at` | ✅ | Aligned |
| Progress ID | `module_progress` | `id` | ✅ | UUID matches |
| User ID (FK) | `module_progress` | `user_id` | ✅ | FK aligned |
| Module ID (FK) | `module_progress` | `module_id` | ✅ | FK aligned |
| Completed lessons | `module_progress` | `completed_lessons` | ✅ | INTEGER matches |
| Progress % | `module_progress` | `progress_percentage` | ✅ | NUMERIC matches |
| Is completed | `module_progress` | `is_completed` | ✅ | BOOLEAN matches |
| Updated at | `module_progress` | `updated_at` | ✅ | Aligned |
| Total lessons | ❌ Missing | N/A | ⚠️ | Calculated from content JSONB |
| Started at | ❌ Missing | N/A | ❌ | No `started_at` timestamp |

**Issues:**
1. ⚠️ **Missing timestamp**: `started_at` would be useful for analytics
2. ⚠️ **JSONB structure**: Content structure needs documentation

**Required Actions:**
- Add `started_at TIMESTAMP` to `module_progress`
- Document expected JSONB structure for `content` field
- Implement backend endpoints for module progress tracking

---

### 9. RELATIONSHIP TIMELINE (`RelationshipTimeline.tsx`, `MilestonesTracker.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| Milestone ID | `milestones` | `id` | ✅ | UUID matches |
| Couple ID | `milestones` | `couple_id` | ✅ | FK aligned |
| Title | `milestones` | `title` | ✅ | TEXT matches |
| Description | `milestones` | `description` | ✅ | TEXT matches |
| Date | `milestones` | `date` | ✅ | DATE matches |
| Icon | `milestones` | `icon_type` | ✅ | TEXT matches |
| Created at | `milestones` | `created_at` | ✅ | Aligned |
| Media | ❌ Missing | N/A | ❌ | No `media_url` or `photo_url` column |
| Category | ❌ Missing | N/A | ❌ | No `category` column |

**Issues:**
1. ⚠️ **Missing feature**: No media attachment support
2. ⚠️ **Missing categorization**: Consider adding milestone categories

**Required Actions:**
- Add `media_url TEXT` or `media_urls TEXT[]` to `milestones`
- Add `category TEXT` for milestone types
- Implement backend endpoints for milestone CRUD

---

### 10. NOTIFICATIONS (`NotificationCenter.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| Notification ID | ❌ Missing | N/A | ❌ | No `notifications` table |
| User ID | ❌ Missing | N/A | ❌ | No table exists |
| Type | ❌ Missing | N/A | ❌ | No table exists |
| Message | ❌ Missing | N/A | ❌ | No table exists |
| Is read | ❌ Missing | N/A | ❌ | No table exists |
| Created at | ❌ Missing | N/A | ❌ | No table exists |

**Issues:**
1. ❌ **CRITICAL**: Entire `notifications` table is missing from schema

**Required Actions:**
- Create `notifications` table with all required fields
- Add foreign keys and indexes
- Implement real-time notification system
- Create backend endpoints for notification CRUD

---

### 11. KNOW EACH OTHER / Q&A (`QuestionsSection.tsx`, `QADiscussionHub.tsx`)

#### UI Fields vs Database Schema

| UI Field | Database Table | Database Column | Status | Notes |
|----------|---------------|-----------------|--------|-------|
| Question ID | ❌ Missing | N/A | ❌ | No `questions` table in schema |
| Question text | ❌ Missing | N/A | ❌ | Hardcoded in app |
| Category | ❌ Missing | N/A | ❌ | Hardcoded in app |
| Response ID | ❌ Missing | N/A | ❌ | No `question_responses` table |
| User ID | ❌ Missing | N/A | ❌ | No table exists |
| Answer | ❌ Missing | N/A | ❌ | No table exists |

**Issues:**
1. ❌ **CRITICAL**: No `questions` table for dynamic question management
2. ❌ **CRITICAL**: No `question_responses` table to store answers
3. ⚠️ **Hardcoded data**: Questions are hardcoded instead of DB-driven

**Required Actions:**
- Create `questions` table: `id`, `category`, `question`, `description`, `order`, `is_active`
- Create `question_responses` table: `id`, `user_id`, `question_id`, `response`, `created_at`, `updated_at`
- Migrate hardcoded questions to database
- Implement backend endpoints for questions and responses

---

## 📋 MISSING TABLES SUMMARY

### Tables That Need to Be Created:

1. **`daily_moods`**
   ```sql
   CREATE TABLE daily_moods (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
       mood TEXT NOT NULL CHECK (mood IN ('great', 'good', 'okay', 'sad')),
       note TEXT,
       date DATE NOT NULL DEFAULT CURRENT_DATE,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
       UNIQUE(user_id, date)
   );
   ```

2. **`devotional_completions`**
   ```sql
   CREATE TABLE devotional_completions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       devotion_id UUID NOT NULL REFERENCES devotions(id) ON DELETE CASCADE,
       completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
       UNIQUE(user_id, devotion_id)
   );
   ```

3. **`streaks`**
   ```sql
   CREATE TABLE streaks (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       streak_type TEXT NOT NULL, -- 'devotional', 'journal', 'prayer'
       current_streak INTEGER DEFAULT 0,
       longest_streak INTEGER DEFAULT 0,
       last_activity_date DATE,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
       UNIQUE(user_id, streak_type)
   );
   ```

4. **`notifications`**
   ```sql
   CREATE TABLE notifications (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       type TEXT NOT NULL,
       title TEXT NOT NULL,
       message TEXT NOT NULL,
       link TEXT,
       is_read BOOLEAN DEFAULT false,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );
   ```

5. **`questions`**
   ```sql
   CREATE TABLE questions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       category TEXT NOT NULL,
       question TEXT NOT NULL,
       description TEXT,
       question_order INTEGER,
       is_active BOOLEAN DEFAULT true,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );
   ```

6. **`question_responses`**
   ```sql
   CREATE TABLE question_responses (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
       question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
       response TEXT NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
       UNIQUE(user_id, question_id)
   );
   ```

7. **`journal_comments`**
   ```sql
   CREATE TABLE journal_comments (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       content TEXT NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );
   ```

8. **`prayer_updates`**
   ```sql
   CREATE TABLE prayer_updates (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       update_text TEXT NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );
   ```

---

## 🔧 REQUIRED SCHEMA MODIFICATIONS

### Tables That Need Column Additions:

#### 1. `users` table
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS relationship_start DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
```

#### 2. `journal_entries` table
```sql
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'journal';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS emoji TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS prompt_id UUID;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
-- Change media_urls to JSONB for structured data
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS media_files JSONB;
```

#### 3. `prayer_requests` table
```sql
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP WITH TIME ZONE;
```

#### 4. `quiz_results` table
```sql
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS result_type TEXT;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS result_details JSONB;
```

#### 5. `devotions` table
```sql
ALTER TABLE devotions ADD COLUMN IF NOT EXISTS published_date DATE;
ALTER TABLE devotions ADD COLUMN IF NOT EXISTS verse_text TEXT;
ALTER TABLE devotions ADD COLUMN IF NOT EXISTS verse_reference TEXT;
```

#### 6. `groups` table
```sql
ALTER TABLE groups ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS meeting_schedule TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS max_members INTEGER;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS image_url TEXT;
```

#### 7. `group_members` table
```sql
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member'));
```

#### 8. `milestones` table
```sql
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS category TEXT;
```

#### 9. `module_progress` table
```sql
ALTER TABLE module_progress ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
```

---

## 🎯 PRIORITY ACTION ITEMS

### 🔴 CRITICAL (Must Fix Immediately)

1. **Create missing tables**: `daily_moods`, `notifications`, `questions`, `question_responses`, `devotional_completions`, `streaks`
2. **Add missing columns** to existing tables (see schema modifications above)
3. **Implement TypeScript type alignment** with database schema
4. **Create backend CRUD endpoints** for all features
5. **Add author_id to prayer_requests** for proper data attribution

### 🟡 HIGH (Should Fix Soon)

6. **Implement media storage** in Supabase Storage with signed URLs
7. **Add RLS policies** for all new tables
8. **Create indexes** on foreign keys and frequently queried columns
9. **Implement error handling** and loading states in all components
10. **Add data validation** on backend before storage

### 🟢 MEDIUM (Nice to Have)

11. **Add journal comments** functionality
12. **Implement prayer updates** timeline
13. **Add quiz answer storage** for review
14. **Create analytics/insights** tables
15. **Add couple profile** fields (anniversary, couple picture, etc.)

---

## ✅ COMPONENTS WITH GOOD ALIGNMENT

These components have proper alignment with the database:

1. ✅ **Quizzes core data** (quizzes table structure)
2. ✅ **Milestones core data** (milestones table structure)
3. ✅ **Groups core data** (groups and group_members structure)
4. ✅ **Couples linking** (couples table and invite codes)
5. ✅ **Module progress tracking** (module_progress table)

---

## 📝 NEXT STEPS

1. Run `/database/schema_updates.sql` to add all missing columns
2. Run `/database/create_missing_tables.sql` to create new tables
3. Update `/types/index.ts` to match database schema exactly
4. Implement backend API routes in `/supabase/functions/server/index.tsx`
5. Add error boundaries and loading states to all components
6. Create comprehensive test suite
7. Test with real user data flow

---

**End of Audit Report**
