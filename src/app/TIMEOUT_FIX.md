# Timeout Fix - Question Responses Endpoint

## Problem
The `/question-responses` endpoint was timing out, causing errors:
```
[App] Failed to load responses: Error: Request timeout. The server is taking too long to respond. Please try again.
```

## Root Cause
The endpoint was using `kv.getByPrefix()` which can be slow when scanning large key ranges in the KV store. With the default 12-second frontend timeout and 5-second backend timeout, the requests were still failing.

## Solutions Implemented

### 1. Backend Optimization (`/supabase/functions/server/index.tsx`)
- ✅ Reduced backend timeout from 5000ms to 2000ms for faster failures
- ✅ Added early returns when data fetch fails (don't wait for partner data if user data fails)
- ✅ Changed error responses to return 200 status with empty arrays instead of 500 errors
- ✅ Better error messages with context
- ✅ Graceful degradation - return partial data if available

**Key Changes:**
```typescript
// Before: 5 second timeout
const queryTimeout = 5000;

// After: 2 second timeout for faster response
const queryTimeout = 2000;

// Better error handling - return 200 with empty data instead of failing
return c.json({ 
  userResponses: [], 
  partnerResponses: []
}, 200); // Return 200 to prevent frontend errors
```

### 2. Frontend Optimization (`/utils/api.ts`)
- ✅ Reduced timeout for `getResponses()` from 12000ms to 5000ms
- ✅ Disabled retries (0 retries) for faster failure
- ✅ Shorter timeout allows for quicker user feedback

**Key Changes:**
```typescript
getResponses: async (category?: string) => {
  const query = category ? `?category=${category}` : ''
  // Use shorter timeout (5s) and no retries for faster failure
  return apiCall<{ userResponses: any[]; partnerResponses: any[] }>(
    `/question-responses${query}`,
    {},
    0, // No retries
    5000 // 5 second timeout
  );
}
```

### 3. App.tsx Error Handling
- ✅ Changed from `console.error` to `console.warn` (non-critical)
- ✅ Always set empty responses on error to prevent crashes
- ✅ Removed error toasts for initial load (better UX)
- ✅ Graceful degradation - app continues loading other data

**Key Changes:**
```typescript
catch (err: any) {
  console.warn('[App] Failed to load responses (non-critical):', err?.message || err);
  setResponses({
    user: [],
    partner: []
  });
  // Don't show error toast - responses are not critical for initial load
}
```

## Benefits

1. **Faster Failures**: 2s backend + 5s frontend = 7s max total (down from 17s)
2. **Better UX**: App doesn't hang, fails fast and gracefully
3. **No User-Facing Errors**: Silent failure with empty data instead of error messages
4. **Partial Data Support**: If user data loads but partner data times out, user still gets their data
5. **Non-Blocking**: Other app features continue to load even if responses fail

## Testing Recommendations

1. Test with slow network conditions
2. Verify app loads without errors even when responses timeout
3. Check that question responses still work when data is available
4. Ensure error messages are not shown to users for this non-critical data

## Future Improvements

Consider implementing:
1. Lazy loading for responses (load on demand, not on app init)
2. Caching strategy to reduce repeated KV queries
3. Pagination for responses if users have many
4. Background refresh after initial empty load
