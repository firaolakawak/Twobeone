# 🧪 TwoBeOne API Testing Guide

Quick reference for testing your 33 backend routes!

---

## 🔧 Setup

### Get Your Access Token

**Option 1: Sign up via API**
```bash
curl -X POST http://localhost:54321/functions/v1/make-server-6d579fee/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

**Option 2: Login via Supabase**
```typescript
const { data } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});
const accessToken = data.session.access_token;
```

Save this token - you'll use it in every request!

---

## 📋 All 33 Routes Quick Reference

### 1. Health Check
```bash
GET /make-server-6d579fee/health
# No auth needed
```

### 2. Sign Up
```bash
POST /make-server-6d579fee/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

### 3. Get Profile
```bash
GET /make-server-6d579fee/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 4. Update Profile
```bash
POST /make-server-6d579fee/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "full_name": "Updated Name",
  "bio": "My bio",
  "location": "City, State"
}
```

### 5. Generate Invite Code
```bash
POST /make-server-6d579fee/profile/generate-code
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 6. Link with Partner
```bash
POST /make-server-6d579fee/profile/link-by-code
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "code": "COUPLE1731283..."
}
```

### 7. Create Journal Entry
```bash
POST /make-server-6d579fee/journal
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "My Journal Entry",
  "content": "Today was amazing!",
  "isShared": true,
  "emoji": "😊"
}
```

### 8. Get Journal Entries
```bash
GET /make-server-6d579fee/journal
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 9. Update Journal Entry
```bash
PUT /make-server-6d579fee/journal/{entry_id}
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content"
}
```

### 10. Delete Journal Entry
```bash
DELETE /make-server-6d579fee/journal/{entry_id}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 11. Create Prayer Request
```bash
POST /make-server-6d579fee/prayer
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "Prayer for Strength",
  "description": "Please pray for...",
  "isShared": true
}
```

### 12. Get Prayer Requests
```bash
GET /make-server-6d579fee/prayer
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 13. Update Prayer Request
```bash
PUT /make-server-6d579fee/prayer/{prayer_id}
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "isAnswered": true
}
```

### 14. Delete Prayer Request
```bash
DELETE /make-server-6d579fee/prayer/{prayer_id}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 15. Save Daily Mood
```bash
POST /make-server-6d579fee/moods
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "mood": "great",
  "note": "Feeling blessed today!"
}
```
*Valid moods: great, good, okay, sad*

### 16. Get Moods History
```bash
GET /make-server-6d579fee/moods?days=30
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 17. Create Notification
```bash
POST /make-server-6d579fee/notifications
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "type": "journal",
  "title": "New Entry",
  "message": "Your partner shared a journal entry"
}
```
*Valid types: devotional, prayer, journal, milestone, partner, group, quiz, system*

### 18. Get Notifications
```bash
GET /make-server-6d579fee/notifications?limit=50&unread=true
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 19. Mark Notification as Read
```bash
PATCH /make-server-6d579fee/notifications/{notification_id}/read
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 20. Mark All Notifications as Read
```bash
POST /make-server-6d579fee/notifications/read-all
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 21. Delete Notification
```bash
DELETE /make-server-6d579fee/notifications/{notification_id}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 22. Get Questions
```bash
GET /make-server-6d579fee/questions?category=Faith&active=true
# No auth needed - public endpoint
```
*Categories: Faith, Communication, Love, Dreams, Family, Intimacy, Finance, Conflict*

### 23. Submit Question Response
```bash
POST /make-server-6d579fee/question-responses
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "question_id": "uuid-here",
  "response": "My answer to the question",
  "is_private": false
}
```

### 24. Get Question Responses
```bash
GET /make-server-6d579fee/question-responses?category=Faith
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 25. Get Recent Devotionals
```bash
GET /make-server-6d579fee/devotions?limit=7
# No auth needed - public endpoint
```

### 26. Get Today's Devotional
```bash
GET /make-server-6d579fee/devotions/today
# No auth needed - public endpoint
```

### 27. Mark Devotional Complete
```bash
POST /make-server-6d579fee/devotional-completions
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "devotion_id": "uuid-here",
  "notes": "Great devotional! Learned about..."
}
```

### 28. Get Devotional Completions
```bash
GET /make-server-6d579fee/devotional-completions
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 29. Get User Streaks
```bash
GET /make-server-6d579fee/streaks
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 30. Create Milestone
```bash
POST /make-server-6d579fee/milestones
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "First Date Anniversary",
  "description": "One year since our first date!",
  "date": "2024-11-10",
  "category": "anniversary"
}
```

### 31. Get Milestones
```bash
GET /make-server-6d579fee/milestones
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 32. Delete Milestone
```bash
DELETE /make-server-6d579fee/milestones/{milestone_id}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 🧪 Postman Collection Structure

```
TwoBeOne API
├── Health
│   └── GET Health Check
├── Authentication
│   └── POST Sign Up
├── Profile
│   ├── GET Get Profile
│   ├── POST Update Profile
│   ├── POST Generate Invite Code
│   └── POST Link by Code
├── Journal
│   ├── POST Create Entry
│   ├── GET Get Entries
│   ├── PUT Update Entry
│   └── DELETE Delete Entry
├── Prayer
│   ├── POST Create Prayer
│   ├── GET Get Prayers
│   ├── PUT Update Prayer
│   └── DELETE Delete Prayer
├── Moods
│   ├── POST Save Mood
│   └── GET Get Moods
├── Notifications
│   ├── POST Create Notification
│   ├── GET Get Notifications
│   ├── PATCH Mark as Read
│   ├── POST Mark All Read
│   └── DELETE Delete Notification
├── Questions
│   ├── GET Get Questions
│   ├── POST Submit Response
│   └── GET Get Responses
├── Devotionals
│   ├── GET Get Devotionals
│   ├── GET Get Today
│   ├── POST Mark Complete
│   └── GET Get Completions
├── Streaks
│   └── GET Get Streaks
└── Milestones
    ├── POST Create Milestone
    ├── GET Get Milestones
    └── DELETE Delete Milestone
```

---

## 🎯 Testing Workflow

### **Step 1: Test Core Auth**
1. Health check ✅
2. Sign up new user ✅
3. Get profile ✅
4. Update profile ✅

### **Step 2: Test Couple Linking**
1. User A generates code ✅
2. User B signs up ✅
3. User B links with code ✅
4. Both users get profile (should see partner) ✅

### **Step 3: Test Journal**
1. User A creates entry (shared) ✅
2. User B gets entries (should see A's entry) ✅
3. User B creates own entry ✅
4. User A updates their entry ✅
5. User A deletes their entry ✅

### **Step 4: Test Prayer**
1. User A creates prayer ✅
2. User B gets prayers (should see A's) ✅
3. User B marks prayer as answered ✅
4. User A sees it's answered ✅

### **Step 5: Test New Features**
1. User A saves mood ✅
2. User B saves mood ✅
3. Both get moods (should see both) ✅
4. Get questions ✅
5. Submit Q&A response ✅
6. Get today's devotional ✅
7. Mark devotional complete ✅
8. Check streaks ✅
9. Create milestone ✅
10. Get milestones ✅

---

## ✅ Expected Results

### **Success Response Example**
```json
{
  "success": true,
  "entry": {
    "id": "uuid-here",
    "title": "My Journal Entry",
    "content": "Today was amazing!",
    "is_shared": true,
    "author_id": "user-uuid",
    "created_at": "2025-11-10T12:00:00Z"
  }
}
```

### **List Response Example**
```json
{
  "entries": [
    {
      "id": "uuid-1",
      "title": "Entry 1",
      "content": "...",
      "isPartner": false
    },
    {
      "id": "uuid-2",
      "title": "Partner's Entry",
      "content": "...",
      "isPartner": true
    }
  ]
}
```

### **Error Response Example**
```json
{
  "error": "Unauthorized"
}
```

---

## 🐛 Common Issues

### Issue 1: "Unauthorized"
**Cause:** Missing or invalid access token  
**Fix:** Get fresh token from login/signup

### Issue 2: "Invalid invite code"
**Cause:** Code doesn't exist or already used  
**Fix:** Generate new code

### Issue 3: "PGRST116"
**Cause:** Record not found  
**Fix:** Normal - means no data exists yet

### Issue 4: Empty results
**Cause:** No data created yet  
**Fix:** Create some test data first

---

## 📊 Data Verification

### **Check in Supabase UI**

1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select table (e.g., `journal_entries`)
4. Verify your test data appears
5. Check timestamps are correct
6. Verify `author_id` matches your user ID

---

## 🎉 You're Ready to Test!

Use this guide to test all 33 routes and verify your backend is working perfectly!

**Happy Testing!** 🚀
