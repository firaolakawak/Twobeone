# TwoBeOne localization and loading validation

Validated the active Vite web application on 13 September 2026. The repository's separate Expo/legacy prototypes were outside this implementation.

## Result

- Shared English, Amharic, and Afaan Oromo preference updates public pages, authenticated screens, open dialogs, navigation, and document language metadata.
- Header and settings save the same preference through an ordered account queue. Profile hydration and language-only profile refreshes preserve a newer local selection and unsaved profile input.
- Screen waits and pending controls use the supplied TwoBeOne logo with a double heartbeat. Reduced-motion preferences stop the animation; status labels translate.
- Known system notification templates translate without changing stored records, sender names, authored excerpts, or unknown broadcasts.
- Oromo dates work when a browser lacks native `om-ET` support. A real Edge probe confirmed this fallback is needed; the helper preserves timezone and formatting options.

## Verification

- Full automated suite: 331 tests passed across 82 files. Coverage includes shared state, cross-tab changes, unavailable storage, profile hydration, ordered/failed/timed-out saves, pending feedback, catalog completeness and placeholder parity, notifications, date fallback, and draft preservation.
- Catalog audit found no missing literal `tr()` keys. The existing typed catalog has 453 keys with complete English/Amharic/Oromo structure. Static inspection also checked translation bindings without changing API identifiers or form option values.
- Browser checks switched languages on the same mounted screen. They covered public/auth/admin pages, core couple flows, guidance and quizzes, legal pages, Bible reading, system dialogs, notifications, and house previews. Narrow screens and enlarged text were checked; actual Radix controls were activated when switching tabs.
- The final utility matrix passed 162 cases across 320, 390, and 1280px with normal and 200% text: settings tabs, group creation, installation instructions, group detail, and landing previews. No measured content overflow or runtime errors remained in those cases.
- A final 48-case calendar/mood matrix passed weekly, monthly and yearly calendars plus populated mood history at 320/390px with normal/200% text in all three languages. It also checked internal scroll clipping, long Oromo dates, all 12 month names, and translated mood badges.
- Quiz checks completed all three quizzes with language changes midway; scoring and stable answer IDs matched the baseline. Unsaved contact text and open sections survived language changes.
- Production preview verified branded waiting, mounted header language changes, settings save, persisted Oromo after reload, and a rendered dashboard at 390px without page overflow or runtime errors. Backend requests and account writes in these checks used local fixtures.
- `npm run build` passed. Vite reports the existing large-chunk warning. The built entry's asset references were checked against files in `dist/assets`; keep `dist/index.html` paired with its build output.

## Boundaries

This verifies UI wiring and layout, not native-speaker editorial approval of every translation. User-authored content, saved/generated analysis, Scripture quotations and uploaded screenshots retain their source text. Missing lesson or Bible editions show a translated availability notice and an explicit English fallback where implemented. Existing Amharic legal documents remain their existing shorter versions.

Native browser/OS prompts and date-picker chrome follow device language. The Oromo date fallback covers Gregorian month, weekday and day-period names; timezone display names and non-Gregorian month names remain browser supplied.

The public Contact form retains its pre-existing simulated submission behavior; this work did not connect a messaging service. No deployment or real account changes were performed.

The durable implementation rules are in [TwoBeOne Localization Language](twobeone-localization-language.md), alongside the typography and navigation standards.
