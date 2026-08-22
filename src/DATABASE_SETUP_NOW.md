# 🚨 URGENT: Set Up Your Database (2 Minutes)

## ❌ Current Error
```
Could not find the table 'public.users' in the schema cache
```

## ✅ The Fix

Your backend is ready, but the database tables don't exist yet. Here's how to fix it:

---

## 📋 Step-by-Step Instructions

### **Step 1: Open Supabase Dashboard**
1. Go to: **https://supabase.com/dashboard**
2. Click on your TwoBeOne project
3. You should see your project dashboard

### **Step 2: Open SQL Editor**
1. Look at the left sidebar
2. Click on **"SQL Editor"** (it has a `</>` icon)
3. Click the **"New Query"** button at the top

### **Step 3: Get the SQL Script**
The complete SQL script is in this file:
```
/database/COMPLETE_SCHEMA_SETUP.sql
```

### **Step 4: Copy the Script**
1. Open `/database/COMPLETE_SCHEMA_SETUP.sql`
2. Click **"Select All"** (Ctrl+A or Cmd+A)
3. Click **"Copy"** (Ctrl+C or Cmd+C)
4. Copy ALL ~350 lines

### **Step 5: Paste and Run**
1. Go back to Supabase SQL Editor tab
2. **Paste** the entire script (Ctrl+V or Cmd+V)
3. Click the **green "RUN"** button (or press Ctrl+Enter)
4. Wait ~5-10 seconds

### **Step 6: Verify Success**
You should see:
```
Success. No rows returned
```

Then scroll down and you'll see a table showing:
```
table_name              | column_count
-----------------------|-------------
users                   | 11
couples                 | 8
devotions               | 7
journal_entries         | 12
prayer_requests         | 9
daily_moods             | 7
notifications           | 9
questions               | 6
question_responses      | 7
devotional_completions  | 4
streaks                 | 6
milestones              | 8

12 rows
```

✅ **If you see this, you're done!**

### **Step 7: Verify in Table Editor**
1. Click **"Table Editor"** in left sidebar
2. You should now see 12 tables listed:
   - users
   - couples
   - devotions
   - journal_entries
   - prayer_requests
   - daily_moods
   - notifications
   - questions
   - question_responses
   - devotional_completions
   - streaks
   - milestones

### **Step 8: Refresh Your App**
1. Go back to your TwoBeOne app
2. **Refresh the page** (F5 or Cmd+R)
3. The error should be **GONE!** ✅

---

## 🎯 What This Does

The SQL script creates:
- ✅ 12 database tables
- ✅ All necessary columns
- ✅ Indexes for performance
- ✅ Foreign key relationships
- ✅ Row Level Security policies
- ✅ Proper data types

---

## 🐛 Troubleshooting

### **Issue: "relation already exists"**
**This is OK!** The script uses `IF NOT EXISTS`, so it won't break anything.

### **Issue: SQL syntax error**
**Solution:** Make sure you copied the ENTIRE file (all ~350 lines)

### **Issue: Still getting "table not found"**
**Solution:** 
1. Refresh Table Editor page
2. Make sure tables are in "public" schema
3. Try this SQL to check:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### **Issue: Permission denied**
**Solution:** You need to be the project owner. If you're not, ask the owner to run the script.

---

## ✅ After Setup

Once the tables are created:
1. ✅ Your app will load profile from database
2. ✅ Journal entries will persist
3. ✅ Prayer requests will persist
4. ✅ You can create/link couples
5. ✅ All features will work!

---

## 🎉 Quick Summary

**Problem:** Database tables don't exist  
**Solution:** Run SQL script in Supabase  
**Location:** SQL Editor  
**File:** `/database/COMPLETE_SCHEMA_SETUP.sql`  
**Time:** 2 minutes  
**Difficulty:** Copy & Paste  

---

## 🆘 Need Help?

If you get stuck:
1. Read `/FIX_DATABASE_ERROR.md` for detailed guide
2. Read `/QUICK_FIX.md` for ultra-quick guide
3. Check Supabase logs for errors

---

**GO DO THIS NOW!** Once you run that SQL, everything will work! 🚀

After you've run the SQL script, refresh your app and the error will be gone!
