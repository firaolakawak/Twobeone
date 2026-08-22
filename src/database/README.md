# TwoBeOne Database Documentation

Complete database setup, audit, and implementation guides for the TwoBeOne Christian couples app.

---

## 📚 Documentation Index

### 🚀 Getting Started
- **[QUICK_START.md](QUICK_START.md)** - 30-minute setup guide (start here!)
- **[PHASE_1_INSTRUCTIONS.md](PHASE_1_INSTRUCTIONS.md)** - Detailed step-by-step for Phase 1
- **[IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)** - Complete 6-phase implementation plan

### 📊 Audit & Analysis
- **[UI_SCHEMA_AUDIT.md](UI_SCHEMA_AUDIT.md)** - Comprehensive UI ↔ Database alignment audit
- **[SUPABASE_STUDIO_CHECKLIST.md](SUPABASE_STUDIO_CHECKLIST.md)** - Manual verification checklist
- **[TEST_PLAN.md](TEST_PLAN.md)** - 50+ test cases for data flow validation

### 🗄️ SQL Scripts (Run in Order)

#### Initial Setup (If not done yet)
- `create_schema.sql` - Creates initial 12 tables
- `verify_schema.sql` - Verifies initial setup

#### Phase 1: Schema Updates (Do this now!)
1. **`01_schema_updates.sql`** ⭐ - Adds 35+ columns to existing tables
2. **`02_create_missing_tables.sql`** ⭐ - Creates 8 new tables
3. **`03_verify_schema.sql`** ⭐ - Verifies everything worked
4. **`04_test_data.sql`** ✨ - (Optional) Adds sample questions & devotionals

### 📖 Reference
- **[PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md)** - What you accomplished in Phase 1
- **`/types/database.ts`** - TypeScript types matching database schema

---

## 🎯 Quick Navigation

### I Want To...

**Just get started quickly:**
→ Read [QUICK_START.md](QUICK_START.md)

**Understand what's wrong with my database:**
→ Read [UI_SCHEMA_AUDIT.md](UI_SCHEMA_AUDIT.md)

**Fix my database schema:**
→ Follow [PHASE_1_INSTRUCTIONS.md](PHASE_1_INSTRUCTIONS.md)

**Implement backend APIs:**
→ See Phase 3 in [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)

**Test my database integration:**
→ Use [TEST_PLAN.md](TEST_PLAN.md)

**Verify schema in Supabase Studio:**
→ Use [SUPABASE_STUDIO_CHECKLIST.md](SUPABASE_STUDIO_CHECKLIST.md)

---

## 📈 Current Status

### ✅ Complete
- [x] Initial 12 tables created
- [x] Foreign keys defined
- [x] RLS policies for core tables
- [x] Basic indexes created

### 🚧 In Progress (Phase 1)
- [ ] Run schema updates
- [ ] Create missing tables
- [ ] Verify all changes
- [ ] Add test data

### 📝 Pending (Future Phases)
- [ ] Update TypeScript types (Phase 2)
- [ ] Implement backend APIs (Phase 3)
- [ ] Connect UI to database (Phase 4)
- [ ] Test all features (Phase 5)
- [ ] Performance optimization (Phase 6)

---

## 🗂️ Database Schema Overview

### Tables (20 Total)

#### User & Relationship Data (2)
- `users` - User profiles with extended fields
- `couples` - Couple relationships & linking

#### Spiritual Growth (4)
- `devotions` - Daily devotionals
- `devotional_completions` - Completion tracking
- `guidance_modules` - Pre-marriage content
- `module_progress` - User progress

#### Relationship Features (6)
- `journal_entries` - Shared journaling
- `journal_comments` - Entry comments
- `prayer_requests` - Prayer requests
- `prayer_updates` - Prayer journey
- `milestones` - Relationship milestones
- `questions` - Dynamic questions

#### Responses & Results (2)
- `question_responses` - Q&A answers
- `quiz_results` - Quiz completions

#### Community (3)
- `groups` - Community groups
- `group_members` - Memberships
- `quizzes` - Quiz definitions

#### Engagement (3)
- `daily_moods` - Mood tracking
- `streaks` - Activity streaks
- `notifications` - In-app alerts

---

## 🔧 Database Features

### Security
- ✅ Row Level Security (RLS) on all tables
- ✅ 48+ RLS policies
- ✅ Partner-only data access
- ✅ Private/shared data controls

### Performance
- ✅ 52+ indexes for fast queries
- ✅ Foreign keys for data integrity
- ✅ Optimized for common lookups
- ✅ Proper ordering for lists

### Data Integrity
- ✅ 45+ foreign key constraints
- ✅ CHECK constraints for validation
- ✅ UNIQUE constraints prevent duplicates
- ✅ NOT NULL where required
- ✅ CASCADE deletes

---

## 📊 Statistics

```
Total Tables:        20
Total Columns:       ~180
Foreign Keys:        45+
Indexes:             52+
RLS Policies:        48+
Check Constraints:   12+
Unique Constraints:  20+
```

---

## 🎓 Key Concepts

### Row Level Security (RLS)
Every table has policies ensuring users can only access their own data or data shared with them.

### Foreign Keys
All relationships properly linked with CASCADE deletes to prevent orphaned data.

### Indexes
Strategic indexes on:
- Foreign keys (user_id, couple_id, etc.)
- Frequently queried columns (date, created_at)
- Unique constraints (email, invite_code)

### JSONB Columns
Used for flexible data:
- `guidance_modules.content` - Lesson structure
- `quiz_results.answers` - Quiz responses
- `journal_entries.media_files` - Media metadata
- `notifications.metadata` - Additional context

---

## 🐛 Common Issues

### "table does not exist"
**Solution:** Run `create_schema.sql` first to create base tables

### "column already exists"  
**Solution:** This is OK! Scripts use `IF NOT EXISTS`

### "permission denied for table"
**Solution:** Check RLS policies and auth.uid()

### "foreign key violation"
**Solution:** Create referenced records first

### "duplicate key value"
**Solution:** Check UNIQUE constraints

---

## 📞 Support

### Debugging Steps
1. Check Supabase SQL Editor logs
2. Review error message details
3. Verify you're logged in correctly
4. Check auth.uid() returns your user ID
5. Review RLS policies for the table

### Useful Queries

**Check your user ID:**
```sql
SELECT auth.uid();
```

**List all tables:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

**Count rows in table:**
```sql
SELECT COUNT(*) FROM table_name;
```

**Check RLS policies:**
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## 🚀 Next Steps

1. ✅ **Phase 1:** Fix database schema (← You are here!)
2. ⏭️ **Phase 2:** Update TypeScript types
3. ⏭️ **Phase 3:** Implement backend APIs
4. ⏭️ **Phase 4:** Connect UI components
5. ⏭️ **Phase 5:** Test thoroughly
6. ⏭️ **Phase 6:** Optimize & deploy

---

## 📁 File Structure

```
/database/
├── README.md (this file)
├── QUICK_START.md
├── PHASE_1_INSTRUCTIONS.md
├── PHASE_1_COMPLETE.md
├── IMPLEMENTATION_ROADMAP.md
├── UI_SCHEMA_AUDIT.md
├── SUPABASE_STUDIO_CHECKLIST.md
├── TEST_PLAN.md
│
├── create_schema.sql (initial setup)
├── verify_schema.sql (initial verification)
│
├── 01_schema_updates.sql ⭐
├── 02_create_missing_tables.sql ⭐
├── 03_verify_schema.sql ⭐
└── 04_test_data.sql ✨
```

---

## 💡 Pro Tips

1. **Always backup** before running schema changes
2. **Test in development** before production
3. **Run verification scripts** after each change
4. **Use transactions** for safety (BEGIN/COMMIT)
5. **Check logs** if something fails
6. **Read error messages** carefully

---

## 🎉 Success Criteria

Phase 1 is complete when:

- ✅ All 20 tables exist
- ✅ All columns present
- ✅ All foreign keys defined
- ✅ All RLS policies active
- ✅ Verification script passes
- ✅ No errors in SQL Editor

---

**Ready to begin? Start with [QUICK_START.md](QUICK_START.md)!**
