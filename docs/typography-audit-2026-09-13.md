# TwoBeOne typography audit

> Historical baseline: the findings and evidence below record the pre-change audit. Its proposed scale was accepted on 13 September 2026. Follow the canonical [TwoBeOne Typography Language, version 1](twobeone-typography-language.md) for current implementation; the original audit text is preserved for comparison.

13 September 2026 · Audit and proposed standard only

The inconsistency is real. Equivalent headings, actions and labels use different sizes, weights and spacing. Two implementation defects also make typography unpredictable: the global defaults depend on unrelated classes, and the intended Ethiopic font is not selected by the app's CSS.

No application typography was changed during this audit. The [interactive specimen](typography-proposal.html) illustrates the proposed standard; it is not an implemented screen.

## Scope and evidence

- Traced local imports from `src/main.tsx` through `src/app/App.tsx`: 184 reachable source/style files, including 138 TSX files and 20 CSS files.
- Reviewed the public landing page, authentication, onboarding, dashboard, calendar, devotions and reading, journal, prayer, chat, community, settings, Q&A/guidance, navigation, shared UI components and admin consoles.
- Ran browser checks in Windows Edge at a 390px viewport using the actual application styles. Inspected computed typography and the platform fonts used to render Latin, Amharic and Oromo samples. Dashboard data was mocked; no account data was changed.
- Recorded computed values and rendered font names in [browser evidence](typography-audit-evidence.json).
- Full screen/state coverage, real iOS/Android font rendering, and every admin/translation layout were not browser-tested. Findings outside the browser samples are based on source inspection.
- Excluded inactive duplicate styles, native/Expo scaffolding outside the active web entry, and miniature phone illustrations from normal UI recommendations. The reachability inventory is a static dependency scan, not a count of simultaneously rendered screens.

## Priority findings

### 1. High: unrelated classes change a heading's typography

`src/styles/globals.css:305` uses an ancestor selector with `:where`, `:not` and `:has` to decide whether heading/body defaults apply. Its behavior does not match the comment above it.

Browser reproduction, using the active stylesheet:

```html
<div>
  <h2>Equivalent heading</h2>
  <span class="text-muted-foreground">Caption</span>
</div>
<div>
  <h2>Equivalent heading</h2>
  <span class="block text-muted-foreground">Caption</span>
</div>
```

| Identical heading | Computed size | Weight | Line height |
| --- | --- | --- | --- |
| First group | 20px | 500 | 30px |
| Second group | 16px | 400 | 24px |

Adding `block` to a sibling should never change a heading. Replace this rule with ordinary element defaults inside `@layer base`, then use explicit role classes/components for exceptions. Tailwind utilities can override the base layer without this selector.

### 2. High: Amharic has no explicit font assignment

`src/app/contexts/LanguageContext.tsx:58–69` sets the language and requests a Noto Sans Ethiopic stylesheet for Amharic **and Oromo**. `src/styles/fonts.css:1` contains only a comment; the active styles never assign that family to text.

In the browser sample:

- Latin and Oromo rendered in **Segoe UI**.
- Amharic glyphs rendered in **Nyala**, with Segoe UI for spaces.
- Noto Sans Ethiopic remained `unloaded`; no font-file resource was observed.

One request for the Google Fonts stylesheet was blocked by the browser (`ERR_BLOCKED_BY_ORB`) in this session. Font delivery therefore also needs verification; the source-level absence of a font-family assignment remains a separate confirmed issue.

Define a shared UI stack and explicitly select the Ethiopic family for `lang="am"` content. Load it when Amharic content is displayed, including mixed-language reading text, rather than coupling it only to the selected UI language. Oromo uses Latin script and should use the shared Latin UI stack. An existing mixed-language example is the Amharic quotation in `CoupleDashboard.tsx:763`.

### 3. High: some mobile text is too small for the proposed standard

These are functional page elements, not text inside miniature illustrations:

| Element | Current value | Evidence |
| --- | --- | --- |
| Landing hero eyebrow | 6.8px / 650 | `launch-landing.css:1572`; browser confirmed |
| Landing trust notes | 8px | `launch-landing.css:1608`; browser confirmed |
| Landing navigation action / web-app link | 10px | `launch-landing.css:1597–1604`; browser confirmed |
| Bottom navigation labels | 9px / 800 | `BottomNavigation.tsx:66` |
| Chat timestamps | 10px / 600 | `PartnerChat.tsx:183` |
| Dashboard stat labels | 10px / 900 | `CoupleDashboard.tsx:691` |
| Admin audit categories and operational metadata | 8–10px | `security-console.css:1–2`, `users-console.css:5–6` |

Use 12px as the normal caption minimum, with 14px for supporting copy/actions. Keep essential labels legible by allowing wrapping or simplifying copy. Any compact navigation exception should be deliberate and tested in all three languages. This is a design/readability finding, not a claim that a font-size threshold alone determines accessibility compliance.

### 4. Medium: equivalent roles have several competing definitions

| Role | Current examples |
| --- | --- |
| Page heading | Guidance: 20px/700; Q&A: 24→30px/700; Journal, Prayer, Devotions and Community: 30→36px/700; Calendar: 30→36px/900 |
| Card title | Dashboard: 16px/900; calendar shortcut: 18px/900; journal entries: 18px/700; community cards: 18→20px/700 |
| Dialog title | Shared default: 18px/600; journal/prayer creation: 24px/700; calendar creation: 24px/900; question discussion: 20px/600 |
| Form label | Shared default: 14px/500; journal: 11–12px/500–600; calendar: 14px/700 |
| Action label | Shared button: 14px/500; dashboard: 14px/600; journal/prayer: 14px/700; login: 15px/600; onboarding: 16px/800 |
| Supporting copy | 12, 13, 14, 15 and 16px, with independently chosen line heights |

Representative sources: `PreMarriageHub.tsx:891`, `QADiscussionHub.tsx:397`, `EnhancedJournal.tsx:440,591,812,910`, `PrayerBoard.tsx:347,514,624`, `DailyDevotionsFeed.tsx:391`, `CommunityGroups.tsx:318,365,506`, `CoupleCalendar.tsx:472,618`, `AuthPage.tsx:286`, `OnboardingScreen.tsx:282`.

The small differences accumulate. Making every screen bold would not resolve the hierarchy; equivalent roles need shared definitions.

### 5. Medium: shared components do not consistently define their own text roles

- `ui/card.tsx:35,45`: CardTitle supplies only `leading-none`; CardDescription supplies only color. Unstyled consumers, including settings cards, depend on inherited/global typography.
- DialogTitle defines a size/weight, while SheetTitle and DrawerTitle omit size (`ui/dialog.tsx:162`, `ui/sheet.tsx:111`, `ui/drawer.tsx:102`).
- Input and Textarea switch from 16px on mobile to 14px on desktop, while auth fields use 15px (`ui/input.tsx:12`, `ui/textarea.tsx:10`, `AuthPage.tsx:252`).
- Toasts retain Sonner's separate 13px default; the local wrapper only configures colors (`ui/sonner.tsx:13–18`).

Give each shared primitive a complete default role: family, size, weight and line height. Use explicit variants for compact controls and reading views.

### 6. Medium: public and admin areas use separate typography systems

The landing page uses an Avenir/Segoe sans stack and Georgia headlines (`launch-landing.css:12,54`), while the signed-in app inherits Tailwind's system sans stack. In the Windows browser the sans stacks both resolve to Segoe UI; the serif headline is visibly different, and other operating systems may resolve the sans stacks differently.

Auth and onboarding add another set of action/body weights. Admin consoles independently use values such as 650, 750, 780, 800 and 850 and several page-title scales. These are valid CSS values, but their use is not attached to clear roles. `admin-tokens.css` defines colors and layout tokens without a corresponding typography scale.

Recommend a shared UI family and role system across public, signed-in and admin screens. A serif marketing headline can remain only as an explicitly approved brand exception; the proposed default uses sans headings throughout.

### 7. Maintenance: parallel tokens and ad hoc overrides make consistency difficult

`globals.css:99–122` declares semantic-looking pixel tokens such as `--text-title` and `--text-body`, but global HTML defaults use different Tailwind size tokens. Inline styles, arbitrary utilities and custom CSS then add more values.

Static source counts, before any typography fixes:

| Measure | Count |
| --- | ---: |
| Inline `fontSize` declarations in reachable JSX | 277 |
| Inline `fontWeight` declarations in reachable JSX | 160 |
| `font-black` utility occurrences | 83 |
| `font-extrabold` utility occurrences | 14 |
| Literal JSX text-size overrides below 12px | 65 across 19 files |

These are source occurrences, not a claim that every occurrence is a defect. Custom CSS and miniature previews need separate role review. An additional typo candidate is `--text-title3` in `admin/DevotionalsImportExport.tsx:459`; no definition was found in `src`.

## Proposed shared standard

At the existing 16px root size, define these roles in `rem`, including their weight and line height. Use one explicit system sans stack for the UI and an explicitly selected Noto Sans Ethiopic family for Amharic. Keeping a system stack preserves the current native feel; exact Latin letterforms will still vary by operating system.

| Role | Mobile → desktop | Weight | Line height |
| --- | --- | ---: | --- |
| Page title | 28 → 32px | 700 | 1.2 |
| Section title | 20px | 700 | 1.3 |
| Card title | 18px | 600 | 1.35 |
| Dialog/sheet/drawer title | 20px | 600 | 1.3 |
| Body and editable field text | 16px | 400 | 1.5 |
| Supporting copy | 14px | 400 | 1.5 |
| Form label and standard action | 14px | 600 | 1.4 |
| Caption, timestamp and metadata | 12px | 500 | 1.4 |

Use 400/500/600/700 for normal UI roles. Reserve the existing 800 brand wordmark for branding. Use slight negative tracking for large titles, normal tracking for body/actions, and restrained tracking for optional Latin eyebrows. Avoid applying uppercase or wide letter spacing indiscriminately to translations.

Preserve the user-approved dashboard exceptions: couple names 28→32px/700; day count 40→44px/700; bold red 14px clock; bold 14px tagline; tabular numeric counters. Reading text, scripture quotations, code/invite identifiers and intentional preview artwork need their own explicit variants.

## Proposed implementation order

1. Correct the global selector and font-family/loading setup. Verify unstyled headings and EN/AM/OM rendering first.
2. Add shared typography role tokens/classes and defaults for cards, overlays, forms, actions, toasts and navigation.
3. Migrate equivalent roles in the couple screens, keeping the approved hero and reading exceptions.
4. Apply the same system to auth, onboarding, public UI and admin consoles. Replace tiny functional labels and scattered heavyweight styles.
5. Verify narrow/mobile/desktop layouts, translated wrapping, dark mode, zoom and input/dialog states. Check actual iOS/Android rendering before claiming cross-device coverage.

The review decision is the proposed role scale and treatment of landing-page serif headings. Applying it is a separate implementation step after this audit.
