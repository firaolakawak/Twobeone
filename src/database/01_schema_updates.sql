-- ============================================
-- TwoBeOne Schema Updates - Step 1 of 3
-- Add missing columns to existing tables
-- ============================================
-- Run this FIRST in Supabase SQL Editor

BEGIN;

-- ============================================
-- 1. UPDATE USERS TABLE
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS relationship_start DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code_ref TEXT;

-- Create index on partner_id
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);

-- ============================================
-- 2. UPDATE JOURNAL_ENTRIES TABLE
-- ============================================
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'journal';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS emoji TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS prompt_id UUID;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS media_files JSONB;

-- Add check constraint for entry_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'journal_entries_entry_type_check'
    ) THEN
        ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_entry_type_check 
        CHECK (entry_type IN ('journal', 'event'));
    END IF;
END $$;

-- ============================================
-- 3. UPDATE PRAYER_REQUESTS TABLE
-- ============================================
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP WITH TIME ZONE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_prayer_requests_author ON prayer_requests(author_id);

-- ============================================
-- 4. UPDATE QUIZ_RESULTS TABLE
-- ============================================
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS result_type TEXT;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS result_details JSONB;

-- ============================================
-- 5. UPDATE DEVOTIONS TABLE
-- ============================================
ALTER TABLE devotions ADD COLUMN IF NOT EXISTS published_date DATE;
ALTER TABLE devotions ADD COLUMN IF NOT EXISTS verse_text TEXT;
ALTER TABLE devotions ADD COLUMN IF NOT EXISTS verse_reference TEXT;

-- Create index on published_date
CREATE INDEX IF NOT EXISTS idx_devotions_published_date ON devotions(published_date);

-- ============================================
-- 6. UPDATE GROUPS TABLE
-- ============================================
ALTER TABLE groups ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS meeting_schedule TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS max_members INTEGER;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_id);

-- ============================================
-- 7. UPDATE GROUP_MEMBERS TABLE
-- ============================================
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Add check constraint for role
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'group_members_role_check'
    ) THEN
        ALTER TABLE group_members ADD CONSTRAINT group_members_role_check 
        CHECK (role IN ('admin', 'moderator', 'member'));
    END IF;
END $$;

-- ============================================
-- 8. UPDATE MILESTONES TABLE
-- ============================================
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS category TEXT;

-- ============================================
-- 9. UPDATE MODULE_PROGRESS TABLE
-- ============================================
ALTER TABLE module_progress ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 10. UPDATE COUPLES TABLE
-- ============================================
ALTER TABLE couples ADD COLUMN IF NOT EXISTS couple_name TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS couple_picture TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS anniversary_date DATE;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'dating';

COMMIT;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ STEP 1 COMPLETE: Schema Updates';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated 10 tables with 35+ new columns:';
    RAISE NOTICE '  ✅ users (7 columns)';
    RAISE NOTICE '  ✅ journal_entries (7 columns)';
    RAISE NOTICE '  ✅ prayer_requests (3 columns)';
    RAISE NOTICE '  ✅ quiz_results (3 columns)';
    RAISE NOTICE '  ✅ devotions (3 columns)';
    RAISE NOTICE '  ✅ groups (4 columns)';
    RAISE NOTICE '  ✅ group_members (1 column)';
    RAISE NOTICE '  ✅ milestones (2 columns)';
    RAISE NOTICE '  ✅ module_progress (1 column)';
    RAISE NOTICE '  ✅ couples (4 columns)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Run 02_create_missing_tables.sql';
    RAISE NOTICE '';
END $$;
