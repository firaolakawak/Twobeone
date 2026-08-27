-- Capture any engagement events written during the phase-one deployment,
-- verify every raw event has an idempotency receipt, then retire raw KV rows.

set lock_timeout = '10s';
set statement_timeout = '120s';

create extension if not exists pg_cron with schema pg_catalog;

with source as (
  select
    key as event_key,
    (value->>'userId')::uuid as user_id,
    value->>'category' as category,
    greatest(1, least(120, (value->>'seconds')::integer)) as seconds,
    (value->>'createdAt')::timestamptz as created_at
  from public.kv_store_6d579fee
  where key like 'engagement:%'
    and value->>'userId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and value->>'category' in ('reading', 'answering', 'journaling', 'praying', 'other')
    and value->>'seconds' ~ '^\d+$'
    and value->>'createdAt' ~ '^\d{4}-\d{2}-\d{2}'
), claimed as (
  insert into public.engagement_event_receipts(event_key, user_id, created_at, expires_at)
  select event_key, user_id, created_at, created_at + interval '7 days' from source
  on conflict (event_key) do nothing
  returning event_key
), delta as (
  select source.user_id, (source.created_at at time zone 'UTC')::date as activity_date,
    source.category, sum(source.seconds)::bigint as total_seconds, count(*)::integer as event_count
  from source join claimed using (event_key)
  group by source.user_id, (source.created_at at time zone 'UTC')::date, source.category
)
insert into public.engagement_daily as daily(
  user_id, activity_date, category, total_seconds, event_count, updated_at
)
select user_id, activity_date, category, total_seconds, event_count, now() from delta
on conflict (user_id, activity_date, category) do update set
  total_seconds = daily.total_seconds + excluded.total_seconds,
  event_count = daily.event_count + excluded.event_count,
  updated_at = now();

do $$
begin
  if exists (
    select 1
    from public.kv_store_6d579fee event
    left join public.engagement_event_receipts receipt on receipt.event_key = event.key
    where event.key like 'engagement:%' and receipt.event_key is null
  ) then
    raise exception 'Engagement cleanup blocked: at least one raw event was not aggregated';
  end if;
end;
$$;

with removed as (
  delete from public.kv_store_6d579fee where key like 'engagement:%'
  returning 1
)
insert into public.kv_migration_runs(
  migration_name, status, source_counts, target_counts, quarantine_counts, completed_at
)
select
  '20260827220000_finalize_engagement_aggregation',
  'verified',
  jsonb_build_object('raw_events_removed', count(*)),
  jsonb_build_object(
    'daily_rows', (select count(*) from public.engagement_daily),
    'aggregated_events', (select coalesce(sum(event_count), 0) from public.engagement_daily)
  ),
  '{}'::jsonb,
  now()
from removed;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job
  where jobname = 'twobeone-operational-event-retention';
  if existing_job_id is not null then perform cron.unschedule(existing_job_id); end if;
end $$;

select cron.schedule(
  'twobeone-operational-event-retention',
  '17 2 * * *',
  $job$
    delete from public.kv_store_6d579fee
    where key like 'ratelimit:%'
      and value->>'expiresAt' < to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

    delete from public.engagement_event_receipts where expires_at < now();
    delete from public.engagement_daily where activity_date < current_date - 45;
  $job$
);

analyze public.kv_store_6d579fee;
analyze public.engagement_daily;
