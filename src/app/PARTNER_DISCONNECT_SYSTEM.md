# Partner Disconnect System - Complete Documentation

## Overview

TwoBeOne implements a **mutual agreement partner disconnect system** with a **30-day grace period** and **email notifications**. This ensures that ending a partnership is a thoughtful, mutual decision that both partners can reconsider.

---

## Key Features ✨

### 1. **Mutual Agreement Required** 🤝
- ✅ One partner alone **cannot** disconnect
- ✅ Both partners must agree before disconnection proceeds
- ✅ Request remains pending until both partners agree

### 2. **30-Day Grace Period** ⏳
- ✅ After both partners agree, a 30-day countdown begins
- ✅ Either partner can cancel at any time during this period
- ✅ Disconnection automatically executes after 30 days

### 3. **Email Notifications** 📧
- ✅ Initial request notification sent to partner
- ✅ Agreement confirmation sent to both
- ✅ Cancellation notification sent to both
- ✅ Final disconnection confirmation sent to both
- ⚠️ **Note:** Email integration requires email service setup (currently logged to console)

### 4. **Data Protection** 🔒
- ✅ Individual data remains private after disconnect
- ✅ Couple record is archived (not deleted) for data integrity
- ✅ Shared content becomes private
- ✅ Both partners can create new partnerships

---

## User Flow

### Scenario 1: Partner A Requests Disconnect

```
1. Partner A clicks "Request Partner Disconnect" in Settings → Couple → Danger Zone
2. System shows warning dialog explaining the process
3. Partner A confirms request
4. System creates disconnect request with 30-day grace period
5. Partner B receives notification + email
6. Status: PENDING (waiting for Partner B)
```

**Partner A sees:**
- "You requested to disconnect. [Partner B] must also agree before the grace period begins."
- Days until request expires (30 days from request date)
- Option to cancel request

**Partner B sees:**
- "[Partner A] has requested to disconnect. If you also agree, a 30-day grace period will begin."
- Option to agree or ignore

---

### Scenario 2: Both Partners Agree

```
1. Partner B clicks "Agree to Disconnect"
2. System updates status to AGREED
3. Both partners receive notification + email
4. 30-day grace period begins
5. Status: AGREED (grace period active)
```

**Both partners see:**
- "Both partners have agreed to disconnect. You have 30 days to cancel if either of you change your mind."
- Countdown: "X days remaining"
- Option to cancel disconnect (green button with heart icon)

---

### Scenario 3: Cancel During Grace Period

```
1. Either partner clicks "Cancel Disconnect"
2. System deletes disconnect request
3. Both partners receive notification + email
4. Partnership remains intact
5. Status: No active request
```

**Both partners see:**
- "Disconnect request cancelled. You remain connected with [Partner]!"

---

### Scenario 4: Grace Period Expires

```
1. System automatically checks when grace period ends
2. Both user profiles updated (partnerId → null, coupleId → null)
3. Couple record archived (status → 'disconnected')
4. Both partners receive final notification + email
5. Status: DISCONNECTED
```

**Both partners see:**
- "Your partnership has been disconnected. Your data remains private."
- Can now link with new partner if desired

---

## Backend API Endpoints

### 1. Request Disconnect
```http
POST /make-server-6d579fee/partner/request-disconnect
Authorization: Bearer {accessToken}
```

**Response (First Request):**
```json
{
  "success": true,
  "message": "Disconnect request created. Your partner has been notified and must also agree.",
  "gracePeriodEnds": "2024-12-19T...",
  "status": "pending"
}
```

**Response (Both Agreed):**
```json
{
  "success": true,
  "message": "Both partners have agreed to disconnect. You have 30 days to cancel if either of you change your mind.",
  "gracePeriodEnds": "2024-12-19T...",
  "status": "agreed"
}
```

---

### 2. Cancel Disconnect
```http
POST /make-server-6d579fee/partner/cancel-disconnect
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Disconnect request cancelled successfully. You remain connected with your partner."
}
```

---

### 3. Get Disconnect Status
```http
GET /make-server-6d579fee/partner/disconnect-status
Authorization: Bearer {accessToken}
```

**Response (No Request):**
```json
{
  "hasRequest": false
}
```

**Response (Pending):**
```json
{
  "hasRequest": true,
  "status": "pending",
  "requestedBy": ["user-id-1"],
  "requestedAt": "2024-11-19T...",
  "gracePeriodEnds": "2024-12-19T...",
  "daysRemaining": 25,
  "userRequested": true
}
```

**Response (Agreed):**
```json
{
  "hasRequest": true,
  "status": "agreed",
  "requestedBy": ["user-id-1", "user-id-2"],
  "requestedAt": "2024-11-19T...",
  "bothAgreedAt": "2024-11-20T...",
  "gracePeriodEnds": "2024-12-19T...",
  "daysRemaining": 24,
  "userRequested": true
}
```

---

## Frontend Integration

### API Client (utils/api.ts)

```typescript
export const partnerApi = {
  requestDisconnect: async () => {
    return apiCall<{ 
      success: boolean; 
      message: string;
      gracePeriodEnds: string;
      status: string;
    }>('/partner/request-disconnect', { method: 'POST' });
  },

  cancelDisconnect: async () => {
    return apiCall<{ 
      success: boolean; 
      message: string;
    }>('/partner/cancel-disconnect', { method: 'POST' });
  },

  getDisconnectStatus: async () => {
    return apiCall<{
      hasRequest: boolean;
      status?: string;
      requestedBy?: string[];
      // ... other fields
    }>('/partner/disconnect-status', { method: 'GET' });
  },
};
```

### Component Usage

```typescript
import { PartnerDisconnectDialog } from './components/PartnerDisconnectDialog';

<PartnerDisconnectDialog
  open={showDisconnectDialog}
  onOpenChange={setShowDisconnectDialog}
  profile={profile}
  partner={partner}
  onDisconnected={onRefresh}
/>
```

---

## UI Components

### PartnerDisconnectDialog

**Location:** `/components/PartnerDisconnectDialog.tsx`

**Features:**
- ✅ Multi-step dialog (warning → confirm → status)
- ✅ Real-time status checking
- ✅ Countdown display
- ✅ Color-coded states (orange = pending, red = agreed, green = cancel)
- ✅ Comprehensive information display
- ✅ Responsive design

**Views:**

1. **Initial View** - Warning about the process
2. **Confirmation View** - Confirm disconnect request
3. **Status View** - Show active request status

---

## Database Schema

### Disconnect Request Object

Stored in KV store at `disconnect:{coupleId}`

```typescript
{
  id: string;
  coupleId: string;
  requestedBy: string[];           // Array of user IDs who requested
  requestedAt: string;              // ISO timestamp of first request
  bothAgreedAt?: string;            // ISO timestamp when both agreed
  gracePeriodEnds: string;          // ISO timestamp (30 days from first request)
  status: 'pending' | 'agreed' | 'cancelled' | 'completed';
}
```

### Couple Record Updates

```typescript
// Before disconnect
{
  id: string;
  partner1Id: string;
  partner2Id: string;
  relationshipStartDate: string;
  createdAt: string;
  status?: string;
  disconnectedAt?: string;
}

// After disconnect
{
  ...
  status: 'disconnected';
  disconnectedAt: '2024-12-19T...';
}
```

### User Profile Updates

```typescript
// Before disconnect
{
  ...
  partnerId: 'partner-user-id';
  coupleId: 'couple-id';
}

// After disconnect
{
  ...
  partnerId: null;
  coupleId: null;
}
```

---

## Notifications

### Notification Types

1. **`partner_disconnect_request`** - Partner initiated disconnect
2. **`partner_disconnect_agreed`** - Both agreed, grace period started
3. **`partner_disconnect_cancelled`** - Request was cancelled
4. **`partner_disconnected`** - Final disconnection completed

### Notification Example

```typescript
{
  id: string;
  userId: string;
  type: 'partner_disconnect_request';
  title: '💔 Partner Disconnect Request';
  message: '[Partner Name] has requested to disconnect. Both partners must agree to proceed.';
  data: {
    requestedBy: string;
    requestedAt: string;
    gracePeriodEnds: string;
  };
  read: false;
  createdAt: string;
}
```

---

## Email Integration (TODO)

Currently, email notifications are logged to console. To enable actual emails:

### Option 1: Sendgrid
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY'));

await sgMail.send({
  to: partner.email,
  from: 'noreply@twobeone.app',
  subject: 'Partner Disconnect Request',
  html: emailTemplate
});
```

### Option 2: Resend
```typescript
import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

await resend.emails.send({
  from: 'TwoBeOne <noreply@twobeone.app>',
  to: partner.email,
  subject: 'Partner Disconnect Request',
  html: emailTemplate
});
```

### Email Templates Needed

1. **Disconnect Request** - Notify partner of initial request
2. **Both Agreed** - Confirm grace period has started
3. **Request Cancelled** - Notify both of cancellation
4. **Final Disconnection** - Confirm partnership ended

---

## Security Considerations

### Authorization
- ✅ All endpoints require valid access token
- ✅ Users can only disconnect their own partnership
- ✅ Cannot disconnect without being linked to a partner

### Data Integrity
- ✅ Couple records archived (not deleted)
- ✅ Prevents accidental data loss
- ✅ Maintains relationship history

### Race Conditions
- ✅ Disconnect status checked before actions
- ✅ Cannot cancel completed disconnections
- ✅ Grace period expiration handled atomically

---

## Testing

### Manual Test Cases

#### Test 1: Request Disconnect (Pending)
1. User A navigates to Settings → Couple → Danger Zone
2. Clicks "Request Partner Disconnect"
3. Reviews warning, clicks Continue
4. Confirms request
5. ✅ User A sees "Waiting for partner"
6. ✅ User B receives notification
7. ✅ Email logged to console

#### Test 2: Both Agree
1. User B sees notification
2. Opens disconnect dialog
3. Clicks "Agree to Disconnect"
4. ✅ Both users see "Both partners agreed"
5. ✅ 30-day countdown displayed
6. ✅ Both receive notifications
7. ✅ Emails logged to console

#### Test 3: Cancel Request
1. Either user clicks "Cancel Disconnect"
2. ✅ Request deleted
3. ✅ Both receive cancellation notifications
4. ✅ Emails logged to console
5. ✅ Partnership remains intact

#### Test 4: Grace Period Expiration
1. Set grace period to past date (for testing)
2. Either user checks status
3. ✅ Auto-disconnect executes
4. ✅ Both users notified
5. ✅ partnerId/coupleId set to null
6. ✅ Couple record archived

---

## Error Handling

### Common Errors

| Error | Cause | User Message |
|-------|-------|--------------|
| No partner connection | User not linked | "No partner connection found" |
| Already requested | User clicked twice | "You have already requested to disconnect" |
| No active request | Trying to cancel non-existent request | "No active disconnect request found" |
| Already completed | Grace period ended | "Disconnect already completed" |

### Error Responses

```json
{
  "error": "Error message",
  "status": "current_status",
  "gracePeriodEnds": "..."
}
```

---

## Future Enhancements

### Potential Improvements

1. **Custom Grace Period**
   - Allow couples to set custom grace period (7, 14, 30, 60, 90 days)
   - Default remains 30 days

2. **Reconnection Cooldown**
   - Prevent immediate re-linking after disconnect
   - Cooling off period (e.g., 7 days)

3. **Disconnect Reasons**
   - Optional reason selection
   - Anonymous analytics for app improvement

4. **Counseling Resources**
   - Suggest Christian counseling before disconnect
   - Partnership difficulty resources
   - Prayer/meditation guides

5. **Data Export Before Disconnect**
   - Automatic export offer before final disconnection
   - Downloadable relationship memories

6. **Mediation Process**
   - Optional third-party mediation
   - Pastor/counselor involvement option

---

## Troubleshooting

### Issue: Request not showing
**Solution:** Refresh the page or check disconnect status endpoint

### Issue: Grace period not ending
**Solution:** Status check happens when users load the dialog. Auto-cleanup could be added via scheduled function

### Issue: Notifications not sent
**Solution:** Check console logs, ensure notification system is working

### Issue: Email not received
**Solution:** Email integration not yet implemented. Check console logs for TODO messages

---

## Files Modified/Created

### Backend
- ✅ `/supabase/functions/server/index.tsx` - Added 3 endpoints + helper function

### Frontend
- ✅ `/utils/api.ts` - Added `partnerApi` with 3 methods
- ✅ `/components/PartnerDisconnectDialog.tsx` - New UI component
- ✅ `/components/SettingsScreen.tsx` - Integrated disconnect button

### Documentation
- ✅ `/PARTNER_DISCONNECT_SYSTEM.md` - This file

---

## Summary

The Partner Disconnect System provides a **safe, thoughtful, and reversible** way for couples to end their partnership connection in TwoBeOne. The mutual agreement requirement and 30-day grace period ensure that the decision is well-considered and can be reversed if partners reconcile.

**Key Benefits:**
- ✅ Protects against impulsive decisions
- ✅ Requires mutual consent
- ✅ Provides time for reconsideration
- ✅ Maintains data integrity
- ✅ Sends clear notifications
- ✅ Preserves individual privacy after disconnect

---

**Last Updated:** November 19, 2024  
**Status:** ✅ Implemented and ready for testing  
**Email Integration:** ⏳ Pending (console logs active)
