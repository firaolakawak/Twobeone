-- ============================================
-- TwoBeOne Complete Database Schema Setup
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This creates all tables needed for the backend
-- ============================================

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    location TEXT,
    relationship_start DATE,
    partner_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for service role" ON users;
CREATE POLICY "Enable insert for service role"
    ON users FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for service role" ON users;
CREATE POLICY "Enable select for service role"
    ON users FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Enable update for service role" ON users;
CREATE POLICY "Enable update for service role"
    ON users FOR UPDATE
    USING (true);

-- ============================================
-- 2. COUPLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_one UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_two UUID REFERENCES users(id) ON DELETE CASCADE,
    linked_at TIMESTAMP WITH TIME ZONE,
    invite_code TEXT UNIQUE,
    relationship_status TEXT DEFAULT 'single',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_couples_partner_one ON couples(partner_one);
CREATE INDEX IF NOT EXISTS idx_couples_partner_two ON couples(partner_two);
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON couples(invite_code);

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for service role" ON couples;
CREATE POLICY "Enable all for service role"
    ON couples FOR ALL
    USING (true);

-- ============================================
-- 3. DEVOTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS devotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    memory_verse TEXT,
    verse_text TEXT,
    verse_reference TEXT,
    published_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devotions_date ON devotions(published_date DESC);

ALTER TABLE devotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all" ON devotions;
CREATE POLICY "Enable read access for all"
    ON devotions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Enable insert for service role" ON devotions;
CREATE POLICY "Enable insert for service role"
    ON devotions FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 4. JOURNAL_ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    is_shared BOOLEAN DEFAULT false,
    entry_type TEXT DEFAULT 'journal',
    location TEXT,
    emoji TEXT,
    prompt_id UUID,
    media_files JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_author ON journal_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_couple ON journal_entries(couple_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created ON journal_entries(created_at DESC);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for service role" ON journal_entries;
CREATE POLICY "Enable all for service role"
    ON journal_entries FOR ALL
    USING (true);

-- ============================================
-- 5. PRAYER_REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_answered BOOLEAN DEFAULT false,
    answered_at TIMESTAMP WITH TIME ZONE,
    is_shared BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_author ON prayer_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_couple ON prayer_requests(couple_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created ON prayer_requests(created_at DESC);

ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for service role" ON prayer_requests;
CREATE POLICY "Enable all for service role"
    ON prayer_requests FOR ALL
    USING (true);

-- ============================================
-- 6. DAILY_MOODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    mood TEXT NOT NULL CHECK (mood IN ('great', 'good', 'okay', 'sad')),
    note TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_moods_user ON daily_moods(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_moods_couple ON daily_moods(couple_id);
CREATE INDEX IF NOT EXISTS idx_daily_moods_date ON daily_moods(date DESC);

ALTER TABLE daily_moods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for service role" ON daily_moods;
CREATE POLICY "Enable all for service role"
    ON daily_moods FOR ALL
    USING (true);

-- ============================================
-- 7. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('devotional', 'prayer', 'journal', 'milestone', 'partner', 'group', 'quiz', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for service role" ON notifications;
CREATE POLICY "Enable all for service role"
    ON notifications FOR ALL
    USING (true);

-- ============================================
-- 8. QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    question_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(question_order);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all" ON questions;
CREATE POLICY "Enable read access for all"
    ON questions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Enable insert for service role" ON questions;
CREATE POLICY "Enable insert for service role"
    ON questions FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 9. QUESTION_RESPONSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    response TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_question_responses_user ON question_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_couple ON question_responses(couple_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_question ON question_responses(question_id);

ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for service role" ON question_responses;
CREATE POLICY "Enable all for service role"
    ON question_responses FOR ALL
    USING (true);

-- ============================================
-- 10. DEVOTIONAL_COMPLETIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS devotional_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    devotion_id UUID NOT NULL REFERENCES devotions(id) ON DELETE CASCADE,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, devotion_id)
);

CREATE INDEX IF NOT EXISTS idx_devotional_completions_user ON devotional_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_devotional_completions_devotion ON devotional_completions(devotion_id);
CREATE INDEX IF NOT EXISTS idx_devotional_completions_date ON devotional_completions(completed_at DESC);

ALTER TABLE devotional_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for service role" ON devotional_completions;
CREATE POLICY "Enable all for service role"
    ON devotional_completions FOR ALL
    USING (true);

-- ============================================
-- 11. STREAKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type TEXT NOT NULL CHECK (streak_type IN ('devotional', 'journal', 'prayer', 'quiz')),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, streak_type)
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_type ON streaks(streak_type);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for service role" ON streaks;
CREATE POLICY "Enable all for service role"
    ON streaks FOR ALL
    USING (true);

-- ============================================
-- 12. MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    icon_type TEXT,
    media_url TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_couple ON milestones(couple_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(date DESC);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for service role" ON milestones;
CREATE POLICY "Enable all for service role"
    ON milestones FOR ALL
    USING (true);

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify all tables were created:
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'users', 'couples', 'devotions', 'journal_entries', 
        'prayer_requests', 'daily_moods', 'notifications', 
        'questions', 'question_responses', 'devotional_completions',
        'streaks', 'milestones'
    )
ORDER BY table_name;

-- Expected output: 12 tables listed
