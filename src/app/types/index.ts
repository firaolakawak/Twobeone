/**
 * TwoBeOne Type Definitions
 * Aligned with Supabase database schema
 * Updated: November 10, 2025
 */

// ============================================
// CORE USER & COUPLE TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  relationship_start: string | null;
  partner_id: string | null;
  invite_code_ref: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Couple {
  id: string;
  partner_one: string;
  partner_two: string | null;
  linked_at: string | null;
  invite_code: string | null;
  couple_name: string | null;
  couple_picture: string | null;
  anniversary_date: string | null;
  relationship_status: string;
  created_at: string;
}

// ============================================
// DEVOTIONALS & SPIRITUAL GROWTH
// ============================================

export interface Devotion {
  id: string;
  title: string;
  body: string;
  audio_url: string | null;
  memory_verse: string | null;
  verse_text: string | null;
  verse_reference: string | null;
  published_date: string | null;
  created_at: string;
}

export interface DevotionalCompletion {
  id: string;
  user_id: string;
  devotion_id: string;
  notes: string | null;
  completed_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  streak_type: 'devotional' | 'journal' | 'prayer' | 'quiz';
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

// ============================================
// GUIDANCE MODULES & PROGRESS
// ============================================

export interface GuidanceModule {
  id: string;
  title: string;
  description: string | null;
  module_order: number;
  duration_minutes: number | null;
  content: any; // JSONB
  is_active: boolean;
  created_at: string;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  completed_lessons: number;
  progress_percentage: number;
  is_completed: boolean;
  started_at: string | null;
  updated_at: string;
}

// ============================================
// JOURNAL & ENTRIES
// ============================================

export interface MediaFile {
  type: 'image' | 'video' | 'audio';
  url: string;
  name: string;
  size?: number;
  thumbnail_url?: string;
}

export interface JournalEntry {
  id: string;
  couple_id: string;
  author_id: string;
  title: string | null;
  content: string;
  media_urls: string[] | null;
  media_files: MediaFile[] | null;
  is_shared: boolean;
  entry_type: 'journal' | 'event';
  location: string | null;
  emoji: string | null;
  prompt_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface JournalComment {
  id: string;
  journal_entry_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// ============================================
// PRAYER REQUESTS
// ============================================

export interface PrayerRequest {
  id: string;
  couple_id: string;
  author_id: string | null;
  title: string;
  description: string | null;
  is_answered: boolean;
  is_shared: boolean;
  answered_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PrayerUpdate {
  id: string;
  prayer_request_id: string;
  user_id: string;
  update_text: string;
  update_type: 'update' | 'answered' | 'praise';
  created_at: string;
}

// ============================================
// QUIZZES
// ============================================

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  category?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number | null;
  answers: Record<string, any> | null;
  result_type: string | null;
  result_details: any;
  scripture_insights: string | null;
  completed_at: string;
}

// ============================================
// QUESTIONS & RESPONSES (Know Each Other)
// ============================================

export interface Question {
  id: string;
  category: 'Faith' | 'Communication' | 'Love' | 'Family' | 'Intimacy' | 'Finance' | 'Dreams' | 'Conflict';
  question: string;
  description: string | null;
  question_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface QuestionResponse {
  id: string;
  user_id: string;
  couple_id: string;
  question_id: string;
  response: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// MILESTONES
// ============================================

export interface Milestone {
  id: string;
  couple_id: string;
  title: string;
  description: string | null;
  date: string;
  icon_type: string | null;
  media_url: string | null;
  category: string | null;
  created_at: string;
}

// ============================================
// GROUPS & COMMUNITY
// ============================================

export interface Group {
  id: string;
  name: string;
  description: string | null;
  creator_id: string | null;
  meeting_schedule: string | null;
  max_members: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

// ============================================
// MOODS & DAILY TRACKING
// ============================================

export interface DailyMood {
  id: string;
  user_id: string;
  couple_id: string;
  mood: 'great' | 'good' | 'okay' | 'sad';
  note: string | null;
  date: string;
  created_at: string;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  type: 'devotional' | 'prayer' | 'journal' | 'milestone' | 'partner' | 'group' | 'quiz' | 'system';
  title: string;
  message: string;
  link: string | null;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

// ============================================
// PROGRESS TRACKING (Computed)
// ============================================

export interface Progress {
  user_id: string;
  devotional_streak: number;
  journal_entries_count: number;
  prayer_requests_count: number;
  questions_answered: number;
  modules_completed: number;
  last_active_date: string;
}

// ============================================
// HELPER TYPES FOR MUTATIONS
// ============================================

// For INSERT operations (omit auto-generated fields)
export type NewUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type NewCouple = Omit<Couple, 'id' | 'created_at'>;
export type NewJournalEntry = Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>;
export type NewPrayerRequest = Omit<PrayerRequest, 'id' | 'created_at' | 'updated_at'>;
export type NewMilestone = Omit<Milestone, 'id' | 'created_at'>;
export type NewNotification = Omit<Notification, 'id' | 'created_at'>;
export type NewDailyMood = Omit<DailyMood, 'id' | 'created_at'>;
export type NewQuestionResponse = Omit<QuestionResponse, 'id' | 'created_at' | 'updated_at'>;

// For UPDATE operations (all fields optional except id)
export type UpdateUser = Partial<Omit<User, 'id' | 'created_at'>> & { id: string };
export type UpdateJournalEntry = Partial<Omit<JournalEntry, 'id' | 'created_at'>> & { id: string };
export type UpdatePrayerRequest = Partial<Omit<PrayerRequest, 'id' | 'created_at'>> & { id: string };

// Backward compatibility aliases (optional - remove after full migration)
export type DailyDevotional = Devotion;