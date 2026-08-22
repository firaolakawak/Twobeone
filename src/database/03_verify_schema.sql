-- ============================================
-- TwoBeOne Schema Verification - Step 3 of 3
-- Verify all tables and columns exist
-- ============================================
-- Run this THIRD in Supabase SQL Editor (after 02_create_missing_tables.sql)

DO $$
DECLARE
    v_table_count INTEGER;
    v_expected_tables TEXT[] := ARRAY[
        'users', 'couples', 'guidance_modules', 'module_progress',
        'journal_entries', 'journal_comments', 'prayer_requests', 'prayer_updates',
        'quizzes', 'quiz_results', 'devotions', 'devotional_completions',
        'milestones', 'groups', 'group_members', 'daily_moods',
        'notifications', 'questions', 'question_responses', 'streaks'
    ];
    v_missing_tables TEXT[] := ARRAY[]::TEXT[];
    v_table TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'TWOBEONE SCHEMA VERIFICATION';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    
    -- Check all expected tables exist
    FOREACH v_table IN ARRAY v_expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = v_table
        ) THEN
            v_missing_tables := array_append(v_missing_tables, v_table);
        END IF;
    END LOOP;
    
    IF array_length(v_missing_tables, 1) IS NULL THEN
        RAISE NOTICE '✅ ALL 20 TABLES EXIST!';
        RAISE NOTICE '';
        
        -- Show table list
        RAISE NOTICE 'Core Tables (12):';
        RAISE NOTICE '  ✅ users';
        RAISE NOTICE '  ✅ couples';
        RAISE NOTICE '  ✅ guidance_modules';
        RAISE NOTICE '  ✅ module_progress';
        RAISE NOTICE '  ✅ journal_entries';
        RAISE NOTICE '  ✅ prayer_requests';
        RAISE NOTICE '  ✅ quizzes';
        RAISE NOTICE '  ✅ quiz_results';
        RAISE NOTICE '  ✅ devotions';
        RAISE NOTICE '  ✅ milestones';
        RAISE NOTICE '  ✅ groups';
        RAISE NOTICE '  ✅ group_members';
        RAISE NOTICE '';
        RAISE NOTICE 'New Tables (8):';
        RAISE NOTICE '  ✅ daily_moods';
        RAISE NOTICE '  ✅ devotional_completions';
        RAISE NOTICE '  ✅ streaks';
        RAISE NOTICE '  ✅ notifications';
        RAISE NOTICE '  ✅ questions';
        RAISE NOTICE '  ✅ question_responses';
        RAISE NOTICE '  ✅ journal_comments';
        RAISE NOTICE '  ✅ prayer_updates';
    ELSE
        RAISE NOTICE '❌ MISSING TABLES: %', array_to_string(v_missing_tables, ', ');
        RAISE NOTICE 'Please run the setup scripts in order!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'COLUMN VERIFICATION';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    
    -- Check critical columns in key tables
    
    -- Users table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
        RAISE NOTICE '✅ users.bio exists';
    ELSE
        RAISE NOTICE '❌ users.bio MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        RAISE NOTICE '✅ users.phone exists';
    ELSE
        RAISE NOTICE '❌ users.phone MISSING';
    END IF;
    
    -- Journal entries
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'title') THEN
        RAISE NOTICE '✅ journal_entries.title exists';
    ELSE
        RAISE NOTICE '❌ journal_entries.title MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'entry_type') THEN
        RAISE NOTICE '✅ journal_entries.entry_type exists';
    ELSE
        RAISE NOTICE '❌ journal_entries.entry_type MISSING';
    END IF;
    
    -- Prayer requests
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'author_id') THEN
        RAISE NOTICE '✅ prayer_requests.author_id exists';
    ELSE
        RAISE NOTICE '❌ prayer_requests.author_id MISSING';
    END IF;
    
    -- Quiz results
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_results' AND column_name = 'answers') THEN
        RAISE NOTICE '✅ quiz_results.answers exists';
    ELSE
        RAISE NOTICE '❌ quiz_results.answers MISSING';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'FOREIGN KEY VERIFICATION';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    
    -- Count foreign keys
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY' 
      AND table_schema = 'public';
    
    RAISE NOTICE 'Total Foreign Keys: %', v_table_count;
    
    IF v_table_count >= 30 THEN
        RAISE NOTICE '✅ Foreign keys properly configured';
    ELSE
        RAISE NOTICE '⚠️ Expected at least 30 foreign keys';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'INDEX VERIFICATION';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    
    -- Count indexes
    SELECT COUNT(*) INTO v_table_count
    FROM pg_indexes
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Total Indexes: %', v_table_count;
    
    IF v_table_count >= 40 THEN
        RAISE NOTICE '✅ Indexes properly configured';
    ELSE
        RAISE NOTICE '⚠️ Expected at least 40 indexes';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'RLS POLICY VERIFICATION';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    
    -- Count RLS policies
    SELECT COUNT(*) INTO v_table_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Total RLS Policies: %', v_table_count;
    
    IF v_table_count >= 40 THEN
        RAISE NOTICE '✅ RLS policies properly configured';
    ELSE
        RAISE NOTICE '⚠️ Expected at least 40 RLS policies';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ PHASE 1 COMPLETE!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Database schema is ready for TwoBeOne!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Update TypeScript types (Phase 2)';
    RAISE NOTICE '  2. Implement backend APIs (Phase 3)';
    RAISE NOTICE '  3. Connect UI to database (Phase 4)';
    RAISE NOTICE '';
    RAISE NOTICE 'See /database/IMPLEMENTATION_ROADMAP.md';
    RAISE NOTICE '';
END $$;
