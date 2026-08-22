# TwoBeOne - Testing & Validation Guide

## 🎯 Testing Objective
Validate all critical user flows to ensure the app works end-to-end.

---

## 📋 Critical User Flows to Test

### **Flow 1: New User Sign Up** ⭐ CRITICAL
**Goal:** Create a new user account and verify profile creation

**Steps:**
1. Open app (should show splash → auth page)
2. Click "Sign Up" tab
3. Enter email, password, and name
4. Submit sign up
5. Verify auto-login after sign up

**Expected Results:**
- ✅ User is created in Supabase Auth
- ✅ Profile auto-created with invite code
- ✅ User is logged in automatically
- ✅ Dashboard loads with user's name
- ✅ Invite code is visible in settings/profile

**What to Check:**
- Console logs show: "User created: { userId, email, name, inviteCode }"
- No errors in console
- Profile loads without "Profile not found" error

---

### **Flow 2: Partner Linking via Invite Code** ⭐ CRITICAL
**Goal:** Two users connect as a couple

**Setup:**
- You need 2 separate browser sessions or incognito windows
- User A already signed up
- User B will sign up and link

**Steps:**
1. **User A:** Get invite code from Settings/Profile
2. **User B:** Sign up with different email
3. **User B:** Navigate to Settings/Profile
4. **User B:** Enter User A's invite code and click "Connect"
5. Verify both users see each other as partners

**Expected Results:**
- ✅ Couple record created (`couple:${coupleId}`)
- ✅ Both users have `partnerId` and `coupleId`
- ✅ User A sees User B's name as partner
- ✅ User B sees User A's name as partner
- ✅ Shared content is now visible

**What to Check:**
- Console shows: "Couple created! CoupleId: xxx"
- Both profiles show partner name
- No "Profile not found" errors

---

### **Flow 3: Daily Devotional** ⭐ CRITICAL
**Goal:** Complete a devotional and track streak

**Steps:**
1. Go to Dashboard
2. Click on Daily Devotional card
3. Read devotional content
4. Click "Mark as Complete"
5. Check streak counter

**Expected Results:**
- ✅ Devotional marked complete
- ✅ Streak counter increments
- ✅ Completion saved to backend
- ✅ Can't complete same devotional twice today

**What to Check:**
- API call to `/devotional-completions` succeeds
- Streak shows correct number
- UI updates immediately

---

### **Flow 4: Shared Journal Entry** ⭐ CRITICAL
**Goal:** User creates journal, partner sees it and comments

**Steps:**
1. **User A:** Navigate to Journal section
2. **User A:** Create new journal entry
3. **User A:** Mark as "Shared with partner"
4. **User A:** Submit entry
5. **User B:** Refresh/navigate to Journal
6. **User B:** See User A's shared entry
7. **User B:** Add a comment to the entry

**Expected Results:**
- ✅ User A's entry saved with `isShared: true`
- ✅ User B sees entry in their journal feed
- ✅ User B can add comment
- ✅ User A sees partner's comment on their entry

**What to Check:**
- API: `POST /journal` succeeds
- API: `GET /journal` returns both user and partner entries
- API: `PUT /journal/:id` adds partner comment
- Console shows shared entries with `isPartner: true`

---

### **Flow 5: Prayer Request & Sharing** ⭐ CRITICAL
**Goal:** Create prayer and partner can view it

**Steps:**
1. **User A:** Navigate to Prayer Board
2. **User A:** Create new prayer request
3. **User A:** Submit prayer
4. **User B:** Navigate to Prayer Board
5. **User B:** See User A's prayer
6. **User A:** Mark prayer as answered

**Expected Results:**
- ✅ Prayer saved to backend
- ✅ Partner sees prayer in their board
- ✅ Prayer can be marked as answered
- ✅ Status updates in real-time

**What to Check:**
- API: `POST /prayer` succeeds
- API: `GET /prayer` returns both user and partner prayers
- Partner prayers marked with `isPartner: true`

---

### **Flow 6: Daily Question - Side by Side Responses**
**Goal:** Both partners answer the same question and see each other's response

**Steps:**
1. **User A:** Navigate to Daily Question
2. **User A:** Submit response to question
3. **User B:** Navigate to Daily Question (same question)
4. **User B:** Submit response
5. **Both:** View side-by-side responses

**Expected Results:**
- ✅ Both responses saved independently
- ✅ User A sees own response + User B's response
- ✅ User B sees own response + User A's response
- ✅ Responses display side-by-side

**What to Check:**
- API: `POST /question-responses` for both users
- API: `GET /question-responses` returns both responses
- UI shows "Your Answer" and "Partner's Answer"

---

### **Flow 7: Q&A Discussion System**
**Goal:** Answer multi-type questions and see compatibility

**Steps:**
1. Navigate to Q&A Hub
2. Select a category (e.g., "Faith & Spirituality")
3. Answer a multiple-choice question
4. Answer a rating question
5. Answer a ranking question
6. View results with partner
7. Check compatibility percentage

**Expected Results:**
- ✅ All question types work (7 types)
- ✅ Responses saved correctly
- ✅ Partner responses visible
- ✅ Compatibility % calculated

**What to Check:**
- API: `GET /questions` returns active questions
- API: `POST /questions/:id/responses` saves responses
- API: `GET /questions/:id/responses` returns both responses
- Compatibility matching works

---

### **Flow 8: Bible Verse Highlight & Share**
**Goal:** Highlight a verse and share with partner

**Steps:**
1. Navigate to Bible Reader
2. Select a book, chapter
3. Highlight a verse
4. Save highlight
5. Share verse with partner
6. **Partner:** Check notifications for shared verse

**Expected Results:**
- ✅ Highlight saved to backend
- ✅ Share creates notification for partner
- ✅ Partner receives notification
- ✅ Highlights viewable in saved list

**What to Check:**
- API: `POST /highlight` saves highlight
- API: `POST /share-verse` creates notification
- API: `GET /notifications` shows shared verse notification

---

### **Flow 9: Learning Module Completion**
**Goal:** Complete a lesson and track progress

**Steps:**
1. Navigate to Learning Modules
2. Select a module
3. Start a lesson
4. Save lesson notes
5. Mark lesson as complete
6. View progress

**Expected Results:**
- ✅ Notes saved and shareable with partner
- ✅ Lesson marked complete
- ✅ Progress percentage updates
- ✅ Partner can see shared notes

**What to Check:**
- API: `POST /modules/:mId/lessons/:lId/notes`
- API: `POST /modules/:mId/lessons/:lId/complete`
- API: `GET /modules/:mId/progress`

---

### **Flow 10: Admin Panel - Content Management** ⭐ ADMIN
**Goal:** Admin can create and manage content

**Steps:**
1. Open Admin Panel (check access)
2. Navigate to Devotionals tab
3. Create new devotional
4. Edit devotional
5. Delete devotional
6. Repeat for Questions, Modules, Groups

**Expected Results:**
- ✅ Can create new content
- ✅ Can edit existing content
- ✅ Can delete content
- ✅ Changes reflect immediately
- ✅ Stats update correctly

**What to Check:**
- API: `POST /admin/devotionals`
- API: `PUT /admin/devotionals/:id`
- API: `DELETE /admin/devotionals/:id`
- API: `GET /admin/stats` shows correct numbers

---

### **Flow 11: Notifications System**
**Goal:** Receive and manage notifications

**Steps:**
1. Trigger notification (partner shares verse, comments on journal, etc.)
2. Check notification center
3. View notification
4. Mark as read
5. Delete notification

**Expected Results:**
- ✅ Notification appears in list
- ✅ Toast notification shows on screen
- ✅ Can mark as read
- ✅ Can delete notification
- ✅ Unread count updates

**What to Check:**
- Real-time polling works
- Toast notifications appear
- Badge count accurate

---

### **Flow 12: Prayer Together Chat**
**Goal:** Real-time messaging between partners

**Steps:**
1. **User A:** Navigate to Prayer Together
2. **User A:** Send a message
3. **User B:** Navigate to Prayer Together
4. **User B:** See message appear
5. **User B:** Reply to message
6. **User A:** See reply

**Expected Results:**
- ✅ Messages saved in order
- ✅ Both users see full conversation
- ✅ Timestamps accurate
- ✅ User names displayed correctly

**What to Check:**
- API: `POST /devotions/:id/prayer-chat`
- API: `GET /devotions/:id/prayer-chat`
- Messages sorted by timestamp

---

## 🐛 Common Issues to Look For

### **Profile Issues**
- [ ] "Profile not found" errors
- [ ] Missing invite code
- [ ] Profile not auto-created after sign up

### **Couple Linking Issues**
- [ ] User has `partnerId` but no `coupleId`
- [ ] One-way linking (only one user linked)
- [ ] Invalid invite code error

### **Data Sharing Issues**
- [ ] Partner content not visible
- [ ] Shared flag not working
- [ ] Permission errors

### **API Issues**
- [ ] 401 Unauthorized errors
- [ ] 404 Not found errors
- [ ] 500 Server errors
- [ ] Missing access tokens

---

## ✅ Testing Checklist

### **Pre-Testing Setup**
- [ ] Backend server is running (`Deno.serve(app.fetch)`)
- [ ] Supabase credentials configured
- [ ] Console is open (F12) to view logs
- [ ] Network tab open to monitor API calls

### **Authentication Tests**
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Sign out
- [ ] Auto-login on refresh
- [ ] Token refresh works

### **Couple Features Tests**
- [ ] Generate invite code
- [ ] Link via invite code
- [ ] Both users see partner name
- [ ] Shared content visible to both

### **Content Creation Tests**
- [ ] Create journal entry
- [ ] Create prayer request
- [ ] Create mood entry
- [ ] Answer daily question
- [ ] Complete devotional

### **Partner Interaction Tests**
- [ ] Partner sees shared journal
- [ ] Partner comments on journal
- [ ] Partner sees prayers
- [ ] Partner sees moods
- [ ] Partner sees question responses

### **Bible Features Tests**
- [ ] Open Bible reader
- [ ] Navigate chapters
- [ ] Highlight verse
- [ ] Save highlight
- [ ] Share verse with partner

### **Admin Tests**
- [ ] Access admin panel
- [ ] Create devotional
- [ ] Create question
- [ ] Create module
- [ ] View statistics

### **Notification Tests**
- [ ] Receive notification
- [ ] Toast appears
- [ ] Mark as read
- [ ] Delete notification

---

## 🚨 Critical Bugs to Fix Immediately

If you encounter these, we need to fix them:

1. **Users can't sign up** → Auth system broken
2. **Profile not created** → Auto-fix logic not working
3. **Couple not created** → Linking flow broken
4. **Partner content not visible** → Query logic issue
5. **Admin panel not accessible** → Routing issue

---

## 📊 Success Criteria

Your app passes validation if:

- ✅ 2 users can sign up independently
- ✅ Users can link as a couple via invite code
- ✅ Both users see each other's shared content
- ✅ Daily devotionals can be completed
- ✅ Journal/prayer sharing works
- ✅ Notifications are delivered
- ✅ Admin panel functions correctly
- ✅ No critical console errors

---

## 🎯 Ready to Test!

**Let's start with Flow 1: New User Sign Up**

I'll guide you through each step and help you validate the results!
