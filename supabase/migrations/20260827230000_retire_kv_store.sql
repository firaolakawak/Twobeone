-- Final cutover: retire the legacy KV table only after every row is covered by
-- a core relational table, a designated partition, or the quarantine ledger.

set lock_timeout = '10s';
set statement_timeout = '120s';

do $$
declare
  source_count bigint;
  uncovered_count bigint;
  unclassified_count bigint;
begin
  lock table public.kv_store_6d579fee in share mode;

  select count(*) into source_count from public.kv_store_6d579fee;
  select count(*) into unclassified_count from public.app_unclassified;
  select count(*) into uncovered_count
  from public.kv_store_6d579fee source
  where not exists (select 1 from public.app_records target where target.source_key = source.key)
    and not exists (select 1 from public.kv_migration_quarantine q where q.source_key = source.key)
    and not exists (select 1 from public.user_profiles target where target.source_key = source.key)
    and not exists (select 1 from public.couples target where target.source_key = source.key)
    and not exists (select 1 from public.journal_entries target where target.source_key = source.key)
    and not exists (select 1 from public.prayer_requests target where target.source_key = source.key)
    and not exists (select 1 from public.mood_entries target where target.source_key = source.key)
    and not exists (select 1 from public.web_push_subscriptions target where target.source_key = source.key);

  if uncovered_count > 0 or unclassified_count > 0 then
    raise exception 'KV retirement blocked: % uncovered rows, % unclassified rows',
      uncovered_count, unclassified_count;
  end if;

  insert into public.kv_migration_runs(
    migration_name, status, source_counts, target_counts, quarantine_counts, completed_at
  ) values (
    '20260827230000_retire_kv_store', 'verified',
    jsonb_build_object('retired_kv_rows', source_count),
    jsonb_build_object(
      'core_records',
        (select count(*) from public.core_relational_source),
      'designated_records',
        (select count(*) from public.app_records)
    ),
    jsonb_build_object('preserved_records', (select count(*) from public.kv_migration_quarantine)),
    now()
  );
end;
$$;

drop view if exists public.remaining_kv_migration_parity;
drop view if exists public.core_migration_parity;
drop view if exists public.core_kv_source;
drop trigger if exists kv_designated_table_mirror on public.kv_store_6d579fee;
drop function if exists public.mirror_kv_to_designated_table();

-- RESTRICT is intentional: an undiscovered database dependency must stop the
-- migration instead of being removed implicitly.
drop table public.kv_store_6d579fee restrict;

create or replace view public.designated_storage_health
with (security_invoker = true)
as
select
  domain,
  count(*)::bigint as record_count,
  min(created_at) as oldest_record_at,
  max(updated_at) as newest_update_at
from public.app_records
group by domain;

revoke all on public.designated_storage_health from public, anon, authenticated;
grant select on public.designated_storage_health to service_role;
