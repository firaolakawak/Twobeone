# 🔧 Fix: "Could not find the table 'public.users'" Error

## ❌ Problem
The backend code is trying to query database tables that don't exist yet!

**Error:** `Could not find the table 'public.users' in the schema cache`

---

## ✅ Solution: Create Database Tables

You need to run ONE SQL script in Supabase to create all the tables.

---

## 📋 Step-by-Step Fix

### **Step 1: Open Supabase SQL Editor**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your TwoBeOne project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"** button

---

### **Step 2: Copy the SQL Script**

1. Open the file: `/database/COMPLETE_SCHEMA_SETUP.sql`
2. **Copy the ENTIRE contents** (all ~350 lines)

---

### **Step 3: Run the Script**

1. **Paste** the SQL into the SQL Editor
2. Click the **"Run"** button (or press Ctrl/Cmd + Enter)
3. Wait ~5-10 seconds for it to complete

**Expected Output:**
```
Success. No rows returned.
```

Then scroll down and you should see:
```
table_name              | column_count
-----------------------|-------------
couples                 | 8
daily_moods             | 7
devotional_completions  | 4
devotions               | 7
journal_entries         | 12
milestones              | 8
notifications           | 9
prayer_requests         | 9
question_responses      | 7
questions               | 6
streaks                 | 6
users                   | 11

12 rows
```

✅ **If you see 12 tables listed, you're done!**

---

### **Step 4: Verify Tables Were Created**

1. In Supabase Dashboard, click **"Table Editor"** in left sidebar
2. You should now see all these tables:
   - ✅ users
   - ✅ couples
   - ✅ devotions
   - ✅ journal_entries
   - ✅ prayer_requests
   - ✅ daily_moods
   - ✅ notifications
   - ✅ questions
   - ✅ question_responses
   - ✅ devotional_completions
   - ✅ streaks
   - ✅ milestones

---

### **Step 5: Restart Your App**

Your backend server should automatically restart and initialize the database with sample data.

**Check the server logs for:**
```
=== INITIALIZING DATABASE ===
✓ Admin account exists
✓ Devotionals exist
✓ Questions exist
=== DATABASE INITIALIZATION COMPLETE ===
```

---

### **Step 6: Test Again**

Try your app again. The errors should be gone!

**Expected:**
- ✅ Profile loads successfully
- ✅ Notifications fetch works
- ✅ Journal entries can be created
- ✅ Data persists in database

---

## 🧪 Quick Database Test

After creating tables, test with this SQL:

```sql
-- Check users table
SELECT COUNT(*) as user_count FROM users;

-- Check devotions (should have 3 from seeding)
SELECT COUNT(*) as devotion_count FROM devotions;

-- Check questions (should have 12 from seeding)
SELECT COUNT(*) as question_count FROM questions;
```

---

## ❓ Troubleshooting

### **Issue: "relation already exists" errors**
**Solution:** This is fine! The script uses `CREATE TABLE IF NOT EXISTS`, so it won't duplicate tables.

### **Issue: SQL syntax errors**
**Solution:** 
1. Make sure you copied the ENTIRE script
2. Don't modify the script
3. Run it all at once (not line by line)

### **Issue: Still getting "table not found" after running script**
**Solution:**
1. Refresh the Table Editor page
2. Check if tables are in the "public" schema
3. Verify in SQL Editor:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### **Issue: RLS policy errors**
**Solution:** The script uses service role policies (`USING (true)`), so RLS won't block the backend.

---

## 🎯 What This Script Does

### **Creates 12 Tables:**
1. **users** - User profiles
2. **couples** - Partner relationships & invite codes
3. **devotions** - Daily devotional content
4. **journal_entries** - Journal entries with sharing
5. **prayer_requests** - Prayer board items
6. **daily_moods** - Mood tracking
7. **notifications** - Notification system
8. **questions** - Q&A prompts
9. **question_responses** - User answers
10. **devotional_completions** - Completion tracking
11. **streaks** - Gamification tracking
12. **milestones** - Timeline events

### **Sets Up Security:**
- ✅ Row Level Security (RLS) enabled
- ✅ Service role policies (for backend access)
- ✅ Indexes for performance
- ✅ Foreign key relationships
- ✅ Unique constraints

### **Optimizations:**
- ✅ Indexes on frequently queried columns
- ✅ Foreign keys for data integrity
- ✅ Timestamps for all tables
- ✅ Proper data types

---

## ✅ After This Fix

Your app will:
- ✅ Load profiles from database
- ✅ Create journal entries that persist
- ✅ Store prayer requests permanently
- ✅ Track moods daily
- ✅ Save question responses
- ✅ Record devotional completions
- ✅ Calculate streaks automatically
- ✅ Support couple linking

---

## 🚀 Next Steps After Fix

1. **Test Signup:**
   - Create a new account
   - Verify user appears in `users` table

2. **Test Profile:**
   - Update your profile
   - Check changes persist

3. **Test Journal:**
   - Create a journal entry
   - Verify it appears in `journal_entries` table

4. **Test Couple Linking:**
   - Generate invite code (User A)
   - Sign up as User B
   - Link with code
   - Verify `couples` table has both partners

---

## 📊 Expected Database State After Setup

### **Users Table:**
- Admin user (from backend seeding)
- Your test users (from signup)

### **Devotions Table:**
- 3 sample devotionals (seeded by backend)

### **Questions Table:**
- 12 sample questions (seeded by backend)

### **Other Tables:**
- Empty initially
- Will populate as you use the app

---

## 🎉 Success!

Once you run this script, your backend will be fully functional!

**Database:** ✅ Created  
**Tables:** ✅ 12 ready  
**Backend:** ✅ Working  
**Ready to use:** ✅ YES!

---

## 📝 Summary

**Problem:** Backend couldn't find database tables  
**Cause:** Tables weren't created yet  
**Fix:** Run `/database/COMPLETE_SCHEMA_SETUP.sql` in Supabase SQL Editor  
**Time:** ~2 minutes  
**Result:** Fully working database!

---

**Now go run that SQL script and your app will work!** 🚀
