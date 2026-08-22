# Phase 3: Backend API Implementation - Checklist

Track your progress implementing backend routes.

---

## 🎯 Goal
Migrate from KV store to Supabase database and add missing APIs

**Estimated Time:** 6-8 hours  
**Status:** [ ] Not Started  [ ] In Progress  [ ] Complete

---

## ✅ Stage 1: Core Data Migration (2-3 hours)

### 1.1 Users & Authentication
- [ ] Reviewed current auth routes
- [ ] Updated GET /profile to use `users` table
- [ ] Updated POST /profile to use `users` table
- [ ] Fixed field names (name → full_name, profilePicture → avatar_url)
- [ ] Tested profile retrieval
- [ ] Tested profile updates
- [ ] Verified RLS policies allow access

**Time Spent:** _____ min  
**Issues:** _________________________

---

### 1.2 Couple Linking
- [ ] Updated generate-code route to use `couples` table
- [ ] Updated link-by-code route to use `couples` table
- [ ] Implemented bidirectional partner_id updates
- [ ] Tested invite code generation
- [ ] Tested linking via code
- [ ] Verified both partners are connected

**Time Spent:** _____ min  
**Issues:** _________________________

---

### 1.3 Journal Entries
- [ ] Updated POST /journal to use `journal_entries` table
- [ ] Updated GET /journal to query database
- [ ] Updated PUT /journal/:id for updates
- [ ] Updated DELETE /journal/:id
- [ ] Fixed field names (userId → author_id, isShared → is_shared)
- [ ] Tested creating entries
- [ ] Tested retrieving own entries
- [ ] Tested retrieving partner's shared entries
- [ ] Tested updating entries
- [ ] Tested deleting entries

**Time Spent:** _____ min  
**Issues:** _________________________

---

### 1.4 Prayer Requests
- [ ] Updated POST /prayer to use `prayer_requests` table
- [ ] Updated GET /prayer to query database
- [ ] Updated PUT /prayer/:id for updates
- [ ] Updated DELETE /prayer/:id
- [ ] Fixed field names (userId → author_id, isAnswered → is_answered)
- [ ] Tested creating prayers
- [ ] Tested retrieving own prayers
- [ ] Tested retrieving partner's prayers
- [ ] Tested marking as answered
- [ ] Tested deleting prayers

**Time Spent:** _____ min  
**Issues:** _________________________

---

## ✅ Stage 2: New Features (3-4 hours)

### 2.1 Daily Moods API
- [ ] Implemented POST /moods (create/update mood)
- [ ] Implemented GET /moods (retrieve moods)
- [ ] Used UPSERT for single mood per day
- [ ] Added validation for mood values
- [ ] Tested creating today's mood
- [ ] Tested updating today's mood
- [ ] Tested retrieving last 30 days
- [ ] Tested retrieving partner's moods

**Time Spent:** _____ min  
**Issues:** _________________________

---

### 2.2 Notifications API
- [ ] Implemented POST /notifications (create notification)
- [ ] Implemented GET /notifications (list notifications)
- [ ] Implemented PATCH /notifications/:id/read (mark as read)
- [ ] Implemented POST /notifications/read-all (mark all read)
- [ ] Implemented DELETE /notifications/:id
- [ ] Added validation for notification types
- [ ] Tested creating notifications
- [ ] Tested retrieving unread notifications
- [ ] Tested marking as read
- [ ] Tested deleting notifications

**Time Spent:** _____ min  
**Issues:** _________________________

---

### 2.3 Questions & Responses API
- [ ] Implemented GET /questions (fetch questions)
- [ ] Implemented POST /question-responses (submit response)
- [ ] Implemented GET /question-responses (get responses)
- [ ] Added category filtering
- [ ] Added privacy controls (is_private)
- [ ] Tested fetching all questions
- [ ] Tested filtering by category
- [ ] Tested submitting response
- [ ] Tested updating response
- [ ] Tested viewing partner's non-private responses

**Time Spent:** _____ min  
**Issues:** _________________________

---

### 2.4 Devotionals & Completions
- [ ] Implemented GET /devotions (list devotions)
- [ ] Implemented GET /devotions/today (today's devotion)
- [ ] Implemented POST /devotional-completions (mark complete)
- [ ] Implemented GET /devotional-completions (list completions)
- [ ] Tested fetching recent devotions
- [ ] Tested fetching today's devotion
- [ ] Tested marking devotion complete
- [ ] Tested viewing completion history

**Time Spent:** _____ min  
**Issues:** _________________________

---

### 2.5 Streaks
- [ ] Implemented updateStreak helper function
- [ ] Implemented GET /streaks (get user's streaks)
- [ ] Added streak calculation logic (consecutive days)
- [ ] Integrated with devotional completions
- [ ] Tested devotional streak tracking
- [ ] Tested streak breaking (gap in days)
- [ ] Tested longest streak calculation

**Time Spent:** _____ min  
**Issues:** _________________________

---

## ✅ Stage 3: Advanced Features (1-2 hours)

### 3.1 Milestones
- [ ] Implemented POST /milestones (create milestone)
- [ ] Implemented GET /milestones (list milestones)
- [ ] Implemented DELETE /milestones/:id
- [ ] Added couple_id association
- [ ] Added media_url support
- [ ] Added category support
- [ ] Tested creating milestone
- [ ] Tested viewing couple's milestones
- [ ] Tested deleting milestone

**Time Spent:** _____ min  
**Issues:** _________________________

---

### 3.2 Journal Comments (Optional)
- [ ] Implemented POST /journal/:id/comments (add comment)
- [ ] Implemented GET /journal/:id/comments (get comments)
- [ ] Implemented DELETE /journal/comments/:id
- [ ] Tested adding comments
- [ ] Tested viewing comments
- [ ] Tested deleting own comments

**Time Spent:** _____ min  
**Issues:** _________________________

---

### 3.3 Prayer Updates (Optional)
- [ ] Implemented POST /prayer/:id/updates (add update)
- [ ] Implemented GET /prayer/:id/updates (get updates)
- [ ] Added update_type support (update, answered, praise)
- [ ] Tested adding prayer updates
- [ ] Tested viewing update history
- [ ] Tested different update types

**Time Spent:** _____ min  
**Issues:** _________________________

---

## ✅ Testing & Verification

### API Testing
- [ ] Tested all routes with Postman/Thunder Client
- [ ] Verified auth tokens work correctly
- [ ] Verified RLS policies don't block queries
- [ ] Verified error messages are helpful
- [ ] Tested rate limiting (if applicable)

### Database Verification
- [ ] Confirmed data appears in Supabase Table Editor
- [ ] Verified foreign keys are correct
- [ ] Verified timestamps are set correctly
- [ ] Verified UUIDs are generated correctly
- [ ] No orphaned records

### Security Verification
- [ ] Users can only access their own data
- [ ] Partners can see each other's shared data
- [ ] Private data stays private
- [ ] Auth required for all protected routes
- [ ] No SQL injection vulnerabilities

### Performance
- [ ] Queries use indexes effectively
- [ ] No N+1 query problems
- [ ] Reasonable response times (<500ms)
- [ ] Proper pagination where needed

---

## 📊 Summary Statistics

| Metric | Count |
|--------|-------|
| Routes Implemented | _____ / 30+ |
| Tables Connected | _____ / 20 |
| Features Working | _____ / 12 |
| Tests Passed | _____ |
| Bugs Fixed | _____ |
| **Total Time** | **_____ hours** |

---

## 🎯 Success Criteria

Phase 3 is complete when ALL are checked:

- [ ] All core routes migrated from KV to database
- [ ] All new feature routes implemented
- [ ] Auth works correctly
- [ ] Partner linking works
- [ ] Journal CRUD works
- [ ] Prayer CRUD works
- [ ] Moods API works
- [ ] Notifications API works
- [ ] Questions API works
- [ ] Devotions API works
- [ ] Streaks tracking works
- [ ] All routes tested manually
- [ ] No critical bugs
- [ ] Server starts without errors
- [ ] Database queries are efficient

---

## 🐛 Issues Encountered

### Issue 1:
**Route:** _____________________  
**Problem:** ___________________________________________  
**Error:** ___________________________________________  
**Solution:** ___________________________________________  
**Time Lost:** _____ min

### Issue 2:
**Route:** _____________________  
**Problem:** ___________________________________________  
**Error:** ___________________________________________  
**Solution:** ___________________________________________  
**Time Lost:** _____ min

### Issue 3:
**Route:** _____________________  
**Problem:** ___________________________________________  
**Error:** ___________________________________________  
**Solution:** ___________________________________________  
**Time Lost:** _____ min

---

## 🔧 Common Fixes Applied

Document patterns you used to fix recurring issues:

### Pattern 1: RLS Policy Issues
```sql
-- Solution that worked:


```

### Pattern 2: Field Name Mismatches
```typescript
// What I changed:


```

### Pattern 3: Query Optimization
```typescript
// How I optimized:


```

---

## 📝 Notes for Phase 4

Things to remember when connecting UI:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## 🎉 Completion

**Phase 3 Status:**
- [ ] ✅ COMPLETE - All routes working!
- [ ] ⚠️ PARTIAL - Some routes incomplete (document above)
- [ ] ❌ INCOMPLETE - Major issues (retry)

**If Complete:**
→ Read [PHASE_3_COMPLETE.md](/database/PHASE_3_COMPLETE.md)  
→ Move to Phase 4: Connect UI to Backend  
→ See [IMPLEMENTATION_ROADMAP.md](/database/IMPLEMENTATION_ROADMAP.md) → Phase 4

**If Partial/Incomplete:**
→ Review issues documented above  
→ Check [PHASE_3_INSTRUCTIONS.md](/database/PHASE_3_INSTRUCTIONS.md)  
→ Test failing routes with Postman  
→ Check Supabase logs for errors

---

## 📈 Progress Tracking

Use this to track daily progress:

### Day 1:
**Date:** ___________  
**Time:** _____ hours  
**Completed:** _________________________  
**Remaining:** _________________________

### Day 2:
**Date:** ___________  
**Time:** _____ hours  
**Completed:** _________________________  
**Remaining:** _________________________

### Day 3:
**Date:** ___________  
**Time:** _____ hours  
**Completed:** _________________________  
**Remaining:** _________________________

---

**Keep going! You're building a production backend! 🚀**
