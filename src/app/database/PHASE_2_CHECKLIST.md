# Phase 2: TypeScript Types Update - Checklist

Track your progress updating types to match database schema.

---

## 🎯 Goal
Align all TypeScript types with Supabase database schema

**Estimated Time:** 1 hour  
**Status:** [ ] Not Started  [ ] In Progress  [ ] Complete

---

## ✅ Step 1: Backup & Replace Types (7 min)

### Backup Current Types
- [ ] Opened `/types/index.ts`
- [ ] Copied all contents
- [ ] Created `/types/index.backup.ts`
- [ ] Pasted contents into backup file
- [ ] Saved backup file

### Verify New Types
- [ ] Opened `/types/index.ts`
- [ ] Confirmed file was updated with database-aligned types
- [ ] See `User` interface with `full_name` field
- [ ] See `User` interface with `avatar_url` field
- [ ] See new types: `DailyMood`, `Notification`, `Streak`
- [ ] See helper types: `NewUser`, `UpdateUser`

**Time Spent:** _____ min  
**Issues:** None / _________________________

---

## ✅ Step 2: Fix User Field Names (15 min)

Use Find & Replace (Ctrl+Shift+H or Cmd+Shift+H)

### Replace: user.name → user.full_name
- [ ] Searched for: `user.name`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `user.full_name`
- [ ] Total replacements: _____

### Replace: user.profilePicture → user.avatar_url
- [ ] Searched for: `user.profilePicture`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `user.avatar_url`
- [ ] Total replacements: _____

### Replace: profile.name → profile.full_name
- [ ] Searched for: `profile.name`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `profile.full_name`
- [ ] Total replacements: _____

### Replace: profile.profilePicture → profile.avatar_url
- [ ] Searched for: `profile.profilePicture`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `profile.avatar_url`
- [ ] Total replacements: _____

### Replace: partner.name → partner.full_name
- [ ] Searched for: `partner.name`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `partner.full_name`
- [ ] Total replacements: _____

### Replace: partner.profilePicture → partner.avatar_url
- [ ] Searched for: `partner.profilePicture`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `partner.avatar_url`
- [ ] Total replacements: _____

**Time Spent:** _____ min  
**Issues:** None / _________________________

---

## ✅ Step 3: Fix Journal Entry Fields (10 min)

### Replace: entry.userId → entry.author_id
- [ ] Searched for: `entry.userId`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `entry.author_id`
- [ ] Total replacements: _____

### Replace: entry.isShared → entry.is_shared
- [ ] Searched for: `entry.isShared`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `entry.is_shared`
- [ ] Total replacements: _____

### Replace: entry.createdAt → entry.created_at
- [ ] Searched for: `entry.createdAt`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `entry.created_at`
- [ ] Total replacements: _____

### Replace: entry.updatedAt → entry.updated_at
- [ ] Searched for: `entry.updatedAt`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `entry.updated_at`
- [ ] Total replacements: _____

### Replace: entry.entryType → entry.entry_type
- [ ] Searched for: `entry.entryType`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `entry.entry_type`
- [ ] Total replacements: _____

### Replace: entry.mediaFiles → entry.media_files
- [ ] Searched for: `entry.mediaFiles`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `entry.media_files`
- [ ] Total replacements: _____

### Replace: entry.promptId → entry.prompt_id
- [ ] Searched for: `entry.promptId`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `entry.prompt_id`
- [ ] Total replacements: _____

**Time Spent:** _____ min  
**Issues:** None / _________________________

---

## ✅ Step 4: Fix Prayer Request Fields (8 min)

### Replace: prayer.userId → prayer.author_id
- [ ] Searched for: `prayer.userId`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `prayer.author_id`
- [ ] Total replacements: _____

### Replace: prayer.isAnswered → prayer.is_answered
- [ ] Searched for: `prayer.isAnswered`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `prayer.is_answered`
- [ ] Total replacements: _____

### Replace: prayer.isShared → prayer.is_shared
- [ ] Searched for: `prayer.isShared`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `prayer.is_shared`
- [ ] Total replacements: _____

### Replace: prayer.createdAt → prayer.created_at
- [ ] Searched for: `prayer.createdAt`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `prayer.created_at`
- [ ] Total replacements: _____

### Replace: prayer.updatedAt → prayer.updated_at
- [ ] Searched for: `prayer.updatedAt`
- [ ] Reviewed all occurrences
- [ ] Replaced with: `prayer.updated_at`
- [ ] Total replacements: _____

**Time Spent:** _____ min  
**Issues:** None / _________________________

---

## ✅ Step 5: Fix Other Type Fields (10 min)

### Quiz Fields
- [ ] `result.userId` → `result.user_id`
- [ ] `result.quizId` → `result.quiz_id`
- [ ] `result.completedAt` → `result.completed_at`
- [ ] Total replacements: _____

### Group Fields
- [ ] `group.isActive` → `group.is_active`
- [ ] `group.createdAt` → `group.created_at`
- [ ] `member.userId` → `member.user_id`
- [ ] `member.groupId` → `member.group_id`
- [ ] `member.joinedAt` → `member.joined_at`
- [ ] Total replacements: _____

### Milestone Fields
- [ ] `milestone.iconType` → `milestone.icon_type`
- [ ] `milestone.createdAt` → `milestone.created_at`
- [ ] Total replacements: _____

### Devotion Fields
- [ ] `devotion.createdAt` → `devotion.created_at`
- [ ] Total replacements: _____

**Time Spent:** _____ min  
**Issues:** None / _________________________

---

## ✅ Step 6: Add New Type Imports (5 min)

### CoupleDashboard.tsx
- [ ] Added: `import { DailyMood, Streak } from './types'`
- [ ] Updated mood state: `useState<DailyMood | null>(null)`

### NotificationCenter.tsx
- [ ] Added: `import { Notification } from './types'`
- [ ] Updated state: `useState<Notification[]>([])`

### QuestionsSection.tsx / QADiscussionHub.tsx
- [ ] Added: `import { Question, QuestionResponse } from './types'`
- [ ] Updated state types

### Other Components
- [ ] Reviewed all components for type usage
- [ ] Added new type imports where needed

**Time Spent:** _____ min  
**Issues:** None / _________________________

---

## ✅ Step 7: Fix TypeScript Errors (10 min)

### Run Build Check
- [ ] Ran: `npm run build` or `npx tsc --noEmit`
- [ ] Reviewed all TypeScript errors
- [ ] Total errors: _____

### Fix Errors
- [ ] Fixed all "Property does not exist" errors
- [ ] Fixed all type mismatch errors
- [ ] Fixed all interface errors
- [ ] Re-ran build: No errors remaining

### VS Code Check
- [ ] Opened VS Code "Problems" tab
- [ ] Confirmed no red squiggles in components
- [ ] Confirmed no TypeScript errors

**Time Spent:** _____ min  
**Issues:** None / _________________________

---

## ✅ Step 8: Update Component Props (5 min)

### Review Prop Interfaces
- [ ] Checked all component prop interfaces
- [ ] Updated to use new field names
- [ ] Example: `{ user: User }` now expects `full_name` not `name`

### Update Mock Data
- [ ] Updated test/mock data to match new types
- [ ] Example: `{ full_name: 'Test', avatar_url: 'url' }`

**Time Spent:** _____ min  
**Issues:** None / _________________________

---

## ✅ Step 9: Final Verification (5 min)

### Build Check
- [ ] Ran: `npm run build`
- [ ] Build completed successfully
- [ ] No TypeScript errors
- [ ] No warnings about types

### Code Review
- [ ] Searched for remaining old field names:
  - [ ] Searched `.name` - Only valid uses remain
  - [ ] Searched `.profilePicture` - None found
  - [ ] Searched `.userId` - None found (or only in correct contexts)
  - [ ] Searched `.isShared` - None found
  - [ ] Searched `.isAnswered` - None found

### Test Run
- [ ] Started dev server: `npm run dev`
- [ ] App loads without errors
- [ ] No console errors about missing properties
- [ ] Basic navigation works

**Time Spent:** _____ min  
**Issues:** None / _________________________

---

## 📊 Summary Statistics

| Metric | Count |
|--------|-------|
| Total Find & Replace Operations | _____ |
| User Field Updates | _____ |
| Journal Field Updates | _____ |
| Prayer Field Updates | _____ |
| Other Field Updates | _____ |
| Components Modified | _____ |
| TypeScript Errors Fixed | _____ |
| **Total Time Spent** | **_____ min** |

---

## 🎯 Success Criteria

Phase 2 is complete when ALL are checked:

- [ ] `/types/index.ts` uses database field names
- [ ] Backup created at `/types/index.backup.ts`
- [ ] All `user.name` replaced with `user.full_name`
- [ ] All `user.profilePicture` replaced with `user.avatar_url`
- [ ] All journal entry fields use snake_case
- [ ] All prayer request fields use snake_case
- [ ] New types imported where needed (DailyMood, Notification, etc.)
- [ ] `npm run build` completes with no errors
- [ ] No TypeScript errors in VS Code
- [ ] App runs without console errors
- [ ] All components compile successfully

---

## 🐛 Issues Encountered

Document any problems you faced:

### Issue 1:
**Problem:** ___________________________________________  
**Solution:** ___________________________________________  
**Time Lost:** _____ min

### Issue 2:
**Problem:** ___________________________________________  
**Solution:** ___________________________________________  
**Time Lost:** _____ min

### Issue 3:
**Problem:** ___________________________________________  
**Solution:** ___________________________________________  
**Time Lost:** _____ min

---

## 🎉 Completion

**Phase 2 Status:**
- [ ] ✅ COMPLETE - All checks passed!
- [ ] ⚠️ PARTIAL - Some issues remain (document above)
- [ ] ❌ INCOMPLETE - Need to retry

**If Complete:**
→ Read what you accomplished: See summary below  
→ Move to Phase 3: Backend API Implementation  
→ See `/database/IMPLEMENTATION_ROADMAP.md` → Phase 3

**If Partial/Incomplete:**
→ Review issues documented above  
→ Check `/database/PHASE_2_INSTRUCTIONS.md` troubleshooting  
→ Use `/database/PHASE_2_FIELD_MAPPING.md` as reference

---

## 📝 What You Accomplished

When Phase 2 is complete, you have:

✅ Aligned TypeScript types with database schema  
✅ Updated 30+ field name references  
✅ Added 8+ new type definitions  
✅ Fixed all type errors  
✅ Ensured type safety throughout app  
✅ Prepared for backend API integration  

**Benefits:**
- ✅ No more field name confusion
- ✅ TypeScript catches errors at compile time
- ✅ Backend integration will be smooth
- ✅ Code is more maintainable
- ✅ Better IDE autocomplete

---

## 🔄 If You Need to Rollback

```bash
# Restore backup
cp /types/index.backup.ts /types/index.ts

# Or use git
git checkout /types/index.ts

# Then undo component changes
git checkout .
```

---

## 🎓 Lessons Learned

Document key takeaways:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

**Phase 2 Complete! Great job on the type updates! 🎯**

**Next: Phase 3 - Backend API Implementation (6 hours)**

See you in `/database/IMPLEMENTATION_ROADMAP.md`!
