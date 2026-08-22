-- ============================================
-- TwoBeOne Database Schema Creation Script
-- ============================================
-- Run this in Supabase SQL Editor to create all tables
-- This script is idempotent (safe to run multiple times)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- 2. COUPLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_one UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_two UUID REFERENCES users(id) ON DELETE CASCADE,
    linked_at TIMESTAMP WITH TIME ZONE,
    invite_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_couples_partner_one ON couples(partner_one);
CREATE INDEX IF NOT EXISTS idx_couples_partner_two ON couples(partner_two);
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON couples(invite_code);

-- Enable RLS
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- RLS Policies for couples
DROP POLICY IF EXISTS "Partners can view their couple" ON couples;
CREATE POLICY "Partners can view their couple"
    ON couples FOR SELECT
    USING (auth.uid() = partner_one OR auth.uid() = partner_two);

DROP POLICY IF EXISTS "Partners can update their couple" ON couples;
CREATE POLICY "Partners can update their couple"
    ON couples FOR UPDATE
    USING (auth.uid() = partner_one OR auth.uid() = partner_two);

DROP POLICY IF EXISTS "Users can create couples" ON couples;
CREATE POLICY "Users can create couples"
    ON couples FOR INSERT
    WITH CHECK (auth.uid() = partner_one);

-- ============================================
-- 3. GUIDANCE_MODULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guidance_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    module_order INTEGER NOT NULL,
    duration_minutes INTEGER,
    content JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guidance_modules_order ON guidance_modules(module_order);
CREATE INDEX IF NOT EXISTS idx_guidance_modules_active ON guidance_modules(is_active);

-- Enable RLS
ALTER TABLE guidance_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policy - public read for active modules
DROP POLICY IF EXISTS "Anyone can view active modules" ON guidance_modules;
CREATE POLICY "Anyone can view active modules"
    ON guidance_modules FOR SELECT
    USING (is_active = true);

-- ============================================
-- 4. MODULE_PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES guidance_modules(id) ON DELETE CASCADE,
    completed_lessons INTEGER DEFAULT 0,
    progress_percentage NUMERIC(5,2) DEFAULT 0.00,
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, module_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_module_progress_user ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module ON module_progress(module_id);

-- Enable RLS
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own progress" ON module_progress;
CREATE POLICY "Users can view their own progress"
    ON module_progress FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON module_progress;
CREATE POLICY "Users can insert their own progress"
    ON module_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON module_progress;
CREATE POLICY "Users can update their own progress"
    ON module_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- 5. JOURNAL_ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls TEXT[],
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_couple ON journal_entries(couple_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_author ON journal_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created ON journal_entries(created_at DESC);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Couple members can view entries" ON journal_entries;
CREATE POLICY "Couple members can view entries"
    ON journal_entries FOR SELECT
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Couple members can insert entries" ON journal_entries;
CREATE POLICY "Couple members can insert entries"
    ON journal_entries FOR INSERT
    WITH CHECK (
        author_id = auth.uid() AND
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Authors can update their entries" ON journal_entries;
CREATE POLICY "Authors can update their entries"
    ON journal_entries FOR UPDATE
    USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete their entries" ON journal_entries;
CREATE POLICY "Authors can delete their entries"
    ON journal_entries FOR DELETE
    USING (author_id = auth.uid());

-- ============================================
-- 6. PRAYER_REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_answered BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prayer_requests_couple ON prayer_requests(couple_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_answered ON prayer_requests(is_answered);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created ON prayer_requests(created_at DESC);

-- Enable RLS
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Couple members can view prayers" ON prayer_requests;
CREATE POLICY "Couple members can view prayers"
    ON prayer_requests FOR SELECT
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Couple members can insert prayers" ON prayer_requests;
CREATE POLICY "Couple members can insert prayers"
    ON prayer_requests FOR INSERT
    WITH CHECK (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Couple members can update prayers" ON prayer_requests;
CREATE POLICY "Couple members can update prayers"
    ON prayer_requests FOR UPDATE
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

-- ============================================
-- 7. QUIZZES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_quizzes_created ON quizzes(created_at DESC);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- RLS Policy - public read
DROP POLICY IF EXISTS "Anyone can view quizzes" ON quizzes;
CREATE POLICY "Anyone can view quizzes"
    ON quizzes FOR SELECT
    USING (true);

-- ============================================
-- 8. QUIZ_RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER,
    scripture_insights TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz ON quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed ON quiz_results(completed_at DESC);

-- Enable RLS
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own results" ON quiz_results;
CREATE POLICY "Users can view their own results"
    ON quiz_results FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own results" ON quiz_results;
CREATE POLICY "Users can insert their own results"
    ON quiz_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Partners can view each other's results
DROP POLICY IF EXISTS "Partners can view each other's results" ON quiz_results;
CREATE POLICY "Partners can view each other's results"
    ON quiz_results FOR SELECT
    USING (
        user_id IN (
            SELECT partner_one FROM couples WHERE partner_two = auth.uid()
            UNION
            SELECT partner_two FROM couples WHERE partner_one = auth.uid()
        )
    );

-- ============================================
-- 9. DEVOTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS devotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    audio_url TEXT,
    memory_verse TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_devotions_created ON devotions(created_at DESC);

-- Enable RLS
ALTER TABLE devotions ENABLE ROW LEVEL SECURITY;

-- RLS Policy - public read
DROP POLICY IF EXISTS "Anyone can view devotions" ON devotions;
CREATE POLICY "Anyone can view devotions"
    ON devotions FOR SELECT
    USING (true);

-- ============================================
-- 10. MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    icon_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_milestones_couple ON milestones(couple_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(date DESC);

-- Enable RLS
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Couple members can view milestones" ON milestones;
CREATE POLICY "Couple members can view milestones"
    ON milestones FOR SELECT
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Couple members can insert milestones" ON milestones;
CREATE POLICY "Couple members can insert milestones"
    ON milestones FOR INSERT
    WITH CHECK (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Couple members can update milestones" ON milestones;
CREATE POLICY "Couple members can update milestones"
    ON milestones FOR UPDATE
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Couple members can delete milestones" ON milestones;
CREATE POLICY "Couple members can delete milestones"
    ON milestones FOR DELETE
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

-- ============================================
-- 11. GROUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- RLS Policy - anyone can view active groups
DROP POLICY IF EXISTS "Anyone can view active groups" ON groups;
CREATE POLICY "Anyone can view active groups"
    ON groups FOR SELECT
    USING (is_active = true);

-- ============================================
-- 12. GROUP_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- Enable RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their group memberships" ON group_members;
CREATE POLICY "Users can view their group memberships"
    ON group_members FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups"
    ON group_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups"
    ON group_members FOR DELETE
    USING (auth.uid() = user_id);

-- Group members can see other members of their groups
DROP POLICY IF EXISTS "Group members can see other members" ON group_members;
CREATE POLICY "Group members can see other members"
    ON group_members FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ SCHEMA CREATION COMPLETE!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All 12 tables have been created with:';
    RAISE NOTICE '  • Primary keys';
    RAISE NOTICE '  • Foreign keys';
    RAISE NOTICE '  • Indexes';
    RAISE NOTICE '  • Default values';
    RAISE NOTICE '  • Row Level Security policies';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Run verify_schema.sql to confirm';
    RAISE NOTICE '  2. Use SUPABASE_STUDIO_CHECKLIST.md for manual verification';
    RAISE NOTICE '';
END $$;
