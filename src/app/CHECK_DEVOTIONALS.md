# How to Check Devotionals Are Working 🔍

## Quick Check in Browser Console

After logging in, open the browser console (F12) and run:

```javascript
// Check if devotionals loaded
console.log('Devotionals:', devotionals);

// Should show array with 3+ items
```

## Expected Console Output

### ✅ Success (After Fix):
```
📖 Seeding initial devotionals...
✅ Seeded 3 initial devotionals
🚀 TwoBeOne API Server starting...
[App] Devotionals loaded: 3
```

### ❌ Before Fix (Error):
```
[App] Failed to load devotionals: TypeError: Failed to fetch
```

## Manual API Test

You can test the devotionals endpoint directly:

```bash
# Get your access token first (check browser console or localStorage)
TOKEN="your-access-token-here"
PROJECT_ID="your-project-id"

# Test the devotionals endpoint
curl -X GET \
  "https://${PROJECT_ID}.supabase.co/functions/v1/make-server-6d579fee/devotions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "devotions": [
    {
      "id": "2024-01-15-abc123",
      "date": "2024-01-15",
      "title": "Love is Patient",
      "verse": "Love is patient, love is kind...",
      "reference": "1 Corinthians 13:4",
      "reflection": "In our relationships...",
      "prayerPrompt": "Pray together for patience...",
      "tags": ["Love", "Patience", "Growth"],
      "status": "published",
      "language": "en",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    ...
  ]
}
```

## Check From Admin Panel

1. Login to the app
2. Go to Settings
3. Enable "Show Testing Dashboard"
4. Click "Testing Dashboard"
5. Click "Run Devotional Tests"
6. Should see: ✅ "Devotional loads from backend - PASSED"

## Verify in UI

### Home Screen:
- Should show "Today's Devotional" card
- Shows devotional title
- Shows verse preview
- "Read Together" button works

### Daily Devotions Tab:
- Shows list of devotionals
- Can scroll through devotionals
- Can complete devotionals
- Shows completion status

## Troubleshooting

### If You Still See Errors:

#### 1. Server Not Started
**Problem:** Edge function not deployed or not running
**Solution:**
- Make sure Supabase project is active
- Edge functions are deployed
- Check Supabase dashboard > Edge Functions

#### 2. Authentication Issues
**Problem:** Access token invalid
**Solution:**
```javascript
// Logout and login again
localStorage.clear();
// Refresh page and login
```

#### 3. CORS Issues
**Problem:** CORS blocking the request
**Solution:**
- Check server has `app.use('*', cors())`
- Make sure origin is allowed
- Check browser console for CORS errors

#### 4. No Devotionals Created
**Problem:** Seeding didn't run
**Solution:**
- Check server logs for "Seeding initial devotionals"
- Manually restart the Edge Function
- Or manually create devotionals via Admin Panel

### Manual Creation (if seeding fails):

Go to Admin Panel → Devotionals Manager → Add Devotional

**Sample Data:**
```
Title: Love is Patient
Verse: Love is patient, love is kind...
Reference: 1 Corinthians 13:4
Reflection: In our relationships, patience is not passive waiting...
Prayer Prompt: Pray together for patience in your relationship
Tags: Love, Patience, Growth
Status: Published
Language: English
Date: [Today's Date]
```

## Server Logs to Check

### Supabase Dashboard → Edge Functions → Logs

**Look for:**
```
📖 Seeding initial devotionals...
✅ Seeded 3 initial devotionals
📖 Found 3 existing devotionals
[Devotions fetch error:] (should NOT appear after fix)
```

## Frontend Logs to Check

### Browser Console → Filter: "devotional"

**Should see:**
```
[App] Devotionals loaded: 3
[DailyDevotionsFeed] Loaded 3 devotionals
[DevotionalDialog] Opening devotional: Love is Patient
```

**Should NOT see:**
```
Failed to load devotionals: TypeError: Failed to fetch
[App] Devotionals response not ok: 401
```

## Database Check

### Supabase Dashboard → Database → KV Store

**Check for keys:**
```
devotional:2024-01-15-abc123xyz
devotional:2024-01-16-def456uvw
devotional:2024-01-17-ghi789rst
```

**Each should have data like:**
```json
{
  "id": "2024-01-15-abc123xyz",
  "title": "Love is Patient",
  ...
}
```

## API Endpoint Health Check

Test the health of all devotional endpoints:

```bash
# 1. Get all devotionals
GET /make-server-6d579fee/devotions

# 2. Get today's devotional
GET /make-server-6d579fee/devotions/today

# 3. Complete a devotional
POST /make-server-6d579fee/complete-devotional

# 4. Get completions
GET /make-server-6d579fee/devotional-completions
```

## Success Criteria

✅ Server logs show "Seeded 3 initial devotionals"
✅ Browser console shows "Devotionals loaded: 3"
✅ Home screen shows "Today's Devotional" card
✅ Daily Devotions tab shows list of devotionals
✅ No "Failed to fetch" errors in console
✅ Can complete devotionals
✅ Streak counter works
✅ Partner can see shared devotionals

## If Everything Still Fails

### Nuclear Option (Reset Everything):

```javascript
// 1. Clear all local storage
localStorage.clear();

// 2. Logout
// Click logout in app

// 3. Restart server
// Redeploy edge function in Supabase

// 4. Clear KV store (careful!)
// Only do this if you want to start fresh
// Supabase Dashboard → Edge Functions → KV Store → Delete All

// 5. Restart will auto-seed 3 devotionals

// 6. Login again
```

## Contact Support

If you still have issues after trying all troubleshooting:

1. Check server logs in Supabase Dashboard
2. Check browser console for errors
3. Verify authentication is working
4. Try creating a devotional manually
5. Check CORS configuration

## Quick Verification Script

Copy this into browser console after logging in:

```javascript
// Quick devotional check
(async () => {
  try {
    const token = localStorage.getItem('sb-access-token'); // Adjust key if needed
    const projectId = 'your-project-id'; // Replace with your project ID
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotions`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Devotionals working!');
      console.log('Count:', data.devotions?.length || 0);
      console.log('Data:', data.devotions);
    } else {
      console.error('❌ Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Fetch failed:', error);
  }
})();
```

---

## Summary

The fix adds auto-seeding of 3 sample devotionals when the server starts. This ensures there's always content available for users, and the "Failed to fetch" error is resolved.

**Your devotionals should now work perfectly!** 📖💜🙏
