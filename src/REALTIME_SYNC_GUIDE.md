# 💕 Relationship Start Date Real-Time Sync

## Overview
The TwoBeOne app features **real-time synchronization** for the relationship start date. When one partner sets or updates the relationship start date, the other partner automatically sees the update within **15 seconds** without needing to refresh the app.

## How It Works

### 🔄 Three-Layer Sync System

#### 1. **Backend Sync** (Immediate)
Located in: `/supabase/functions/server/index.tsx` (lines 305-343)

When one partner updates their relationship start date:
```typescript
// Server automatically syncs to partner's profile
if (updates.relationshipStart && profile.partnerId) {
  const updatedPartner = {
    ...partner,
    relationshipStart: updates.relationshipStart,
    updatedAt: new Date().toISOString()
  };
  await kv.set(`user:${profile.partnerId}`, updatedPartner);
  
  // Create notification for partner
  const notification = {
    type: 'profile_update',
    title: '💕 Relationship Date Set!',
    message: `${updatedProfile.name} set your relationship start date`,
    data: { relationshipStart: updates.relationshipStart }
  };
}
```

**Result**: Both profiles now have matching relationship start dates in the database.

#### 2. **Profile Polling** (Every 15 seconds)
Located in: `/App.tsx` (lines 201-246)

The app polls for profile updates every 15 seconds:
```typescript
const checkForProfileUpdates = async () => {
  // Fetch latest profile from server
  const { profile: updatedProfile } = await response.json();
  
  // Detect if profile changed
  if (lastProfileCheck !== updatedProfile.updatedAt) {
    console.log('[App] Profile updated detected, reloading data...');
    await loadUserData(); // Reload all user data
  }
};
```

**Result**: Partner sees the updated date automatically within 15 seconds.

#### 3. **Notification Toast** (Real-time)
Located in: `/App.tsx` (lines 170-198)

When a notification is detected:
```typescript
if (notification.type === 'profile_update' && notification.data?.relationshipStart) {
  const date = new Date(notification.data.relationshipStart).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  toast.success(
    '💕 Relationship Date Set!',
    {
      description: `Your partner set your relationship start date to ${date}`,
      duration: 6000
    }
  );
}
```

**Result**: Partner gets a beautiful toast notification showing the exact date.

## UI Updates

### Components That React to Changes

1. **CoupleDashboard** (`/components/CoupleDashboard.tsx`)
   - Days together counter updates automatically
   - Time together display (years, months, days) refreshes
   - Uses `profile?.relationshipStart` from state

2. **SettingsScreen** (`/components/SettingsScreen.tsx`)
   - Input field shows current date
   - Updates when partner changes date
   - Syncs on save

## User Experience Flow

### Scenario: Partner A sets the relationship date

```
1. Partner A opens Settings → Personal Information
2. Partner A selects "Relationship Started" date: June 4, 2023
3. Partner A clicks "Save Changes"

   ↓ Immediate (< 1 second)
   
4. Backend syncs date to Partner B's profile
5. Backend creates notification for Partner B
6. Partner A sees: "Profile updated! Your partner's relationship start date has been synced too. 💕"

   ↓ Within 15 seconds
   
7. Partner B's app detects profile update via polling
8. Partner B's app reloads data automatically
9. Partner B sees toast: "💕 Relationship Date Set!"
10. Partner B's dashboard updates with new date
11. Days together counter updates automatically
```

## Technical Details

### Polling Interval
- **15 seconds** - Balances real-time feel with server load
- Configurable in `/App.tsx` line 245: `setInterval(..., 15000)`

### Data Flow
```
User Action (Settings)
  ↓
PUT /profile endpoint
  ↓
Update user's profile
  ↓
Sync to partner's profile (if partnerId exists)
  ↓
Create notification
  ↓
Profile polling detects change (updatedAt timestamp)
  ↓
loadUserData() refreshes all data
  ↓
React state updates
  ↓
UI re-renders with new date
```

### State Management
- Profile stored in App.tsx state: `const [profile, setProfile] = useState()`
- Passed down to components as props
- React automatically re-renders when state changes
- No manual refresh needed

## Testing the Sync

### Method 1: Two Devices
1. Sign in as Partner A on Device 1
2. Sign in as Partner B on Device 2
3. On Device 1: Go to Settings → Change relationship date → Save
4. On Device 2: Wait up to 15 seconds → See toast notification and updated date

### Method 2: Browser Console
```javascript
// Watch for profile updates
console.log('[App] 💕 Relationship start date changed!', {
  old: oldRelationshipStart,
  new: newRelationshipStart
});
```

## Performance

- **Latency**: < 15 seconds for sync
- **Network**: Minimal (small JSON payloads)
- **Battery**: Efficient polling with background throttling
- **UX**: Seamless, no user action required

## Future Enhancements

Consider implementing WebSocket-based real-time sync for:
- Instant updates (< 1 second)
- Lower server load (no polling)
- Better battery efficiency
- Bi-directional real-time communication

However, the current 15-second polling provides a great balance for this use case.

---

**Status**: ✅ **Fully Implemented & Tested**
**Last Updated**: Current implementation
