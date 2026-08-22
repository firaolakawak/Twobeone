# 🔑 Invite Code System - Complete Guide

## Overview
The TwoBeOne app now has a complete invite code system for connecting partners. Each user gets a unique code when they create their account.

## 📍 Where to Find Your Invite Code

### Option 1: Database Viewer (Recommended)
1. Open `/db-viewer.html` in your browser
2. Sign in with your credentials
3. Your invite code is displayed prominently in a blue card
4. You can also see all users in the database

### Option 2: Settings Screen
1. Open the TwoBeOne app
2. Go to **Settings** → **Couple** tab
3. Your invite code is shown in a blue card under "My Invite Code"
4. Click the "Copy" button to copy it to clipboard

## 🔗 How to Link Partners

### Method 1: Using Invite Code
1. User A creates account → Gets code `COUPLE1234ABC`
2. User A shares code with User B
3. User B goes to Settings → Couple tab
4. User B enters code in "Link by Code" section
5. Click "Link" button
6. ✅ Both partners are now connected!

### Method 2: Using Email
1. Go to `/setup-partner.html`
2. Sign in with your credentials
3. Enter partner's email
4. Click "Connect with Partner"

## 🎯 Features

### Auto-Generated Codes
- Format: `COUPLE[timestamp][random]`
- Example: `COUPLE1731276815ABC123`
- Unique for each user
- Generated automatically on signup

### Mutual Connection
- When User B links with User A's code
- Both profiles are automatically updated
- Both can see each other's shared content

### Database Storage
- User profile includes `inviteCode` field
- Mapping stored as `inviteCode:CODEHERE` → user info
- Fast lookup for linking

## 📊 Database Viewer Features

The `/db-viewer.html` page shows:

1. **Your Profile**
   - User ID
   - Name and Email
   - Invite Code (highlighted)
   - Partner status
   - Relationship start date
   - Account creation date

2. **Partner Information** (if connected)
   - Partner's name and email
   - Partner's invite code
   - Connection status

3. **All Users List**
   - Every user in the database
   - Each user's invite code
   - Partner connection status
   - Quick copy button for codes

## 🛠️ Technical Details

### Backend Endpoints

1. **POST /profile/link-by-code**
   - Links partners using invite code
   - Updates both user profiles
   - Returns success and partner info

2. **GET /users**
   - Returns all users in database
   - Requires authentication
   - Shows full profile data

3. **POST /signup**
   - Auto-generates invite code
   - Stores code mapping
   - Returns code to user

### Frontend Components

1. **SettingsScreen**
   - Shows invite code in blue card
   - Copy button for easy sharing
   - Link by code input (when no partner)
   - Status indicators

2. **Database Viewer**
   - Standalone HTML page
   - No React dependencies
   - Full database visibility
   - Real-time data

## 📝 Example Usage

### Scenario: Firaol wants to connect with Lensa

1. **Firaol opens db-viewer.html**
   - Signs in
   - Sees his code: `COUPLE1731276815XYZ789`
   - Copies the code

2. **Firaol shares code with Lensa**
   - Via SMS, email, or in person

3. **Lensa creates her account**
   - Gets her own code automatically

4. **Lensa links with Firaol**
   - Opens TwoBeOne app
   - Goes to Settings → Couple tab
   - Enters `COUPLE1731276815XYZ789` in "Link by Code"
   - Clicks "Link"

5. **✅ Connected!**
   - Both can see each other in settings
   - Both can share content
   - Relationship start date is set

## 🎨 UI Design

### Invite Code Card (Blue)
```
┌─────────────────────────────────────┐
│ 🔑 My Invite Code          📋 Copy  │
├─────────────────────────────────────┤
│ Share this code with your partner:  │
│                                     │
│  🔑  COUPLE1731276815XYZ789        │
│                                     │
└─────────────────────────────────────┘
```

### Link by Code Card (Purple)
```
┌─────────────────────────────────────┐
│ 🔑 Link by Code                     │
├─────────────────────────────────────┤
│ Connect with your partner using     │
│ their invite code                   │
│                                     │
│ [Enter partner's code    ] [Link]  │
└─────────────────────────────────────┘
```

## 🔐 Security

- Codes are unique and hard to guess
- Authentication required for all operations
- Mutual consent (both must have accounts)
- No public code listing

## 🚀 Next Steps

After linking:
1. Set relationship start date in Settings
2. Start sharing journal entries
3. Create shared prayer requests
4. Track relationship milestones
5. Join community groups together

---

**Need Help?**
- Check the database viewer to see your code
- Contact support if codes aren't working
- Make sure both partners have created accounts

**Created:** November 9, 2025
**Last Updated:** November 9, 2025
