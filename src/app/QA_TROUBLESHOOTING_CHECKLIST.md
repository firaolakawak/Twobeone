# Q&A System Troubleshooting Checklist

## Quick Fix Steps

### For Admin (Creating Questions):

1. **Check Your Login:**
   - [ ] Are you logged in with an admin account?
   - [ ] Does your email contain the word "admin"? (e.g., admin@example.com)
   - [ ] If not, create a new account with "admin" in the email

2. **Open Browser Console (Press F12):**
   - [ ] Go to Console tab
   - [ ] Clear all previous logs

3. **Try Creating a Test Question:**
   - [ ] Go to Admin Panel > Q&A Questions tab
   - [ ] Click "New Question"
   - [ ] Fill in:
     - Category: Daily Life
     - Status: **Active** (IMPORTANT!)
     - Title: "Test Morning Routine"
     - Bible Verse: "Very early in the morning, while it was still dark, Jesus got up"
     - Verse Reference: "Mark 1:35"
   - [ ] Click "Add Question" button
   - [ ] Enter prompt text: "What does your morning routine look like?"
   - [ ] Leave type as "Text Response"
   - [ ] Click "Create Question"

4. **Check Console Output:**
   - [ ] Look for: `Creating question:` - Shows the question data
   - [ ] Look for: `Using token: Token exists` - Confirms authentication
   - [ ] Look for: `Create response status: 200` - Success!
   - [ ] Look for: `Create response: {success: true}` - Confirmed saved

5. **Verify in Admin Panel:**
   - [ ] Does the question appear in the list below?
   - [ ] Does "Total Questions" count increase?
   - [ ] Is the status showing as "Active" (green)?

### For User View (Seeing Questions):

1. **Make Sure You're Logged In:**
   - [ ] Log in as a regular user (or stay logged in as admin, both work)

2. **Navigate to Q&A Discussion Hub:**
   - [ ] Go to main menu/navigation
   - [ ] Find and click "Q&A Discussion Hub" or "Questions"

3. **Open Browser Console (Press F12):**
   - [ ] Look for: `Fetching questions from:` - Shows it's trying to load
   - [ ] Look for: `Response status: 200` - Success!
   - [ ] Look for: `Fetched questions: [...]` - Shows the questions
   - [ ] Look for: `Converted questions: [...]` - Shows formatted questions

4. **Check the UI:**
   - [ ] Does it show loading spinner first?
   - [ ] Does the "Total Questions" stat show a number > 0?
   - [ ] Do you see any question cards?
   - [ ] If you see "No Questions Yet", try clicking "View All Categories"

## Most Common Issues & Quick Fixes:

### Issue 1: "Unauthorized" Error
**Symptoms:** Console shows `401 Unauthorized`
**Fix:** 
- Log out completely
- Log back in with admin email (must contain "admin")
- Try again

### Issue 2: Question Created But Not Visible to Users
**Symptoms:** Shows in admin panel but not in user view
**Fix:**
- Go back to admin panel
- Find your question
- Click the edit button (pencil icon)
- Make sure Status is set to "**Active**" (not Inactive)
- Click "Update Question"
- Go back to user view and refresh

### Issue 3: Empty Questions List in User View
**Symptoms:** "No Questions Yet" message
**Fix:**
1. Check admin panel - are there any questions at all?
2. If yes, are they marked as "Active"?
3. Try clicking different categories
4. Try clicking "View All Categories"

### Issue 4: Console Shows No Logs
**Symptoms:** Nothing appears in console when creating
**Fix:**
- Make sure you're on the Console tab (not Elements or Network)
- Click "Clear console" button first
- Make sure "All levels" is selected (not just Errors)
- Try the action again

### Issue 5: Form Won't Submit
**Symptoms:** Clicking "Create Question" does nothing
**Fix:** Make sure:
- [ ] Title field is filled
- [ ] Bible Verse field is filled  
- [ ] Verse Reference field is filled
- [ ] At least ONE question prompt is added (click "Add Question" first)
- [ ] Prompt text is not empty

## Test Data You Can Use:

**Test Question 1:**
- Category: Daily Life
- Status: Active
- Title: "Morning Quiet Time"
- Verse: "Very early in the morning, while it was still dark, Jesus got up, left the house and went off to a solitary place, where he prayed."
- Reference: "Mark 1:35"
- Prompt 1: "What does your ideal morning routine look like?"
- Prompt 2: "How can we support each other in maintaining daily quiet time with God?"

**Test Question 2:**
- Category: Trust
- Status: Active
- Title: "Building Trust Together"
- Verse: "Instead, speaking the truth in love, we will grow to become in every respect the mature body."
- Reference: "Ephesians 4:15"
- Prompt 1: "What does complete transparency look like in our relationship?"

## What Should Happen (Expected Flow):

1. ✅ Admin logs in
2. ✅ Goes to Admin Panel > Q&A Questions
3. ✅ Clicks "New Question"
4. ✅ Fills form with all required fields
5. ✅ Adds at least one prompt
6. ✅ Clicks "Create Question"
7. ✅ Sees toast notification: "Question created successfully"
8. ✅ Question appears in the list immediately
9. ✅ "Total Questions" counter increases
10. ✅ User navigates to Q&A Discussion Hub
11. ✅ Question loads and appears in the carousel
12. ✅ User can navigate to it using Previous/Next buttons

## Still Having Issues?

### Take These Screenshots:
1. Browser console showing all logs when creating a question
2. Browser console showing all logs when loading user view
3. The admin panel showing your questions list
4. The user view showing the empty state or questions

### Check These Things:
- [ ] What's your admin email? (does it contain "admin"?)
- [ ] What's the question status? (Active or Inactive?)
- [ ] Can you see any red errors in the console?
- [ ] What happens when you refresh the page?
- [ ] Does the issue persist in a different browser?
- [ ] Does the issue persist in incognito/private mode?

### Share This Info:
1. All console logs (copy/paste or screenshot)
2. Network tab showing the failed request (if any)
3. Your admin email format (hide the actual address, just show format like "a***n@example.com")
4. Browser and version you're using
5. Whether questions show in admin panel but not user view, or don't show anywhere

---

**TIP:** The most common issue is that questions are created as "Inactive" instead of "Active". Always check the status toggle when creating!

**TIP 2:** If nothing works, try creating a brand new account with email like "admin@test.com" and test with that.
