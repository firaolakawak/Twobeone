# Phase 2: Field Name Mapping Reference

Quick reference for updating field names from old types to database schema.

---

## 🔄 Find & Replace Guide

Use this guide with your code editor's find & replace (Ctrl+Shift+H in VS Code)

---

## 👤 USER FIELDS

### Core Fields

| Old Field | New Field | Type | Example |
|-----------|-----------|------|---------|
| `user.name` | `user.full_name` | string | "Sarah Johnson" |
| `user.profilePicture` | `user.avatar_url` | string | "https://..." |
| `user.createdAt` | `user.created_at` | string | ISO timestamp |
| `user.updatedAt` | `user.updated_at` | string | ISO timestamp |
| `user.partnerId` | `user.partner_id` | UUID | "123e4567..." |
| `user.inviteCode` | `user.invite_code_ref` | string | "ABC123" |

### New Fields (Already Correct)
- ✅ `user.bio`
- ✅ `user.phone`
- ✅ `user.location`
- ✅ `user.relationship_start`

---

## 📔 JOURNAL ENTRY FIELDS

### Core Fields

| Old Field | New Field | Type | Notes |
|-----------|-----------|------|-------|
| `entry.userId` | `entry.author_id` | UUID | Who wrote it |
| `entry.isShared` | `entry.is_shared` | boolean | Shared with partner? |
| `entry.createdAt` | `entry.created_at` | string | When created |
| `entry.updatedAt` | `entry.updated_at` | string | When modified |
| `entry.promptId` | `entry.prompt_id` | UUID | Optional prompt |
| `entry.entryType` | `entry.entry_type` | enum | 'journal' \| 'event' |
| `entry.mediaFiles` | `entry.media_files` | JSONB | Structured media |

### New/Updated Fields
- ✅ `entry.title` - Entry title
- ✅ `entry.location` - Where written
- ✅ `entry.emoji` - Entry emoji
- ✅ `entry.couple_id` - Which couple

---

## 🙏 PRAYER REQUEST FIELDS

### Core Fields

| Old Field | New Field | Type | Notes |
|-----------|-----------|------|-------|
| `prayer.userId` | `prayer.author_id` | UUID | Who created |
| `prayer.isAnswered` | `prayer.is_answered` | boolean | Answered status |
| `prayer.isShared` | `prayer.is_shared` | boolean | Shared? |
| `prayer.createdAt` | `prayer.created_at` | string | Created date |
| `prayer.updatedAt` | `prayer.updated_at` | string | Updated date |

### New Fields
- ✅ `prayer.answered_at` - When answered (NEW!)
- ✅ `prayer.couple_id` - Which couple

---

## 📊 QUIZ & RESULTS FIELDS

### Quiz Fields
| Old Field | New Field | Type |
|-----------|-----------|------|
| `quiz.createdAt` | `quiz.created_at` | string |

### Quiz Result Fields
| Old Field | New Field | Type | Notes |
|-----------|-----------|------|-------|
| `result.userId` | `result.user_id` | UUID | |
| `result.quizId` | `result.quiz_id` | UUID | |
| `result.completedAt` | `result.completed_at` | string | |
| `result.scriptureInsights` | `result.scripture_insights` | string | |

### New Fields
- ✅ `result.answers` - User's actual answers (JSONB)
- ✅ `result.result_type` - e.g., "Physical Touch"
- ✅ `result.result_details` - Additional data (JSONB)

---

## 📚 DEVOTIONAL FIELDS

### Devotion Fields

| Old Field | New Field | Type | Notes |
|-----------|-----------|------|-------|
| `devotion.verse` | `devotion.memory_verse` | string | Full verse |
| `devotion.reference` | `devotion.verse_reference` | string | e.g., "John 3:16" |
| `devotion.reflection` | `devotion.body` | string | Main content |
| `devotion.date` | `devotion.published_date` | date | When to show |

### New Fields
- ✅ `devotion.verse_text` - Verse text only
- ✅ `devotion.audio_url` - Audio file URL

---

## 🎯 MILESTONE FIELDS

### Core Fields
| Old Field | New Field | Type |
|-----------|-----------|------|
| `milestone.iconType` | `milestone.icon_type` | string |
| `milestone.createdAt` | `milestone.created_at` | string |

### New Fields
- ✅ `milestone.media_url` - Photo/video URL
- ✅ `milestone.category` - Milestone type
- ✅ `milestone.couple_id` - Which couple

---

## 👥 GROUP FIELDS

### Group Fields
| Old Field | New Field | Type |
|-----------|-----------|------|
| `group.isActive` | `group.is_active` | boolean |
| `group.createdAt` | `group.created_at` | string |

### New Fields
- ✅ `group.creator_id` - Who created
- ✅ `group.meeting_schedule` - Schedule text
- ✅ `group.max_members` - Max capacity
- ✅ `group.image_url` - Group image

### Group Member Fields
| Old Field | New Field | Type |
|-----------|-----------|------|
| `member.userId` | `member.user_id` | UUID |
| `member.groupId` | `member.group_id` | UUID |
| `member.joinedAt` | `member.joined_at` | string |

### New Fields
- ✅ `member.role` - 'admin' \| 'moderator' \| 'member'

---

## 💑 COUPLE FIELDS

### Core Fields
| Old Field | New Field | Type |
|-----------|-----------|------|
| `couple.partnerOne` | `couple.partner_one` | UUID |
| `couple.partnerTwo` | `couple.partner_two` | UUID |
| `couple.linkedAt` | `couple.linked_at` | string |
| `couple.inviteCode` | `couple.invite_code` | string |
| `couple.createdAt` | `couple.created_at` | string |

### New Fields
- ✅ `couple.couple_name` - e.g., "Sarah & David"
- ✅ `couple.couple_picture` - Couple photo URL
- ✅ `couple.anniversary_date` - Anniversary date
- ✅ `couple.relationship_status` - e.g., "dating", "engaged"

---

## 📖 MODULE PROGRESS FIELDS

| Old Field | New Field | Type |
|-----------|-----------|------|
| `progress.userId` | `progress.user_id` | UUID |
| `progress.moduleId` | `progress.module_id` | UUID |
| `progress.completedLessons` | `progress.completed_lessons` | number |
| `progress.progressPercentage` | `progress.progress_percentage` | number |
| `progress.isCompleted` | `progress.is_completed` | boolean |
| `progress.updatedAt` | `progress.updated_at` | string |

### New Fields
- ✅ `progress.started_at` - When user started

---

## 🆕 NEW TYPES (No Old Fields)

These are completely new - just use database field names:

### DailyMood
```typescript
{
  id: string;
  user_id: string;
  couple_id: string;
  mood: 'great' | 'good' | 'okay' | 'sad';
  note: string | null;
  date: string;
  created_at: string;
}
```

### Notification
```typescript
{
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
```

### Question
```typescript
{
  id: string;
  category: 'Faith' | 'Communication' | 'Love' | 'Family' | 'Intimacy' | 'Finance' | 'Dreams' | 'Conflict';
  question: string;
  description: string | null;
  question_order: number | null;
  is_active: boolean;
  created_at: string;
}
```

### QuestionResponse
```typescript
{
  id: string;
  user_id: string;
  couple_id: string;
  question_id: string;
  response: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}
```

### Streak
```typescript
{
  id: string;
  user_id: string;
  streak_type: 'devotional' | 'journal' | 'prayer' | 'quiz';
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}
```

### DevotionalCompletion
```typescript
{
  id: string;
  user_id: string;
  devotion_id: string;
  notes: string | null;
  completed_at: string;
}
```

### JournalComment
```typescript
{
  id: string;
  journal_entry_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
```

### PrayerUpdate
```typescript
{
  id: string;
  prayer_request_id: string;
  user_id: string;
  update_text: string;
  update_type: 'update' | 'answered' | 'praise';
  created_at: string;
}
```

---

## 🔍 Search Patterns by Component

### CoupleDashboard.tsx
Search for:
- `profile.name` → Replace with `profile.full_name`
- `profile.profilePicture` → Replace with `profile.avatar_url`
- `partner.name` → Replace with `partner.full_name`
- `partner.profilePicture` → Replace with `partner.avatar_url`

### ProfileSettings.tsx
Search for:
- `user.name` → Replace with `user.full_name`
- `user.profilePicture` → Replace with `user.avatar_url`
- `formData.name` → Replace with `formData.full_name`
- `formData.profilePicture` → Replace with `formData.avatar_url`

### EnhancedJournal.tsx / CollaborativeJournal.tsx
Search for:
- `entry.userId` → Replace with `entry.author_id`
- `entry.isShared` → Replace with `entry.is_shared`
- `entry.createdAt` → Replace with `entry.created_at`
- `entry.updatedAt` → Replace with `entry.updated_at`
- `entry.entryType` → Replace with `entry.entry_type`
- `entry.mediaFiles` → Replace with `entry.media_files`
- `entry.promptId` → Replace with `entry.prompt_id`

### PrayerBoard.tsx / PrayerSection.tsx
Search for:
- `prayer.userId` → Replace with `prayer.author_id`
- `prayer.isAnswered` → Replace with `prayer.is_answered`
- `prayer.isShared` → Replace with `prayer.is_shared`
- `prayer.createdAt` → Replace with `prayer.created_at`
- `prayer.updatedAt` → Replace with `prayer.updated_at`

### Quiz Components
Search for:
- `result.userId` → Replace with `result.user_id`
- `result.quizId` → Replace with `result.quiz_id`
- `result.completedAt` → Replace with `result.completed_at`

### Group Components
Search for:
- `group.isActive` → Replace with `group.is_active`
- `group.createdAt` → Replace with `group.created_at`
- `member.userId` → Replace with `member.user_id`
- `member.groupId` → Replace with `member.group_id`
- `member.joinedAt` → Replace with `member.joined_at`

---

## ⚡ Quick Replace Script

For VS Code users, use multi-cursor find & replace:

1. Press `Ctrl+Shift+H` (Windows/Linux) or `Cmd+Shift+H` (Mac)
2. Enable "Use Regular Expression" (.*) icon
3. Use these patterns:

**Pattern for all "At" → "_at" conversions:**
```regex
Find:    \.(\w+)At\b
Replace: .$1_at
```
This converts: `createdAt`, `updatedAt`, `completedAt`, etc.

**Pattern for "Id" → "_id" conversions:**
```regex
Find:    \.(\w+)Id\b
Replace: .$1_id
```
This converts: `userId`, `partnerId`, `quizId`, etc.

**⚠️ Warning:** Review each replacement before applying! Some might need manual adjustment.

---

## 📝 Manual Review Needed

These require careful manual updates:

1. **name → full_name** - Common word, review each
2. **profilePicture → avatar_url** - Different meaning
3. **userId in JournalEntry → author_id** - Semantic difference
4. **isShared → is_shared** - Check all usages
5. **isAnswered → is_answered** - Check all usages

---

## ✅ Verification After Replacement

After making changes, verify:

```bash
# Check for remaining old field names
grep -r "\.name" src/  # Should mostly be gone
grep -r "\.profilePicture" src/  # Should be gone
grep -r "\.userId" src/  # Should be gone
grep -r "\.isShared" src/  # Should be gone

# Check TypeScript compiles
npm run build
```

---

## 🎯 Priority Order

Update in this order for least breakage:

1. **User fields** (most used across app)
2. **Journal fields** (complex, many components)
3. **Prayer fields** (medium complexity)
4. **Quiz fields** (isolated to quiz components)
5. **Group fields** (isolated to group components)
6. **Other fields** (less critical)

---

**Use this as your reference during Phase 2!** ✅
