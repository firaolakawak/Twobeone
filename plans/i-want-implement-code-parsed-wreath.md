# Learning Module Direct Navigation Fix

## Context

When a user clicks an individual module card inside `LearningModulesCard` (shown on the home dashboard), they land on the **guidance overview screen** (`PreMarriageHub`) instead of jumping directly into that specific module. This happens because `LearningModulesCard` only has one callback prop `onViewAll?: () => void` — every module row click calls the exact same function, discarding which module was clicked. The user has to click twice: once on the module card, then again on the same module in the overview. The individual module selection is silently **skipped**.

## Root Cause

`LearningModulesCard.tsx` props (line 120-123): only `onViewAll?: () => void` — every row uses `onClick={onViewAll}`, module ID never passed up.

## Fix — 3 files

### 1. `src/app/components/LearningModulesCard.tsx`
- Add `onModuleClick?: (moduleId: string) => void` to props interface
- Change each module row `onClick` to: `() => onModuleClick ? onModuleClick(m.id) : onViewAll?.()`
- "View All" footer button keeps `onClick={onViewAll}` unchanged

### 2. `src/app/components/CoupleDashboard.tsx`
- Add `onModuleNavigate?: (moduleId: string) => void` to `CoupleDashboardProps` (line ~58)
- Pass to `LearningModulesCard`: `onModuleClick={onModuleNavigate}`

### 3. `src/app/App.tsx`
- Pass handler to `CoupleDashboard` (around line 1297):
```tsx
onModuleNavigate={(moduleId) => {
  setSelectedModuleId(moduleId);
  setSelectedLessonId(null);
  setSelectedScreen('lesson');
}}
```
Reuses existing `setSelectedModuleId` + `setSelectedScreen` — no new state needed.

## Verification

1. Click individual module in dashboard card → jumps directly to `LessonScreen` for that module (no intermediate overview)
2. Click "View All" footer → still navigates to `PreMarriageHub` overview
3. Back in `LessonScreen` → returns to guidance overview (unchanged)

---

# Daily Reminder System Plan (Push + Email)

## Context

Couples who don't open the app for a day lose their devotional streak and miss their daily mood check-in and Q&A habits. The app already has a **fully built** push notification stack (web-push, VAPID keys, service worker, subscription management in KV). What's missing is the scheduler logic and email delivery. This plan adds:

1. A **cron endpoint** (`POST /cron/daily-reminders`) that checks inactive users and sends personalised reminders
2. **Email delivery** via the Resend API (lightweight, free tier available)
3. A **reminder preferences toggle** in Settings so users can opt in/out
4. Cron scheduling via an external HTTP cron service (EasyCron or Upstash QStash — free tiers exist)

---

## What already exists (reuse these)

| Asset | Location |
|---|---|
| Push subscription storage `push_subscription:{userId}` | `push_routes.tsx` |
| VAPID keys + web-push send logic | `push_routes.tsx` |
| `touchActivity(userId)` — bumps `updatedAt` on profile | `index.tsx` line ~121 |
| Devotional streak KV (`streak:{userId}:devotional`) | `index.tsx` streak endpoint |
| Devotional completion KV (`completion:{userId}:{date}:{devotionId}`) | `index.tsx` completions endpoint |
| User profile with `updatedAt` + `email` field | `index.tsx` GET /profile |
| Send push to user function | `push_routes.tsx` POST `/send-push` |
| `generateId()` | `index.tsx` |
| KV store functions (`kv.get`, `kv.getByPrefix`, `kv.set`) | `kv_store.tsx` |

---

## Phase 1 — Backend: Cron Reminder Endpoint

**File:** `supabase/functions/server/index.tsx`

### New endpoint: `POST /cron/daily-reminders`

Protected by `Authorization: Bearer ${CRON_SECRET}` header.

**Logic per user:**

```
for each user in kv.getByPrefix('user:'):
  1. Was lastActive > 24h ago?  →  check profile.updatedAt
  2. Did they complete a devotional today?  →  check kv.get(`streak:{id}:devotional`).last_activity_date
  3. Did they log a mood today?  →  check kv.getByPrefix(`mood:{id}:`), filter by today's date
  4. Have they answered any Q&A recently (7 days)?  →  check kv.getByPrefix(`response:{id}:`), newest entry
  5. Build personalised message from which items are overdue
  6. If user has push subscription → send push notification
  7. If user has email AND email reminders enabled → send email via Resend
```

**Push payload structure:**
```json
{
  "title": "TwoBeOne — Don't break the streak! 🔥",
  "body": "Log your mood, answer today's Q&A, and complete your devotional. Your partner is waiting 💕",
  "icon": "/icons/icon-192x192.png",
  "badge": "/icons/icon-72x72.png",
  "data": { "url": "/" }
}
```
Body is personalised: only mentions items actually overdue.

**Email HTML template** (inline, no external template engine):
- Subject: `"TwoBeOne — Your daily check-in is waiting 💕"`
- Sections: mood card, Q&A card, devotional streak card — each hidden/shown based on what's overdue
- CTA button: "Open TwoBeOne" linking to `https://twobeone.app`
- Unsubscribe footer link

**Resend integration** (new helper function `sendReminderEmail(to, subject, html)`):
```typescript
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: 'TwoBeOne <reminders@twobeone.app>', to, subject, html })
});
```

**Idempotency**: store `reminder-sent:{userId}:{date}` in KV so the same user is never reminded twice per day even if cron fires multiple times.

---

## Phase 2 — Secrets Required

Two new secrets needed (set via Figma Make secret card or Supabase dashboard):

| Secret | Purpose |
|---|---|
| `RESEND_API_KEY` | Email delivery (get from resend.com — free tier: 3,000 emails/month) |
| `CRON_SECRET` | Protects the cron endpoint from unauthorised calls |

---

## Phase 3 — User Preference: Reminder Settings

**File:** `src/app/components/SettingsScreen.tsx` (App tab)

Add a "Reminders" card below the Language card:

```
┌─────────────────────────────────────────────┐
│ 🔔 Daily Reminders                           │
│ Get nudged when you miss your daily habits  │
│                                             │
│  Push Notifications    [Toggle ON/OFF]      │
│  Email Reminders       [Toggle ON/OFF]      │
│                                             │
│  Reminder time: [8:00 AM ▼] (future)       │
└─────────────────────────────────────────────┘
```

Preferences stored on the user profile object:
```json
{
  "reminderPush": true,
  "reminderEmail": false
}
```

Backend: `PUT /profile` already handles arbitrary fields — no new endpoint needed.

Frontend changes:
- Two `Switch` toggles in SettingsScreen App tab (after Language card, before Legal)
- Reads `profile.reminderPush` and `profile.reminderEmail`
- Calls `api.profile.update({ reminderPush, reminderEmail })` on toggle

---

## Phase 4 — Cron Scheduling

No code changes needed — this is a configuration step. Options (all free):

**Option A — cron-job.org (recommended, 100% free):**
1. Sign up at cron-job.org
2. Create job: `POST https://twobeone.app/functions/v1/make-server-6d579fee/cron/daily-reminders`
3. Header: `Authorization: Bearer {CRON_SECRET}`
4. Schedule: `0 8 * * *` (8:00 AM UTC daily)

**Option B — Upstash QStash:**
1. Free tier: 500 messages/day
2. Schedule same endpoint with same secret

**Option C — GitHub Actions:**
```yaml
on:
  schedule:
    - cron: '0 8 * * *'
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST $URL -H "Authorization: Bearer $SECRET"
        env:
          URL: ${{ secrets.REMINDER_URL }}
          SECRET: ${{ secrets.CRON_SECRET }}
```

---

## Execution Order

1. Add `RESEND_API_KEY` and `CRON_SECRET` secrets via Supabase dashboard
2. Add `sendReminderEmail()` helper to `index.tsx`
3. Add `POST /cron/daily-reminders` endpoint to `index.tsx`
4. Add reminder preference toggles to `SettingsScreen.tsx`
5. Set up external cron (cron-job.org or equivalent)
6. Test: manually POST to `/cron/daily-reminders` with the secret header

---

## Verification

1. **Unit test**: POST `/cron/daily-reminders` with `Authorization: Bearer {CRON_SECRET}` → should return `{ sent: N, skipped: M }` 
2. **Push test**: Set `profile.updatedAt` to 2 days ago in KV for a test user, fire the endpoint → check if push arrives on device
3. **Email test**: Enable email reminder in settings, fire endpoint → check inbox
4. **Idempotency test**: Fire endpoint twice in the same day for same user → second call sends nothing
5. **Settings**: Toggle push/email in Settings → verify preference saved in profile
6. **Design system**: All new UI in SettingsScreen uses `var(--spacing-*)`, `var(--primary-*)`, `var(--radius-*)` — no raw Tailwind colors

---

# General Compatibility Match Plan

## Context

Currently the Compatibility Match is **per-question only** — when both partners answer one question, they see a score for that question alone. The user wants a **General Compatibility Match** that:
- Spans ALL 11 categories (`daily-life`, `intimacy`, `love-balance`, `dream-wedding`, `travel`, `boundaries`, `trust`, `kids-future`, `finance`, `family`, `bible`)
- Requires both partners to have answered questions together before a category contributes
- Uses Gemini AI to generate a rich narrative based on ALL answered Q&A pairs across ALL categories
- Shows progress toward completion (X/11 categories with both partners engaged)
- Caches the overall result permanently (only regenerates when new categories complete)

**No aggregate compatibility endpoint exists yet.** The per-question endpoint `/ai/compatibility` (with per-question caching) is fully built and will be reused for the per-question view; the new work is a separate overall layer.

---

## Files to Modify / Create

| File | Change |
|---|---|
| `supabase/functions/server/index.tsx` | Add `GET /ai/compatibility/overall` + `POST /ai/compatibility/overall` endpoints |
| `src/app/components/QAResultsView.tsx` | Add Overall Compatibility section at the top of the results view |
| `src/app/components/QADiscussionHub.tsx` | Wire the Overall section into the Results tab |
| `src/app/utils/api.ts` | Add `compatibility.getOverall()` and `compatibility.generateOverall()` methods |

---

## Phase 1 — Backend: Two New Endpoints

### `GET /ai/compatibility/overall`

Checks KV for a cached overall result for the couple.

```typescript
app.get('/make-server-6d579fee/ai/compatibility/overall', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  const profile = await kv.get(`user:${userId}`);
  const partnerId = profile?.partnerId;
  const keyBase = partnerId && partnerId < userId ? partnerId : userId;
  const cached = await kv.get(`compatibility-overall:${keyBase}`);
  return c.json({ result: cached || null, cached: !!cached });
});
```

### `POST /ai/compatibility/overall`

Accepts all answered Q&A pairs from the client, sends them to Gemini as a comprehensive prompt, saves the result.

**Idempotency**: if a cached result already exists AND `force !== true`, return the cached result without calling Gemini again.

**Gemini prompt structure** (extend the existing `callGemini` function):

```
You are a compassionate Christian relationship counselor analyzing a couple's overall compatibility 
across multiple life categories.

Categories Completed Together: ${completedCategories.join(', ')}
Total Questions Discussed: ${totalPairs}

[For each category with both partners' answers, provide a section:]
CATEGORY: Daily Life & Habits
Q: "Describe your ideal morning routine as a couple."
  ${userName}: [answer text]
  ${partnerName}: [answer text]
... (all prompts for this question)

[Repeat for all answered questions across categories]

Please provide an OVERALL COUPLE COMPATIBILITY ANALYSIS:

1. **Overall Score** (0-100): A holistic compatibility percentage considering semantic 
   similarity, shared values, and life-vision alignment across all categories answered.

2. **Overall Label**: A brief descriptive label 
   (e.g. "Deeply Aligned", "Beautifully Complementary", "Growing Together", "Wonderfully Different")

3. **Top 3 Strengths**: The three most powerful areas of alignment across all categories.

4. **Top 2 Growth Areas**: Two specific areas where deeper conversation would strengthen the relationship.

5. **Category Highlights**: For each completed category, a one-sentence compatibility note.

6. **Overall Insight**: One personalized paragraph about what makes this couple unique based on their specific answers.

7. **30-Day Challenge**: One specific, actionable 30-day couple challenge based on their answers.

Format as JSON:
{
  "score": number,
  "label": string,
  "strengths": string[3],
  "growthAreas": string[2],
  "categoryHighlights": { [categoryId]: string },
  "insight": string,
  "challenge": string
}
Return ONLY valid JSON.
```

**Caching key**: `compatibility-overall:${keyBase}` — persisted permanently, updated only when `force: true` is sent (allow regeneration after more categories complete).

---

## Phase 2 — API Layer: Two New Methods

Add to `src/app/utils/api.ts` under a new `compatibility` export:

```typescript
export const compatibility = {
  getOverall: async () =>
    apiCallDirect<{ result: OverallCompatibility | null; cached: boolean }>(
      '/ai/compatibility/overall'
    ),

  generateOverall: async (payload: {
    completedCategories: string[];
    questionPairs: CategoryQAPairs[];
    userName: string;
    partnerName: string;
    force?: boolean;
  }) =>
    apiCallDirect<OverallCompatibility>('/ai/compatibility/overall', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
```

Note: Use the existing `apiCall` function (already handles auth headers, retries, timeouts).

---

## Phase 3 — Frontend: OverallCompatibilityCard Component

Create the `OverallCompatibilityCard` as a section inside `QAResultsView.tsx`.

### Completion Progress Logic

```typescript
// A category is "engaged" when both partners have answered ≥1 question in that category
const ALL_CATEGORIES = ['daily-life','intimacy','love-balance','dream-wedding',
  'travel','boundaries','trust','kids-future','finance','family','bible'];

const categoryEngagement = ALL_CATEGORIES.map(catId => {
  const catQuestions = questions.filter(q => q.category === catId);
  const bothAnswered = catQuestions.filter(q =>
    q.userAnswers && Object.keys(q.userAnswers).length > 0 &&
    q.partnerAnswers && Object.keys(q.partnerAnswers).length > 0
  );
  return {
    id: catId,
    total: catQuestions.length,
    bothAnswered: bothAnswered.length,
    complete: bothAnswered.length > 0,  // at least 1 question discussed together
  };
});

const completedCount = categoryEngagement.filter(c => c.complete).length;
const isEligible = completedCount >= 3;  // minimum 3 categories to unlock
const isFullyComplete = completedCount === ALL_CATEGORIES.length;
```

### UI Structure

```
┌─────────────────────────────────────────────────────────┐
│  💑 General Compatibility Match                          │
│  ─────────────────────────────────────────────────────  │
│  Category Progress  [██████████░░░░░]  8 / 11 categories│
│                                                         │
│  [Category pill grid: ✅ Daily Life  ✅ Trust  ⏳ Finance]│
│                                                         │
│  [If < 3 complete]                                      │
│  🔒 Complete at least 3 categories together to unlock   │
│                                                         │
│  [If ≥ 3 complete AND no result]                        │
│  [Generate Overall Match] button                        │
│                                                         │
│  [If result exists]                                     │
│  Score ring: 78%  "Beautifully Complementary"           │
│  ┌──────────────┐ ┌──────────────┐                     │
│  │ ✅ Strengths  │ │ 🌱 Growth    │                     │
│  └──────────────┘ └──────────────┘                     │
│  💡 Overall Insight paragraph                           │
│  📅 30-Day Challenge                                    │
│  [Category Highlights accordion]                        │
│  [Regenerate] small button (if all 11 complete)         │
└─────────────────────────────────────────────────────────┘
```

### Color coding for category pills
- ✅ Green ring: both partners answered ≥1 question in category
- ⏳ Neutral: only one partner answered or no answers yet
- Numbers on pill: `(bothAnswered)/(total)` questions

### Where it appears
- At the **top of the Results tab** in `QADiscussionHub.tsx` (the `viewMode === 'results'` section), above the per-question list.

---

## Phase 4 — Interface Definitions

```typescript
interface OverallCompatibility {
  score: number;
  label: string;
  strengths: string[];        // 3 items
  growthAreas: string[];      // 2 items
  categoryHighlights: Record<string, string>; // catId → one-sentence note
  insight: string;
  challenge: string;
  aiPowered?: boolean;
  cached?: boolean;
  generatedAt?: string;
}

interface CategoryQAPairs {
  categoryId: string;
  categoryLabel: string;
  questions: {
    title: string;
    prompts: Array<{
      text: string;
      userAnswer: string;
      partnerAnswer: string;
    }>;
  }[];
}
```

---

## Execution Order

1. **Backend**: Add `GET` and `POST /ai/compatibility/overall` routes in `index.tsx` (using existing `callGemini` + KV)
2. **API layer**: Add `compatibility.getOverall()` and `generateOverall()` to `api.ts`
3. **Frontend**: Build `OverallCompatibilityCard` component inline in `QAResultsView.tsx`
4. **Wire**: Import and render at top of Results tab in `QADiscussionHub.tsx`

---

## Verification

1. Answer questions in at least 3 categories with both partners → "Generate Overall Match" button appears
2. Click Generate → loading state → Gemini call → result card renders with score, strengths, challenge
3. Navigate away and back → cached result loads instantly ("AI · Saved" badge)
4. Answer more categories → "Regenerate" button appears once all 11 complete
5. All colors use CSS vars (`var(--primary-*)`, `var(--success-*)`, etc.) — no raw Tailwind colors
6. Check mobile layout (category pills wrap cleanly, score ring scales)

---

# SEO & GEO Improvement Plan

## Context

TwoBeOne is a Christian couples app that currently has ~60% SEO readiness. The foundation (basic meta, OG, Twitter cards, manifest, robots.txt, sitemap) is in place, but three critical gaps block visibility in both **search engines** and **AI answer engines** (GEO — Generative Engine Optimization):

1. **No JSON-LD structured data** — search engines and AI crawlers (Perplexity, ChatGPT, Google AI Overviews, Claude) cannot understand the app's purpose, creator, or content categories
2. **No `llms.txt`** — new AI crawler standard that tells LLMs how to summarise the product
3. **Incomplete sitemap + stale dates** — only 2 URLs listed, dates from 2024
4. **SVG used for `og:image`** — Facebook and WhatsApp do not render SVGs; sharing produces broken preview cards
5. **Missing canonical tag** — risk of duplicate-content penalties
6. **Missing screenshots directory** — PWA install prompt has no app previews

Goal: bring SEO readiness from ~60% to ~95%, make the app citable by AI answer engines, and fix every broken sharing/preview issue.

---

## Files to Modify

| File | Change |
|---|---|
| `src/app/index.html` | Add canonical, JSON-LD WebApp schema, fix og:image, add keywords/author |
| `src/app/public/sitemap.xml` | Add all public routes, update dates |
| `src/app/public/robots.txt` | Add AI crawler rules (GPTBot, ClaudeBot, PerplexityBot) |
| `src/app/public/llms.txt` (new) | GEO: human-readable app summary for LLM crawlers |
| `src/app/public/og-image.png` (new) | 1200×630 PNG social sharing image |
| `src/app/components/LandingPage.tsx` | Add inline JSON-LD FAQ schema, improve heading hierarchy |
| `src/app/public/screenshots/` (new dir) | Two screenshots for PWA install prompt |

---

## Phase 1 — `index.html` Core SEO

**File:** `src/app/index.html`

### 1A. Fix `og:image` (SVG → PNG)
```html
<!-- REMOVE: -->
<meta property="og:image" content="/icon.svg" />
<meta name="twitter:image" content="/icon.svg" />

<!-- ADD: -->
<meta property="og:image" content="https://twobeone.app/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="TwoBeOne — Christian Couples App" />
<meta name="twitter:image" content="https://twobeone.app/og-image.png" />
```

### 1B. Add canonical + missing meta
```html
<link rel="canonical" href="https://twobeone.app/" />
<meta name="author" content="TwoBeOne" />
<meta name="keywords" content="Christian couples app, marriage devotional, couples prayer, faith relationship app, pre-marriage app, couples Bible study" />
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
```

### 1C. Add JSON-LD WebApplication schema
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "TwoBeOne",
  "alternateName": "TwoBeOne Couples App",
  "description": "A faith-based app helping Christian couples grow together through daily devotionals, shared prayer, journaling, and meaningful conversations.",
  "url": "https://twobeone.app",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Daily Biblical Devotionals for Couples",
    "Shared Prayer Board",
    "Couples Journal",
    "Faith-based Relationship Questions",
    "Devotional Streak Tracking",
    "Pre-Marriage Guidance Modules"
  ],
  "audience": {
    "@type": "Audience",
    "audienceType": "Christian Couples"
  },
  "creator": {
    "@type": "Organization",
    "name": "TwoBeOne",
    "url": "https://twobeone.app"
  },
  "inLanguage": ["en", "am", "om"],
  "screenshot": "https://twobeone.app/og-image.png"
}
</script>
```

### 1D. Add FAQ JSON-LD (GEO — helps AI answers quote the app directly)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is TwoBeOne?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TwoBeOne is a free Christian couples app that helps partners grow together in faith through daily devotionals, shared prayer, journaling, and deep conversation questions rooted in Biblical values."
      }
    },
    {
      "@type": "Question",
      "name": "Is TwoBeOne free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. TwoBeOne is completely free to download and use. Both partners need the app and connect via a unique invite code."
      }
    },
    {
      "@type": "Question",
      "name": "What languages does TwoBeOne support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TwoBeOne supports English, Amharic (አማርኛ), and Afan Oromo (Oromiffa)."
      }
    },
    {
      "@type": "Question",
      "name": "Can engaged couples use TwoBeOne?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely. TwoBeOne is designed for dating Christian couples, engaged couples, newlyweds, and married couples of any duration."
      }
    }
  ]
}
</script>
```

---

## Phase 2 — GEO: `llms.txt`

**File:** `src/app/public/llms.txt` (new — served at `https://twobeone.app/llms.txt`)

This file follows the emerging [llms.txt standard](https://llmstxt.org/) — when AI crawlers index the site, they read this file to understand how to describe the product accurately.

```markdown
# TwoBeOne

> TwoBeOne is a free Christian couples app that strengthens relationships through faith.

## What it does
TwoBeOne helps Christian couples grow together spiritually through:
- **Daily Devotionals** — Bible-based devotions written for couples
- **Shared Prayer Board** — Add, track, and celebrate answered prayers together
- **Couples Journal** — Private and shared journaling for memories and reflection
- **Know Each Other Questions** — 1000+ faith-based conversation starters across 11 categories
- **Devotional Streak Tracking** — Gamified consistency for daily devotionals
- **Pre-Marriage Guidance** — Biblical modules covering communication, finance, intimacy, and more
- **Mood Tracking** — Weekly emotional check-ins with AI-powered compatibility analysis
- **Community Groups** — Connect with other Christian couples

## Who it's for
Christian couples at any stage: dating, engaged, newlywed, or married.

## Languages
English, Amharic (አማርኛ), Afan Oromo (Oromiffa)

## Pricing
Free. No subscription required.

## Platform
Progressive Web App (PWA). Works on iOS, Android, and desktop browsers.

## Key facts for AI answers
- Founded to help Christian couples build faith-centered relationships
- Supports multilingual communities in Ethiopia (Amharic and Afan Oromo)
- AI-powered compatibility analysis uses Gemini to analyse answered questions
- Partners connect via a unique invite code; data is private between the couple
```

---

## Phase 3 — Updated `sitemap.xml`

**File:** `src/app/public/sitemap.xml`

Replace entirely with up-to-date routes and correct dates:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <url>
    <loc>https://twobeone.app/</loc>
    <lastmod>2026-06-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://twobeone.app/"/>
    <xhtml:link rel="alternate" hreflang="am" href="https://twobeone.app/?lang=am"/>
    <xhtml:link rel="alternate" hreflang="om" href="https://twobeone.app/?lang=om"/>
  </url>

  <url>
    <loc>https://twobeone.app/features</loc>
    <lastmod>2026-06-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://twobeone.app/about</loc>
    <lastmod>2026-06-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://twobeone.app/privacy-policy</loc>
    <lastmod>2026-06-16</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>https://twobeone.app/terms</loc>
    <lastmod>2026-06-16</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>

</urlset>
```

---

## Phase 4 — `robots.txt` (add AI crawler rules)

**File:** `src/app/public/robots.txt`

Add explicit rules for major AI crawlers while keeping existing rules:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /functions

# Allow AI crawlers to index public content for GEO
User-agent: GPTBot
Allow: /
Disallow: /admin

User-agent: ClaudeBot
Allow: /
Disallow: /admin

User-agent: PerplexityBot
Allow: /
Disallow: /admin

User-agent: GoogleOther
Allow: /

Sitemap: https://twobeone.app/sitemap.xml
```

---

## Phase 5 — Social Share OG Image

**File:** `src/app/public/og-image.png` (1200×630px)

Create a simple branded PNG using a React component rendered to canvas, or a static design. The image should show:
- TwoBeOne logo/wordmark (heart icon + name)
- Tagline: "Grow Together in Faith"
- Dark gradient background using `var(--primary-600)` to `var(--primary-900)`
- Two heart icons representing a couple

**Implementation:** Create `src/app/components/OGImageGenerator.tsx` as a static route rendered to a PNG at build time, OR use a simple pre-designed PNG placed directly in `src/app/public/`.

For simplicity, generate using an SVG-to-PNG approach in the build, or create a simple static PNG directly.

---

## Phase 6 — PWA Screenshots

**Files:** `src/app/public/screenshots/screenshot1.png`, `screenshot2.png`

The manifest.json already references these but the directory doesn't exist:
- `screenshot1.png` — 1170×2532 (mobile portrait, showing dashboard)
- `screenshot2.png` — 2048×1536 (tablet landscape, showing devotionals)

These enable the "Add to Home Screen" install prompt to show app previews.

**Implementation:** Generate screenshots using the Figma design or by capturing the actual app. Use placeholder solid-color PNGs with the correct dimensions initially to prevent manifest errors, then replace with real screenshots.

---

## Phase 7 — LandingPage.tsx SEO improvements

**File:** `src/app/components/LandingPage.tsx`

1. **Improve heading hierarchy** — ensure exactly one `<h1>` per page ("Grow Together In Faith"), with `<h2>` for sections (Features, Testimonials, FAQ)
2. **Add `aria-label` to key sections** for accessibility crawlers
3. **Improve alt text** on any images
4. **FAQ section semantic markup** — wrap FAQ items in proper `<details>`/`<summary>` or ensure the text matches the JSON-LD FAQ schema exactly (so AI answers can cite specific question-answer pairs)

---

## Execution Order

1. Update `robots.txt` — 2 min, no risk
2. Create `llms.txt` — 5 min, new file
3. Update `sitemap.xml` — 5 min, replace content
4. Update `index.html` — 15 min, add canonical, fix og:image, add JSON-LD
5. Create placeholder screenshots (2 solid PNGs with correct dimensions)
6. Create `og-image.png` (1200×630 branded PNG)
7. LandingPage.tsx heading/semantic improvements

---

## Verification

1. **Social sharing preview** — paste `https://twobeone.app` into [https://opengraph.xyz](https://opengraph.xyz) and [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator) — should show the branded PNG
2. **Structured data** — paste HTML into [Google Rich Results Test](https://search.google.com/test/rich-results) — should detect WebApplication and FAQPage schemas
3. **`llms.txt` accessible** — `curl https://twobeone.app/llms.txt` should return the markdown content
4. **Sitemap** — `curl https://twobeone.app/sitemap.xml` should return valid XML with 5 URLs
5. **Robots.txt** — `curl https://twobeone.app/robots.txt` — verify AI crawler rules present
6. **PWA manifest** — Chrome DevTools → Application → Manifest → no errors, screenshots shown
7. **Design system** — all new JSX in LandingPage uses CSS vars, no raw Tailwind color utilities

---

# Language Translation Plan — Amharic & Afan Oromo

## Context

The app has a translation system (`src/app/utils/i18n.ts`) with 256 string keys across 20 semantic sections. English (`en`) and Amharic (`am`) are fully translated. Afan Oromo (`om` / Oromiffa) is completely absent — not even in the `Language` type. Additionally, only 6 of 85 components consume the `useLanguage` hook; the other 79 have hardcoded English strings. This plan adds Afan Oromo and wires the translation hook into every high-traffic screen.

---

## Phase 1 — Core Infrastructure

### 1A. Extend `i18n.ts` with Afan Oromo + new keys

**File:** `src/app/utils/i18n.ts`

**Changes:**
1. Change `export type Language = 'en' | 'am'` → `export type Language = 'en' | 'am' | 'om'`
2. Add `om` entry to `export const translations: Record<Language, Translations>` with all 256 keys translated into Afan Oromo (Qubee Latin script).
3. Extend `languages` array with: `{ code: 'om' as Language, name: 'Afan Oromo', nativeName: 'Oromiffa', flag: '🇪🇹' }`
4. Extend the `Translations` interface with new keys needed by components not yet wired (listed in Phase 2 below).

**Complete Afan Oromo translation set (all 256 keys):**

```ts
om: {
  common: {
    welcome: 'Baga Nagaan Dhuftan', loading: 'Fe\'aa jira...', save: 'Kuuxi',
    cancel: 'Dhiisi', delete: 'Haquu', edit: 'Gulaali', share: 'Qoodi',
    close: 'Cufi', back: 'Deebi\'i', next: 'Itti aanu', previous: 'Kan dura',
    yes: 'Eeyyee', no: 'Miti', ok: 'Tole', error: 'Dogoggora',
    success: 'Milkaa\'e', today: 'Har\'aa', yesterday: 'Kaleessa', tomorrow: 'Boru',
  },
  nav: {
    home: 'Mana', devotions: 'Kaayyoo Amantii', journal: 'Yaadannoo',
    prayer: 'Kadhannaa', questions: 'Gaaffilee', profile: 'Eenyummaa',
    settings: 'Qindaa\'ina', bible: 'Macaafa Qulqulluu', community: 'Hawaasa',
  },
  auth: {
    signIn: 'Seeni', signUp: 'Galmaa\'i', signOut: 'Ba\'i', email: 'Imeelii',
    password: 'Jecha Darbii', name: 'Maqaa', confirmPassword: 'Jecha Darbii Mirkaneessi',
    forgotPassword: 'Jecha Darbii Dagatte?', createAccount: 'Herrega Bani',
    alreadyHaveAccount: 'Herrega qabdaa?', dontHaveAccount: 'Herrega hin qabduu?',
    enterEmail: 'Imeelii kee galchi', enterPassword: 'Jecha darbii kee galchi',
    enterName: 'Maqaa kee galchi', passwordMismatch: 'Jecha darbiin wal hin simatu',
    invalidEmail: 'Teessuma imeelii dogongora',
    weakPassword: 'Jecha darbiin sadarkaawwan 6 ol qabaachuu qaba',
  },
  dashboard: {
    title: 'Fuula Jalqabaa', growingTogetherInFaith: 'Amantiin waliin guddachaa jirra',
    daysTogether: 'Guyyaa Waliin', devotionalStreak: 'Taateen Amantii',
    journalEntries: 'Yaadannoo', prayers: 'Kadhannaa', questions: 'Gaaffilee',
    answered: 'deebii argateera', shared: 'qoodameera',
    quickActions: 'Tarkaanfiiwwan Ariifataawaa',
    continueJourney: 'Imala amantii kee itti fufi', dailyVerse: 'Weeji Guyyaa',
    readFullChapter: 'Boqonnaa Hunda Dubbisi', todaysMood: 'Miira Har\'aa',
    yourMood: 'Miira Kee', partnersMood: 'Miira Hiriyaa Kee',
    relationshipMilestones: 'Balbala Hariiroo', celebrateJourney: 'Imala waliin kabajaa',
    yourJourneyTogether: 'Imala Keessan Waliin',
    buildingFoundation: 'Hundee cimaa amantiin ijaaruu',
    recentActivity: 'Hojii Dhiyoo', viewAll: 'Hunda Ilaali',
    addPartner: 'Hiriyaa Dabaluu',
    connectWithPartner: 'Imala waliin jalqabuuf hiriyaa kee waliin quunnamaa',
    noPartnerYet: 'Hiriyaan ammaaf hin quunnamne',
  },
  devotionals: {
    title: 'Kaayyoo Amantii Guyyaa Guyyaa', todaysDevotional: 'Kaayyoo Har\'aa',
    dailyReflection: 'Yaadannoo Guyyaa Guyyaa', scriptureReading: 'Macaafa Qulqulluu Dubbisuu',
    prayerPrompt: 'Qajeelfama Kadhannaa', discussionQuestions: 'Gaaffilee Marii',
    markComplete: 'Xumurameera Jedhii', shareWithPartner: 'Hiriyaa Waliin Qoodi',
    partnerCompleted: 'Hiriyaan Xumureera', yourThoughts: 'Yaada Kee',
    writeReflection: 'Yaadannoo kee barreessi...', saveReflection: 'Yaadannoo Kuuxi',
    streak: 'Itti fufinsa', days: 'guyyaa', keepGoing: 'Itti fufi!',
  },
  journal: {
    title: 'Yaadannoo', newEntry: 'Galma\'a Haaraa', myEntries: 'Galma\'aa Kiyya',
    sharedEntries: 'Galma\'a Qoodame', writeTitle: 'Mata-duree galma\'aa...',
    writeContent: 'Yaada kee barreessi...', shareWithPartner: 'Hiriyaa Waliin Qoodi',
    private: 'Dhuunfaa', shared: 'Qoodame', save: 'Galma\'a Kuuxi',
    delete: 'Galma\'a Haquu', edit: 'Galma\'a Gulaali',
    noEntries: 'Ammaaf galma\'aan hin jiru', startWriting: 'Galma\'a jalqabaa kee barreessi',
  },
  prayer: {
    title: 'Kadhannaa', prayerRequests: 'Gaaffii Kadhannaa', newRequest: 'Gaaffii Haaraa',
    myPrayers: 'Kadhannaa Kiyya', partnersPrayers: 'Kadhannaa Hiriyaa',
    prayTogether: 'Waliin Kadhadhu', markAnswered: 'Deebii Argateera Jedhii',
    answered: 'Deebii Argateera', pending: 'Eeggachaa jira',
    writeRequest: 'Gaaffii kadhannaa kee barreessi...',
    noRequests: 'Ammaaf gaaffiin kadhannaa hin jiru',
    addFirstPrayer: 'Kadhannaa jalqabaa kee dabaluu',
    praiseReport: 'Gabaasa Galata', howAnswered: 'Kadhannaan kun akkamiin deebii argateef?',
  },
  questions: {
    title: 'Walii Barina', knowEachOther: 'Walii ofitti gad-fageenyaan barina',
    selectCategory: 'Caasaa Filadhu', answerQuestion: 'Gaaffii Deebisi',
    yourAnswer: 'Deebii Kee', partnersAnswer: 'Deebii Hiriyaa',
    notAnsweredYet: 'Ammaaf deebii hin arganne', writeAnswer: 'Deebii kee barreessi...',
    saveAnswer: 'Deebii Kuuxi', questionsAnswered: 'Gaaffilee Deebi\'an',
    viewResponses: 'Deebiiwwan Ilaali', shareYourAnswer: 'Deebii kee qoodi',
    shareYourThoughts: 'Yaada kee qoodi...', writeAReply: 'Deebi\'i barreessi...',
    savePriva: 'Dhuunfaan Kuuxi', sendAndSave: 'Ergi fi Kuuxi',
    reply: 'Deebi\'i', private: 'Dhuunfaa', shared: 'Qoodame', discuss: 'Mari\'adhu',
    categories: {
      faith: 'Amantii fi Yaadota', values: 'Gatii fi Kaayyoo',
      dreams: 'Hawwii fi Fuuldura', family: 'Maatii fi Daa\'imman',
      intimacy: 'Jaalala fi Waldhabbii', conflict: 'Rakkoo Furuu',
      finance: 'Faayinaansii fi Qabeenya', daily: 'Jireenya Guyyaa Guyyaa',
    },
  },
  profile: {
    title: 'Eenyummaa', myProfile: 'Eenyummaa Kiyya', editProfile: 'Eenyummaa Gulaali',
    partnerCode: 'Koodii Hiriyaa', enterPartnerCode: 'Koodii hiriyaa galchi',
    linkPartner: 'Hiriyaa Walqabsiisi', relationshipStart: 'Guyyaa Hariiroo Jalqabame',
    linkedWith: 'Walqabatee jira', notLinked: 'Walqabatee miti',
    preferences: 'Filannoo', language: 'Afaan', notifications: 'Beeksisa',
    theme: 'Fakkaataa', about: 'Waa\'ee', version: 'Vershinii',
  },
  bible: {
    title: 'Macaafa Qulqulluu', selectBook: 'Kitaaba Filadhu', selectChapter: 'Boqonnaa Filadhu',
    oldTestament: 'Kakuu Moofaa', newTestament: 'Kakuu Haaraa', search: 'Barbaadi',
    bookmarks: 'Mallattoo', highlights: 'Ibsituu', addHighlight: 'Ibsituu Dabaluu',
    addNote: 'Yaadannoo Dabaluu', shareVerse: 'Weeji Qoodi', copyVerse: 'Weeji Kopii',
  },
  notifications: {
    title: 'Beeksisa', enableNotifications: 'Beeksisa Dandeessisi',
    disableNotifications: 'Beeksisa Dhaabi', notificationsOn: 'Beeksisni Banaa dha',
    notificationsOff: 'Beeksisa Dandeessisi', youllBeNotified: 'Beeksisa argatta:',
    sharedVerse: 'Weejjonni fi ibsituuwwan Macaafa Qulqulluu qoodame',
    newPrayer: 'Gaaffii kadhannaa haaraa hiriyaa keetii irraa',
    journalEntry: 'Galma\'aa yaadannoo fi xumura kaayyoo',
    devotionalComplete: 'Yaadachiisa kaayyoo amantii guyyaa guyyaa',
    milestone: 'Kabaja fi milkaa\'ina balbala', dailyReminder: 'Yaadachiisa guyyaa guyyaa',
    pushNotifications: 'Beeksisa Push',
    stayConnected: 'Beeksisa ariifataan hiriyaa keetiin quunnamaa tulli',
    permissionRequired: 'Hayyama Barbaachisa',
    enableInSettings: 'Qindaa\'ina browser keessatti beeksisa dandeessisi',
  },
  milestones: {
    title: 'Balbala', addMilestone: 'Balbala Dabaluu', editMilestone: 'Balbala Gulaali',
    deleteMilestone: 'Balbala Haquu', milestoneTitle: 'Mata-duree Balbala',
    milestoneDescription: 'Ibsa', milestoneDate: 'Guyyaa', selectIcon: 'Akaakuu Filadhu',
    noMilestones: 'Ammaaf balballi hin jiru', addFirstMilestone: 'Balbala jalqabaa kee dabaluu',
  },
  mood: {
    title: 'Miira', great: 'Baay\'ee Gaarii', good: 'Gaarii', okay: 'Tole',
    sad: 'Gadda', notSetYet: 'Ammaaf hin qindaa\'ofne', analytics: 'Xiinxala',
    weeklyReport: 'Gabaasa Torban', moodTrends: 'Achiistuu Miiraa',
  },
  messages: {
    savedSuccessfully: 'Milkaa\'inaan kuufame', deletedSuccessfully: 'Milkaa\'inaan haqqame',
    sharedSuccessfully: 'Milkaa\'inaan qoodame', errorOccurred: 'Dogoggori uumameera',
    noInternetConnection: 'Quunnamtii intarneetii hin jiru',
    tryAgainLater: 'Maaloo booda irra deebi\'i yaali',
    confirmDelete: 'Haquusa Mirkaneessi', areYouSure: 'Mirkana?',
    cannotUndo: 'Tarkaanfiin kun deebi\'ee deemuu hin danda\'u',
  },
  time: {
    second: 'sekondii', seconds: 'sekondiiwwan', minute: 'daqiiqaa', minutes: 'daqiiqaalee',
    hour: 'sa\'atii', hours: 'sa\'aatiiwwan', day: 'guyyaa', days: 'guyyaalee',
    week: 'torban', weeks: 'torbanoolee', month: 'ji\'a', months: 'ji\'ootni',
    year: 'bara', years: 'barootni', ago: 'dura', justNow: 'amma dura',
  },
  install: {
    title: 'TwoBeOne Diriirsi', subtitle: 'Muuxannoo gaarii argachuuf screen jalqabaa kee irratti dabaluu',
    iosInstructions: 'iOS irratti diriirsuuf:', iosStep1: 'Caancala Qoodi gadiitti cuqi',
    iosStep2: 'Tiirirsii "Screen Jalqabaatti Dabaluu" cuqi', iosStep3: 'Mirkaneessuuf "Dabaluu" cuqi',
    androidInstructions: 'TwoBeOne meeshaa kee irratti diriirsuuf caancala gadii cuqi',
    installButton: 'Appii Diriirsi', gotIt: 'Hubadhe!', dismiss: 'Dhiisi',
    benefit1Title: 'Ariifataa', benefit1Desc: 'Saffisaan galmaa\'a',
    benefit2Title: 'Uummamaa', benefit2Desc: 'Akka appitti',
    benefit3Title: 'Beeksisa', benefit3Desc: 'Beeksisa argadhu',
  },
  community: {
    title: 'Hawaasa', myGroups: 'Gareelee Kiyya', joinGroup: 'Garee Makama\'a',
    createGroup: 'Garee Uumi', groupName: 'Maqaa Garee', groupDescription: 'Ibsa',
    members: 'Miseensota', posts: 'Maxxansa', noPosts: 'Ammaaf maxxansaan hin jiru',
    writePost: 'Maxxansa barreessi...', sendMessage: 'Ergi', leaveGroup: 'Garee Dhiisi',
  },
}
```

### 1B. Update `LanguageContext.tsx`

**File:** `src/app/contexts/LanguageContext.tsx`

Change the localStorage validation:
```ts
// BEFORE:
return (saved === 'en' || saved === 'am') ? saved : 'en';
// AFTER:
return (saved === 'en' || saved === 'am' || saved === 'om') ? saved as Language : 'en';
```

### 1C. Update `LanguageSelector.tsx`

**File:** `src/app/components/LanguageSelector.tsx`

The `languages` array from `i18n.ts` now includes `om`. No manual change needed if it already imports `languages` from i18n — verify and confirm. If it hardcodes the list, add:
```ts
{ code: 'om', name: 'Afan Oromo', nativeName: 'Oromiffa', flag: '🇪🇹' }
```

---

## Phase 2 — Wire Components to Translation Hook

**Pattern for every component** (repeat for each):
```tsx
import { useLanguage } from '../contexts/LanguageContext';
// Inside component:
const { t, language } = useLanguage();
// Replace hardcoded strings: "Prayer Requests" → {t.prayer.prayerRequests}
```

### Priority 1 — Core Screens (highest traffic)

**`CoupleDashboard.tsx`**
Replace: "Growing together in faith" → `t.dashboard.growingTogetherInFaith`, "Days Together" → `t.dashboard.daysTogether`, "Devotional Streak" → `t.dashboard.devotionalStreak`, "Journal Entries" → `t.dashboard.journalEntries`, "Prayers" → `t.dashboard.prayers`, "Questions" → `t.dashboard.questions`, "Add Partner" → `t.dashboard.addPartner`, "Today's Mood" → `t.dashboard.todaysMood`, "View All" → `t.dashboard.viewAll`, "Recent Activity" → `t.dashboard.recentActivity`, mood labels ("Great"/"Good"/"Okay"/"Sad") → `t.mood.great` etc., "Devotional Streak" badge, "days" unit → `t.time.days`.

**`DailyDevotionsFeed.tsx`**
Replace: "Daily Devotions" → `t.devotionals.title`, "Today's Devotional" → `t.devotionals.todaysDevotional`, "Mark Complete" → `t.devotionals.markComplete`, "Share with Partner" → `t.devotionals.shareWithPartner`, "Streak" → `t.devotionals.streak`, "Keep Going!" → `t.devotionals.keepGoing`, "Audio" / "Verses" / tab labels — add new keys `devotionals.audioTab`, `devotionals.versesTab`, `devotionals.highlightsTab` to interface + all 3 language translations.

**`EnhancedJournal.tsx`**
Replace: "New Entry" → `t.journal.newEntry`, "My Entries" → `t.journal.myEntries`, "Shared Entries" → `t.journal.sharedEntries`, entry title placeholder → `t.journal.writeTitle`, content placeholder → `t.journal.writeContent`, "Save Entry" → `t.journal.save`, "Delete Entry" → `t.journal.delete`, "Edit Entry" → `t.journal.edit`, "No journal entries yet" → `t.journal.noEntries`, "Start writing" → `t.journal.startWriting`, "Private" → `t.journal.private`, "Shared" → `t.journal.shared`, "Share with Partner" → `t.journal.shareWithPartner`.

**`PrayerBoard.tsx`**
Replace: "Prayer Requests" → `t.prayer.prayerRequests`, "My Prayers" → `t.prayer.myPrayers`, "Partner's Prayers" → `t.prayer.partnersPrayers`, "New Request" → `t.prayer.newRequest`, "Pray Together" → `t.prayer.prayTogether`, "Mark as Answered" → `t.prayer.markAnswered`, "Answered" → `t.prayer.answered`, "Pending" → `t.prayer.pending`, "No prayer requests yet" → `t.prayer.noRequests`, "Add your first prayer" → `t.prayer.addFirstPrayer`, prayer request placeholder → `t.prayer.writeRequest`.

**`QADiscussionHub.tsx`**
Replace: category labels → `t.questions.categories.*`, "Your Answer" → `t.questions.yourAnswer`, "Partner's Answer" → `t.questions.partnersAnswer`, "Not answered yet" → `t.questions.notAnsweredYet`, "Write your answer..." → `t.questions.writeAnswer`, "Save Answer" → `t.questions.saveAnswer`, "Private" → `t.questions.private`, "Shared" → `t.questions.shared`, "Discuss" → `t.questions.discuss`.

**`CategorySelection.tsx`**
Replace: category names → `t.questions.categories.*`, "Select a Category" → `t.questions.selectCategory`.

### Priority 2 — Profile & Settings

**`SettingsScreen.tsx`**
Replace: "My Profile" → `t.profile.myProfile`, "Edit Profile" → `t.profile.editProfile`, "Partner Code" → `t.profile.partnerCode`, "Language" → `t.profile.language`, "Notifications" → `t.profile.notifications`, "About" → `t.profile.about`, "Sign Out" → `t.auth.signOut`, "Linked with" → `t.profile.linkedWith`, "Relationship Start Date" → `t.profile.relationshipStart`.

**`NotificationCenter.tsx`**
Replace: "Notifications" → `t.notifications.title`, notification type labels using `t.notifications.*` keys.

### Priority 3 — Additional screens

Apply the same pattern to: `MoodTracker.tsx` (mood labels → `t.mood.*`), `RelationshipTimeline.tsx` (milestones labels → `t.milestones.*`), `DailyQuestion.tsx`, `LessonScreen.tsx`, `PreMarriageHub.tsx`.

---

## Phase 3 — Extend Interface for New Keys

Some components need strings not in the current 256-key schema. Add these to the `Translations` interface and provide all 3 language values:

```ts
devotionals: {
  // existing keys...
  audioTab: string;       // "Audio" / "ኦዲዮ" / "Sagalee"
  versesTab: string;      // "Verses" / "ጥቅሶች" / "Weejiilee"
  highlightsTab: string;  // "Highlights" / "ድምቀቶች" / "Ibsituuwwan"
  filter: string;         // "Filter" / "ማጣሪያ" / "Calaluu"
}
journal: {
  // existing keys...
  searchPlaceholder: string; // "Search entries..." / ... / ...
  sortBy: string;            // "Sort by" / ... / ...
}
prayer: {
  // existing keys...
  searchPrayers: string;     // "Search prayers..." / ... / ...
  together: string;          // "Together" / "አብሮ" / "Waliin"
}
```

---

## Execution Order

1. `src/app/utils/i18n.ts` — add `om` type + translations + new interface keys (all 3 languages)
2. `src/app/contexts/LanguageContext.tsx` — allow `'om'` in validation
3. `src/app/components/LanguageSelector.tsx` — confirm `om` appears in language list
4. `CoupleDashboard.tsx` — wire hook, replace dashboard strings
5. `DailyDevotionsFeed.tsx` — wire hook, replace devotionals strings
6. `EnhancedJournal.tsx` — wire hook, replace journal strings
7. `PrayerBoard.tsx` — wire hook, replace prayer strings
8. `QADiscussionHub.tsx` + `CategorySelection.tsx` — wire hook, replace Q&A strings
9. `SettingsScreen.tsx` — wire hook, replace profile/settings strings
10. `NotificationCenter.tsx`, `MoodTracker.tsx`, `RelationshipTimeline.tsx` — wire hook

---

## Verification

1. Open LanguageSelector → confirm 3 options appear: English, አማርኛ, Oromiffa
2. Switch to Amharic → all wired components show Amharic text, bottom nav shows: መነሻ / የእምነት ጥናት / ጸሎት / ማህበረሰብ / መገለጫ
3. Switch to Afan Oromo → bottom nav shows: Mana / Kaayyoo Amantii / Kadhannaa / Hawaasa / Eenyummaa; dashboard title shows "Fuula Jalqabaa"
4. Switch back to English → all text returns to English
5. Reload page → language preference persists (localStorage `twobeone_language = 'om'`)
6. Design system: all new/modified JSX uses CSS vars (`var(--primary-600)`, `var(--spacing-4)`, etc.) — no raw Tailwind color utilities

---

# Performance Fix Plan — Slow Response Times

## Context

The app is experiencing severe slowness because of two compounding problems:

1. **Frontend: `loadUserData()` is a sequential waterfall.** Profile → journal → responses → devotionals → streaks are all `await`ed in series. Each call also blocks on `await warmUpServer()` before any data fetch begins. Total cold-load time: 15–20 seconds instead of the ~5s it would be if parallelized.

2. **Backend: every high-traffic route makes multiple KV calls in series.** The journal route has a custom retry wrapper that adds 300ms delays and can take 20s. The prayer, moods, and milestones routes also fetch user then partner data sequentially rather than in parallel.

Secondary contributors: 7 concurrent polling intervals (including a 1-second timer that re-renders CoupleDashboard every tick, and a 10-second highlights poll in DailyDevotionsFeed), an unbounded notifications query, and 11 handler functions recreated on every App render.

---

## Fix 1 — Parallelize `loadUserData()` in App.tsx  *(biggest user-visible win)*

**File:** `src/app/App.tsx` — the `loadUserData` function (lines ~349–595)

**Problem:** Six independent API calls run sequentially. Profile waits for warmUp, journal waits for profile, responses wait for journal, devotionals wait for responses, streaks wait for devotionals.

**Change:**
1. Fire `warmUpServer()` as a **non-blocking side-effect** — do NOT `await` it; just call it and continue immediately.
2. Run all independent fetches concurrently with `Promise.allSettled`:

```ts
const loadUserData = async (token?: string) => {
  const authToken = token || accessToken;
  if (!authToken || !user) return;
  setIsLoading(true);
  setLoadError(null);

  // Fire-and-forget warm-up (don't block on it)
  warmUpServer();

  try {
    // Profile is needed first — its result gates a few downstream actions
    const profileData = await api.profile.get();
    setProfile(profileData.profile || null);
    setPartner(profileData.partner || null);
    setLoadError(null);

    // Admin check fire-and-forget (already non-blocking)
    adminApi.checkPrivileges()
      .then(d => setIsAdmin(d.isAdmin || false))
      .catch(() => setIsAdmin(false));

    // All remaining data can load concurrently
    const [journalResult, prayerResult, milestonesResult, responsesResult, devotionalsResult, streaksResult] =
      await Promise.allSettled([
        api.journal.list(),
        api.prayer.list(),
        api.milestones.list(),
        api.questions.getResponses(),
        api.devotionals.list(),   // replace raw fetch with api utility (see Fix 4)
        api.streaks.get(),        // replace raw fetch with api utility (see Fix 4)
      ]);

    if (journalResult.status === 'fulfilled') setJournalEntries(journalResult.value.entries || []);
    if (prayerResult.status === 'fulfilled')  setPrayers(prayerResult.value.prayers || []);
    if (milestonesResult.status === 'fulfilled') setMilestones(milestonesResult.value.milestones || []);
    if (responsesResult.status === 'fulfilled') {
      setResponses({ user: responsesResult.value.userResponses || [], partner: responsesResult.value.partnerResponses || [] });
    }
    if (devotionalsResult.status === 'fulfilled') setDevotionals(devotionalsResult.value.devotions || []);
    if (streaksResult.status === 'fulfilled') {
      const s = streaksResult.value.streaks?.find((x: any) => x.streak_type === 'devotional');
      setDevotionalStreak(s?.current_streak || 0);
    }
  } catch (profileErr: any) {
    setLoadError('Unable to load your profile. Please refresh and try again.');
  } finally {
    setIsLoading(false);
  }
};
```

Expected gain: load time drops from ~15–20s to ~5–8s (profile RTT + one parallel batch).

---

## Fix 2 — Add `devotionals` and `streaks` to `api.ts`  *(required by Fix 1)*

**File:** `src/app/utils/api.ts`

Add two named exports so Fix 1 can use the standard api utility instead of raw `fetch()`:

```ts
export const devotionals = {
  list: async () =>
    apiCall<{ devotions: any[] }>('/devotions', {}, 1, 15000),
};

export const streaks = {
  get: async () =>
    apiCall<{ streaks: any[] }>('/streaks', {}, 1, 10000),
};
```

Also add them to the `api` default export object at the bottom.

---

## Fix 3 — Parallelize backend KV calls  *(backend latency)*

**File:** `supabase/functions/server/index.tsx`

Three routes fetch user data then partner data in two sequential `kv.getByPrefix` calls. Replace with `Promise.all`.

### 3A. `GET /journal` (line ~1248)
Remove the custom `fetchWithRetry` wrapper entirely (KV calls don't need application-level retry — they're in-process). Replace with:
```ts
const [profile, userEntries] = await Promise.all([
  kv.get(`user:${userId}`),
  kv.getByPrefix(`journal:${userId}:`),
]);
const partnerEntries = profile?.partnerId
  ? await kv.getByPrefix(`journal:${profile.partnerId}:`)
  : [];
```
Profile + user journal entries now run in parallel. Partner fetch can only start after profile (needs partnerId) but runs immediately after — total: 2 round trips instead of 3+.

### 3B. `GET /prayer` (line ~1508)
Replace sequential profile → user prayers → partner prayers with:
```ts
const [profile, userPrayers] = await Promise.all([
  kv.get(`user:${userId}`),
  kv.getByPrefix(`prayer:${userId}:`),
]);
const partnerPrayers = profile?.partnerId
  ? await kv.getByPrefix(`prayer:${profile.partnerId}:`)
  : [];
```

### 3C. `GET /milestones` (line ~2700)
Same pattern: parallel profile + user milestones, then partner milestones if partnerId exists.

### 3D. `GET /moods` (line ~1695)
It already uses `fetchWithTimeout` — replace sequential calls with:
```ts
const [profile, userMoods] = await Promise.all([
  kv.get(`user:${userId}`),
  kv.getByPrefix(`mood:${userId}:`),
]);
const partnerMoods = profile?.partnerId
  ? await kv.getByPrefix(`mood:${profile.partnerId}:`)
  : [];
```

### 3E. `GET /notifications` — cap result set
Add `.slice(0, 50)` after sorting notifications (currently unbounded). Prevents memory and processing spikes for active users.

---

## Fix 4 — Reduce polling aggression  *(CPU + network relief)*

### 4A. DailyDevotionsFeed 10-second highlights poll → 60 seconds
**File:** `src/app/components/DailyDevotionsFeed.tsx` — change `setInterval(loadHighlights, 10000)` to `setInterval(loadHighlights, 60000)`.

### 4B. Isolate 1-second CoupleDashboard timer
**File:** `src/app/components/CoupleDashboard.tsx`

The `setInterval(..., 1000)` that calls `setTimeTogether()` re-renders the entire ~500-line component every second. Extract the timer into a tiny isolated component:

```tsx
const TimerDisplay = memo(function TimerDisplay({ profile, coupleData }: { profile: any; coupleData: any }) {
  const [time, setTime] = useState(() => calculateTimeTogether(profile, coupleData));
  useEffect(() => {
    const id = setInterval(() => setTime(calculateTimeTogether(profile, coupleData)), 1000);
    return () => clearInterval(id);
  }, [profile?.relationshipStart, coupleData?.relationshipStartDate]);
  return <span>{time.days}d {time.hours}h {time.minutes}m {time.seconds}s</span>;
});
```

Remove `timeTogether` state and the 1s interval from `CoupleDashboard`. Replace the counter display with `<TimerDisplay />`. Parent CoupleDashboard now re-renders only when meaningful data changes, not 60× per minute.

---

## Fix 5 — Wrap handlers in useCallback  *(prevent cascading re-renders)*

**File:** `src/app/App.tsx`

Wrap all 11+ plain `async function` handlers in `useCallback`. The dependency arrays:

| Handler | Dependencies |
|---|---|
| `handleAddJournalEntry` | `[accessToken, profile, progress]` |
| `handleUpdateJournalEntry` | `[accessToken]` |
| `handleDeleteJournalEntry` | `[accessToken]` |
| `handleAddPrayer` | `[accessToken, profile]` |
| `handleUpdatePrayer` | `[accessToken]` |
| `handleDeletePrayer` | `[accessToken]` |
| `handleMarkPrayed` | `[accessToken]` |
| `handleAddMilestone` | `[accessToken]` |
| `handleUpdateMilestone` | `[accessToken]` |
| `handleDeleteMilestone` | `[accessToken]` |
| `handleSaveQuestionResponse` | `[accessToken, profile]` |
| `handleCompleteDevotional` | `[accessToken, selectedDevotionalId]` |
| `updateProgress` | `[accessToken]` |

Also stabilize `handlePrayClick` (currently inline in JSX): `const handlePrayClick = useCallback(() => setActiveTab('prayer'), []);`

---

## Fix 6 — Move inline constants to module scope

**File:** `src/app/App.tsx`

Move these out of the component body so they don't recreate on every render:
- `QA_CATEGORY_LABELS` (currently ~line 975) → module scope, `as const`
- `GUIDANCE_MODULES` (currently ~line 1190) → module scope, `as const`
- `REFLECTION_PROMPTS` (currently ~line 1196) → module scope, `as const`

Keep `todaysPrompt` inside the component as a `useMemo([], [])` since it reads `new Date()`.

---

## Fix 7 — React.memo on BottomNavigation

**File:** `src/app/components/BottomNavigation.tsx`

Wrap the export with `memo`. It receives only `activeTab: string` and `onTabChange` (a stable `useState` setter), so it should never re-render during the 1s timer ticks or any unrelated state changes.

```tsx
import { memo } from 'react';
export const BottomNavigation = memo(function BottomNavigation({ activeTab, onTabChange }) { ... });
```

---

## Execution Order

| Priority | Fix | Expected Gain |
|---|---|---|
| 1 | Fix 2 — add devotionals + streaks to api.ts | Required by Fix 1 |
| 2 | Fix 1 — parallelize loadUserData() | 10–15s → 4–6s load time |
| 3 | Fix 3A — parallel journal KV calls | -3–5s journal route |
| 4 | Fix 3B/C/D — parallel prayer/milestones/moods | -1–2s per route |
| 5 | Fix 3E — cap notifications at 50 | Prevents memory spikes |
| 6 | Fix 4A — reduce highlights poll 10s → 60s | -5 extra network calls/min |
| 7 | Fix 4B — isolate 1s timer | Removes 60 re-renders/min |
| 8 | Fix 5 — useCallback on handlers | Stops child re-render cascade |
| 9 | Fix 6 — module-scope constants | Minor GC reduction |
| 10 | Fix 7 — React.memo BottomNavigation | Low-cost insurance |

---

## Verification

1. **Load time**: Hard-reload the app → dashboard should fully populate within 5–7s (previously 15–20s)
2. **Network tab**: After Fix 1, journal/prayer/streaks/devotionals requests should start at the same timestamp (parallel), not staggered
3. **React DevTools Profiler**: Record 5s idle on the dashboard — BottomNavigation and FloatingActionButtons should show 0 renders; TimerDisplay should show renders every 1s but nothing else
4. **Console**: No more `[App] Loading journal entries...` then waiting, then `[App] Responses loading...` — all logs should appear at roughly the same time
5. **Design system**: No raw Tailwind color utilities in modified files (grep `bg-(rose|red|blue|green|gray|purple)-` in changed files → 0 hits)

---

# Code Optimization Plan — Couple Devotional App

## Context

The app's entire component tree lives under a single `App.tsx` (~1720 lines) with 28+ `useState` calls and no memoization on any of the 11+ async handler functions. Every state change (including a 1-second timer in `CoupleDashboard`) re-renders `App` and cascades through all 32 eagerly-imported child components. No `React.lazy` is used anywhere, meaning every user downloads ~400–500KB of JS they may never need (admin panel, debug tools, landing page). The goal is maximum FPS on 120Hz viewports with minimum initial load weight, while enforcing the team design system CSS variables throughout.

---

## Phase 1 — Zero-Risk Constant Extraction (App.tsx)

**Why first:** Pure moves of static data out of render scope. No logic change, no risk, immediate GC + memoization wins.

### 1A. Move `QA_CATEGORY_LABELS` to module scope
- **File:** `src/app/App.tsx` lines 994–1006
- Move the object literal **above** `export default function App()` and add `as const`
- No downstream changes needed — it is only read inside `handleSaveQuestionResponse`

### 1B. Move `guidanceModules` + `reflectionPrompts` to module scope
- **File:** `src/app/App.tsx` lines 1179–1191
- Move both arrays above the component export, rename to `GUIDANCE_MODULES` / `REFLECTION_PROMPTS`
- Replace `todaysPrompt` with `useMemo(() => REFLECTION_PROMPTS[new Date().getDate() % REFLECTION_PROMPTS.length], [])` inside the component

### 1C. Replace devotional-lookup IIFE with `useMemo`
- **File:** `src/app/App.tsx` lines 1666–1690
- The inline `(() => { devotionals.find(...) })()` passed as a prop runs a linear search on every render (including every 1s timer tick from CoupleDashboard)
- Replace with:
```tsx
const selectedDevotional = useMemo(() => {
  if (selectedDevotionalId && devotionals.length > 0) {
    const found = devotionals.find(d => d.id === selectedDevotionalId);
    if (found) return {
      id: found.id,
      title: found.title || 'Daily Devotion',
      verse: found.verse || '',
      reference: found.reference || found.verseReference || '',
      reflection: found.reflection || found.content || '',
      prayer: found.prayerPrompt || '',
      audioUrl: found.audioUrl,
    };
  }
  return { title: 'Daily Devotion', verse: '', reference: '', reflection: '', prayer: '' };
}, [selectedDevotionalId, devotionals]);
```
- Pass `devotional={selectedDevotional}` to `<DevotionalDialog>`

---

## Phase 2 — useCallback All Handlers in App.tsx

**Why:** All 11 async handlers are recreated on every App render and passed as props to children. This defeats any memoization on those children. `handleSignOut` is already memoized — leave it.

Wrap each with `useCallback` and the minimum accurate dependency array:

| Handler | Dependencies |
|---|---|
| `handleAddJournalEntry` | `[accessToken, profile, progress]` |
| `handleUpdateJournalEntry` | `[accessToken]` |
| `handleDeleteJournalEntry` | `[accessToken]` |
| `handleAddPrayer` | `[accessToken, profile]` |
| `handleUpdatePrayer` | `[accessToken]` |
| `handleDeletePrayer` | `[accessToken]` |
| `handleMarkPrayed` | `[accessToken]` |
| `handleAddMilestone` | `[accessToken]` |
| `handleUpdateMilestone` | `[accessToken]` |
| `handleDeleteMilestone` | `[accessToken]` |
| `handleSaveQuestionResponse` | `[accessToken, profile]` |
| `handleCompleteDevotional` | `[accessToken, selectedDevotionalId]` |
| `updateProgress` | `[accessToken]` |
| `handlePrayClick` (inline `() => setActiveTab('prayer')`) | `[]` — extract and stabilize for FloatingActionButtons |

Also verify `loadUserData` itself is stable. If it is not wrapped in `useCallback`, wrap it with `[accessToken, user]`.

---

## Phase 3 — React.memo on Leaf Components

### 3A. `BottomNavigation`
- **File:** `src/app/components/BottomNavigation.tsx`
- Receives only `activeTab: string` + `onTabChange` (stable `useState` setter)
- Wrap export with `memo` — should never re-render from 1s timer ticks
- Simultaneously apply design-system fixes (see Phase 7A)

### 3B. `FloatingActionButtons`
- **File:** `src/app/components/FloatingActionButtons.tsx`
- Wrap with `memo`; its `onPrayClick` will be stable after Phase 2 stabilizes it

### 3C. Journal entry card in `EnhancedJournal`
- **File:** `src/app/components/EnhancedJournal.tsx`
- Extract the per-entry JSX inside `sortedDateKeys.map(...)` into a named `JournalEntryCard` component
- Wrap it with `memo`; stabilize `onEdit` and `onAddComment` inside `EnhancedJournal` with `useCallback`

---

## Phase 4 — React.lazy + Suspense Code Splitting

**Why:** Zero `React.lazy` currently used. Every authenticated user downloads ~400–500KB of JS for screens they may never open.

Add `lazy` and `Suspense` to the React import in `App.tsx`. Create a shared spinner fallback:
```tsx
const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[200px] bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);
```

Convert static imports to `lazy()` in this priority order:

| Component | Est. Savings | Condition |
|---|---|---|
| `LandingPage` | ~45KB | `showLanding && !user` |
| `AdminPanel` (+ 8 sub-managers) | ~200KB | `isAdmin && selectedScreen === 'admin'` |
| `TestingDashboard` | ~30KB | `selectedScreen === 'testing'` |
| `DebugQuestions` | ~25KB | `selectedScreen === 'debug-questions'` |
| `DebugResponses` | ~25KB | `selectedScreen === 'debug-responses'` |
| `ScriptureMemory` | ~50KB | `selectedScreen === 'scripture-memory'` |
| `QuizzesHub` | ~40KB | `selectedScreen === 'quizzes'` |
| `PreMarriageHub` | ~35KB | `selectedScreen === 'guidance'` |

**Pattern for each:**
```tsx
// Remove: import { LandingPage } from './components/LandingPage';
const LandingPage = lazy(() =>
  import('./components/LandingPage').then(m => ({ default: m.LandingPage }))
);
// Wrap usage with: <Suspense fallback={<LazyFallback />}>...</Suspense>
```

Named exports (not default exports) must use `.then(m => ({ default: m.ComponentName }))`.

---

## Phase 5 — useMemo for Expensive Derived Computations

### 5A. `EnhancedJournal` — groupedEntries
- **File:** `src/app/components/EnhancedJournal.tsx` lines 367–396
- `.filter()` + `.sort()` + `.reduce()` runs on every render including local modal toggles
- Wrap all three operations in one `useMemo([entries])` returning `{ groupedEntries, sortedDateKeys, validEntries }`

### 5B. `CoupleDashboard` — isolate 1-second timer
- **File:** `src/app/components/CoupleDashboard.tsx`
- The `setInterval(..., 1000)` calling `setTimeTogether(...)` re-renders the entire 500-line component every second, recalculating all derived values
- Extract `timeTogether` state + the 1s interval into a new `TimerDisplay` child component wrapped in `memo`
- `TimerDisplay` accepts `profile` + `coupleData` props, manages its own state; parent CoupleDashboard stops re-rendering every second
- Wrap `recentEntries` derivation in `useMemo([journalEntries])`
- Wrap `handleMilestoneDelete`, `handleMilestoneAdd`, `handleMoodUpdate` in `useCallback`

### 5C. `QADiscussionHub` — calculateMatchPercentage
- **File:** `src/app/components/QADiscussionHub.tsx` line ~679
- Wrap the `calculateMatchPercentage(...)` call in `useMemo([bothAnswered, question.prompts, question.userAnswers, question.partnerAnswers])`

---

## Phase 6 — Fix Inline Style DOM Mutations → CSS

### 6A. `NotificationCenter` hover states
- **File:** `src/app/components/NotificationCenter.tsx`
- 8 `onMouseEnter/Leave` handlers directly mutate `e.currentTarget.style.background` — bypasses React, creates new function instances per render, prevents CSS transitions
- Add CSS classes to `src/styles/globals.css`:
```css
.notification-trigger:hover { background: var(--neutral-100); transition: background 150ms; }
.notification-item:hover    { background: var(--muted);        transition: background 150ms; }
.notification-dismiss:hover { background: var(--neutral-200);  transition: background 150ms; }
```
- Remove all `onMouseEnter` / `onMouseLeave` props; add corresponding class names to elements

---

## Phase 7 — Design System Compliance Sweep

**Rule:** No raw Tailwind color utilities (`bg-rose-500`, `text-blue-600`, `from-purple-50`, etc.). Use CSS vars via semantic Tailwind classes or `style={{ color: 'var(--primary-600)' }}`.

**Mapping table:**

| Raw utility | Replacement |
|---|---|
| `bg-gray-50 dark:bg-gray-950` | `bg-background` |
| `bg-white dark:bg-gray-900` | `bg-background` or `bg-card` |
| `border-gray-200 dark:border-gray-800` | `border-border` |
| `text-gray-500 dark:text-gray-400` | `text-muted-foreground` |
| `text-gray-900 dark:text-gray-100` | `text-foreground` |
| `text-rose-600` / `text-primary-600` | `text-primary` |
| `bg-rose-100` | `style={{ background: 'var(--primary-100)' }}` |
| `text-green-600` | `style={{ color: 'var(--success-700)' }}` |
| `bg-green-50` | `style={{ background: 'var(--success-50)' }}` |
| `text-red-600` | `style={{ color: 'var(--error-500)' }}` |
| `bg-red-50` | `style={{ background: 'var(--error-50)' }}` |
| gradient `from-purple-50 to-pink-50` | `style={{ background: 'var(--primary-50)' }}` or add a CSS class |

**Priority files for sweep (already partially done for App.tsx, DevotionalDialog, PWAInstallHelp):**
1. `BottomNavigation.tsx` — done alongside Phase 3A
2. `CoupleDashboard.tsx` — audit after Phase 5B
3. `EnhancedJournal.tsx` — audit after Phase 5A
4. `DailyDevotionsFeed.tsx` — standalone sweep
5. `PrayerBoard.tsx` — standalone sweep
6. `NotificationCenter.tsx` — done alongside Phase 6A

**Typography rule:** Only use font faces declared in `src/styles/fonts.css`. Currently the file is empty so the system font stack applies. If custom `@font-face` rules are added to `fonts.css` in future, all font-family references must use only those faces — never hardcode `font-sans`, `font-serif`, or specific family names not declared there.

---

## Verification

After each phase, verify with:

1. **TypeScript** — `tsc --noEmit` passes with no new errors
2. **React DevTools Profiler** — record a 5-second session on CoupleDashboard; confirm `BottomNavigation` shows grey (no re-render), `TimerDisplay` shows yellow (expected every 1s) but parent CoupleDashboard does not
3. **React DevTools Components** — select a memo-wrapped component; "Why did this render?" should say "Props are equal (bailout)" on unrelated state changes
4. **Network tab** — after lazy loading, confirm `LandingPage.[hash].js` and `AdminPanel.[hash].js` are absent from the initial page load waterfall; they appear only when their conditions are met
5. **Design system** — grep for raw color utilities: `rg "bg-(rose|red|blue|green|purple|gray|yellow|pink|indigo)-" src/app/components/` should return 0 hits in modified files
6. **Functional regression** — manually exercise: add journal entry, add prayer, mark devotional complete, switch all tabs, open admin panel (as admin), open landing page (sign out)
