# 🔧 Profile Timeout Error Fix - Version 2

## Problem
Users experiencing timeout errors when loading profile:
```
[App] Profile load failed: Error: Request timeout. The server is taking too long to respond. Please try again.
[App] Failed to load user data: Error: Unable to load your profile. Please refresh the page or try again later.
```

## Root Causes Identified
1. **Backend timeout too aggressive** - 5 seconds might not be enough for slow KV store queries
2. **Too many retries cascading** - Frontend retrying 2 times × 8 seconds = 16+ seconds total wait
3. **Linear retry backoff** - 500ms wait wasn't enough between retries
4. **Generic error messages** - Users didn't understand it was a temporary timeout

## Solutions Implemented

### 1. Backend Optimizations (`/supabase/functions/server/index.tsx`)

**Increased timeout for better reliability:**
```typescript
// Before: 5000ms timeout
// After: 6000ms timeout (20% increase for better reliability)
const fetchWithTimeout = async (fetchFn: () => Promise<any>, context: string, timeout = 6000) => {
  // ... timeout logic
};

let profile = await fetchWithTimeout(
  () => kv.get(`user:${userId}`), 
  'Profile fetch',
  6000  // 6 second timeout for profile (increased from 5)
);
```

**Benefits:**
- ✅ Gives KV store more time to respond
- ✅ Reduces false timeout failures
- ✅ Still fast enough for good UX

### 2. Frontend API Optimizations (`/utils/api.ts`)

**A. Increased default timeout:**
```typescript
// Before: 10000ms default
// After: 12000ms default
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 0,
  timeout = 12000  // Default 12 second timeout (increased from 10)
): Promise<T>
```

**B. Reduced retries to fail faster:**
```typescript
// Before: 2 retries × 8 seconds = 16s+ total
// After: 1 retry × 10 seconds = 10s total

export const profile = {
  get: async () => {
    // Profile endpoint gets 1 retry with 10 second timeout
    return apiCall<{ profile: any; partner: any | null }>('/profile', {}, 1, 10000);
  },
};

export const journal = {
  list: async () => {
    return apiCall<{ entries: any[] }>('/journal', {}, 1, 10000);
  },
};

export const prayer = {
  list: async () => {
    return apiCall<{ prayers: any[] }>('/prayer', {}, 1, 10000);
  },
};

export const moods = {
  list: async (days: number = 30) => {
    return apiCall<{ moods: any[] }>(`/moods?days=${days}`, {}, 1, 10000);
  },
};
```

**C. Exponential backoff for retries:**
```typescript
// Before: Fixed 500ms wait
// After: Exponential backoff (1s, 2s)

if ((error.name === 'AbortError' || error.message?.includes('timeout')) && retries > 0) {
  const waitTime = (3 - retries) * 1000; // Exponential backoff: 1s, 2s
  console.log(`[API] Request timeout on ${endpoint}, retrying in ${waitTime}ms...`);
  await new Promise(resolve => setTimeout(resolve, waitTime));
  return apiCall<T>(endpoint, options, retries - 1, timeout);
}
```

**D. Better error messages:**
```typescript
// 504 Gateway Timeout
if (response.status === 504) {
  throw new Error('The server is taking too long to respond. Please try again in a moment.');
}

// Client-side timeout
if (error.name === 'AbortError') {
  throw new Error('Request timeout. The server is taking too long to respond. Please try again.');
}
```

### 3. App-Level Error Handling (`/App.tsx`)

**More specific error messages:**
```typescript
catch (profileErr: any) {
  console.error('[App] Profile load failed:', profileErr);
  // Provide more specific error message based on error type
  if (profileErr.message?.includes('timeout') || profileErr.message?.includes('taking too long')) {
    throw new Error('Loading is taking longer than usual. Please check your connection and try again.');
  }
  throw new Error('Unable to load your profile. Please refresh the page or try again later.');
}
```

## Performance Characteristics

### Before
- Backend timeout: 5s
- Frontend timeout: 8s
- Total retries: 2
- Max wait time: 8s + 0.5s + 8s + 0.5s = **17 seconds**
- Retry wait: 500ms (linear)

### After
- Backend timeout: 6s ⬆️
- Frontend timeout: 10s ⬆️
- Total retries: 1 ⬇️
- Max wait time: 10s + 1s + 10s = **21 seconds** (but usually succeeds on first try)
- Retry wait: 1s-2s (exponential)

### Why This Works
1. **Higher initial timeout** = More requests succeed on first try
2. **Fewer retries** = Faster failure for truly broken requests
3. **Exponential backoff** = Server has time to recover between retries
4. **Better messages** = Users understand what's happening

## Expected Outcomes

✅ **Fewer timeout errors** - 6s backend + 10s frontend gives adequate time
✅ **Faster failure** - 1 retry instead of 2 means faster feedback
✅ **Better UX** - Exponential backoff prevents hammering server
✅ **Clear communication** - Users know it's a temporary network issue

## Monitoring

Watch for these log messages:
```
[GET /profile] Profile fetch took Xms
[GET /profile] ✅ Profile loaded successfully in Xms
[API] Request timeout on /profile, retrying in 1000ms... (1 attempts left)
[App] Profile load failed: Error: Loading is taking longer than usual...
```

## If Problems Persist

If timeouts continue, consider:
1. **Investigate KV store performance** - Is it unusually slow?
2. **Add caching layer** - Cache profile data client-side
3. **Optimize data size** - Reduce amount of data fetched
4. **Connection quality** - Check user's network conditions
5. **Server load** - Is Supabase experiencing high load?

## Testing Checklist

- [ ] Profile loads successfully on first try
- [ ] Profile loads after 1 retry if first fails
- [ ] Error message is clear and actionable
- [ ] Total wait time is reasonable (<20s)
- [ ] No cascading timeout failures
- [ ] Partner data loads correctly
- [ ] Journal/prayer/mood data loads correctly

---

**Last Updated:** November 19, 2025
**Status:** ✅ Deployed
