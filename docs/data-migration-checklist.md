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

## Live Configuration

- `RELATIONAL_PRIMARY_READS=true`
- `RELATIONAL_SHADOW_WRITES=true`
- Core reads: relational first, KV fallback on missing rows or query errors.
- Core writes: KV plus relational mirror during the rollback window.
- Engagement reads/writes: `engagement_daily` and `record_engagement_daily`.

## Daily Checks (First 48 Hours)

- [ ] Confirm `/functions/v1/make-server-6d579fee/health` reports
  `relational-primary` and `dual-write`.
- [ ] Check Edge Function logs for `[Relational Read]` or
  `[Relational Shadow]` warnings.
- [ ] Query `core_migration_parity`; every eligible domain must have
  `missing_count = 0`, `stale_count = 0`, and `orphan_count = 0`.
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

## KV Families Intentionally Retained

The remaining KV records are not part of the core-table cutover. They include
dynamic questions/content, notifications, chats, newsletter delivery state,
community data, temporary realtime/location state, AI caches, rate limits,
leases, audit logs, and deduplication records. Move these only with their own
schema, RLS, API compatibility, backfill, and parity migration; do not place
them into unrelated legacy tables merely to make those tables non-empty.
