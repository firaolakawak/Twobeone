# Q&A Discussion Questions System - Complete Guide

## Overview
The Q&A Discussion Questions system is fully implemented with backend integration, allowing admins to create, edit, and delete discussion questions that are dynamically displayed to users.

## System Architecture

### Backend (Supabase Edge Functions)
Location: `/supabase/functions/server/index.tsx`

#### Admin Routes (Require Admin Authentication)
- `POST /make-server-6d579fee/admin/questions` - Create a new question
- `PUT /make-server-6d579fee/admin/questions/:id` - Update existing question
- `DELETE /make-server-6d579fee/admin/questions/:id` - Delete a question
- `GET /make-server-6d579fee/admin/questions/list` - List all questions (active and inactive)

#### User Routes (Require User Authentication)
- `GET /make-server-6d579fee/questions?category={category}` - Get active questions (optionally filtered by category)
- `POST /make-server-6d579fee/questions/:questionId/responses` - Save user's answers to a question
- `GET /make-server-6d579fee/questions/:questionId/responses` - Get user's and partner's responses

### Admin Panel Component
Location: `/components/admin/QuestionsManager.tsx`

**Features:**
- ✅ Create new discussion questions with multiple prompts
- ✅ 7 question types supported:
  - Text Response
  - Multiple Choice (select one)
  - Multiple Select (select multiple)
  - Like/Dislike (thumbs up/down)
  - Love/Hate (heart/broken heart)
  - Rating Scale (1-5 or 1-10)
  - Yes/No
- ✅ Edit existing questions
- ✅ Delete questions
- ✅ Search and filter by category
- ✅ Set question status (active/inactive)
- ✅ Add Bible verses and references
- ✅ Organize by 11 categories

**Categories:**
1. Daily Life & Habits
2. Intimacy & Lifestyle
3. Love & Balance
4. Dream Wedding / Dream Home
5. Travel & Adventure
6. Relationship Boundaries
7. Trust & Truth
8. Kids & Future
9. Finance & Goals
10. Family Relations
11. Bible Convictions

### User-Facing Component
Location: `/components/QADiscussionHub.tsx`

**Features:**
- ✅ Dynamically fetches questions from backend
- ✅ Category filtering
- ✅ Question carousel navigation
- ✅ Loading and empty states
- ✅ Integration with QuestionCard for answering
- ✅ AI Assistant integration
- ✅ Progress tracking (answered, discussed)

## How to Use

### As an Admin

1. **Access Admin Panel:**
   - Navigate to Admin Panel > Q&A Questions tab
   - You must be logged in as an admin (email contains "admin")

2. **Create a New Question:**
   - Click "New Question" button
   - Fill in:
     - Category (dropdown)
     - Status (active/inactive)
     - Question Title
     - Bible Verse (full text)
     - Verse Reference (e.g., "Mark 1:35")
   - Add discussion questions/prompts:
     - Click "Add Question"
     - Select question type
     - Enter question text
     - Add options for multiple choice/select types
     - Set scale max for rating scale types
   - Click "Create Question"

3. **Edit a Question:**
   - Click the edit icon on any question card
   - Modify fields as needed
   - Click "Update Question"

4. **Delete a Question:**
   - Click the delete icon on any question card
   - Confirm deletion

5. **Filter Questions:**
   - Use search bar to search by title or verse reference
   - Use category dropdown to filter by category
   - View stats at the top (total, active, categories, prompts)

### As a User

1. **View Questions:**
   - Navigate to Q&A Discussion Hub
   - Questions are automatically loaded from the backend
   - View questions by category or all questions

2. **Answer Questions:**
   - Browse through questions using Previous/Next buttons
   - Answer prompts based on question type
   - Save your responses

3. **Track Progress:**
   - View stats at top: Total Questions, Answered, Discussed
   - See which questions you and your partner have answered

## Data Storage

### Question Storage
Questions are stored in the Supabase KV store with the key pattern:
```
question:{questionId}
```

**Question Object Structure:**
```typescript
{
  id: string;
  category: string;
  title: string;
  verse: string;
  verseReference: string;
  prompts: [
    {
      id: string;
      text: string;
      type: 'text' | 'multiple_choice' | 'multiple_select' | 'like_dislike' | 'love_hate' | 'scale' | 'yes_no';
      options?: string[];  // For multiple_choice and multiple_select
      scaleMax?: number;   // For scale type (5 or 10)
    }
  ];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

### Response Storage
User responses are stored with the key pattern:
```
question-response:{userId}:{questionId}
```

**Response Object Structure:**
```typescript
{
  userId: string;
  questionId: string;
  coupleId: string | null;
  answers: {
    [promptId: string]: any  // Answer format depends on question type
  };
  createdAt: string;
  updatedAt: string;
}
```

## Question Type Details

### 1. Text Response
- Free-form text input
- No additional configuration needed

### 2. Multiple Choice
- User selects ONE option
- Admin must provide at least 2 options
- Options configured in admin panel

### 3. Multiple Select
- User can select MULTIPLE options
- Admin must provide at least 2 options
- Options configured in admin panel

### 4. Like/Dislike
- Simple thumbs up or thumbs down
- No additional configuration needed

### 5. Love/Hate
- Heart or broken heart selection
- No additional configuration needed

### 6. Rating Scale
- User rates on a scale
- Admin chooses 1-5 or 1-10 scale
- Configured in admin panel

### 7. Yes/No
- Simple yes or no response
- No additional configuration needed

## Testing the System

### Test as Admin:
1. Login as admin (email must contain "admin")
2. Go to Admin Panel > Q&A Questions
3. Create a new question with multiple prompts of different types
4. Verify question appears in the list
5. Edit the question and verify changes
6. Test search and filter functionality

### Test as User:
1. Login as a regular user
2. Navigate to Q&A Discussion Hub
3. Verify questions load from backend
4. Test category filtering
5. Answer questions and verify responses save
6. Check progress tracking

## Future Enhancements
- [ ] Couple-shared responses view
- [ ] Response comparison UI
- [ ] Question analytics dashboard
- [ ] Scheduled question delivery
- [ ] Push notifications for new questions
- [ ] Question favorites/bookmarks
- [ ] Export responses as PDF

## Troubleshooting

### Questions not loading
- Check browser console for errors
- Verify user is authenticated
- Check backend logs in Supabase dashboard
- Ensure questions exist and are marked as "active"

### Cannot create/edit questions
- Verify admin authentication (email must contain "admin")
- Check all required fields are filled
- Ensure at least one prompt is added
- Verify prompts with options have at least 2 valid options

### Responses not saving
- Verify user is authenticated
- Check all prompts have been answered
- Check browser console for API errors
- Verify question exists in backend

## API Authentication
All API calls require authentication:
- Admin routes: Use admin user's access token
- User routes: Use regular user's access token
- Access tokens are automatically retrieved from Supabase session

## Notes
- Questions marked as "inactive" will not appear to users
- Only questions with status "active" are fetched by the user-facing component
- Admin can see both active and inactive questions
- Responses are linked to user's couple ID for partner response viewing
