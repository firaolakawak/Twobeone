# 📖 Daily Devotions & Devotional Streak - Explained

## What is Daily Devotions?

**Daily Devotions** (also called Daily Devotionals) is a core feature of TwoBeOne that provides **Bible-based spiritual content** for couples to read together every day.

### 🌅 How It Works

Each day, TwoBeOne provides a new devotional that includes:
1. **📖 Bible Verse** - A scripture passage (e.g., "1 Corinthians 13:4-7")
2. **💭 Reflection** - Spiritual teaching/meditation on the verse
3. **❤️ Application** - How it applies to your relationship
4. **🙏 Prayer Prompt** - Suggested prayer for the couple

### 📱 Where to Find It

- **Home Tab → Daily Devotional Card** - Featured on dashboard
- **Devotions Tab** (if available) - Browse past devotionals
- **Push Notifications** - Morning reminder (8 AM by default)

---

## What is Devotional Streak? 🔥

**Devotional Streak** tracks how many **consecutive days** you've read your daily devotional. It's a motivation system to help couples build a consistent spiritual habit together.

### 🎯 How Streaks Work

**Example:**
```
Day 1: Read devotional → Streak = 1 day ✅
Day 2: Read devotional → Streak = 2 days ✅
Day 3: Read devotional → Streak = 3 days ✅
Day 4: Missed devotional → Streak = 0 days ❌ (resets)
Day 5: Read devotional → Streak = 1 day ✅ (starts over)
```

### 📊 Streak Display

You'll see your devotional streak on the dashboard:

```
┌─────────────────────────┐
│  Devotional Streak      │
│                         │
│         7               │ ← Number of days
│        days             │
│                         │
│  🗓️ Calendar Icon       │
└─────────────────────────┘
```

**Location:** Home Tab → Quick Stats Grid → Purple Card (top left)

---

## 🛠️ Technical Implementation

### Backend Logic

#### 1. **Mark Devotional as Complete**

When you tap "Mark as Read" on a devotional:

```typescript
// API Endpoint
POST /make-server-6d579fee/devotional-completions

// Request
{
  devotion_id: "dev_2024_01_15",
  notes: "Optional reflection notes"
}

// Response
{
  success: true,
  completion: {
    user_id: "user_123",
    devotion_id: "dev_2024_01_15",
    completed_at: "2024-01-15T08:30:00Z"
  }
}
```

#### 2. **Streak Calculation**

The backend automatically calculates your streak:

```typescript
async function updateStreak(userId: string, streakType: 'devotional') {
  const today = new Date().toISOString().split('T')[0]; // "2024-01-15"
  
  // Get existing streak from database
  const streak = await getStreak(userId, 'devotional');
  
  if (!streak) {
    // First time - create streak
    createStreak(userId, 'devotional', currentStreak: 1);
    return;
  }
  
  // Calculate days since last activity
  const lastDate = new Date(streak.last_activity_date);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Same day - no change
    return;
  } else if (diffDays === 1) {
    // Consecutive day - increase streak! 🎉
    updateStreak({
      current_streak: streak.current_streak + 1,
      longest_streak: Math.max(streak.longest_streak, streak.current_streak + 1),
      last_activity_date: today
    });
  } else {
    // Missed day(s) - reset streak 😢
    updateStreak({
      current_streak: 1,
      last_activity_date: today
    });
  }
}
```

#### 3. **Get Streak Data**

Frontend fetches your current streak:

```typescript
// API Endpoint
GET /make-server-6d579fee/streaks

// Response
{
  streaks: [
    {
      id: "streak_123",
      user_id: "user_123",
      streak_type: "devotional",
      current_streak: 7,      // 🔥 Current consecutive days
      longest_streak: 21,     // 🏆 Best streak ever
      last_activity_date: "2024-01-15"
    }
  ]
}
```

### Frontend Display

```tsx
// CoupleDashboard.tsx
<Card className="bg-gradient-to-br from-purple-50 to-purple-100">
  <CardContent>
    <p className="text-sm">Devotional Streak</p>
    <p className="text-3xl font-bold">{devotionalStreak}</p>
    <p className="text-xs">{devotionalStreak === 1 ? 'day' : 'days'}</p>
    <Calendar className="w-6 h-6" /> {/* Calendar icon */}
  </CardContent>
</Card>
```

---

## 📅 Database Schema

### `devotions` Table
Stores all devotional content:
```sql
CREATE TABLE devotions (
  id TEXT PRIMARY KEY,              -- e.g., "dev_2024_01_15"
  title TEXT NOT NULL,              -- "Love is Patient"
  reference TEXT NOT NULL,          -- "1 Corinthians 13:4-7"
  verse TEXT NOT NULL,              -- Full verse text
  reflection TEXT NOT NULL,         -- Spiritual reflection
  application TEXT,                 -- How to apply
  prayer TEXT,                      -- Prayer prompt
  date DATE NOT NULL,               -- 2024-01-15
  language TEXT DEFAULT 'en',       -- 'en' or 'am' (Amharic)
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `devotion_completions` Table
Tracks which users completed which devotionals:
```sql
CREATE TABLE devotion_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  devotion_id TEXT REFERENCES devotions(id),
  notes TEXT,                       -- Optional user notes
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, devotion_id)      -- One completion per user per devotion
);
```

### `streaks` Table
Tracks all types of streaks (devotional, prayer, journal, etc.):
```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  streak_type TEXT NOT NULL,        -- 'devotional', 'prayer', 'journal'
  current_streak INTEGER DEFAULT 0, -- Current consecutive days
  longest_streak INTEGER DEFAULT 0, -- Best streak ever
  last_activity_date DATE,          -- Last activity date
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, streak_type)      -- One streak per user per type
);
```

---

## 🎮 User Flow

### Reading a Devotional

1. **User opens TwoBeOne** → Sees daily devotional on dashboard
2. **Taps devotional card** → Opens full devotional dialog
3. **Reads** Bible verse + reflection + application
4. **Taps "Mark as Read"** button at bottom
5. **Backend processes**:
   - Saves completion to `devotion_completions` table
   - Updates `streaks` table (increases streak by 1)
   - Returns updated streak count
6. **UI updates**:
   - Button changes to "Completed Today ✓"
   - Streak counter increases on dashboard
   - Confetti animation (optional) 🎉

### Viewing Streak

**Option 1: Dashboard Quick Stat**
- Home Tab → Purple card shows current streak

**Option 2: Progress Section**
- Progress Tab → "Spiritual Growth" section shows:
  - Current devotional streak
  - Longest devotional streak ever
  - Graph of devotional completion history

---

## 🌟 Benefits of Devotional Streaks

### For Couples
✅ **Builds Consistency** - Encourages daily Bible reading
✅ **Accountability** - Both partners see each other's progress
✅ **Motivation** - Gamification makes it fun
✅ **Spiritual Growth** - Regular scripture engagement
✅ **Shared Experience** - Something to do together daily

### Psychological Impact
- **Habit Formation** - 21-day streak builds lasting habits
- **Achievement** - Reaching milestones (7, 14, 30, 100 days)
- **Loss Aversion** - Don't want to break the streak!
- **Social Proof** - Partner's streak motivates you

---

## 📲 Push Notifications

### Daily Reminders
TwoBeOne can send notifications to help maintain streaks:

**Morning Devotional Reminder** (8:00 AM)
```
🌅 Good morning!
Your daily devotional is ready.
Current streak: 7 days 🔥
```

**Streak Milestone** (Achievement unlocked)
```
🎉 Amazing! 30-Day Streak!
You've read devotionals for 30 consecutive days!
Keep it up! 💪
```

**Streak Warning** (Evening, if not completed)
```
⚠️ Don't break your streak!
You haven't read today's devotional yet.
7-day streak at risk 😢
```

---

## 🏆 Streak Milestones

### Achievements
```
🌱 First Step       - 1 day
🔥 Hot Streak       - 7 days
⭐ Committed        - 14 days
💪 Strong Habit     - 21 days (habit formed!)
👑 Dedicated        - 30 days
🏅 Champion         - 50 days
🎖️ Elite            - 100 days
🌟 Legendary        - 365 days (1 year!)
```

### Rewards (Optional Future Enhancement)
- Unlock special devotional series
- Earn badges/trophies
- Unlock couples quizzes
- Get featured on community board
- Unlock advanced spiritual content

---

## 📈 Progress Tracking

### What Gets Tracked
1. **Current Streak** - Consecutive days (resets if you miss a day)
2. **Longest Streak** - Your personal best (never resets)
3. **Total Completions** - How many devotionals you've read (all-time)
4. **Completion Rate** - % of available devotionals you've completed
5. **Last Activity** - When you last read a devotional

### Example Progress Display
```
┌─────────────────────────────────────┐
│  Your Devotional Progress           │
├─────────────────────────────────────┤
│                                     │
│  Current Streak:     7 days  🔥     │
│  Longest Streak:    21 days  🏆     │
│  Total Read:       156      📖      │
│  Completion Rate:   85%     ⭐      │
│  Last Activity:    Today    ✓       │
│                                     │
└─────────────────────────────────────┘
```

---

## 💑 Couples Features

### Both Partners Track Separately
- **Each person** has their own devotional streak
- **Independent progress** - your streak doesn't affect partner's
- **Visible to both** - both can see each other's streaks
- **Encouragement** - Motivate each other to keep going!

### Shared Reading (Optional)
- Mark devotional as "Read Together" ✓
- Both partners get credit
- Special "Couples Streak" counter
- Celebrate milestones together

---

## 🔧 Troubleshooting

### "My streak reset but I read yesterday!"
**Possible causes:**
1. Different time zones (crossed midnight)
2. Didn't tap "Mark as Read" button
3. Internet connection issue (completion didn't save)
4. Read after midnight (counts as next day)

**Solution:** Read devotionals in the morning for consistency

### "Streak not updating"
**Try:**
1. Pull to refresh the dashboard
2. Tap devotional card to open
3. Ensure "Mark as Read" button is enabled
4. Check internet connection
5. Restart app

### "Want to recover lost streak"
**Unfortunately:** Streaks are automatic and can't be manually adjusted
**Tip:** Start fresh and use daily reminders to avoid missing days

---

## 🎯 Best Practices

### For Building Long Streaks

1. **Set a Daily Time** - Read at the same time daily (e.g., morning coffee)
2. **Enable Notifications** - Let TwoBeOne remind you
3. **Read Together** - Make it a couples ritual
4. **Don't Just Click** - Actually read and reflect
5. **Add Notes** - Write your thoughts (optional but meaningful)
6. **Discuss** - Talk about the devotional with your partner
7. **Pray Together** - Use the prayer prompt

### For Couples

1. **Morning Routine** - Read devotional over breakfast
2. **Accountability** - Check each other's streaks
3. **Encouragement** - Celebrate milestones together
4. **Recovery Plan** - If one misses, encourage restart
5. **Shared Goal** - Aim for 30-day couples streak

---

## 📊 Statistics (Example)

### Average User Stats
```
Average Streak:           14 days
Longest Recorded Streak: 547 days (1.5 years!) 🤯
Most Popular Time:        7:00 AM - 9:00 AM
Completion Rate:          68%
Couples with >30 days:    23%
```

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Streak recovery (1 grace day per month)
- [ ] Couples streak (both must complete)
- [ ] Streak leaderboard (optional, opt-in)
- [ ] Weekly devotional series (7-day themes)
- [ ] Audio devotionals (listen while commuting)
- [ ] Devotional discussions (comment section)
- [ ] Share favorite devotionals
- [ ] Custom devotionals (create your own)
- [ ] Streak freeze (vacation mode)
- [ ] Achievement badges
- [ ] Printable certificates for milestones

---

## 📝 Summary

**Daily Devotions** = Daily Bible-based content for spiritual growth
**Devotional Streak** = Consecutive days you've read devotionals

### Quick Facts
- ✅ New devotional every day
- ✅ Includes verse + reflection + application
- ✅ Tap "Mark as Read" to complete
- ✅ Streak increases by 1 each consecutive day
- ✅ Miss a day = streak resets to 0
- ✅ Visible on dashboard (purple card)
- ✅ Push notifications help maintain streak
- ✅ Both partners track independently
- ✅ Builds spiritual discipline & consistency

---

## 🙏 Spiritual Purpose

The devotional streak system isn't just gamification—it's a tool to help couples:
- **Build spiritual habits** that last a lifetime
- **Stay connected to God** daily
- **Grow together** in faith
- **Strengthen their relationship** through shared spiritual practice
- **Experience transformation** through consistent Bible engagement

*"Do not conform to the pattern of this world, but be transformed by the renewing of your mind." - Romans 12:2*

---

**TwoBeOne - Strengthening relationships through faith, one day at a time** 💜📖

*Current Version: 1.0.0*
