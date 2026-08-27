# TwoBeOne Data Migration Checklist

Last updated: 2026-08-27 UTC

## Completed Deployment

- [x] Capture pre-migration production schema and data snapshots.
- [x] Remove duplicate KV indexes and retain one named prefix index.
- [x] Reduce calendar reminder frequency and add timestamp indexing.
- [x] Create relational profiles, couples, couple members, journals, prayers,
  moods, and web-push subscriptions.
- [x] Preserve `source_key` and `kv_payload` on every migrated core row.
- [x] Backfill all core records belonging to live Auth users.
- [x] Quarantine six historical mood rows belonging to a deleted Auth user.
- [x] Enable owner/partner RLS and remove anonymous core-table access.
- [x] Enable KV-first dual writes with relational shadow writes.
- [x] Pass the database parity gate with zero eligible missing, stale, or
  orphaned records.
- [x] Enable relational-primary reads with automatic KV fallback.
- [x] Aggregate 1,983 engagement events into 112 daily rows.
- [x] Switch engagement writes to the atomic idempotent aggregate function.
- [x] Remove all raw `engagement:*` KV rows after the receipt-backed delta pass.
- [x] Deploy the updated Edge Function and confirm HTTP 200 health.
- [x] Confirm anonymous requests receive HTTP 401 for private tables and
  migration views.
- [x] Create designated partitions for questions/responses, notifications,
  devotionals/highlights, chats, invitations, community, newsletter, calendar,
  progress, AI caches, audit logs, rate limits, deduplication, and realtime state.
- [x] Backfill all 1,110 remaining classified KV records.
- [x] Confirm zero missing, stale, orphaned, or unclassified remaining records.
- [x] Install database-level insert/update/delete mirroring on the KV table.

## Live Configuration

- `RELATIONAL_PRIMARY_READS=true`
- `RELATIONAL_SHADOW_WRITES=true`
- All classified reads: designated relational table first, KV fallback on
  missing rows or query errors.
- All writes: KV plus a database-level relational mirror during the rollback
  window, including writes made directly by database functions.
- Engagement reads/writes: `engagement_daily` and `record_engagement_daily`.

## Daily Checks (First 48 Hours)

- [ ] Confirm `/functions/v1/make-server-6d579fee/health` reports
  `relational-primary` and `dual-write`.
- [ ] Check Edge Function logs for `[Relational Read]` or
  `[Relational Shadow]` warnings.
- [ ] Query `core_migration_parity`; every eligible domain must have
  `missing_count = 0`, `stale_count = 0`, and `orphan_count = 0`.
- [ ] Query `remaining_kv_migration_parity`; all error counts and
  `unclassified_count` must remain zero.
- [ ] Confirm `kv_migration_quarantine` remains limited to the six deleted-user
  mood records.
- [ ] Confirm engagement summaries load and new `engagement_daily.updated_at`
  values continue advancing.
- [ ] Run `scripts/check-supabase-health.sh` and compare CPU, I/O, locks, bloat,
  query calls, and long-running queries with the pre-migration snapshot.
- [ ] Review Supabase Database Health after 24 and 48 hours.

## Immediate Rollback

- [ ] Set `RELATIONAL_PRIMARY_READS=false` to return core reads to KV.
- [ ] Keep `RELATIONAL_SHADOW_WRITES=true` so relational rows continue syncing.
- [ ] Confirm the health endpoint reports `kv-primary` and `dual-write`.
- [ ] Investigate parity/log errors before re-enabling relational reads.
- [ ] Do not roll the Edge Function back to a pre-aggregation version; engagement
  is now stored as daily aggregates and must be repaired by a forward deploy.

Command:

```bash
npx supabase secrets set RELATIONAL_PRIMARY_READS=false RELATIONAL_SHADOW_WRITES=true
```

## Core KV Retirement Gate

Do not delete the remaining profile, couple, journal, prayer, mood, or push
subscription KV keys until every item below is complete.

- [ ] At least 48 hours of clean parity checks.
- [ ] No relational fallback or shadow-write warnings for 24 hours.
- [ ] A current database backup is available and restoration is tested.
- [ ] Account creation, partner linking, journal CRUD, prayer CRUD, mood CRUD,
  push subscription, export, and account deletion are smoke-tested.
- [ ] Change core writes from dual-write to relational-only.
- [ ] Observe relational-only writes for another 24 hours.
- [ ] Archive quarantined deleted-user payloads according to the retention policy.
- [ ] Delete only the core KV key families covered by `core_migration_parity`.
- [ ] Keep operational KV families such as rate limits, leases, caches, audit
  records, realtime state, and deduplication keys in bounded retention storage.

## Designated Remaining-Data Tables

- `app_questions`, `app_question_responses`
- `app_notifications`
- `app_devotionals`, `app_highlights`
- `app_couple_chats`, `app_prayer_chats`
- `app_invitations`, `app_community`
- `app_newsletter_state`
- `app_calendar`, `app_progress`
- `app_ai_cache`, `app_audit_logs`, `app_rate_limits`
- `app_deduplication`, `app_realtime_state`

`app_unclassified` is a safety partition for future unknown key families. It
must remain empty; any row appearing there requires an explicit classification
before KV retirement.
