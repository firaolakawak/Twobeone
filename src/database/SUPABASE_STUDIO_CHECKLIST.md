# TwoBeOne Database Schema Verification Checklist

Use this checklist to manually verify your database schema in Supabase Studio.

## Navigation
Go to: **Supabase Dashboard** → **Your Project** → **Table Editor**

---

## ✅ 1. USERS TABLE

### Table Exists
- [ ] Table `users` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `email` — TEXT, NOT NULL, UNIQUE
- [ ] `full_name` — TEXT
- [ ] `avatar_url` — TEXT
- [ ] `created_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Additional Checks
- [ ] Primary key set on `id`
- [ ] Unique constraint on `email`

---

## ✅ 2. COUPLES TABLE

### Table Exists
- [ ] Table `couples` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `partner_one` — UUID, NOT NULL, Foreign Key → `users(id)`
- [ ] `partner_two` — UUID, Foreign Key → `users(id)` (nullable)
- [ ] `linked_at` — TIMESTAMP WITH TIME ZONE
- [ ] `invite_code` — TEXT, UNIQUE
- [ ] `created_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Foreign Keys
- [ ] `partner_one` references `users(id)` ON DELETE CASCADE
- [ ] `partner_two` references `users(id)` ON DELETE CASCADE

### Additional Checks
- [ ] Unique constraint on `invite_code`
- [ ] Index on `invite_code` for faster lookups

---

## ✅ 3. GUIDANCE_MODULES TABLE

### Table Exists
- [ ] Table `guidance_modules` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `title` — TEXT, NOT NULL
- [ ] `description` — TEXT
- [ ] `module_order` — INTEGER, NOT NULL
- [ ] `duration_minutes` — INTEGER
- [ ] `content` — JSONB
- [ ] `is_active` — BOOLEAN, DEFAULT `true`
- [ ] `created_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Additional Checks
- [ ] Index on `module_order` for sorting
- [ ] Index on `is_active` for filtering

---

## ✅ 4. MODULE_PROGRESS TABLE

### Table Exists
- [ ] Table `module_progress` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `user_id` — UUID, NOT NULL, Foreign Key → `users(id)`
- [ ] `module_id` — UUID, NOT NULL, Foreign Key → `guidance_modules(id)`
- [ ] `completed_lessons` — INTEGER, DEFAULT `0`
- [ ] `progress_percentage` — NUMERIC(5,2), DEFAULT `0.00`
- [ ] `is_completed` — BOOLEAN, DEFAULT `false`
- [ ] `updated_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Foreign Keys
- [ ] `user_id` references `users(id)` ON DELETE CASCADE
- [ ] `module_id` references `guidance_modules(id)` ON DELETE CASCADE

### Additional Checks
- [ ] Unique constraint on `(user_id, module_id)` to prevent duplicates
- [ ] Index on `user_id` for user queries

---

## ✅ 5. JOURNAL_ENTRIES TABLE

### Table Exists
- [ ] Table `journal_entries` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `couple_id` — UUID, NOT NULL, Foreign Key → `couples(id)`
- [ ] `author_id` — UUID, NOT NULL, Foreign Key → `users(id)`
- [ ] `content` — TEXT, NOT NULL
- [ ] `media_urls` — TEXT[] (array of text)
- [ ] `is_shared` — BOOLEAN, DEFAULT `false`
- [ ] `created_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Foreign Keys
- [ ] `couple_id` references `couples(id)` ON DELETE CASCADE
- [ ] `author_id` references `users(id)` ON DELETE CASCADE

### Additional Checks
- [ ] Index on `couple_id` for couple queries
- [ ] Index on `created_at` for sorting (DESC)

---

## ✅ 6. PRAYER_REQUESTS TABLE

### Table Exists
- [ ] Table `prayer_requests` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `couple_id` — UUID, NOT NULL, Foreign Key → `couples(id)`
- [ ] `title` — TEXT, NOT NULL
- [ ] `description` — TEXT
- [ ] `is_answered` — BOOLEAN, DEFAULT `false`
- [ ] `is_shared` — BOOLEAN, DEFAULT `false`
- [ ] `created_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Foreign Keys
- [ ] `couple_id` references `couples(id)` ON DELETE CASCADE

### Additional Checks
- [ ] Index on `couple_id`
- [ ] Index on `is_answered` for filtering

---

## ✅ 7. QUIZZES TABLE

### Table Exists
- [ ] Table `quizzes` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `title` — TEXT, NOT NULL
- [ ] `description` — TEXT
- [ ] `questions` — JSONB, NOT NULL
- [ ] `created_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Additional Checks
- [ ] Index on `created_at` for sorting

---

## ✅ 8. QUIZ_RESULTS TABLE

### Table Exists
- [ ] Table `quiz_results` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `user_id` — UUID, NOT NULL, Foreign Key → `users(id)`
- [ ] `quiz_id` — UUID, NOT NULL, Foreign Key → `quizzes(id)`
- [ ] `score` — INTEGER
- [ ] `scripture_insights` — TEXT
- [ ] `completed_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Foreign Keys
- [ ] `user_id` references `users(id)` ON DELETE CASCADE
- [ ] `quiz_id` references `quizzes(id)` ON DELETE CASCADE

### Additional Checks
- [ ] Index on `user_id`
- [ ] Index on `quiz_id`
- [ ] Index on `completed_at` for sorting

---

## ✅ 9. DEVOTIONS TABLE

### Table Exists
- [ ] Table `devotions` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `title` — TEXT, NOT NULL
- [ ] `body` — TEXT, NOT NULL
- [ ] `audio_url` — TEXT
- [ ] `memory_verse` — TEXT
- [ ] `created_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Additional Checks
- [ ] Index on `created_at` for sorting

---

## ✅ 10. MILESTONES TABLE

### Table Exists
- [ ] Table `milestones` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `couple_id` — UUID, NOT NULL, Foreign Key → `couples(id)`
- [ ] `title` — TEXT, NOT NULL
- [ ] `description` — TEXT
- [ ] `date` — DATE, NOT NULL
- [ ] `icon_type` — TEXT
- [ ] `created_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Foreign Keys
- [ ] `couple_id` references `couples(id)` ON DELETE CASCADE

### Additional Checks
- [ ] Index on `couple_id`
- [ ] Index on `date` for sorting

---

## ✅ 11. GROUPS TABLE

### Table Exists
- [ ] Table `groups` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `name` — TEXT, NOT NULL
- [ ] `description` — TEXT
- [ ] `is_active` — BOOLEAN, DEFAULT `true`
- [ ] `created_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Additional Checks
- [ ] Index on `is_active` for filtering active groups

---

## ✅ 12. GROUP_MEMBERS TABLE

### Table Exists
- [ ] Table `group_members` is visible in Table Editor

### Columns
- [ ] `id` — UUID, Primary Key, Default: `gen_random_uuid()`
- [ ] `group_id` — UUID, NOT NULL, Foreign Key → `groups(id)`
- [ ] `user_id` — UUID, NOT NULL, Foreign Key → `users(id)`
- [ ] `joined_at` — TIMESTAMP WITH TIME ZONE, DEFAULT `now()`

### Foreign Keys
- [ ] `group_id` references `groups(id)` ON DELETE CASCADE
- [ ] `user_id` references `users(id)` ON DELETE CASCADE

### Additional Checks
- [ ] Unique constraint on `(group_id, user_id)` to prevent duplicate memberships
- [ ] Index on `group_id` for group queries
- [ ] Index on `user_id` for user queries

---

## 🔐 ROW LEVEL SECURITY (RLS) CHECKS

For each table, verify RLS is enabled:

- [ ] `users` — RLS enabled
- [ ] `couples` — RLS enabled
- [ ] `guidance_modules` — RLS enabled (public read)
- [ ] `module_progress` — RLS enabled
- [ ] `journal_entries` — RLS enabled
- [ ] `prayer_requests` — RLS enabled
- [ ] `quizzes` — RLS enabled (public read)
- [ ] `quiz_results` — RLS enabled
- [ ] `devotions` — RLS enabled (public read)
- [ ] `milestones` — RLS enabled
- [ ] `groups` — RLS enabled
- [ ] `group_members` — RLS enabled

---

## 📊 VERIFICATION QUERIES

Run these queries in **SQL Editor** to verify data integrity:

### Check all tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Check all foreign keys:
```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

### Check indexes:
```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## ✅ FINAL VERIFICATION

- [ ] All 12 tables exist
- [ ] All columns match specifications
- [ ] All foreign keys are correctly defined
- [ ] All default values are set (especially `now()` for timestamps)
- [ ] All NOT NULL constraints are applied
- [ ] All unique constraints are in place
- [ ] RLS is enabled on all tables
- [ ] Appropriate indexes exist for performance

---

## 🚀 NEXT STEPS

If any items are unchecked, create the missing tables/columns using the migration scripts provided in `/database/migrations/`.

**Verification complete?** ✅ Your database is ready for TwoBeOne!
