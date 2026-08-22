# Phase 1: Database Schema Setup

## 🎯 Goal
Fix the database schema by adding missing tables and columns.

**Time Required:** 30-45 minutes  
**Difficulty:** Easy (just copy & paste!)

---

## 📋 Prerequisites

✅ You have access to your Supabase Dashboard  
✅ You know your Supabase project URL  
✅ The basic 12 tables already exist (from initial setup)

---

## 🚀 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor (2 minutes)

1. Go to https://supabase.com/dashboard
2. Select your TwoBeOne project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

![Supabase SQL Editor Location](https://supabase.com/docs/img/sql-editor-location.png)

---

### Step 2: Run Schema Updates (10 minutes)

1. **Open** the file `/database/01_schema_updates.sql`
2. **Copy ALL** the SQL code (Ctrl+A, Ctrl+C)
3. **Paste** into the SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. **Wait** for completion (should take 5-10 seconds)

**Expected Output:**
```
✅ STEP 1 COMPLETE: Schema Updates
Updated 10 tables with 35+ new columns:
  ✅ users (7 columns)
  ✅ journal_entries (7 columns)
  ✅ prayer_requests (3 columns)
  ... etc
```

**What This Does:**
- Adds `bio`, `phone`, `location` to users table
- Adds `title`, `entry_type`, `emoji` to journal_entries
- Adds `author_id`, `answered_at` to prayer_requests
- And 25+ more columns across all tables

---

### Step 3: Create Missing Tables (10 minutes)

1. Click **"New Query"** in SQL Editor
2. **Open** the file `/database/02_create_missing_tables.sql`
3. **Copy ALL** the SQL code
4. **Paste** into the SQL Editor
5. Click **"Run"**
6. **Wait** for completion (should take 10-15 seconds)

**Expected Output:**
```
✅ STEP 2 COMPLETE: Missing Tables Created
Created 8 new tables:
  ✅ daily_moods
  ✅ devotional_completions
  ✅ streaks
  ✅ notifications
  ✅ questions
  ✅ question_responses
  ✅ journal_comments
  ✅ prayer_updates
```

**What This Does:**
- Creates table for mood tracking feature
- Creates table for devotional streaks
- Creates table for in-app notifications
- Creates table for Q&A responses
- And 4 more tables!

---

### Step 4: Verify Everything Worked (5 minutes)

1. Click **"New Query"** in SQL Editor
2. **Open** the file `/database/03_verify_schema.sql`
3. **Copy ALL** the SQL code
4. **Paste** into the SQL Editor
5. Click **"Run"**
6. **Review** the output

**Expected Output:**
```
✅ ALL 20 TABLES EXIST!

Core Tables (12):
  ✅ users
  ✅ couples
  ✅ guidance_modules
  ... etc

New Tables (8):
  ✅ daily_moods
  ✅ notifications
  ... etc

Total Foreign Keys: 45
Total Indexes: 52
Total RLS Policies: 48

✅ PHASE 1 COMPLETE!
```

---

### Step 5: Visual Confirmation (5 minutes)

1. Click **"Table Editor"** in left sidebar
2. **Scroll through** the table list
3. **Verify** you see all these tables:

**Should See:**
- ✅ couples
- ✅ daily_moods ← NEW!
- ✅ devotional_completions ← NEW!
- ✅ devotions
- ✅ group_members
- ✅ groups
- ✅ guidance_modules
- ✅ journal_comments ← NEW!
- ✅ journal_entries
- ✅ milestones
- ✅ module_progress
- ✅ notifications ← NEW!
- ✅ prayer_requests
- ✅ prayer_updates ← NEW!
- ✅ question_responses ← NEW!
- ✅ questions ← NEW!
- ✅ quiz_results
- ✅ quizzes
- ✅ streaks ← NEW!
- ✅ users

4. Click on **`users`** table
5. Verify you see these NEW columns:
   - bio
   - phone
   - location
   - updated_at
   - relationship_start
   - partner_id

6. Click on **`daily_moods`** table (NEW!)
7. Verify structure looks correct

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] All 3 SQL scripts ran without errors
- [ ] Verification script shows "✅ ALL 20 TABLES EXIST!"
- [ ] Table Editor shows 20 tables total
- [ ] Users table has new columns (bio, phone, location)
- [ ] New tables visible (daily_moods, notifications, etc.)
- [ ] No red error messages in SQL Editor

---

## ❌ Troubleshooting

### Error: "table already exists"
**Solution:** This is OK! The scripts use `IF NOT EXISTS` so they're safe to run multiple times. Just continue.

### Error: "column already exists"
**Solution:** This is OK! Same reason as above. Continue to next script.

### Error: "relation does not exist"
**Cause:** Basic tables weren't created yet  
**Solution:** Run `/database/create_schema.sql` first, then retry Phase 1

### Error: "permission denied"
**Cause:** Not logged in or wrong project  
**Solution:** Verify you're in the correct Supabase project

### SQL Editor shows nothing after clicking "Run"
**Solution:** Look in the **"Results"** tab at the bottom of the editor

### Can't find SQL Editor
**Solution:** 
1. Make sure you're in your project dashboard
2. Look for icon that looks like `</>` or "SQL Editor" in left menu
3. Try refreshing the page

---

## 📊 What Changed?

### Tables Added (8):
1. **daily_moods** - Mood tracking between partners
2. **devotional_completions** - Track which devotionals users completed
3. **streaks** - Gamification (devotional streaks, journal streaks, etc.)
4. **notifications** - In-app notification system
5. **questions** - Dynamic question management for Q&A
6. **question_responses** - Store user answers to questions
7. **journal_comments** - Comments on journal entries
8. **prayer_updates** - Track prayer journey updates

### Columns Added (35+):
- **users:** bio, phone, location, updated_at, relationship_start, partner_id, invite_code_ref
- **journal_entries:** title, entry_type, location, emoji, prompt_id, updated_at, media_files
- **prayer_requests:** author_id, updated_at, answered_at
- **quiz_results:** answers, result_type, result_details
- **devotions:** published_date, verse_text, verse_reference
- **groups:** creator_id, meeting_schedule, max_members, image_url
- **group_members:** role
- **milestones:** media_url, category
- **module_progress:** started_at
- **couples:** couple_name, couple_picture, anniversary_date, relationship_status

### Security Added:
- 48+ Row Level Security (RLS) policies
- Foreign keys for data integrity
- Indexes for fast queries
- Check constraints for data validation

---

## 🎉 Phase 1 Complete!

Congratulations! Your database is now properly structured and ready for Phase 2.

**What's Next:**
1. **Phase 2:** Update TypeScript types to match database
2. **Phase 3:** Implement backend API routes
3. **Phase 4:** Connect UI components to real database

---

## 📞 Need Help?

If you're stuck:
1. Check the error message in SQL Editor "Results" tab
2. Look for the specific error in Troubleshooting section above
3. Re-read the step you're on carefully
4. Make sure you ran the scripts in order (01 → 02 → 03)

---

**Time to celebrate! 🎊 You just upgraded your database schema!**

Move on to Phase 2 when ready: `/database/PHASE_2_INSTRUCTIONS.md`
