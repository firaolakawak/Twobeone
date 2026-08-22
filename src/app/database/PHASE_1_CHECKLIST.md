# Phase 1: Database Schema Setup - Checklist

Use this checklist to track your progress through Phase 1.

---

## 🎯 Goal
Fix database schema by adding missing tables and columns

**Estimated Time:** 30-45 minutes  
**Difficulty:** Easy (copy & paste!)

---

## ✅ Pre-Flight Checklist

Before starting, verify:

- [ ] I have access to Supabase Dashboard
- [ ] I know my project URL/name
- [ ] I can access SQL Editor
- [ ] I have the `/database/` folder with SQL files
- [ ] I've read QUICK_START.md or PHASE_1_INSTRUCTIONS.md

---

## 📝 Step 1: Update Existing Tables

**File:** `01_schema_updates.sql`  
**Time:** 10 minutes

- [ ] Opened Supabase SQL Editor
- [ ] Created new query
- [ ] Copied entire contents of `01_schema_updates.sql`
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run" button
- [ ] Waited for completion (5-10 seconds)
- [ ] Saw success message: "✅ STEP 1 COMPLETE: Schema Updates"
- [ ] Saw: "Updated 10 tables with 35+ new columns"
- [ ] No red error messages

**Common Errors:**
- "column already exists" → This is OK! Continue.
- "table does not exist" → Run `create_schema.sql` first

---

## 📝 Step 2: Create Missing Tables

**File:** `02_create_missing_tables.sql`  
**Time:** 10 minutes

- [ ] Clicked "New Query" in SQL Editor
- [ ] Copied entire contents of `02_create_missing_tables.sql`
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run" button
- [ ] Waited for completion (10-15 seconds)
- [ ] Saw success message: "✅ STEP 2 COMPLETE: Missing Tables Created"
- [ ] Saw: "Created 8 new tables"
- [ ] Listed tables include: daily_moods, notifications, questions, etc.
- [ ] No red error messages

**Common Errors:**
- "table already exists" → This is OK! Continue.
- "relation does not exist" → Step 1 wasn't run successfully

---

## 📝 Step 3: Verify Schema

**File:** `03_verify_schema.sql`  
**Time:** 5 minutes

- [ ] Clicked "New Query" in SQL Editor
- [ ] Copied entire contents of `03_verify_schema.sql`
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run" button
- [ ] Saw: "✅ ALL 20 TABLES EXIST!"
- [ ] Saw list of Core Tables (12)
- [ ] Saw list of New Tables (8)
- [ ] Foreign Keys count: 40+
- [ ] Indexes count: 40+
- [ ] RLS Policies count: 40+
- [ ] Saw: "✅ PHASE 1 COMPLETE!"
- [ ] No "❌ MISSING" messages

**If you see missing tables:**
- Go back to Step 2
- Re-run `02_create_missing_tables.sql`
- Then re-run verification

---

## 📝 Step 4: Visual Confirmation

**Location:** Supabase Table Editor  
**Time:** 5 minutes

- [ ] Clicked "Table Editor" in left sidebar
- [ ] Can see 20 tables listed
- [ ] Found table: `users`
- [ ] Found table: `couples`
- [ ] Found table: `daily_moods` ← NEW!
- [ ] Found table: `notifications` ← NEW!
- [ ] Found table: `questions` ← NEW!
- [ ] Found table: `question_responses` ← NEW!
- [ ] Found table: `journal_comments` ← NEW!
- [ ] Found table: `prayer_updates` ← NEW!
- [ ] Found table: `devotional_completions` ← NEW!
- [ ] Found table: `streaks` ← NEW!

**Verify New Columns:**
- [ ] Clicked on `users` table
- [ ] Can see column: `bio`
- [ ] Can see column: `phone`
- [ ] Can see column: `location`
- [ ] Can see column: `updated_at`

---

## 📝 Step 5: Test Data (Optional)

**File:** `04_test_data.sql`  
**Time:** 5 minutes

- [ ] Clicked "New Query" in SQL Editor
- [ ] Copied entire contents of `04_test_data.sql`
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run" button
- [ ] Saw: "✅ TEST DATA LOADED"
- [ ] Saw: "Added 40 'Know Each Other' questions"
- [ ] Saw: "Added 3 sample devotionals"

**Verify Test Data:**
- [ ] In Table Editor, clicked `questions` table
- [ ] Can see rows with questions
- [ ] Categories include: Faith, Love, Communication, etc.
- [ ] In Table Editor, clicked `devotions` table
- [ ] Can see 3 devotional entries

---

## 🎯 Final Verification

Run these queries to confirm everything:

### Query 1: Count Tables
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```
- [ ] Result shows: **20** (or more)

### Query 2: List All Tables
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```
- [ ] See all 20 expected tables

### Query 3: Check New Columns
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY column_name;
```
- [ ] See: bio, phone, location in list

### Query 4: Count Foreign Keys
```sql
SELECT COUNT(*) FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
```
- [ ] Result shows: **40+**

---

## ✅ Success Criteria

Mark complete when ALL are true:

- [ ] All 3 SQL scripts ran without errors
- [ ] Verification shows "✅ ALL 20 TABLES EXIST!"
- [ ] Table Editor shows 20+ tables
- [ ] Users table has new columns (bio, phone, location)
- [ ] New tables visible (daily_moods, notifications, etc.)
- [ ] Foreign keys count is 40+
- [ ] No critical errors or warnings
- [ ] (Optional) Test data loaded successfully

---

## 🎉 Completion

**Phase 1 Status:** 
- [ ] ✅ COMPLETE - All checks passed!
- [ ] ⚠️ PARTIAL - Some issues, but moving forward
- [ ] ❌ INCOMPLETE - Need to retry

**If Complete:**
→ Read [PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md) to see what you accomplished  
→ Move on to Phase 2: Update TypeScript Types  
→ See [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) for next steps

**If Partial/Incomplete:**
→ Review error messages  
→ Check [PHASE_1_INSTRUCTIONS.md](PHASE_1_INSTRUCTIONS.md) troubleshooting  
→ Re-run failed scripts  
→ Ask for help if stuck

---

## 📊 What You Accomplished

When Phase 1 is complete, you have:

✅ Updated 10 existing tables  
✅ Added 35+ new columns  
✅ Created 8 new tables  
✅ Set up 48+ RLS policies  
✅ Created 52+ performance indexes  
✅ Established 45+ foreign keys  
✅ Prepared database for production  

**Time Invested:** ~45 minutes  
**Value Created:** Production-ready database schema! 🚀

---

## 🔄 If You Need to Start Over

1. **Backup first!** (Settings → Database → Create backup)
2. Drop all changes:
   ```sql
   -- WARNING: Only if you need to completely reset
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
3. Re-run initial setup: `create_schema.sql`
4. Then re-run Phase 1 scripts

**Better option:** Just re-run the Phase 1 scripts - they're safe to run multiple times!

---

## 📝 Notes Section

Use this space to track any issues or observations:

```
Date: ___________
Time Started: ___________
Time Completed: ___________

Issues Encountered:
- 
- 
- 

Solutions Applied:
- 
- 
- 

Final Status: ✅ Complete / ⚠️ Partial / ❌ Incomplete
```

---

**Ready for Phase 2? See you in the TypeScript types update!** 🎯
