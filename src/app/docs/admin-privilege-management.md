# TwoBeOne Admin Privilege Management System

## Overview

The Admin Privilege Management system allows authorized administrators to grant or revoke admin privileges to other users through a web-based UI. This system replaces the previous hardcoded email-based admin access with a dynamic, database-driven approach.

## Features

### 🔐 Core Capabilities
- **Grant Admin Privileges**: Promote any user to admin status
- **Revoke Admin Privileges**: Demote admins to regular users
- **View All Users**: Browse all registered users with their admin status
- **View Active Admins**: See a list of all current administrators
- **Activity Log**: Complete audit trail of all privilege changes

### 🛡️ Security Features
- **Self-Revocation Protection**: Users cannot revoke their own admin privileges
- **Last Admin Protection**: System prevents removal of the last admin
- **Backend Validation**: All operations validated on the server
- **Audit Trail**: Complete logging of who granted/revoked privileges and when
- **Authorization Required**: All endpoints require valid admin authentication

### 🎨 User Interface
- **Three-Tab Layout**: 
  - All Users: Complete user list with grant/revoke controls
  - Admins: Dedicated view of current administrators
  - Activity Log: Historical record of privilege changes
- **Search Functionality**: Filter users by email or name
- **Real-time Updates**: Immediate UI updates after privilege changes
- **Confirmation Dialogs**: Detailed warnings before granting/revoking privileges
- **Beautiful Design**: Gradient backgrounds, icons, and intuitive layout

## Backend API Endpoints

### GET `/admin/privileges/list`
Returns list of all current administrators.

**Response:**
```json
{
  "admins": [
    {
      "id": "user-id",
      "email": "admin@example.com",
      "name": "Admin Name",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET `/admin/privileges/users`
Returns list of all users with their admin status.

**Response:**
```json
{
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "isAdmin": false,
      "hasPartner": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET `/admin/privileges/check`
Checks if the current user has admin privileges.

**Response:**
```json
{
  "isAdmin": true
}
```

### POST `/admin/privileges/grant`
Grants admin privileges to a user.

**Request:**
```json
{
  "targetUserId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin privileges granted to user@example.com",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### POST `/admin/privileges/revoke`
Revokes admin privileges from a user.

**Request:**
```json
{
  "targetUserId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin privileges revoked from user@example.com",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### GET `/admin/privileges/activity-log`
Returns complete history of privilege changes.

**Response:**
```json
{
  "activityLog": [
    {
      "action": "granted",
      "targetUser": {
        "id": "user-id",
        "email": "user@example.com",
        "name": "User Name"
      },
      "performedBy": {
        "id": "admin-id",
        "email": "admin@example.com",
        "name": "Admin Name"
      },
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Data Storage

### Admin List
- **Key**: `system:admins`
- **Type**: Array of user IDs
- **Example**: `["user-id-1", "user-id-2", "user-id-3"]`

### User Profile Fields
When a user is granted admin privileges, their profile is updated with:
- `adminAddedAt`: ISO timestamp of when admin was granted
- `adminAddedBy`: User ID of the admin who granted the privilege (or "system")

When admin privileges are revoked:
- `adminRevokedAt`: ISO timestamp of when admin was revoked
- `adminRevokedBy`: User ID of the admin who revoked the privilege
- `adminAddedAt` and `adminAddedBy` are deleted

## Default Admins

The system initializes with four default admin accounts (if they exist in the database):
- admin@twobeone.com
- naf@gmail.com
- abdigetu1710@gmail.com
- mahtebng@gmail.com

These are automatically added to the admin list when the server starts, if they have registered accounts.

## Accessing the Privilege Manager

1. Sign in as an admin user
2. Navigate to Settings (Profile tab)
3. Click "Admin Panel" button
4. Select "Privileges" from the navigation menu

## Security Considerations

### What Admins Can Do
✅ Grant admin privileges to any user  
✅ Revoke admin privileges from other users  
✅ View all users and their data  
✅ Manage content (devotionals, questions, modules)  
✅ View system statistics  

### What Admins Cannot Do
❌ Revoke their own admin privileges  
❌ Delete the last admin account  
❌ Modify the KV store directly  

### Audit Trail
All privilege changes are logged with:
- Who performed the action
- What action was performed (grant/revoke)
- Who was affected
- When it occurred

## Files

### Backend
- `/supabase/functions/server/admin_routes.tsx` - API endpoints for privilege management
- `/supabase/functions/server/init_admins.tsx` - Admin system initialization
- `/supabase/functions/server/index.tsx` - Server integration

### Frontend
- `/components/admin/PrivilegeManager.tsx` - UI component for managing privileges
- `/components/AdminPanel.tsx` - Admin panel navigation
- `/App.tsx` - Admin status checking and routing
- `/components/SettingsScreen.tsx` - Admin panel access button

## Usage Examples

### Granting Admin to a New User

1. User registers with email: `newadmin@example.com`
2. Existing admin navigates to Admin Panel → Privileges → All Users
3. Admin searches for `newadmin@example.com`
4. Admin clicks "Grant Admin" button
5. Confirms the action in the dialog
6. System grants privileges and logs the action
7. New admin can now access the Admin Panel

### Revoking Admin Access

1. Admin navigates to Admin Panel → Privileges → Admins
2. Finds the user to demote
3. Clicks "Revoke" button
4. Confirms the action
5. System revokes privileges (if not self or last admin)
6. User loses admin access immediately

### Viewing Activity Log

1. Admin navigates to Admin Panel → Privileges → Activity Log
2. Views chronological list of all privilege changes
3. Can see who granted/revoked privileges to whom
4. Each entry shows timestamp and action details

## Troubleshooting

### Admin Access Not Working
1. Check if `system:admins` key exists in KV store
2. Verify user ID is in the admin list
3. Check server logs for initialization errors
4. Try restarting the server to trigger re-initialization

### Cannot Grant Privileges
- Ensure you are signed in as an admin
- Check that target user exists
- Verify user is not already an admin
- Check server logs for error messages

### Cannot Revoke Privileges
- Ensure you are not trying to revoke yourself
- Check that user is actually an admin
- Verify you are not revoking the last admin
- Check server logs for error messages

## Migration Notes

### From Hardcoded Email List
The previous system used hardcoded email checks:
```typescript
const adminEmails = ['admin@twobeone.com', 'naf@gmail.com', ...];
const isAdmin = adminEmails.includes(email);
```

The new system:
- Stores admin IDs in KV store under `system:admins`
- Checks admin status via backend API
- Allows dynamic privilege management
- Maintains audit trail

### Backward Compatibility
The system includes a fallback check for emails containing "admin" for backward compatibility during transition period. This can be removed once all admins are properly migrated.

## Future Enhancements

Potential improvements:
- Role-based permissions (e.g., Content Editor, User Manager, Super Admin)
- Time-limited admin access
- Email notifications for privilege changes
- Two-factor authentication for admin actions
- Bulk admin operations
- Export audit log to CSV
