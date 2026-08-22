# TwoBeOne Dual Language System

## Overview
TwoBeOne now has a sophisticated dual-language system that separates **UI Language** from **Content Language**.

## Architecture

### 1. UI Language (User Interface)
- **Context**: `LanguageContext` in `/contexts/LanguageContext.tsx`
- **Hook**: `useLanguage()`
- **Purpose**: Controls the language of interface elements (buttons, labels, navigation, etc.)
- **Usage**: Users can switch between English and Amharic for the app interface
- **Location**: Settings screen, affects entire app UI

### 2. Content Language (Admin Panel)
- **Context**: `ContentLanguageContext` in `/contexts/ContentLanguageContext.tsx`
- **Hook**: `useContentLanguage()`
- **Purpose**: Controls the language of content being created/edited in admin panel
- **Usage**: Admins select language when creating devotionals, prayers, questions, etc.
- **Location**: Admin panel only, doesn't affect admin panel UI

## How It Works

### For Regular Users:
1. User opens Settings
2. Selects preferred UI language (English or Amharic)
3. **Entire app interface** changes to selected language
4. **Content is displayed** based on the content's own language field

### For Admin Users Creating Content:
1. Admin opens Admin Panel (interface stays in their preferred UI language)
2. When creating new content (devotional, prayer, question):
   - Sees `ContentLanguageSelector` component at top of form
   - Selects content language (English or Amharic)
   - This does NOT change the admin panel interface
3. Content is created with the selected language tag
4. Users will see this content based on their content language preference

## Implementation Details

### Admin Panel Components with Content Language:
- ✅ `DevotionalsManager` - Fully implemented
- 🔄 `QuestionsManager` - Needs implementation
- 🔄 `ModulesManager` - Needs implementation
- 🔄 Other content managers - Needs implementation

### Database Schema:
All content tables should have a `language` field:
```javascript
{
  id: string,
  // ... other fields ...
  language: 'en' | 'am'  // Content language
}
```

### Content Language Selector Component:
Located at `/components/admin/ContentLanguageSelector.tsx`
- Shows current content language selection
- Allows switching between English and Amharic
- Visual indicator showing which language content will be created in
- Does not affect admin panel UI

## Example User Flows

### Flow 1: Admin Creating Amharic Content
1. Admin panel interface is in English (their preference)
2. Admin clicks "New Devotional"
3. Clicks "Amharic (አማርኛ)" button in Content Language Selector
4. Types devotional content in Amharic
5. Saves - content is tagged with language: 'am'
6. Amharic-speaking users will see this content

### Flow 2: User Viewing Content
1. User has UI set to English
2. App interface is in English
3. User's content language preference is Amharic
4. User sees devotionals, prayers, etc. in Amharic
5. UI elements (buttons, menus) remain in English

## Benefits

1. **Flexibility**: Admins can create content in any language regardless of their preferred UI language
2. **Clarity**: Clear separation between what language the interface is in vs. what language the content is in
3. **Scalability**: Easy to add more languages in the future
4. **User Choice**: Users get content in their preferred language with UI in their comfortable language

## Next Steps

To complete the content language system:

1. Add ContentLanguageSelector to all admin content managers (Questions, Modules, Groups)
2. Update backend to store language field for all content types
3. Update frontend to filter content by user's preferred content language
4. Add user preference for content language in settings
5. Implement fallback logic (e.g., show English if Amharic not available)
