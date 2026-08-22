-- ============================================
-- TwoBeOne Database Schema Verification Script
-- ============================================
-- Run this in Supabase SQL Editor to verify all tables and columns

-- Create a temporary function to check schema
DO $$
DECLARE
    v_table_name text;
    v_column_name text;
    v_missing_tables text[] := ARRAY[]::text[];
    v_missing_columns text[] := ARRAY[]::text[];
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'TWOBEONE DATABASE VERIFICATION';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';

    -- ============================================
    -- 1. USERS TABLE
    -- ============================================
    RAISE NOTICE '1. Checking USERS table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        v_missing_tables := array_append(v_missing_tables, 'users');
        RAISE NOTICE '   ❌ Table "users" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "users" exists';
        
        -- Check columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'users.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
            v_missing_columns := array_append(v_missing_columns, 'users.email');
            RAISE NOTICE '   ❌ Column "email" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "email" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
            v_missing_columns := array_append(v_missing_columns, 'users.full_name');
            RAISE NOTICE '   ❌ Column "full_name" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "full_name" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
            v_missing_columns := array_append(v_missing_columns, 'users.avatar_url');
            RAISE NOTICE '   ❌ Column "avatar_url" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "avatar_url" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'users.created_at');
            RAISE NOTICE '   ❌ Column "created_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "created_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 2. COUPLES TABLE
    -- ============================================
    RAISE NOTICE '2. Checking COUPLES table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'couples') THEN
        v_missing_tables := array_append(v_missing_tables, 'couples');
        RAISE NOTICE '   ❌ Table "couples" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "couples" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couples' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'couples.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couples' AND column_name = 'partner_one') THEN
            v_missing_columns := array_append(v_missing_columns, 'couples.partner_one');
            RAISE NOTICE '   ❌ Column "partner_one" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "partner_one" exists (uuid, FK to users)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couples' AND column_name = 'partner_two') THEN
            v_missing_columns := array_append(v_missing_columns, 'couples.partner_two');
            RAISE NOTICE '   ❌ Column "partner_two" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "partner_two" exists (uuid, FK to users)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couples' AND column_name = 'linked_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'couples.linked_at');
            RAISE NOTICE '   ❌ Column "linked_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "linked_at" exists (timestamp)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couples' AND column_name = 'invite_code') THEN
            v_missing_columns := array_append(v_missing_columns, 'couples.invite_code');
            RAISE NOTICE '   ❌ Column "invite_code" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "invite_code" exists (text)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 3. GUIDANCE_MODULES TABLE
    -- ============================================
    RAISE NOTICE '3. Checking GUIDANCE_MODULES table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'guidance_modules') THEN
        v_missing_tables := array_append(v_missing_tables, 'guidance_modules');
        RAISE NOTICE '   ❌ Table "guidance_modules" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "guidance_modules" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guidance_modules' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'guidance_modules.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guidance_modules' AND column_name = 'title') THEN
            v_missing_columns := array_append(v_missing_columns, 'guidance_modules.title');
            RAISE NOTICE '   ❌ Column "title" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "title" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guidance_modules' AND column_name = 'description') THEN
            v_missing_columns := array_append(v_missing_columns, 'guidance_modules.description');
            RAISE NOTICE '   ❌ Column "description" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "description" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guidance_modules' AND column_name = 'module_order') THEN
            v_missing_columns := array_append(v_missing_columns, 'guidance_modules.module_order');
            RAISE NOTICE '   ❌ Column "module_order" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "module_order" exists (integer)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guidance_modules' AND column_name = 'duration_minutes') THEN
            v_missing_columns := array_append(v_missing_columns, 'guidance_modules.duration_minutes');
            RAISE NOTICE '   ❌ Column "duration_minutes" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "duration_minutes" exists (integer)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guidance_modules' AND column_name = 'content') THEN
            v_missing_columns := array_append(v_missing_columns, 'guidance_modules.content');
            RAISE NOTICE '   ❌ Column "content" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "content" exists (jsonb)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guidance_modules' AND column_name = 'is_active') THEN
            v_missing_columns := array_append(v_missing_columns, 'guidance_modules.is_active');
            RAISE NOTICE '   ❌ Column "is_active" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "is_active" exists (boolean)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guidance_modules' AND column_name = 'created_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'guidance_modules.created_at');
            RAISE NOTICE '   ❌ Column "created_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "created_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 4. MODULE_PROGRESS TABLE
    -- ============================================
    RAISE NOTICE '4. Checking MODULE_PROGRESS table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'module_progress') THEN
        v_missing_tables := array_append(v_missing_tables, 'module_progress');
        RAISE NOTICE '   ❌ Table "module_progress" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "module_progress" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'module_progress' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'module_progress.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'module_progress' AND column_name = 'user_id') THEN
            v_missing_columns := array_append(v_missing_columns, 'module_progress.user_id');
            RAISE NOTICE '   ❌ Column "user_id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "user_id" exists (uuid, FK to users)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'module_progress' AND column_name = 'module_id') THEN
            v_missing_columns := array_append(v_missing_columns, 'module_progress.module_id');
            RAISE NOTICE '   ❌ Column "module_id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "module_id" exists (uuid, FK to guidance_modules)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'module_progress' AND column_name = 'completed_lessons') THEN
            v_missing_columns := array_append(v_missing_columns, 'module_progress.completed_lessons');
            RAISE NOTICE '   ❌ Column "completed_lessons" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "completed_lessons" exists (integer)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'module_progress' AND column_name = 'progress_percentage') THEN
            v_missing_columns := array_append(v_missing_columns, 'module_progress.progress_percentage');
            RAISE NOTICE '   ❌ Column "progress_percentage" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "progress_percentage" exists (numeric)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'module_progress' AND column_name = 'is_completed') THEN
            v_missing_columns := array_append(v_missing_columns, 'module_progress.is_completed');
            RAISE NOTICE '   ❌ Column "is_completed" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "is_completed" exists (boolean)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'module_progress' AND column_name = 'updated_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'module_progress.updated_at');
            RAISE NOTICE '   ❌ Column "updated_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "updated_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 5. JOURNAL_ENTRIES TABLE
    -- ============================================
    RAISE NOTICE '5. Checking JOURNAL_ENTRIES table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'journal_entries') THEN
        v_missing_tables := array_append(v_missing_tables, 'journal_entries');
        RAISE NOTICE '   ❌ Table "journal_entries" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "journal_entries" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'journal_entries.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'couple_id') THEN
            v_missing_columns := array_append(v_missing_columns, 'journal_entries.couple_id');
            RAISE NOTICE '   ❌ Column "couple_id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "couple_id" exists (uuid, FK to couples)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'author_id') THEN
            v_missing_columns := array_append(v_missing_columns, 'journal_entries.author_id');
            RAISE NOTICE '   ❌ Column "author_id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "author_id" exists (uuid, FK to users)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'content') THEN
            v_missing_columns := array_append(v_missing_columns, 'journal_entries.content');
            RAISE NOTICE '   ❌ Column "content" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "content" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'media_urls') THEN
            v_missing_columns := array_append(v_missing_columns, 'journal_entries.media_urls');
            RAISE NOTICE '   ❌ Column "media_urls" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "media_urls" exists (text[])';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'is_shared') THEN
            v_missing_columns := array_append(v_missing_columns, 'journal_entries.is_shared');
            RAISE NOTICE '   ❌ Column "is_shared" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "is_shared" exists (boolean)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'created_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'journal_entries.created_at');
            RAISE NOTICE '   ❌ Column "created_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "created_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 6. PRAYER_REQUESTS TABLE
    -- ============================================
    RAISE NOTICE '6. Checking PRAYER_REQUESTS table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prayer_requests') THEN
        v_missing_tables := array_append(v_missing_tables, 'prayer_requests');
        RAISE NOTICE '   ❌ Table "prayer_requests" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "prayer_requests" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'prayer_requests.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'couple_id') THEN
            v_missing_columns := array_append(v_missing_columns, 'prayer_requests.couple_id');
            RAISE NOTICE '   ❌ Column "couple_id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "couple_id" exists (uuid, FK to couples)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'title') THEN
            v_missing_columns := array_append(v_missing_columns, 'prayer_requests.title');
            RAISE NOTICE '   ❌ Column "title" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "title" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'description') THEN
            v_missing_columns := array_append(v_missing_columns, 'prayer_requests.description');
            RAISE NOTICE '   ❌ Column "description" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "description" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'is_answered') THEN
            v_missing_columns := array_append(v_missing_columns, 'prayer_requests.is_answered');
            RAISE NOTICE '   ❌ Column "is_answered" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "is_answered" exists (boolean)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'is_shared') THEN
            v_missing_columns := array_append(v_missing_columns, 'prayer_requests.is_shared');
            RAISE NOTICE '   ❌ Column "is_shared" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "is_shared" exists (boolean)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'created_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'prayer_requests.created_at');
            RAISE NOTICE '   ❌ Column "created_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "created_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 7. QUIZZES TABLE
    -- ============================================
    RAISE NOTICE '7. Checking QUIZZES table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quizzes') THEN
        v_missing_tables := array_append(v_missing_tables, 'quizzes');
        RAISE NOTICE '   ❌ Table "quizzes" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "quizzes" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'quizzes.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'title') THEN
            v_missing_columns := array_append(v_missing_columns, 'quizzes.title');
            RAISE NOTICE '   ❌ Column "title" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "title" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'description') THEN
            v_missing_columns := array_append(v_missing_columns, 'quizzes.description');
            RAISE NOTICE '   ❌ Column "description" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "description" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'questions') THEN
            v_missing_columns := array_append(v_missing_columns, 'quizzes.questions');
            RAISE NOTICE '   ❌ Column "questions" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "questions" exists (jsonb)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'created_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'quizzes.created_at');
            RAISE NOTICE '   ❌ Column "created_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "created_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 8. QUIZ_RESULTS TABLE
    -- ============================================
    RAISE NOTICE '8. Checking QUIZ_RESULTS table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_results') THEN
        v_missing_tables := array_append(v_missing_tables, 'quiz_results');
        RAISE NOTICE '   ❌ Table "quiz_results" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "quiz_results" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_results' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'quiz_results.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_results' AND column_name = 'user_id') THEN
            v_missing_columns := array_append(v_missing_columns, 'quiz_results.user_id');
            RAISE NOTICE '   ❌ Column "user_id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "user_id" exists (uuid, FK to users)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_results' AND column_name = 'quiz_id') THEN
            v_missing_columns := array_append(v_missing_columns, 'quiz_results.quiz_id');
            RAISE NOTICE '   ❌ Column "quiz_id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "quiz_id" exists (uuid, FK to quizzes)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_results' AND column_name = 'score') THEN
            v_missing_columns := array_append(v_missing_columns, 'quiz_results.score');
            RAISE NOTICE '   ❌ Column "score" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "score" exists (integer)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_results' AND column_name = 'scripture_insights') THEN
            v_missing_columns := array_append(v_missing_columns, 'quiz_results.scripture_insights');
            RAISE NOTICE '   ❌ Column "scripture_insights" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "scripture_insights" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_results' AND column_name = 'completed_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'quiz_results.completed_at');
            RAISE NOTICE '   ❌ Column "completed_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "completed_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 9. DEVOTIONS TABLE
    -- ============================================
    RAISE NOTICE '9. Checking DEVOTIONS table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devotions') THEN
        v_missing_tables := array_append(v_missing_tables, 'devotions');
        RAISE NOTICE '   ❌ Table "devotions" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "devotions" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotions' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'devotions.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotions' AND column_name = 'title') THEN
            v_missing_columns := array_append(v_missing_columns, 'devotions.title');
            RAISE NOTICE '   ❌ Column "title" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "title" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotions' AND column_name = 'body') THEN
            v_missing_columns := array_append(v_missing_columns, 'devotions.body');
            RAISE NOTICE '   ❌ Column "body" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "body" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotions' AND column_name = 'audio_url') THEN
            v_missing_columns := array_append(v_missing_columns, 'devotions.audio_url');
            RAISE NOTICE '   ❌ Column "audio_url" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "audio_url" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotions' AND column_name = 'memory_verse') THEN
            v_missing_columns := array_append(v_missing_columns, 'devotions.memory_verse');
            RAISE NOTICE '   ❌ Column "memory_verse" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "memory_verse" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devotions' AND column_name = 'created_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'devotions.created_at');
            RAISE NOTICE '   ❌ Column "created_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "created_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 10. MILESTONES TABLE
    -- ============================================
    RAISE NOTICE '10. Checking MILESTONES table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'milestones') THEN
        v_missing_tables := array_append(v_missing_tables, 'milestones');
        RAISE NOTICE '   ❌ Table "milestones" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "milestones" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'milestones.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'couple_id') THEN
            v_missing_columns := array_append(v_missing_columns, 'milestones.couple_id');
            RAISE NOTICE '   ❌ Column "couple_id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "couple_id" exists (uuid, FK to couples)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'title') THEN
            v_missing_columns := array_append(v_missing_columns, 'milestones.title');
            RAISE NOTICE '   ❌ Column "title" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "title" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'description') THEN
            v_missing_columns := array_append(v_missing_columns, 'milestones.description');
            RAISE NOTICE '   ❌ Column "description" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "description" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'date') THEN
            v_missing_columns := array_append(v_missing_columns, 'milestones.date');
            RAISE NOTICE '   ❌ Column "date" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "date" exists (date)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'icon_type') THEN
            v_missing_columns := array_append(v_missing_columns, 'milestones.icon_type');
            RAISE NOTICE '   ❌ Column "icon_type" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "icon_type" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'created_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'milestones.created_at');
            RAISE NOTICE '   ❌ Column "created_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "created_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 11. GROUPS TABLE
    -- ============================================
    RAISE NOTICE '11. Checking GROUPS table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups') THEN
        v_missing_tables := array_append(v_missing_tables, 'groups');
        RAISE NOTICE '   ❌ Table "groups" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "groups" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'groups.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'name') THEN
            v_missing_columns := array_append(v_missing_columns, 'groups.name');
            RAISE NOTICE '   ❌ Column "name" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "name" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'description') THEN
            v_missing_columns := array_append(v_missing_columns, 'groups.description');
            RAISE NOTICE '   ❌ Column "description" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "description" exists (text)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'is_active') THEN
            v_missing_columns := array_append(v_missing_columns, 'groups.is_active');
            RAISE NOTICE '   ❌ Column "is_active" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "is_active" exists (boolean)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'created_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'groups.created_at');
            RAISE NOTICE '   ❌ Column "created_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "created_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- 12. GROUP_MEMBERS TABLE
    -- ============================================
    RAISE NOTICE '12. Checking GROUP_MEMBERS table...';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_members') THEN
        v_missing_tables := array_append(v_missing_tables, 'group_members');
        RAISE NOTICE '   ❌ Table "group_members" does NOT exist';
    ELSE
        RAISE NOTICE '   ✅ Table "group_members" exists';
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'id') THEN
            v_missing_columns := array_append(v_missing_columns, 'group_members.id');
            RAISE NOTICE '   ❌ Column "id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "id" exists (uuid)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'group_id') THEN
            v_missing_columns := array_append(v_missing_columns, 'group_members.group_id');
            RAISE NOTICE '   ❌ Column "group_id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "group_id" exists (uuid, FK to groups)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'user_id') THEN
            v_missing_columns := array_append(v_missing_columns, 'group_members.user_id');
            RAISE NOTICE '   ❌ Column "user_id" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "user_id" exists (uuid, FK to users)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'joined_at') THEN
            v_missing_columns := array_append(v_missing_columns, 'group_members.joined_at');
            RAISE NOTICE '   ❌ Column "joined_at" missing';
        ELSE
            RAISE NOTICE '   ✅ Column "joined_at" exists (timestamp)';
        END IF;
    END IF;
    RAISE NOTICE '';

    -- ============================================
    -- SUMMARY
    -- ============================================
    RAISE NOTICE '====================================';
    RAISE NOTICE 'VERIFICATION SUMMARY';
    RAISE NOTICE '====================================';
    
    IF array_length(v_missing_tables, 1) IS NULL AND array_length(v_missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✅ ALL TABLES AND COLUMNS EXIST!';
    ELSE
        IF array_length(v_missing_tables, 1) IS NOT NULL THEN
            RAISE NOTICE '❌ Missing Tables: %', array_to_string(v_missing_tables, ', ');
        END IF;
        
        IF array_length(v_missing_columns, 1) IS NOT NULL THEN
            RAISE NOTICE '❌ Missing Columns: %', array_to_string(v_missing_columns, ', ');
        END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps: Check foreign keys and constraints manually';
    RAISE NOTICE '';
END $$;
