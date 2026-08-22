# 🚀 Phase 1 Quick Start Guide

**Time:** 30 minutes | **Difficulty:** Easy | **Skills:** Copy & Paste

---

## What You're Doing

Updating your TwoBeOne database to support ALL your UI features.

---

## 3 Simple Steps

### 1️⃣ Update Existing Tables (10 min)

```
Open Supabase SQL Editor
↓
Copy /database/01_schema_updates.sql
↓
Paste & Run
↓
Wait for ✅ success message
```

**Adds:** 35+ columns to 10 tables

---

### 2️⃣ Create New Tables (10 min)

```
Click "New Query"
↓
Copy /database/02_create_missing_tables.sql
↓
Paste & Run
↓
Wait for ✅ success message
```

**Creates:** 8 new tables (moods, notifications, etc.)

---

### 3️⃣ Verify Everything (5 min)

```
Click "New Query"
↓
Copy /database/03_verify_schema.sql
↓
Paste & Run
↓
Look for "✅ ALL 20 TABLES EXIST!"
```

**Confirms:** Everything worked correctly

---

## 🎯 Success = You See This

```
====================================
✅ ALL 20 TABLES EXIST!
====================================

Core Tables (12):
  ✅ users
  ✅ couples
  ✅ guidance_modules
  ... etc

New Tables (8):
  ✅ daily_moods
  ✅ notifications
  ✅ questions
  ... etc

Total Foreign Keys: 45
Total Indexes: 52
Total RLS Policies: 48

✅ PHASE 1 COMPLETE!
====================================
```

---

## 🎁 Bonus: Add Test Data (5 min)

**Optional but recommended:**

```
Click "New Query"
↓
Copy /database/04_test_data.sql
↓
Paste & Run
↓
Get 40 questions + 3 devotionals!
```

---

## 🆘 Help! Something Went Wrong

### Error: "table does not exist"
Run `/database/create_schema.sql` first

### Error: "column already exists"  
This is OK! Continue to next step

### Can't find SQL Editor
Dashboard → Left sidebar → `</>` icon

### Script won't run
Make sure you're logged into Supabase

---

## ✅ When Done

Go to Table Editor and verify you see:

- ✅ 20 tables total
- ✅ New tables: daily_moods, notifications, questions, etc.
- ✅ Users table has: bio, phone, location columns

---

## 🎉 Then What?

**Phase 2:** Update TypeScript types (1 hour)  
**Phase 3:** Build backend APIs (6 hours)  
**Phase 4:** Connect UI to database (8 hours)

See `/database/IMPLEMENTATION_ROADMAP.md` for full plan.

---

## 📁 File Reference

All SQL files in `/database/`:

- `01_schema_updates.sql` ← Run 1st
- `02_create_missing_tables.sql` ← Run 2nd  
- `03_verify_schema.sql` ← Run 3rd
- `04_test_data.sql` ← Optional
- `PHASE_1_INSTRUCTIONS.md` ← Detailed guide
- `PHASE_1_COMPLETE.md` ← What you accomplished

---

**Let's go! Open Supabase and start with Step 1! 💪**
