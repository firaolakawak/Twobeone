# A house built through daily character practice

The couple-facing house is now a shared goal for Together in Faith. Setup asks only for a house type and bedroom count. **Lock & start building** saves those choices for the couple. Decorating, floor planning, camera controls, and the 3D scene are removed from this flow.

## How the game builds the house

- A saved mood check-in leads to the existing daily emoji challenge. Each mission names the quality being practised: love, patience, kindness, peace, faithfulness, or joy.
- Both partners answer, reveal their cards, try the activity, and confirm completion. A submitted answer alone earns no block.
- When both have completed, that shared UTC day contributes one block. Refreshing, reopening, and repeated completion requests do not add another block.
- The result shows the practised quality and the house contribution. A partner who finishes first sees that the other partner still needs to complete the activity.
- The goal is 365 shared blocks. Missed days leave progress intact. Construction moves through Foundation, Walls, Windows, Roof, and Home in a simple 2D illustration.
- House progress records participation in shared practice. It does not measure either person's character or verify offline behaviour.

The house page opens the same daily popup through the dashboard's existing mood check-in sequence. The popup's result can return directly to the house. The older standalone practice preview remains a separate demo and earns no shared blocks.

## Persistence

The server owns the locked design and progress. A new `character_house_goals` table stores each pair's house. Construction is derived from the existing daily challenge records with completed activities from both members, capped at 365. There is no client-writeable block count or local “place a block” action.

New construction counts from the house's starting UTC day, including a challenge completed earlier on that same day. Earlier daily challenges are not backfilled into a newly started house. Server-stored, mutually approved legacy designs retain their saved progress as a baseline, and their original decoration data remains untouched. The old browser-only prototype cache is not imported into another account's shared progress.

The canonical Edge Function now provides authenticated `GET /character-house` and `POST /character-house/start`. Daily challenge responses include a house summary so both completion and background refresh show current shared progress. Mutual partner links are checked before access; unrelated accounts cannot read or advance a couple's house.

The administrative 3D preview remains available for historical designs. It is not loaded by the simplified couple house screen.

## Release status

Prepared locally; no production migration, function deployment, or live partner notification was performed for this change. Activation requires the earlier daily challenge migration and then `20260917230000_character_house_daily_progress.sql`, followed by deployment of `make-server-6d579fee` and the web release. Review the intended project and pending migrations before publishing; do not apply unrelated migrations.

## Verification

Verified on 17 September 2026:

- All **486 tests in 97 files** passed. The production build passed with the existing large-chunk advisory.
- **14 isolated PostgreSQL/PGlite scenarios** passed, covering two-person completion, daily deduplication, locked setup, saved design/progress preservation, current partner authorization, skipped days, and the 365-block cap. PGlite uses one connection; actual multi-session lock contention was not tested.
- **39 rendered browser states and 42 behaviour checks** passed in Windows Edge. Coverage includes English, Amharic, and Afaan Oromo; light/dark themes; 320px, 390px, and 1280px widths; and representative 200% root text scaling. No unintended horizontal scrolling, clipped functional text, captions below 12px, or runtime errors were found. Native browser zoom and physical devices were not tested.
- Browser scenarios use actual app components with intercepted fixtures and never send live account writes. They cover failed-save recovery, saved design reopening, mood-before-game sequencing, first-partner waiting, the real polling interval revealing a shared block, and repeated reopening without another client-side increment. Database tests separately verify actual progress counting. Translation editorial review by native speakers has not been performed.

Review the [browser evidence](character-house-evidence.json), [two-question setup](character-house-setup.png), [house progress](character-house-progress.png), and [daily result](character-house-result.png).
