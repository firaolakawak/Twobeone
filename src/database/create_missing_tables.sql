-- ============================================
-- TwoBeOne Missing Tables Creation
-- Create all missing tables identified in audit
-- ============================================

-- ============================================
-- 1. DAILY_MOODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    mood TEXT NOT NULL CHECK (mood IN ('great', 'good', 'okay', 'sad')),
    note TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_moods_user ON daily_moods(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_moods_couple ON daily_moods(couple_id);
CREATE INDEX IF NOT EXISTS idx_daily_moods_date ON daily_moods(date DESC);

-- Enable RLS
ALTER TABLE daily_moods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own moods" ON daily_moods;
CREATE POLICY "Users can view their own moods"
    ON daily_moods FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own moods" ON daily_moods;
CREATE POLICY "Users can insert their own moods"
    ON daily_moods FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own moods" ON daily_moods;
CREATE POLICY "Users can update their own moods"
    ON daily_moods FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Partners can view each other's moods" ON daily_moods;
CREATE POLICY "Partners can view each other's moods"
    ON daily_moods FOR SELECT
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

RAISE NOTICE '✅ Created daily_moods table';

-- ============================================
-- 2. DEVOTIONAL_COMPLETIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS devotional_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    devotion_id UUID NOT NULL REFERENCES devotions(id) ON DELETE CASCADE,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, devotion_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_devotional_completions_user ON devotional_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_devotional_completions_devotion ON devotional_completions(devotion_id);
CREATE INDEX IF NOT EXISTS idx_devotional_completions_date ON devotional_completions(completed_at DESC);

-- Enable RLS
ALTER TABLE devotional_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own completions" ON devotional_completions;
CREATE POLICY "Users can view their own completions"
    ON devotional_completions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own completions" ON devotional_completions;
CREATE POLICY "Users can insert their own completions"
    ON devotional_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Partners can view each other's completions" ON devotional_completions;
CREATE POLICY "Partners can view each other's completions"
    ON devotional_completions FOR SELECT
    USING (
        user_id IN (
            SELECT partner_one FROM couples WHERE partner_two = auth.uid()
            UNION
            SELECT partner_two FROM couples WHERE partner_one = auth.uid()
        )
    );

RAISE NOTICE '✅ Created devotional_completions table';

-- ============================================
-- 3. STREAKS TABLE
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_type ON streaks(streak_type);

-- Enable RLS
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own streaks" ON streaks;
CREATE POLICY "Users can view their own streaks"
    ON streaks FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own streaks" ON streaks;
CREATE POLICY "Users can manage their own streaks"
    ON streaks FOR ALL
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Partners can view each other's streaks" ON streaks;
CREATE POLICY "Partners can view each other's streaks"
    ON streaks FOR SELECT
    USING (
        user_id IN (
            SELECT partner_one FROM couples WHERE partner_two = auth.uid()
            UNION
            SELECT partner_two FROM couples WHERE partner_one = auth.uid()
        )
    );

RAISE NOTICE '✅ Created streaks table';

-- ============================================
-- 4. NOTIFICATIONS TABLE
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

RAISE NOTICE '✅ Created notifications table';

-- ============================================
-- 5. QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('Faith', 'Communication', 'Love', 'Family', 'Intimacy', 'Finance', 'Dreams', 'Conflict')),
    question TEXT NOT NULL,
    description TEXT,
    question_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(question_order);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- RLS Policy - public read for active questions
DROP POLICY IF EXISTS "Anyone can view active questions" ON questions;
CREATE POLICY "Anyone can view active questions"
    ON questions FOR SELECT
    USING (is_active = true);

RAISE NOTICE '✅ Created questions table';

-- ============================================
-- 6. QUESTION_RESPONSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    response TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, question_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_question_responses_user ON question_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_couple ON question_responses(couple_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_question ON question_responses(question_id);

-- Enable RLS
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own responses" ON question_responses;
CREATE POLICY "Users can view their own responses"
    ON question_responses FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own responses" ON question_responses;
CREATE POLICY "Users can insert their own responses"
    ON question_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own responses" ON question_responses;
CREATE POLICY "Users can update their own responses"
    ON question_responses FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Partners can view non-private responses" ON question_responses;
CREATE POLICY "Partners can view non-private responses"
    ON question_responses FOR SELECT
    USING (
        is_private = false AND
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner_one = auth.uid() OR partner_two = auth.uid()
        )
    );

RAISE NOTICE '✅ Created question_responses table';

-- ============================================
-- 7. JOURNAL_COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS journal_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_journal_comments_entry ON journal_comments(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_comments_user ON journal_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_comments_created ON journal_comments(created_at DESC);

-- Enable RLS
ALTER TABLE journal_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Couple members can view comments" ON journal_comments;
CREATE POLICY "Couple members can view comments"
    ON journal_comments FOR SELECT
    USING (
        journal_entry_id IN (
            SELECT id FROM journal_entries
            WHERE couple_id IN (
                SELECT id FROM couples 
                WHERE partner_one = auth.uid() OR partner_two = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Couple members can insert comments" ON journal_comments;
CREATE POLICY "Couple members can insert comments"
    ON journal_comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        journal_entry_id IN (
            SELECT id FROM journal_entries
            WHERE couple_id IN (
                SELECT id FROM couples 
                WHERE partner_one = auth.uid() OR partner_two = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can delete their own comments" ON journal_comments;
CREATE POLICY "Users can delete their own comments"
    ON journal_comments FOR DELETE
    USING (auth.uid() = user_id);

RAISE NOTICE '✅ Created journal_comments table';

-- ============================================
-- 8. PRAYER_UPDATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prayer_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    update_type TEXT DEFAULT 'update' CHECK (update_type IN ('update', 'answered', 'praise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prayer_updates_prayer ON prayer_updates(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_updates_user ON prayer_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_updates_created ON prayer_updates(created_at DESC);

-- Enable RLS
ALTER TABLE prayer_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Couple members can view prayer updates" ON prayer_updates;
CREATE POLICY "Couple members can view prayer updates"
    ON prayer_updates FOR SELECT
    USING (
        prayer_request_id IN (
            SELECT id FROM prayer_requests
            WHERE couple_id IN (
                SELECT id FROM couples 
                WHERE partner_one = auth.uid() OR partner_two = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Couple members can insert prayer updates" ON prayer_updates;
CREATE POLICY "Couple members can insert prayer updates"
    ON prayer_updates FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        prayer_request_id IN (
            SELECT id FROM prayer_requests
            WHERE couple_id IN (
                SELECT id FROM couples 
                WHERE partner_one = auth.uid() OR partner_two = auth.uid()
            )
        )
    );

RAISE NOTICE '✅ Created prayer_updates table';

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ MISSING TABLES CREATED!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  1. daily_moods - Track daily mood sharing';
    RAISE NOTICE '  2. devotional_completions - Track devotional progress';
    RAISE NOTICE '  3. streaks - Track activity streaks';
    RAISE NOTICE '  4. notifications - In-app notifications';
    RAISE NOTICE '  5. questions - Dynamic question management';
    RAISE NOTICE '  6. question_responses - Store answers';
    RAISE NOTICE '  7. journal_comments - Comment on journal entries';
    RAISE NOTICE '  8. prayer_updates - Prayer journey tracking';
    RAISE NOTICE '';
    RAISE NOTICE 'All tables include:';
    RAISE NOTICE '  • Primary keys (UUID)';
    RAISE NOTICE '  • Foreign keys with CASCADE';
    RAISE NOTICE '  • Indexes for performance';
    RAISE NOTICE '  • Row Level Security (RLS)';
    RAISE NOTICE '  • Proper constraints';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update TypeScript types';
    RAISE NOTICE '  2. Implement backend API routes';
    RAISE NOTICE '  3. Update UI components';
    RAISE NOTICE '  4. Test data flow';
    RAISE NOTICE '';
END $$;
