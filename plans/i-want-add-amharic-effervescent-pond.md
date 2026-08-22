# Plan: Add Amharic Bible Version for Daily Verse

## Context

The app currently shows a Daily Bible Verse that rotates through 8 hardcoded verses fetched from `bible-api.com` (KJV only). The user wants to add an Amharic-language Bible translation so the daily verse can be read in Amharic (አማርኛ). There is no free public Amharic Bible API, so Amharic verse text will be stored as static data alongside the existing English verses.

## Approach

### 1. Create Amharic verse data file
**File to create**: `src/app/data/amharic-verses.ts`

Store the Amharic translations of the 8 rotating daily verses as a static map keyed by verse reference. Each entry includes:
- `reference` (English key, e.g. `"John 3:16"`)
- `referenceAmharic` (e.g. `"ዮሐንስ 3:16"`)
- `text` (Amharic verse text from standard Amharic Bible - አማርኛ መጽሐፍ ቅዱስ)
- `translation` (e.g. `"አማርኛ መጽሐፍ ቅዱስ"`)

The 8 verses to translate:
- John 3:16 → ዮሐንስ 3:16
- Philippians 4:13 → ፊልጵስዩስ 4:13
- Proverbs 3:5-6 → ምሳሌ 3:5-6
- Romans 8:28 → ሮሜ 8:28
- Jeremiah 29:11 → ኤርምያስ 29:11
- Psalm 23:1 → መዝሙር 23:1
- Isaiah 40:31 → ኢሳይያስ 40:31
- 1 Corinthians 13:4-8 → 1ቆሮንቶስ 13:4-8

### 2. Add language toggle to the Daily Verse section in CoupleDashboard.tsx
**File to modify**: `src/app/components/CoupleDashboard.tsx`

- Add state: `const [verseLanguage, setVerseLanguage] = useState<'en' | 'am'>('en')`
- Import the Amharic verses map
- In the verse card UI, add a small toggle row with two pill buttons: `English` / `አማርኛ`
- When Amharic is selected, display the static Amharic verse text and Amharic reference/translation label instead of the API-fetched English text
- All styling uses existing CSS variables (`--card`, `--primary`, `--text-sm`, `--radius-md`, `--spacing-*`, etc.) — no new raw colors

### 3. Styling the language toggle
Use CSS variable tokens only:
```tsx
// Toggle container
style={{ display: 'flex', gap: 'var(--spacing-1)', padding: 'var(--spacing-1)' }}

// Active pill
style={{
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)',
  padding: 'var(--spacing-1) var(--spacing-2)',
  border: 'none',
  cursor: 'pointer',
}}

// Inactive pill
style={{
  background: 'transparent',
  color: 'var(--muted-foreground)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)',
  padding: 'var(--spacing-1) var(--spacing-2)',
  border: '1px solid var(--border)',
  cursor: 'pointer',
}}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/app/data/amharic-verses.ts` | **Create** — static Amharic translations of 8 daily verses |
| `src/app/components/CoupleDashboard.tsx` | Add `verseLanguage` state, import Amharic data, add EN/AM toggle in verse card |

## Key Reuse

- Existing `dailyVerse` state and fetch logic — untouched, Amharic is a local fallback layer
- Existing `dayOfYear % verses.length` index calculation — reuse same index for Amharic lookup
- Existing amber card styling and layout — only insert toggle above the verse text

## Verification

1. Open the app and navigate to the Couple Dashboard
2. Confirm the Daily Verse card shows an `English | አማርኛ` toggle
3. Click `አማርኛ` — verse text, reference, and translation label all switch to Amharic
4. Click `English` — switches back to KJV text
5. Verify toggle buttons use CSS variable colors (no hardcoded hex)
6. Confirm verse rotates correctly on different days (index logic unchanged)
