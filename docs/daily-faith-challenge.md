# Daily Together in Faith challenge

The dashboard invitation now uses a distinct Target icon and opens today's emoji game in a dialog. It no longer sends couples to the practice journey page.

## Couple experience

- After a saved mood check-in, a short original Christian encouragement and today's three emoji choices open together. Existing dialogs close first. Dismissing the automatic prompt is remembered for that account, partner, and day; the dashboard card can reopen it.
- Both partners receive the same challenge for a shared UTC day, resetting at 00:00 UTC. Thirty missions rotate in order from 17 September 2026. There is no next-mission button in daily mode.
- Heart missions collect a private answer and a guess. Grace missions collect a response. Kindness missions require trying the selected activity before submission.
- The first saved submission creates one durable notification for the other partner. If that partner already submitted, it says the cards are ready. Notification clicks open the current day's popup, after mood check-in if needed.
- Choices stay private until both have submitted. The view refreshes every 30 seconds while visible and on return to the app. After revealing their cards, each partner can mark the shared activity complete.

The encouragement sentences are original application copy, not Bible quotations. Interface copy supports English, Amharic, and Afaan Oromo. Native-speaker editorial review has not been performed.

## Storage and notifications

`20260917220000_daily_faith_challenges.sql` creates a private table and a service-role-only RPC. The function verifies a mutual partner link, serializes operations for the couple, reads the database UTC clock after the lock, and stores immutable daily answers. Answer submission and the in-app notification commit together. Repeated requests do not change the answer or resend the notice. Completing a challenge is also idempotent. An unlinked or disconnected account cannot access a previous couple's answers through the endpoint.

The authenticated Edge Function provides `GET /faith-challenge/today`, `POST /faith-challenge/submit`, and `POST /faith-challenge/complete`. Clients cannot choose another date or mission, impersonate a partner, or read a partner's answer early. Before both submit, the response omits the partner's answer and guess entirely.

Push is optional: it uses the existing subscription and VAPID setup, respects disabled push preferences, and localizes the notification to the recipient. Delivery failure leaves the in-app notification intact. No live partner notifications were sent during development.

The original practice route `/?preview=faith-quest` remains a separate local demo with sample answers; it does not exercise the real daily endpoints.

## Activation

The migration and function are prepared locally and have **not been published**. To activate real partner syncing, apply the new migration to the intended Supabase project, then deploy `make-server-6d579fee` with its current project configuration. Publish the web build through the app's existing release process when desired; Vite already serves the frontend changes locally.

Do not apply unrelated pending migrations as part of this change. After activation, verify the authenticated daily read before a voluntary two-person playtest; a submission intentionally creates a real partner notification.

## Verification

Tests cover mood-to-dialog sequencing, daily dismissal/manual reopening, deferred notification requests, real answer/guess payloads, waiting/reveal/completion, retry behavior, storage separation, disabled/auth boundaries, stale requests, response validation, translation coverage, and route authorization. An isolated PostgreSQL/PGlite harness executes the migration and verifies 14 database scenarios, including notification rollback, privacy, daily rotation, immutable retries, and privileges. PGlite uses one connection, so it does not prove true multi-session lock contention.

Browser checks use the actual dashboard, mood dialog, notification center, daily component, and API parser with intercepted fixture responses. No live database or account writes are part of those checks. Text enlargement uses CSS root scaling, not native browser zoom; physical devices are not covered.

Final verification on 17 September 2026: all 440 tests in 94 files passed, and the production build passed (with the existing large-chunk advisory). Browser verification passed 36 rendered layout states and 31 interaction checks, including narrow screens, light/dark themes, English/Amharic/Afaan Oromo, enlarged text, and the actual background polling interval. The detailed fixture-based report is [daily-faith-evidence.json](daily-faith-evidence.json).

Screenshots: [Today's emoji choices](daily-faith-choice.png) and [Waiting for a partner](daily-faith-waiting.png).
