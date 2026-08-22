/**
 * TwoBeOne Database Types
 * These types match the Supabase database schema exactly
 * Updated: November 10, 2025
 */

// ============================================
// CORE ENTITIES
// ============================================

export interface DatabaseUser {
  id: string; // UUID
  email: string; // TEXT, UNIQUE
  full_name: string | null; // TEXT
  avatar_url: string | null; // TEXT
  bio: string | null; // TEXT
  phone: string | null; // TEXT
  location: string | null; // TEXT
  relationship_start: string | null; // DATE
  partner_id: string | null; // UUID FK to users(id)
  invite_code_ref: string | null; // TEXT
  created_at: string; // TIMESTAMP
  updated_at: string | null; // TIMESTAMP
}

export interface Couple {
  id: string; // UUID
  partner_one: string; // UUID FK to users(id)
  partner_two: string | null; // UUID FK to users(id)
  linked_at: string | null; // TIMESTAMP
  invite_code: string | null; // TEXT, UNIQUE
  couple_name: string | null; // TEXT
  couple_picture: string | null; // TEXT
  anniversary_date: string | null; // DATE
  relationship_status: string; // TEXT DEFAULT 'dating'
  created_at: string; // TIMESTAMP
}

// ============================================
// DEVOTIONALS & SPIRITUAL GROWTH
// ============================================

export interface Devotion {
  id: string; // UUID
  title: string; // TEXT
  body: string; // TEXT
  audio_url: string | null; // TEXT
  memory_verse: string | null; // TEXT
  verse_text: string | null; // TEXT
  verse_reference: string | null; // TEXT
  published_date: string | null; // DATE
  created_at: string; // TIMESTAMP
}

export interface DevotionalCompletion {
  id: string; // UUID
  user_id: string; // UUID FK to users(id)
  devotion_id: string; // UUID FK to devotions(id)
  notes: string | null; // TEXT
  completed_at: string; // TIMESTAMP
}

export interface Streak {
  id: string; // UUID
  user_id: string; // UUID FK to users(id)
  streak_type: 'devotional' | 'journal' | 'prayer' | 'quiz'; // TEXT
  current_streak: number; // INTEGER
  longest_streak: number; // INTEGER
  last_activity_date: string | null; // DATE
  updated_at: string; // TIMESTAMP
}

// ============================================
// GUIDANCE MODULES & PROGRESS
// ============================================

export interface GuidanceModule {
  id: string; // UUID
  title: string; // TEXT
  description: string | null; // TEXT
  module_order: number; // INTEGER
  duration_minutes: number | null; // INTEGER
  content: any; // JSONB - structure: { lessons: [...] }
  is_active: boolean; // BOOLEAN
  created_at: string; // TIMESTAMP
}

export interface ModuleProgress {
  id: string; // UUID
  user_id: string; // UUID FK to users(id)
  module_id: string; // UUID FK to guidance_modules(id)
  completed_lessons: number; // INTEGER
  progress_percentage: number; // NUMERIC(5,2)
  is_completed: boolean; // BOOLEAN
  started_at: string | null; // TIMESTAMP
  updated_at: string; // TIMESTAMP
}

// ============================================
// JOURNAL & ENTRIES
// ============================================

export interface JournalEntry {
  id: string; // UUID
  couple_id: string; // UUID FK to couples(id)
  author_id: string; // UUID FK to users(id)
  title: string | null; // TEXT
  content: string; // TEXT
  media_urls: string[] | null; // TEXT[]
  media_files: MediaFile[] | null; // JSONB
  is_shared: boolean; // BOOLEAN
  entry_type: 'journal' | 'event'; // TEXT
  location: string | null; // TEXT
  emoji: string | null; // TEXT
  prompt_id: string | null; // UUID
  created_at: string; // TIMESTAMP
  updated_at: string | null; // TIMESTAMP
}

export interface MediaFile {
  type: 'image' | 'video' | 'audio';
  url: string;
  name: string;
  size?: number;
  thumbnail_url?: string;
}

export interface JournalComment {
  id: string; // UUID
  journal_entry_id: string; // UUID FK to journal_entries(id)
  user_id: string; // UUID FK to users(id)
  content: string; // TEXT
  created_at: string; // TIMESTAMP
}

// ============================================
// PRAYER REQUESTS
// ============================================

export interface PrayerRequest {
  id: string; // UUID
  couple_id: string; // UUID FK to couples(id)
  author_id: string | null; // UUID FK to users(id)
  title: string; // TEXT
  description: string | null; // TEXT
  is_answered: boolean; // BOOLEAN
  is_shared: boolean; // BOOLEAN
  answered_at: string | null; // TIMESTAMP
  created_at: string; // TIMESTAMP
  updated_at: string | null; // TIMESTAMP
}

export interface PrayerUpdate {
  id: string; // UUID
  prayer_request_id: string; // UUID FK to prayer_requests(id)
  user_id: string; // UUID FK to users(id)
  update_text: string; // TEXT
  update_type: 'update' | 'answered' | 'praise'; // TEXT
  created_at: string; // TIMESTAMP
}

// ============================================
// QUIZZES
// ============================================

export interface Quiz {
  id: string; // UUID
  title: string; // TEXT
  description: string | null; // TEXT
  questions: QuizQuestion[]; // JSONB
  created_at: string; // TIMESTAMP
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  category?: string;
}

export interface QuizResult {
  id: string; // UUID
  user_id: string; // UUID FK to users(id)
  quiz_id: string; // UUID FK to quizzes(id)
  score: number | null; // INTEGER
  answers: Record<string, any> | null; // JSONB
  result_type: string | null; // TEXT (e.g., "Physical Touch", "Words of Affirmation")
  result_details: any; // JSONB
  scripture_insights: string | null; // TEXT
  completed_at: string; // TIMESTAMP
}

// ============================================
// QUESTIONS & RESPONSES (Know Each Other)
// ============================================

export interface Question {
  id: string; // UUID
  category: 'Faith' | 'Communication' | 'Love' | 'Family' | 'Intimacy' | 'Finance' | 'Dreams' | 'Conflict'; // TEXT
  question: string; // TEXT
  description: string | null; // TEXT
  question_order: number | null; // INTEGER
  is_active: boolean; // BOOLEAN
  created_at: string; // TIMESTAMP
}

export interface QuestionResponse {
  id: string; // UUID
  user_id: string; // UUID FK to users(id)
  couple_id: string; // UUID FK to couples(id)
  question_id: string; // UUID FK to questions(id)
  response: string; // TEXT
  is_private: boolean; // BOOLEAN
  created_at: string; // TIMESTAMP
  updated_at: string; // TIMESTAMP
}

// ============================================
// MILESTONES
// ============================================

export interface Milestone {
  id: string; // UUID
  couple_id: string; // UUID FK to couples(id)
  title: string; // TEXT
  description: string | null; // TEXT
  date: string; // DATE
  icon_type: string | null; // TEXT (e.g., "heart", "star", "gift")
  media_url: string | null; // TEXT
  category: string | null; // TEXT
  created_at: string; // TIMESTAMP
}

// ============================================
// GROUPS & COMMUNITY
// ============================================

export interface Group {
  id: string; // UUID
  name: string; // TEXT
  description: string | null; // TEXT
  creator_id: string | null; // UUID FK to users(id)
  meeting_schedule: string | null; // TEXT
  max_members: number | null; // INTEGER
  image_url: string | null; // TEXT
  is_active: boolean; // BOOLEAN
  created_at: string; // TIMESTAMP
}

export interface GroupMember {
  id: string; // UUID
  group_id: string; // UUID FK to groups(id)
  user_id: string; // UUID FK to users(id)
  role: 'admin' | 'moderator' | 'member'; // TEXT
  joined_at: string; // TIMESTAMP
}

// ============================================
// MOODS & DAILY TRACKING
// ============================================

export interface DailyMood {
  id: string; // UUID
  user_id: string; // UUID FK to users(id)
  couple_id: string; // UUID FK to couples(id)
  mood: 'great' | 'good' | 'okay' | 'sad'; // TEXT
  note: string | null; // TEXT
  date: string; // DATE
  created_at: string; // TIMESTAMP
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string; // UUID
  user_id: string; // UUID FK to users(id)
  type: 'devotional' | 'prayer' | 'journal' | 'milestone' | 'partner' | 'group' | 'quiz' | 'system'; // TEXT
  title: string; // TEXT
  message: string; // TEXT
  link: string | null; // TEXT
  metadata: any; // JSONB
  is_read: boolean; // BOOLEAN
  created_at: string; // TIMESTAMP
}

// ============================================
// PROGRESS TRACKING (Computed/Aggregate)
// ============================================

export interface UserProgress {
  user_id: string;
  devotional_streak: number;
  journal_entries_count: number;
  prayer_requests_count: number;
  questions_answered: number;
  modules_completed: number;
  last_active_date: string;
}

// ============================================
// TYPE HELPERS
// ============================================

// For INSERT operations (omit auto-generated fields)
export type NewDatabaseUser = Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>;
export type NewCouple = Omit<Couple, 'id' | 'created_at'>;
export type NewJournalEntry = Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>;
export type NewPrayerRequest = Omit<PrayerRequest, 'id' | 'created_at' | 'updated_at'>;
export type NewMilestone = Omit<Milestone, 'id' | 'created_at'>;
export type NewNotification = Omit<Notification, 'id' | 'created_at'>;
export type NewDailyMood = Omit<DailyMood, 'id' | 'created_at'>;
export type NewQuestionResponse = Omit<QuestionResponse, 'id' | 'created_at' | 'updated_at'>;

// For UPDATE operations (all fields optional except id)
export type UpdateDatabaseUser = Partial<Omit<DatabaseUser, 'id' | 'created_at'>> & { id: string };
export type UpdateJournalEntry = Partial<Omit<JournalEntry, 'id' | 'created_at'>> & { id: string };
export type UpdatePrayerRequest = Partial<Omit<PrayerRequest, 'id' | 'created_at'>> & { id: string };
