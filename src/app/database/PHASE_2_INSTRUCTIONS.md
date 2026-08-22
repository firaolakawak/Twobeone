# Phase 2: Update TypeScript Types

## 🎯 Goal
Align TypeScript types with database schema for type safety and consistency

**Time Required:** 1 hour  
**Difficulty:** Medium (requires careful find & replace)

---

## 📋 Prerequisites

✅ Phase 1 complete (database schema updated)  
✅ All 20 tables exist in Supabase  
✅ Basic understanding of TypeScript

---

## 🔍 The Problem

Your current types don't match the database schema:

| Current Type | Database Column | Status |
|--------------|-----------------|--------|
| `name` | `full_name` | ❌ Mismatch |
| `profilePicture` | `avatar_url` | ❌ Mismatch |
| `createdAt` | `created_at` | ❌ Mismatch (casing) |
| `userId` | `author_id` or `user_id` | ⚠️ Inconsistent |

**This causes:**
- Runtime errors when data doesn't match
- Confusing bugs
- Harder backend integration

---

## 🚀 Step-by-Step Instructions

### Step 1: Backup Current Types (2 min)

1. Open `/types/index.ts`
2. Copy entire contents
3. Create `/types/index.backup.ts`
4. Paste contents there
5. Save

**Why:** Safety! You can revert if needed.

---

### Step 2: Replace Types File (5 min)

We have a new `/types/database.ts` with correct types.

**Option A: Simple Replacement**
1. Delete contents of `/types/index.ts`
2. Copy all contents from `/types/database.ts`
3. Paste into `/types/index.ts`
4. Save

**Option B: Side-by-Side**
1. Keep both files
2. Import from `/types/database.ts` where needed
3. Gradually migrate imports

**Recommended:** Option A (simpler)

---

### Step 3: Update Import Statements (10 min)

Search your entire codebase for type imports and update them.

#### Find & Replace Patterns:

**Pattern 1: User Type**
```typescript
// OLD
import { User } from './types'
// or
import { User } from '../types'

// NEW - Stay the same!
import { User } from './types'
// But User interface is now DatabaseUser internally
```

**Pattern 2: Add New Imports**
```typescript
// Add to files that need new types
import { 
  DailyMood,
  Notification,
  Question,
  QuestionResponse,
  Streak,
  DevotionalCompletion
} from './types'
```

---

### Step 4: Fix Field Name Mismatches (20 min)

Update component code to use database field names:

#### User Fields

**Find and Replace Across Project:**

| Find | Replace With | Files Affected |
|------|--------------|----------------|
| `user.name` | `user.full_name` | ProfileSettings, Dashboard, etc. |
| `user.profilePicture` | `user.avatar_url` | All avatar displays |
| `profile.name` | `profile.full_name` | Profile components |
| `profile.profilePicture` | `profile.avatar_url` | Profile components |

**How to Find & Replace:**
1. Press `Ctrl+Shift+F` (VS Code) or `Cmd+Shift+F` (Mac)
2. Type search term in "Search" field
3. Type replacement in "Replace" field
4. Review each occurrence
5. Click "Replace All" or replace individually

---

#### Journal Entry Fields

| Find | Replace With | Context |
|------|--------------|---------|
| `entry.userId` | `entry.author_id` | Journal components |
| `entry.isShared` | `entry.is_shared` | Journal components |
| `entry.createdAt` | `entry.created_at` | Date displays |
| `entry.updatedAt` | `entry.updated_at` | Date displays |
| `entry.promptId` | `entry.prompt_id` | Journal prompts |
| `entry.entryType` | `entry.entry_type` | Entry type checks |
| `entry.mediaFiles` | `entry.media_files` | Media handling |

---

#### Prayer Request Fields

| Find | Replace With | Context |
|------|--------------|---------|
| `prayer.userId` | `prayer.author_id` | Prayer components |
| `prayer.isAnswered` | `prayer.is_answered` | Prayer status |
| `prayer.isShared` | `prayer.is_shared` | Privacy settings |
| `prayer.createdAt` | `prayer.created_at` | Date displays |
| `prayer.updatedAt` | `prayer.updated_at` | Date displays |

---

### Step 5: Add Missing Type Definitions (10 min)

Add types for new features that didn't have them before:

#### In Components Using Mood Tracker:

```typescript
// Add import
import { DailyMood } from './types'

// Update state
const [todaysMood, setTodaysMood] = useState<DailyMood | null>(null);

// Update function signatures
const handleMoodUpdate = async (mood: DailyMood['mood']) => {
  // 'mood' is now typed as 'great' | 'good' | 'okay' | 'sad'
}
```

---

#### In Components Using Notifications:

```typescript
// Add import
import { Notification } from './types'

// Update state
const [notifications, setNotifications] = useState<Notification[]>([]);

// Type-safe notification creation
const createNotification = (data: Omit<Notification, 'id' | 'created_at'>) => {
  // TypeScript ensures all required fields are present
}
```

---

#### In Components Using Questions:

```typescript
// Add imports
import { Question, QuestionResponse } from './types'

// Update state
const [questions, setQuestions] = useState<Question[]>([]);
const [responses, setResponses] = useState<QuestionResponse[]>([]);
```

---

### Step 6: Fix Type Errors (10 min)

After updates, TypeScript will show errors. Fix them:

1. Run: `npm run build` or check VS Code "Problems" tab
2. Review each error
3. Common fixes:

**Error: Property 'name' does not exist**
```typescript
// BEFORE
<div>{user.name}</div>

// AFTER
<div>{user.full_name}</div>
```

**Error: Property 'profilePicture' does not exist**
```typescript
// BEFORE
<img src={user.profilePicture} />

// AFTER
<img src={user.avatar_url} />
```

**Error: Property 'userId' does not exist on JournalEntry**
```typescript
// BEFORE
if (entry.userId === currentUserId) { }

// AFTER
if (entry.author_id === currentUserId) { }
```

---

### Step 7: Update Helper Functions (5 min)

Update any utility functions that work with these types:

```typescript
// BEFORE
export const formatUserName = (user: User): string => {
  return user.name || 'Anonymous';
}

// AFTER
export const formatUserName = (user: DatabaseUser): string => {
  return user.full_name || 'Anonymous';
}
```

---

### Step 8: Test Build (5 min)

Verify no type errors remain:

```bash
# Run TypeScript compiler
npm run build

# Or check types only
npx tsc --noEmit
```

**Expected:** No type errors!

If errors remain, review them and fix using patterns above.

---

## 📝 Component-Specific Updates

### CoupleDashboard.tsx

**Changes Needed:**
```typescript
// Update interface usage
import { DatabaseUser as User, Couple, DailyMood, Streak } from './types'

// Update field access
profile.full_name        // was: profile.name
profile.avatar_url       // was: profile.profilePicture
coupleData.partner_one   // already correct
coupleData.partner_two   // already correct
```

---

### ProfileSettings.tsx

**Changes Needed:**
```typescript
import { DatabaseUser as User, UpdateDatabaseUser } from './types'

// Form state uses correct field names
const [formData, setFormData] = useState({
  full_name: profile?.full_name || '',
  avatar_url: profile?.avatar_url || '',
  bio: profile?.bio || '',
  phone: profile?.phone || '',
  location: profile?.location || '',
})

// Update mutation
const updateUser = async (updates: UpdateDatabaseUser) => {
  // TypeScript ensures only valid fields
}
```

---

### EnhancedJournal.tsx & CollaborativeJournal.tsx

**Changes Needed:**
```typescript
import { JournalEntry, NewJournalEntry } from './types'

// Use correct field names
entry.author_id         // was: entry.userId
entry.is_shared         // was: entry.isShared
entry.created_at        // was: entry.createdAt
entry.entry_type        // was: entry.entryType
entry.media_files       // was: entry.mediaFiles
```

---

### PrayerBoard.tsx & PrayerSection.tsx

**Changes Needed:**
```typescript
import { PrayerRequest, NewPrayerRequest } from './types'

// Use correct field names
prayer.author_id        // was: prayer.userId
prayer.is_answered      // was: prayer.isAnswered
prayer.is_shared        // was: prayer.isShared
prayer.answered_at      // NEW FIELD!
```

---

### Quiz Components

**Changes Needed:**
```typescript
import { Quiz, QuizResult } from './types'

// Add new fields
result.answers          // NEW: Store actual answers
result.result_type      // NEW: e.g., "Physical Touch"
result.result_details   // NEW: Additional data
```

---

## 🔧 Advanced: Create Type Adapters (Optional)

If you want to keep your old field names in components, create adapters:

```typescript
// /utils/typeAdapters.ts

import { DatabaseUser, JournalEntry } from '@/types'

// Adapter for User
export const adaptUser = (dbUser: DatabaseUser) => ({
  ...dbUser,
  name: dbUser.full_name,
  profilePicture: dbUser.avatar_url,
  createdAt: dbUser.created_at,
  updatedAt: dbUser.updated_at,
})

// Adapter for JournalEntry
export const adaptJournalEntry = (dbEntry: JournalEntry) => ({
  ...dbEntry,
  userId: dbEntry.author_id,
  isShared: dbEntry.is_shared,
  createdAt: dbEntry.created_at,
  updatedAt: dbEntry.updated_at,
  entryType: dbEntry.entry_type,
  mediaFiles: dbEntry.media_files,
})

// Usage in component
const user = adaptUser(dbUserData);
console.log(user.name); // Works!
```

**Pros:** Less refactoring needed  
**Cons:** Extra layer, potential confusion

**Recommendation:** Just update to database names (cleaner long-term)

---

## ✅ Verification Checklist

After completing all steps:

- [ ] `/types/index.ts` updated with database types
- [ ] Backup created in `/types/index.backup.ts`
- [ ] All imports using types still work
- [ ] Field name mismatches fixed (name → full_name, etc.)
- [ ] New types added where needed (DailyMood, Notification, etc.)
- [ ] `npm run build` completes without type errors
- [ ] VS Code shows no red squiggles in type usage
- [ ] App still compiles and runs

---

## 🐛 Common Issues & Solutions

### Issue 1: "Property does not exist" errors everywhere

**Cause:** Field name mismatches  
**Solution:** Use find & replace patterns from Step 4

---

### Issue 2: Import errors after type update

**Cause:** Changed export names  
**Solution:** 
```typescript
// If you renamed exports, update imports
import { DatabaseUser } from './types'
// And optionally alias it
import { DatabaseUser as User } from './types'
```

---

### Issue 3: Components expecting old field names

**Cause:** Prop interfaces need updating  
**Solution:**
```typescript
// BEFORE
interface Props {
  user: { name: string; profilePicture: string }
}

// AFTER
interface Props {
  user: { full_name: string; avatar_url: string }
}
```

---

### Issue 4: Mock data doesn't match types

**Cause:** Test data uses old field names  
**Solution:** Update mock data to match schema
```typescript
// BEFORE
const mockUser = { name: 'John', profilePicture: 'url' }

// AFTER
const mockUser = { full_name: 'John', avatar_url: 'url' }
```

---

## 📊 Before vs After

### BEFORE Phase 2:
```typescript
interface User {
  name: string;              // ❌ Doesn't match DB
  profilePicture: string;    // ❌ Doesn't match DB
  createdAt: string;         // ❌ Wrong casing
}

interface JournalEntry {
  userId: string;            // ❌ Should be author_id
  isShared: boolean;         // ❌ Should be is_shared
}

// Missing types
DailyMood                    // ❌ Doesn't exist
Notification                 // ❌ Doesn't exist
Streak                       // ❌ Doesn't exist
```

### AFTER Phase 2:
```typescript
interface DatabaseUser {
  full_name: string;         // ✅ Matches DB
  avatar_url: string;        // ✅ Matches DB
  created_at: string;        // ✅ Correct casing
}

interface JournalEntry {
  author_id: string;         // ✅ Matches DB
  is_shared: boolean;        // ✅ Matches DB
}

// All types exist
DailyMood                    // ✅ Complete type
Notification                 // ✅ Complete type
Streak                       // ✅ Complete type
```

---

## 🎓 What You're Learning

- ✅ How to align TypeScript with database schema
- ✅ Snake_case vs camelCase conventions
- ✅ Type safety benefits
- ✅ Database-first development

---

## ⏱️ Time Breakdown

```
Backup current types          → 2 min
Replace types file            → 5 min
Update imports                → 10 min
Fix field name mismatches     → 20 min
Add missing types             → 10 min
Fix type errors               → 10 min
Update helpers                → 5 min
Test build                    → 5 min
--------------------------------
Total:                          ~67 min
```

---

## 🚀 Next Steps

After Phase 2:
- [ ] All types match database schema
- [ ] No TypeScript errors
- [ ] Ready for Phase 3 (Backend APIs)

**Phase 3 Preview:**  
Implement backend API routes that use these types!

See: `/database/IMPLEMENTATION_ROADMAP.md` → Phase 3

---

## 💾 Rollback If Needed

If something goes wrong:

```bash
# Restore backup
cp /types/index.backup.ts /types/index.ts

# Or revert with git
git checkout /types/index.ts
```

---

**Good luck with Phase 2! Type safety FTW! 🎯**
