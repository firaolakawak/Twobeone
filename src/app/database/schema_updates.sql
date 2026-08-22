-- ============================================
-- TwoBeOne Schema Updates
-- Add missing columns to existing tables
-- ============================================

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

RAISE NOTICE '✅ Updated users table with bio, phone, location, updated_at, relationship_start, partner_id';

-- ============================================
-- 2. UPDATE JOURNAL_ENTRIES TABLE
-- ============================================
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'journal' CHECK (entry_type IN ('journal', 'event'));
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS emoji TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS prompt_id UUID;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add media_files JSONB column for structured media storage
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS media_files JSONB;

-- Note: Keep media_urls for backward compatibility, migrate data if needed
-- Example migration: UPDATE journal_entries SET media_files = to_jsonb(media_urls) WHERE media_urls IS NOT NULL;

RAISE NOTICE '✅ Updated journal_entries table with title, entry_type, location, emoji, prompt_id, updated_at, media_files';

-- ============================================
-- 3. UPDATE PRAYER_REQUESTS TABLE
-- ============================================
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP WITH TIME ZONE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_prayer_requests_author ON prayer_requests(author_id);

RAISE NOTICE '✅ Updated prayer_requests table with author_id, updated_at, answered_at';

-- ============================================
-- 4. UPDATE QUIZ_RESULTS TABLE
-- ============================================
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS result_type TEXT;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS result_details JSONB;

RAISE NOTICE '✅ Updated quiz_results table with answers, result_type, result_details';

-- ============================================
-- 5. UPDATE DEVOTIONS TABLE
-- ============================================
ALTER TABLE devotions ADD COLUMN IF NOT EXISTS published_date DATE;
ALTER TABLE devotions ADD COLUMN IF NOT EXISTS verse_text TEXT;
ALTER TABLE devotions ADD COLUMN IF NOT EXISTS verse_reference TEXT;

-- Create index on published_date
CREATE INDEX IF NOT EXISTS idx_devotions_published_date ON devotions(published_date);

RAISE NOTICE '✅ Updated devotions table with published_date, verse_text, verse_reference';

-- ============================================
-- 6. UPDATE GROUPS TABLE
-- ============================================
ALTER TABLE groups ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS meeting_schedule TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS max_members INTEGER;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_id);

RAISE NOTICE '✅ Updated groups table with creator_id, meeting_schedule, max_members, image_url';

-- ============================================
-- 7. UPDATE GROUP_MEMBERS TABLE
-- ============================================
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Add check constraint for role
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_role_check;
ALTER TABLE group_members ADD CONSTRAINT group_members_role_check CHECK (role IN ('admin', 'moderator', 'member'));

RAISE NOTICE '✅ Updated group_members table with role column';

-- ============================================
-- 8. UPDATE MILESTONES TABLE
-- ============================================
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS category TEXT;

RAISE NOTICE '✅ Updated milestones table with media_url, category';

-- ============================================
-- 9. UPDATE MODULE_PROGRESS TABLE
-- ============================================
ALTER TABLE module_progress ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

RAISE NOTICE '✅ Updated module_progress table with started_at';

-- ============================================
-- 10. UPDATE COUPLES TABLE
-- ============================================
ALTER TABLE couples ADD COLUMN IF NOT EXISTS couple_name TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS couple_picture TEXT;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS anniversary_date DATE;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'dating';

RAISE NOTICE '✅ Updated couples table with couple_name, couple_picture, anniversary_date, relationship_status';

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ SCHEMA UPDATES COMPLETE!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated tables:';
    RAISE NOTICE '  • users (7 new columns)';
    RAISE NOTICE '  • journal_entries (7 new columns)';
    RAISE NOTICE '  • prayer_requests (3 new columns)';
    RAISE NOTICE '  • quiz_results (3 new columns)';
    RAISE NOTICE '  • devotions (3 new columns)';
    RAISE NOTICE '  • groups (4 new columns)';
    RAISE NOTICE '  • group_members (1 new column)';
    RAISE NOTICE '  • milestones (2 new columns)';
    RAISE NOTICE '  • module_progress (1 new column)';
    RAISE NOTICE '  • couples (4 new columns)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Run create_missing_tables.sql';
    RAISE NOTICE '';
END $$;
