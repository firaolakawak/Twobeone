# 🚀 Phase 2 Quick Start

**Goal:** Update TypeScript types to match database  
**Time:** 1 hour  
**Difficulty:** Medium

---

## ✅ Prerequisites

Before starting:
- [x] Phase 1 complete (database updated)
- [x] `/types/index.ts` file exists
- [x] Basic TypeScript knowledge
- [x] Code editor with find & replace (VS Code recommended)

---

## 🎯 What You'll Do

Update your TypeScript types from:
```typescript
// OLD (doesn't match database)
interface User {
  name: string;               // ❌
  profilePicture: string;     // ❌
  createdAt: string;          // ❌
}
```

To:
```typescript
// NEW (matches database)
interface User {
  full_name: string | null;   // ✅
  avatar_url: string | null;  // ✅
  created_at: string;         // ✅
}
```

---

## ⚡ Quick Method (30 min)

### Step 1: Types Already Updated! ✅
Good news - `/types/index.ts` was already updated with correct types in Phase 1!

Check it:
```bash
cat /types/index.ts | grep "full_name"
# Should show: full_name: string | null;
```

---

### Step 2: Update Components (25 min)

Use Find & Replace in VS Code (`Ctrl+Shift+H`):

**Priority 1: User Fields (10 min)**
```
Find: user.name          → Replace: user.full_name
Find: user.profilePicture → Replace: user.avatar_url
Find: profile.name       → Replace: profile.full_name
Find: profile.profilePicture → Replace: profile.avatar_url
```

**Priority 2: Journal Fields (8 min)**
```
Find: entry.userId       → Replace: entry.author_id
Find: entry.isShared     → Replace: entry.is_shared
Find: entry.createdAt    → Replace: entry.created_at
Find: entry.entryType    → Replace: entry.entry_type
```

**Priority 3: Prayer Fields (5 min)**
```
Find: prayer.userId      → Replace: prayer.author_id
Find: prayer.isAnswered  → Replace: prayer.is_answered
Find: prayer.isShared    → Replace: prayer.is_shared
```

**⚠️ Review each replacement before applying!**

---

### Step 3: Fix Build Errors (5 min)

```bash
# Check for errors
npm run build

# Fix any remaining issues
# Usually just field name mismatches
```

---

## 📋 Detailed Method (60 min)

For thorough updates, follow:

1. **Read:** [PHASE_2_INSTRUCTIONS.md](PHASE_2_INSTRUCTIONS.md)
2. **Use:** [PHASE_2_CHECKLIST.md](PHASE_2_CHECKLIST.md)
3. **Reference:** [PHASE_2_FIELD_MAPPING.md](PHASE_2_FIELD_MAPPING.md)

---

## 🔍 Find & Replace Tips

### VS Code Keyboard Shortcuts
- `Ctrl+Shift+F` - Search across all files
- `Ctrl+Shift+H` - Find & Replace across all files
- `Ctrl+H` - Find & Replace in current file

### Search Patterns

**To find all "At" fields:**
```regex
\.(\w+)At\b
```

**To find all "Id" fields:**
```regex
\.(\w+)Id\b
```

**⚠️ Use carefully!** Review each match.

---

## 📊 Component Priority

Update in this order:

1. **CoupleDashboard.tsx** - Most field usage
2. **ProfileSettings.tsx** - User profile
3. **EnhancedJournal.tsx** - Journal entries
4. **CollaborativeJournal.tsx** - Shared journal
5. **PrayerBoard.tsx** - Prayer requests
6. **PrayerSection.tsx** - Prayer section
7. Quiz components - Quiz types
8. Group components - Group types
9. Other components - As needed

---

## ✅ Quick Verification

After updates, verify:

### Check 1: Build
```bash
npm run build
# Should succeed with no TypeScript errors
```

### Check 2: Types File
```bash
grep "full_name" /types/index.ts
# Should find the field

grep "avatar_url" /types/index.ts
# Should find the field

grep "DailyMood" /types/index.ts
# Should find the type
```

### Check 3: No Old Fields
```bash
# Should find very few (or zero) results:
grep -r "\.name\b" src/components/
grep -r "\.profilePicture" src/components/
grep -r "\.userId" src/components/
```

---

## 🐛 Common Issues

### Issue: "Property 'name' does not exist"
**Solution:** Change to `full_name`

### Issue: "Property 'profilePicture' does not exist"
**Solution:** Change to `avatar_url`

### Issue: "Property 'userId' does not exist"
**Solution:** Change to `author_id` or `user_id` (context-dependent)

### Issue: Many similar errors
**Solution:** Use find & replace patterns above

---

## 📝 Checklist

- [ ] Types file already has database fields
- [ ] Updated `user.name` → `user.full_name`
- [ ] Updated `user.profilePicture` → `user.avatar_url`
- [ ] Updated `entry.userId` → `entry.author_id`
- [ ] Updated `entry.isShared` → `entry.is_shared`
- [ ] Updated `prayer.userId` → `prayer.author_id`
- [ ] Updated `prayer.isAnswered` → `prayer.is_answered`
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors in VS Code

---

## 🎯 Success = This Works

```typescript
import { User, JournalEntry, DailyMood } from './types';

// ✅ All type-safe and matches database!
const user: User = {
  id: '...',
  email: 'sarah@example.com',
  full_name: 'Sarah Johnson',      // Not 'name'
  avatar_url: 'https://...',       // Not 'profilePicture'
  created_at: '2025-11-10T...',    // Not 'createdAt'
  // ... other fields
};

const entry: JournalEntry = {
  id: '...',
  author_id: user.id,              // Not 'userId'
  is_shared: true,                 // Not 'isShared'
  entry_type: 'journal',           // Not 'entryType'
  created_at: '2025-11-10T...',    // Not 'createdAt'
  // ... other fields
};

const mood: DailyMood = {
  id: '...',
  user_id: user.id,
  couple_id: '...',
  mood: 'great',                   // Type-safe enum!
  date: '2025-11-10',
  created_at: '2025-11-10T...'
};
```

---

## 🚀 After Phase 2

You'll be ready to:
- ✅ Implement backend APIs with type safety
- ✅ No field name confusion
- ✅ Frontend/backend alignment
- ✅ Smooth Phase 3 integration

---

## 📚 Resources

- [PHASE_2_INSTRUCTIONS.md](PHASE_2_INSTRUCTIONS.md) - Full guide
- [PHASE_2_CHECKLIST.md](PHASE_2_CHECKLIST.md) - Track progress
- [PHASE_2_FIELD_MAPPING.md](PHASE_2_FIELD_MAPPING.md) - Field reference
- [PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md) - What you accomplished

---

## ⏱️ Time Estimate

```
Quick Method:     30 min
Detailed Method:  60 min
With Issues:      90 min
```

---

**Ready to start? Open VS Code and begin with user fields!** 🎯

**After:** Move to Phase 3 (Backend APIs) - See [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)
