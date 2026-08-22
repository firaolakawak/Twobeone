# Q&A Partner Response Testing Instructions

## 🎯 Goal
Test that partner responses are properly saved, fetched, and displayed in the Q&A system.

## ✅ What We Fixed

### 1. **Response Storage Structure**
- ✅ Added `id` field to response data (contains the storage key)
- ✅ Responses now store: `{id, userId, questionId, coupleId, answers, createdAt, updatedAt}`
- ✅ Storage key format: `question-response:{userId}:{questionId}`

### 2. **Clear All Responses Endpoint**
- ✅ Fixed AlertDialog trigger with `asChild` prop
- ✅ Fixed `getSupabase()` client initialization
- ✅ Properly queries database to get keys and values
- ✅ Uses `mdel()` to efficiently delete all responses at once

### 3. **Enhanced Logging**
- ✅ Detailed logging when saving responses (with coupleId)
- ✅ Comprehensive logging when fetching responses
- ✅ Shows exact keys being queried
- ✅ Shows partner identification logic
- ✅ Shows what's found vs not found

## 🧪 Testing Steps

### Step 1: Clear All Existing Responses
1. Go to the **Debug Responses** screen
2. Click **"Clear All Responses"** button
3. Confirm the deletion in the dialog
4. Wait for success toast
5. Click **Refresh** to verify count is 0

### Step 2: Verify Users Are Coupled
In the Debug Responses screen, check:
- [ ] Two users exist
- [ ] Both users have the same `coupleId`
- [ ] A couple exists with both user IDs as `partner1Id` and `partner2Id`

### Step 3: Answer Questions as User 1
1. **Sign out** if signed in
2. **Sign in as User 1** (e.g., Lensa)
3. Go to **Know Each Other** → Pick a category
4. Answer **2-3 questions** completely
5. Watch the console logs - you should see:
   ```
   [Save Q&A Response] User: {userId}, Question: {questionId}
   [Save Q&A Response] User data: { coupleId: 'xxx' }
   [Save Q&A Response] ✅ Saved successfully with key: question-response:{userId}:{questionId}
   ```

### Step 4: Check Debug Screen (Still as User 1)
1. Go to **Debug Responses** screen
2. Verify you see your responses
3. Each response should show:
   - **Storage Key**: `question-response:{userId}:{questionId}`
   - **User ID**: Your user ID
   - **Couple ID**: Your couple ID (should match your profile)
   - **Answers**: Your actual answers

### Step 5: Answer Same Questions as User 2
1. **Sign out**
2. **Sign in as User 2** (e.g., David)
3. Go to **Know Each Other** → Same category
4. Answer the **SAME questions** that User 1 answered
5. Watch console logs again

### Step 6: View Partner Responses as User 1
1. **Sign out**
2. **Sign in as User 1** again
3. Go to **Know Each Other** → Same category
4. View the questions you both answered
5. **Expected behavior:**
   - ✅ You should see YOUR answers
   - ✅ You should see PARTNER'S name and answers
   - ✅ Match percentage should calculate
   - ✅ No more "Lensa hasn't answered this question yet"

### Step 7: Check Console Logs
When viewing a question, check console for:
```
========== [Q&A Responses] START ==========
[Q&A Responses] Question ID: xxx
[Q&A Responses] Current User ID: {yourId}
[Q&A Responses] User response key: question-response:{yourId}:{questionId}
[Q&A Responses] User response: ✅ FOUND
[Q&A Responses] User coupleId from profile: {coupleId}
[Q&A Responses] Couple found: ✅ YES
[Q&A Responses] Identified Partner ID: {partnerId}
[Q&A Responses] Partner response key: question-response:{partnerId}:{questionId}
[Q&A Responses] Partner response: ✅ FOUND
[Q&A Responses] Partner response answers: ['answer1', 'answer2', ...]
[Q&A Responses] Final result: { hasUserResponse: true, hasPartnerResponse: true }
========== [Q&A Responses] END ==========
```

## 🐛 What to Look For

### ✅ Success Indicators
- Both users can save responses
- Responses include `coupleId` in storage
- Partner responses are found when queried
- Partner name and answers display correctly
- Match percentage calculates
- Debug screen shows all responses with correct couple IDs

### ❌ Failure Indicators
- "Partner hasn't answered" message still appears
- Partner response shows as "❌ NOT FOUND" in logs
- Responses saved without `coupleId` (shows NULL in logs)
- Users don't have matching `coupleId` in their profiles

## 🔍 Troubleshooting

### If Partner Response Still Not Showing:

1. **Check if users are coupled:**
   - Debug screen → Users section
   - Both users should have same `coupleId`

2. **Check response storage:**
   - Debug screen → Responses section
   - Each response should have a `coupleId`
   - Should match the user's profile `coupleId`

3. **Check console logs:**
   - Look for "Partner response: ❌ NOT FOUND"
   - Check what keys are being queried
   - Verify partner ID is correctly identified

4. **Verify both answered same question:**
   - Each question has unique ID
   - Both partners must answer the same question ID
   - Check questionId in debug screen

## 📊 Expected Database State After Testing

### Users Table (via Debug):
```
User 1: { id: 'xxx', coupleId: 'couple-123' }
User 2: { id: 'yyy', coupleId: 'couple-123' }
```

### Couples Table (via Debug):
```
Couple: { id: 'couple-123', partner1Id: 'xxx', partner2Id: 'yyy' }
```

### Responses Table (via Debug):
```
Response 1: {
  id: 'question-response:xxx:question-1',
  userId: 'xxx',
  questionId: 'question-1',
  coupleId: 'couple-123',
  answers: {...}
}

Response 2: {
  id: 'question-response:yyy:question-1',
  userId: 'yyy',
  questionId: 'question-1',
  coupleId: 'couple-123',
  answers: {...}
}
```

---

## 🚀 Ready to Test!

Follow the steps above and watch the console logs carefully. The detailed logging will show you exactly what's happening at each step.

If you see any ❌ NOT FOUND in the logs, that's where the issue is - let me know what you see and we'll debug it together!
