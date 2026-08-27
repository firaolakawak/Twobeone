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
- [x] Use dual writes during the compatibility window.
- [x] Pass the database parity gate with zero eligible missing, stale, or
  orphaned records.
- [x] Enable relational-primary reads during the compatibility window.
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
- [x] Install and verify database-side relational writers for rate limits,
  generation leases, idempotency claims, and all designated CRUD.
- [x] Switch Edge Function version 359 to relational-only mode.
- [x] Pass the final coverage gate with all legacy rows represented in core
  tables, designated partitions, or quarantine.
- [x] Drop `kv_store_6d579fee` with `RESTRICT` and remove its trigger/views.
- [x] Deploy Edge Function version 361 with all KV runtime branches removed.
- [x] Run the production create/read/update/delete probe successfully and
  remove its temporary notification record.
- [x] Confirm all 17 designated partitions remain available and
  `app_unclassified` contains zero rows.

## Live Configuration

- All core reads and writes: relational-only.
- All other CRUD: routed through `app_records` to its designated physical
  partition.
- KV fallback: disabled in configuration and removed from runtime code.
- Legacy KV table: removed from production.
- Engagement reads/writes: `engagement_daily` and `record_engagement_daily`.

## Daily Checks (First 48 Hours)

- [ ] Confirm the authenticated health endpoint reports `relational-only` for
  core and designated reads/writes and `kvFallbackReads: false`.
- [ ] Check Edge Function logs for relational read/write errors.
- [ ] Query `designated_storage_health` and confirm expected domains continue
  receiving updates.
- [ ] Confirm `to_regclass('public.kv_store_6d579fee')` remains `NULL` and
  `app_unclassified` remains empty.
- [ ] Confirm `kv_migration_quarantine` remains limited to the six deleted-user
  mood records.
- [ ] Confirm engagement summaries load and new `engagement_daily.updated_at`
  values continue advancing.
- [ ] Run `scripts/check-supabase-health.sh` and compare CPU, I/O, locks, bloat,
  query calls, and long-running queries with the pre-migration snapshot.
- [ ] Review Supabase Database Health after 24 and 48 hours.

## Recovery

KV rollback is intentionally unavailable after retirement. Recover by a forward
database or Edge fix; use the Supabase point-in-time/database backup only for a
confirmed data-loss incident. Never redeploy an older Edge version because it
still references the removed table. The six deleted-user mood payloads remain
preserved in `kv_migration_quarantine` pending the retention decision.

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
must remain empty; any row appearing there requires a new explicit domain
classification and migration.
