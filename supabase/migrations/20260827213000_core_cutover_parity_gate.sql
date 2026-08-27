-- Gate relational reads on exact source-key and payload parity. Quarantined
-- records are reported separately and are never treated as migrated rows.

set lock_timeout = '10s';
set statement_timeout = '60s';

create or replace view public.core_kv_source
with (security_invoker = true)
as
  select 'profile'::text as domain, key as source_key, value as payload
  from public.kv_store_6d579fee
  where key ~ '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and jsonb_typeof(value) = 'object'
  union all
  select 'couple', key, value from public.kv_store_6d579fee
  where key like 'couple:%' and key not like 'couple-chat:%' and jsonb_typeof(value) = 'object'
  union all
  select 'journal', key, value from public.kv_store_6d579fee
  where key like 'journal:%' and jsonb_typeof(value) = 'object'
  union all
  select 'prayer', key, value from public.kv_store_6d579fee
  where key like 'prayer:%' and key not like 'prayer-chat:%' and jsonb_typeof(value) = 'object'
  union all
  select 'mood', key, value from public.kv_store_6d579fee
  where key like 'mood:%' and key not like 'mood-analysis%' and jsonb_typeof(value) = 'object'
  union all
  select 'web_push', key, value from public.kv_store_6d579fee
  where key ~ '^push_subscription:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and jsonb_typeof(value) = 'object';

create or replace view public.core_relational_source
with (security_invoker = true)
as
  select 'profile'::text as domain, source_key, kv_payload as payload
  from public.user_profiles where source_key is not null
  union all
  select 'couple', source_key, kv_payload from public.couples where source_key is not null
  union all
  select 'journal', source_key, kv_payload from public.journal_entries where source_key is not null
  union all
  select 'prayer', source_key, kv_payload from public.prayer_requests where source_key is not null
  union all
  select 'mood', source_key, kv_payload from public.mood_entries where source_key is not null
  union all
  select 'web_push', source_key, kv_payload from public.web_push_subscriptions where source_key is not null;

create or replace view public.core_migration_parity
with (security_invoker = true)
as
with domains(domain) as (
  values ('profile'::text), ('couple'), ('journal'), ('prayer'), ('mood'), ('web_push')
)
select
  domains.domain,
  (select count(*) from public.core_kv_source source where source.domain = domains.domain) as source_count,
  (select count(*) from public.core_kv_source source
    where source.domain = domains.domain
      and not exists (
        select 1 from public.kv_migration_quarantine quarantine
        where quarantine.source_key = source.source_key
      )) as eligible_source_count,
  (select count(*) from public.core_relational_source target where target.domain = domains.domain) as target_count,
  (select count(*) from public.core_kv_source source
    where source.domain = domains.domain
      and not exists (
        select 1 from public.kv_migration_quarantine quarantine
        where quarantine.source_key = source.source_key
      )
      and not exists (
        select 1 from public.core_relational_source target
        where target.domain = source.domain and target.source_key = source.source_key
      )) as missing_count,
  (select count(*) from public.core_kv_source source
    join public.core_relational_source target
      on target.domain = source.domain and target.source_key = source.source_key
    where source.domain = domains.domain and target.payload is distinct from source.payload) as stale_count,
  (select count(*) from public.core_relational_source target
    where target.domain = domains.domain
      and not exists (
        select 1 from public.core_kv_source source
        where source.domain = target.domain and source.source_key = target.source_key
      )) as orphan_count,
  (select count(*) from public.core_kv_source source
    join public.kv_migration_quarantine quarantine on quarantine.source_key = source.source_key
    where source.domain = domains.domain) as quarantined_count
from domains;

revoke all on public.core_kv_source, public.core_relational_source,
  public.core_migration_parity from public, anon, authenticated;
grant select on public.core_kv_source, public.core_relational_source,
  public.core_migration_parity to service_role;

do $$
begin
  if exists (
    select 1 from public.core_migration_parity
    where missing_count > 0 or stale_count > 0 or orphan_count > 0
  ) then
    raise exception 'Core relational cutover blocked: parity check failed';
  end if;
end;
$$;

insert into public.kv_migration_runs(
  migration_name, status, source_counts, target_counts, quarantine_counts, completed_at
)
select
  '20260827213000_core_cutover_parity_gate',
  'verified',
  coalesce(jsonb_object_agg(domain, source_count), '{}'::jsonb),
  coalesce(jsonb_object_agg(domain, target_count), '{}'::jsonb),
  coalesce(jsonb_object_agg(domain, quarantined_count) filter (where quarantined_count > 0), '{}'::jsonb),
  now()
from public.core_migration_parity;
