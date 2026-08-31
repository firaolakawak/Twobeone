# TwoBeOne

TwoBeOne is a free, faith-centered relationship app designed for Christian couples. It gives two partners a private shared space to strengthen their relationship with each other and with God.

Its main features include:

- Daily Scripture-based devotionals and reflection prompts
- Shared prayer requests and answered-prayer tracking
- Private and shared couple journaling
- More than 1,000 conversation questions across faith, family, finance, intimacy, trust, and everyday life
- Partner chat, shared calendar, reminders, and relationship milestones
- Mood tracking, weekly reports, and AI-generated relationship insights
- Pre-marriage lessons, quizzes, and marriage-readiness reports
- Scripture memorization and Bible reading
- Christian community groups
- Progress, engagement, and devotional-streak tracking

Each person creates an account, then connects with their partner using a unique invitation code. Couple-related content is synchronized between the two accounts.

The app supports English, Amharic, and Afaan Oromo, making it particularly relevant to Ethiopian Christian communities. It is intended for dating, engaged, newlywed, and married couples.

Technically, the primary product is a React and TypeScript Progressive Web App built with Vite. It uses Supabase for authentication, database storage, server functions, partner synchronization, and authorization. It also includes offline support, install-to-home-screen functionality, push notifications, an administration console, newsletters, and AI-assisted analysis.

One important repository observation: it contains both the main Vite PWA and an Expo/React Native starter structure. The Vite application under [`src/app/App.tsx`](src/app/App.tsx) appears to be the developed product, while parts of the root Expo setup do not accurately describe the full app yet. The project is feature-rich, but the documentation and duplicate platform structure would benefit from consolidation before production handoff.



# Character Development Game Plan

## Working title

**Build the House That Honors God**

A 365-day character-development journey where a couple builds a large virtual house one block at a time. Every block represents a small act of faith, character, love, or commitment.

The central message:

> “Unless the Lord builds the house, the builders labor in vain.” — Psalm 127:1

The house represents both the couple’s relationship and the character they are developing together. God’s Word forms the foundation; prayer, integrity, forgiveness, wisdom, and love form the rest of the structure.

## 1. Core experience

Each calendar day:

1. The couple receives one activity.
2. They read a short Scripture passage.
3. Each partner reflects or answers a question.
4. They complete one practical action together.
5. They finish with a short prayer.
6. One new block is added to their house.

Only one new activity can be completed per day. This prevents users from rushing through the journey and reinforces daily commitment.

Completing every available day finishes the house in 365 days. Missed days do not destroy progress—the journey simply takes longer.

## 2. Guiding principles

The experience should encourage growth without creating spiritual pressure.

- Progress represents faithfulness, not spiritual superiority.
- A missed day never removes blocks or damages the house.
- There are no “wrong” emotional answers.
- Activities should be short enough for everyday life.
- Private answers remain private unless the user chooses to share.
- Scripture should be used in context, with references clearly shown.
- The game should emphasize grace, restoration, and consistency rather than perfect streaks.

## 3. The 365-block construction plan

| Stage | Days | Character focus | House result |
|---|---:|---|---|
| Foundation | 40 | God’s Word, identity, faith, values | Foundation stones |
| Floor | 30 | Daily habits, discipline, responsibility | Ground floor |
| Framework | 45 | Trust, honesty, dependability | Structural frame |
| Walls | 55 | Boundaries, protection, unity | Exterior walls |
| Doors and Windows | 30 | Communication, listening, hospitality | Doors and windows |
| Roof | 40 | Commitment, forgiveness, resilience | Roof and covering |
| Rooms | 55 | Love, intimacy, finances, family life | Interior rooms |
| Utilities | 30 | Service, practical care, stewardship | Light and water |
| Interior and Garden | 35 | Peace, gratitude, joy, community | Furnishing and garden |
| Dedication | 25 | Purpose, testimony, future covenant | Finished and dedicated house |
| **Total** | **365** |  | **Completed house** |

The final day could include a house-dedication experience with a shared prayer, review of the journey, and a downloadable certificate or visual of the completed house.

## 4. Meaning of the building materials

Every construction material should have a spiritual meaning:

- **Foundation stones:** Scripture and truth
- **Mortar:** Prayer and unity
- **Wooden beams:** Trust and responsibility
- **Walls:** Healthy boundaries and protection
- **Windows:** Understanding and honest communication
- **Doors:** Hospitality and openness
- **Roof:** Commitment and forgiveness
- **Lights:** Wisdom and encouragement
- **Water:** Grace, renewal, and spiritual life
- **Furniture:** Shared memories and daily acts of love
- **Garden:** Fruit of the Spirit and service to others

These materials are not purchased. They are earned through participation, keeping the experience free and spiritually meaningful.

## 5. Daily activity structure

Each activity should take approximately 7–12 minutes.

### Today’s block

**Theme:** Listening Before Speaking  
**Scripture:** James 1:19  
**Character trait:** Patience  
**Construction reward:** One window block

### Activity steps

1. **Read**  
   Read the selected verse and a brief explanation.

2. **Reflect**  
   “When do you find it most difficult to listen patiently?”

3. **Share**  
   Each partner shares one thought. Answers can remain private until both finish.

4. **Practice**  
   Give your partner three uninterrupted minutes to speak about their day.

5. **Pray**  
   “Lord, help us to be quick to listen, slow to speak, and slow to become angry.”

6. **Place the block**  
   The couple watches the window appear in their house.

## 6. Activity categories

The 365 activities should rotate through several forms to prevent repetition.

- Scripture reflection
- Couple discussion
- Personal character examination
- Practical act of service
- Gratitude exercise
- Apology and forgiveness practice
- Communication challenge
- Financial-stewardship activity
- Prayer activity
- Encouragement challenge
- Community-service action
- Memory-making activity
- Conflict-resolution exercise
- Future-planning conversation
- Scripture memorization

A balanced weekly rhythm could be:

| Day | Activity emphasis |
|---|---|
| Day 1 | God’s Word |
| Day 2 | Personal character |
| Day 3 | Communication |
| Day 4 | Practical love |
| Day 5 | Couple discussion |
| Day 6 | Service or shared action |
| Day 7 | Prayer, gratitude, and weekly reflection |

Users still receive only one activity each day.

## 7. Couple participation

The game should support three completion states:

- **Not started**
- **Waiting for partner**
- **Completed together**

Some activities can be completed individually, but the shared block is fully illuminated when both partners participate.

Recommended flow:

1. Partner A completes a private reflection.
2. Partner B receives a gentle notification.
3. Partner B completes their reflection.
4. Answers are revealed according to each partner’s sharing choice.
5. The couple completes the shared action.
6. Both confirm completion.
7. The block is added to the house.

If only one partner participates, their personal progress is saved without publicly shaming the other partner.

## 8. Progress and motivation

The primary measurement should be completed blocks rather than uninterrupted streaks.

Display:

- `87 of 365 blocks placed`
- Current construction stage
- Percentage of the house completed
- Character traits practiced
- Days completed together
- Favorite Scriptures collected
- Shared prayers offered
- Relationship memories created

Streaks can remain as a secondary encouragement, but breaking a streak should not remove rewards.

Useful celebrations:

- First foundation stone
- First seven blocks
- Foundation completed
- 50 activities together
- 100 activities together
- Half of the house completed
- Every major construction stage
- 365th block and house dedication

## 9. Grace and missed days

This is essential to the game’s tone.

- No blocks are removed after a missed day.
- The house never becomes damaged.
- Users cannot complete multiple activities in one day to rush ahead.
- The next incomplete activity remains available when they return.
- The app can display: “Your house is waiting for you.”
- After a long absence, offer a short “Welcome Back” prayer.
- The 365 blocks represent 365 committed days, not necessarily 365 consecutive days.

This means the shortest completion time is one year, but couples can complete it at a healthy pace.

## 10. Main screens

### Character Journey home

Shows:

- Today’s activity
- Current house preview
- Total blocks placed
- Partner completion state
- Current character trait
- Continue button

### House view

An interactive visual of the house:

- Rotate or zoom the building
- Tap a block to see the activity that earned it
- View construction stages
- Compare the early and current house
- Watch a short construction animation when adding a block

### Today’s activity

A focused step-by-step screen containing Scripture, reflection, sharing, action, prayer, and completion.

### Character library

Organizes completed activities by traits:

- Faith
- Love
- Integrity
- Patience
- Self-control
- Forgiveness
- Humility
- Wisdom
- Responsibility
- Generosity
- Courage
- Service

### Journey timeline

Shows all 365 positions without unlocking future content:

- Completed blocks
- Today’s block
- Upcoming construction stage
- Milestones
- Meaningful memories

### House dedication

The final experience should include:

- Before-and-after house animation
- Favorite verses from the journey
- Character-growth summary
- Couple reflections
- Dedication prayer
- Shareable image or certificate
- Option to begin a second journey with new activities

## 11. Visual direction

The house should start as an empty piece of land and gradually become a warm, beautiful home.

Recommended style:

- Soft illustrated 2D or isometric 3D house
- Warm stone, wood, cream, green, and gold colors
- Subtle construction animations
- Morning-to-evening background changes
- A growing garden around the house
- Scripture inscriptions on major foundation stones
- No competitive leaderboards

The final house should feel peaceful and sacred—not luxurious or materialistic. Its beauty should represent character, unity, and faithful commitment.

## 12. Example construction milestones

- **Day 1:** Place the cornerstone
- **Day 7:** First foundation section
- **Day 40:** Foundation completed
- **Day 70:** Floor completed
- **Day 115:** Framework raised
- **Day 170:** Walls completed
- **Day 200:** Doors and windows installed
- **Day 240:** Roof completed
- **Day 295:** Rooms completed
- **Day 325:** Utilities completed
- **Day 350:** Interior and garden completed
- **Day 365:** House dedication

## 13. Content-management requirements

Administrators should be able to create and review activities with:

- Day number
- Construction stage
- Character trait
- Title
- Scripture reference
- Scripture text or Bible API reference
- Short teaching
- Individual reflection
- Couple question
- Practical action
- Closing prayer
- English, Amharic, and Afaan Oromo translations
- Block type and construction animation
- Estimated completion time
- Pastoral-review status

AI may help draft content, but the final 365 activities should receive human theological and language review.

## 14. Recommended development phases

### Phase 1 — Content prototype

- Define the 12 core character traits.
- Write the first 14 daily activities.
- Test the activity length and couple flow.
- Create simple block illustrations.

### Phase 2 — Minimum viable game

- Add Today’s Activity.
- Enforce one activity per calendar day.
- Save individual and couple completion.
- Display a basic 365-block house.
- Add partner notifications and progress.
- Launch with the first 40 foundation activities.

### Phase 3 — Complete journey

- Prepare all 365 reviewed activities.
- Add all construction stages.
- Translate content into Amharic and Afaan Oromo.
- Add milestones, animations, and the character library.

### Phase 4 — Advanced experience

- Interactive house exploration
- House dedication certificate
- Couple memory timeline
- Seasonal visual themes
- Second-year journeys
- Church or mentor discussion guides

The strongest product direction is to treat this as a spiritual formation journey with game-like feedback—not merely a game. The house is the visible reward, while daily character development, Scripture, prayer, and practical love are the real achievement.