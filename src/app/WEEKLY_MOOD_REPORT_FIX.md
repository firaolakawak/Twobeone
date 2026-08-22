# Weekly Mood Report - Saturday Scheduling Fix

## Issue Resolved ✅

The Weekly Mood Report was only running once every 7 days instead of specifically on Saturdays. This has been fixed with proper Saturday-specific scheduling logic.

---

## Changes Made

### 1. **Updated CoupleDashboard.tsx** ✨

**Previous Logic:**
- Checked if 7 days had passed since last report
- Ran at random times (whenever component mounted)
- Used localStorage with simple timestamp comparison

**New Logic:**
- ✅ **Runs only on Saturdays** (day 6 of the week)
- ✅ **Week-based tracking** (prevents duplicate reports in same week)
- ✅ **Checks every 6 hours** to catch Saturday reliably
- ✅ **Proper week boundary detection** (Sunday to Saturday)

### 2. **Implementation Details**

```typescript
// Key improvements:
const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

// Only run on Saturdays
if (dayOfWeek !== 6) {
  return;
}

// Check if report already sent this week
const currentWeekStart = new Date(now);
currentWeekStart.setDate(now.getDate() - dayOfWeek); // Go back to Sunday
currentWeekStart.setHours(0, 0, 0, 0);

if (lastReportDate >= currentWeekStart) {
  console.log('[WeeklyMoodReport] Report already sent this week');
  return;
}
```

### 3. **Check Frequency**

- **Before:** Once per 24 hours (could miss Saturday)
- **After:** Every 6 hours (catches Saturday reliably)

---

## How It Works

### Automatic Report Generation

1. **Every Saturday**, the app checks if a mood report has been sent this week
2. If no report was sent, it automatically generates and sends a report to both partners
3. The report includes:
   - Both partners' mood averages for the past 7 days
   - AI-powered analysis and encouragement
   - Specific observations and Bible-based guidance
   - Actionable suggestions for the week ahead

### Manual Report Generation

Users can also manually trigger a weekly report anytime by:
1. Going to **Home → Mood Analytics**
2. Clicking the **"Generate Weekly Report"** button at the top

---

## Testing Instructions

### Option 1: Manual Testing (Immediate)
1. Navigate to **Mood Analytics** screen
2. Click **"Generate Weekly Report"** button
3. Check notifications to see the report

### Option 2: Automatic Testing (Requires Saturday)
1. Wait until Saturday
2. Open the app on Saturday
3. The report will auto-generate within 6 hours
4. Check notifications for the weekly mood report

### Option 3: Developer Testing (Skip to Saturday)
To test without waiting for Saturday:
1. Add some mood entries throughout the week
2. Open browser DevTools → Console
3. Run this code to trigger manually:
```javascript
// Temporarily simulate Saturday
const originalGetDay = Date.prototype.getDay;
Date.prototype.getDay = function() { return 6; }; // Force Saturday
localStorage.removeItem('lastMoodReport:' + profile.id); // Clear last report
// Reload the page - it should trigger the report
```

---

## Expected Behavior

### ✅ What Should Happen

1. **Every Saturday:**
   - Report automatically generates if you have mood data
   - Both partners receive a notification
   - Notification includes mood analysis and encouragement

2. **Not on Saturday:**
   - Auto-generation doesn't run
   - Manual generation still available via Mood Analytics

3. **Same Week Protection:**
   - If report already sent this week, won't send again
   - Resets every Sunday at midnight

### ❌ What Should NOT Happen

- ❌ Report sending multiple times in one week
- ❌ Report sending on days other than Saturday
- ❌ Report failing if no mood data exists (graceful error)

---

## Backend Requirements

The backend endpoint `/moods/weekly-report` requires:

1. **Both partners must have linked accounts**
2. **At least one mood entry** in the past 7 days (from either partner)
3. **Valid authentication** (user must be logged in)

If requirements aren't met:
- Returns error message explaining why (e.g., "Not enough mood data")
- Frontend logs the error but doesn't show user alerts
- User can try again later after tracking more moods

---

## Monitoring & Debugging

### Console Logs to Watch

```
[WeeklyMoodReport] Auto-generating weekly mood report for Saturday...
[WeeklyMoodReport] Weekly report generated successfully!
```

or

```
[WeeklyMoodReport] Report already sent this week
[WeeklyMoodReport] Could not auto-generate report: <reason>
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Report not generating | Not Saturday | Wait for Saturday or use manual trigger |
| "Not enough mood data" error | Less than 1 mood entry in past 7 days | Track moods throughout the week |
| No notification received | Partner not linked | Link with partner first |
| Multiple reports on Saturday | localStorage cleared | Normal - will only happen once per week |

---

## Technical Notes

- Uses **localStorage** to track last report timestamp
- Key format: `lastMoodReport:{userId}`
- Stores millisecond timestamp for precise tracking
- Checks week boundaries (Sunday 00:00 to Saturday 23:59)
- Compatible with all timezones (uses device local time)

---

## Future Enhancements (Optional)

- [ ] Allow users to customize report day (e.g., Friday instead of Saturday)
- [ ] Add report frequency settings (weekly, bi-weekly, monthly)
- [ ] Email delivery option for weekly reports
- [ ] Historical report viewing in Mood Analytics
- [ ] Comparison with previous weeks' reports

---

## Related Files

- `/components/CoupleDashboard.tsx` - Auto-generation logic
- `/components/MoodAnalytics.tsx` - Manual trigger UI
- `/supabase/functions/server/index.tsx` - Backend report generation (lines 1567-1775)
- `/utils/api.ts` - API client methods

---

**Last Updated:** November 19, 2024  
**Status:** ✅ Fixed and deployed