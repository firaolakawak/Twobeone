# Q&A System Debugging Guide

## Issue: Cannot see recently created Q&A questions

### Step-by-Step Debugging Process

#### 1. Check Admin Creation (Admin Panel > Q&A Questions Tab)

**Open Browser Console (F12)** and create a new question:

1. Fill in the form with:
   - Category: Daily Life
   - Status: Active
   - Title: "Test Question"
   - Bible Verse: "Test verse"
   - Verse Reference: "Test 1:1"
   - Add at least one question prompt

2. Click "Create Question"

3. **Look for these console logs:**
   ```
   Creating question: {title: "Test Question", category: "daily-life", ...}
   Using token: Token exists
   Create response status: 200 (or error code)
   Create response: {success: true, questionId: "..."}
   ```

**Possible Issues:**

- **If status is 401 (Unauthorized):**
  - Problem: Not logged in as admin
  - Solution: Make sure you're logged in with an admin account (email must contain "admin")
  
- **If status is 403 (Forbidden):**
  - Problem: Logged in but not as admin
  - Solution: Your email doesn't contain "admin". Use an admin account or update your email.

- **If status is 500:**
  - Problem: Server error
  - Check Supabase Edge Function logs for detailed error
  - Verify the question data structure

- **If "Token exists" shows "No token":**
  - Problem: Not authenticated
  - Solution: Log out and log back in

#### 2. Check if Question Was Saved (Admin Panel)

After creating, the admin panel should automatically reload questions.

**Look for console logs:**
```
Admin questions loaded: [...]
```

**Check the Admin Panel UI:**
- Does the new question appear in the list?
- Check the "Total Questions" counter - did it increase?
- Try searching for your question title

**If question doesn't appear:**
- The CREATE might have failed silently
- Check the console for error messages
- Try refreshing the page

#### 3. Check User-Facing View (Q&A Discussion Hub)

Navigate to the Q&A Discussion Hub (user view)

**Look for console logs:**
```
Fetching questions from: https://...
Category filter: all
Response status: 200
Fetched questions: [...]
Converted questions: [...]
```

**Possible Issues:**

- **If "Fetched questions: []" (empty array):**
  - Problem: No active questions in database
  - Solution: Go back to admin panel and verify:
    1. Question exists
    2. Question status is "Active" (not "Inactive")

- **If response status is 401:**
  - Problem: Not logged in
  - Solution: Log in as a user

- **If questions show in admin but not user view:**
  - Problem: Question might be marked as "Inactive"
  - Solution: Edit the question in admin panel and set status to "Active"

#### 4. Database Verification

**Check Supabase KV Store:**

1. Go to Supabase Dashboard
2. Navigate to Edge Functions > Logs
3. Look for logs from the server function
4. Check if questions are being stored with key pattern: `question:{id}`

**Manual Database Check (if you have access):**

You can test the backend directly using curl or Postman:

```bash
# List all questions (admin endpoint)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://YOUR_PROJECT.supabase.co/functions/v1/make-server-6d579fee/admin/questions/list

# Get active questions (user endpoint)  
curl -H "Authorization: Bearer YOUR_USER_TOKEN" \
  https://YOUR_PROJECT.supabase.co/functions/v1/make-server-6d579fee/questions
```

#### 5. Common Issues and Solutions

**Issue: Questions created but showing as 0 in stats**
- **Cause:** Filter is active
- **Solution:** Set category filter to "All Categories" in admin panel

**Issue: Question appears in admin but not in user view**
- **Cause:** Question status is "Inactive"
- **Solution:** Edit question, change status to "Active"

**Issue: Create button does nothing**
- **Cause:** Form validation failing
- **Solution:** Make sure:
  - Title is filled
  - Verse is filled
  - Verse Reference is filled
  - At least one prompt is added
  - Prompts with multiple choice have at least 2 options

**Issue: "Unauthorized" error when creating**
- **Cause:** Not logged in as admin
- **Solution:** 
  1. Check your email contains "admin"
  2. Log out and log back in
  3. Check console for "Using token: Token exists"

**Issue: Questions don't load after creation**
- **Cause:** `loadQuestions()` not being called
- **Solution:** This should happen automatically. Try refreshing the page.

#### 6. Quick Test Checklist

- [ ] Logged in as admin (email contains "admin")
- [ ] Can access Admin Panel
- [ ] Can see Q&A Questions tab
- [ ] Form opens when clicking "New Question"
- [ ] All required fields filled
- [ ] At least one prompt added
- [ ] Status set to "Active"
- [ ] Click "Create Question"
- [ ] See success toast notification
- [ ] Question appears in admin list
- [ ] Question count increases
- [ ] Navigate to user Q&A Hub
- [ ] Question appears for users
- [ ] Can navigate to the question

#### 7. Expected Console Output

**When Creating (Admin Panel):**
```
Creating question: {
  title: "Test Question",
  category: "daily-life",
  verse: "Test verse",
  verseReference: "Test 1:1",
  prompts: [{id: "...", text: "Test prompt", type: "text"}],
  status: "active"
}
Using token: Token exists
Create response status: 200
Create response: {success: true, questionId: "1234567890"}
```

**When Loading User View:**
```
Fetching questions from: https://xxx.supabase.co/functions/v1/make-server-6d579fee/questions
Category filter: all
Response status: 200
Fetched questions: [{id: "1234567890", title: "Test Question", ...}]
Converted questions: [{id: "1234567890", title: "Test Question", prompts: ["Test prompt"]}]
```

#### 8. Still Not Working?

If you've tried all the above and it still doesn't work:

1. **Clear browser cache and cookies**
2. **Open in incognito/private window**
3. **Check Supabase Edge Function status** - Functions might be down
4. **Check Supabase Edge Function logs** for detailed errors
5. **Verify environment variables** are set correctly
6. **Try with a different browser**
7. **Check network tab** in browser dev tools for failed requests

#### 9. Key Files to Check

- `/components/admin/QuestionsManager.tsx` - Admin creation logic
- `/components/QADiscussionHub.tsx` - User view logic
- `/supabase/functions/server/index.tsx` - Backend API routes
- Backend logs in Supabase Dashboard

## Need More Help?

Share the following information:
1. Console logs from browser (all logs when creating and viewing)
2. Network tab showing the API request/response
3. Supabase Edge Function logs
4. Screenshots of the issue
5. Email format of the admin user (does it contain "admin"?)
6. Question status (Active or Inactive?)
