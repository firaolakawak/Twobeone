-- Replace high-volume raw engagement KV events with bounded daily aggregates.
-- Raw rows remain in KV until the application is deployed against the atomic
-- recorder and a second delta pass confirms that no event was missed.

set lock_timeout = '10s';
set statement_timeout = '120s';

create table if not exists public.engagement_daily (
  user_id uuid not null,
  activity_date date not null,
  category text not null check (category in ('reading', 'answering', 'journaling', 'praying', 'other')),
  total_seconds bigint not null default 0 check (total_seconds >= 0),
  event_count integer not null default 0 check (event_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_date, category)
);

create table if not exists public.engagement_event_receipts (
  event_key text primary key,
  user_id uuid not null,
  created_at timestamptz not null,
  expires_at timestamptz not null
);

create index if not exists idx_engagement_daily_user_date
  on public.engagement_daily(user_id, activity_date desc);
create index if not exists idx_engagement_receipts_expiry
  on public.engagement_event_receipts(expires_at);

alter table public.engagement_daily enable row level security;
alter table public.engagement_event_receipts enable row level security;
revoke all on public.engagement_daily, public.engagement_event_receipts from public, anon, authenticated;
grant all on public.engagement_daily, public.engagement_event_receipts to service_role;

create or replace function public.record_engagement_daily(
  p_user_id uuid,
  p_event_id text,
  p_category text,
  p_seconds integer,
  p_created_at timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_key text := 'engagement:' || p_user_id::text || ':' || p_event_id;
  claimed_count integer;
begin
  if p_category not in ('reading', 'answering', 'journaling', 'praying', 'other')
    or p_seconds < 1 or p_seconds > 120
    or p_event_id !~ '^[a-zA-Z0-9._:-]{8,160}$'
    or p_created_at < now() - interval '5 minutes'
    or p_created_at > now() + interval '1 minute'
  then
    raise exception 'Invalid engagement event';
  end if;

  insert into public.engagement_event_receipts(event_key, user_id, created_at, expires_at)
  values (v_event_key, p_user_id, p_created_at, p_created_at + interval '7 days')
  on conflict (event_key) do nothing;
  get diagnostics claimed_count = row_count;

  if claimed_count = 0 then return false; end if;

  insert into public.engagement_daily as daily(
    user_id, activity_date, category, total_seconds, event_count, updated_at
  ) values (
    p_user_id, (p_created_at at time zone 'UTC')::date, p_category,
    p_seconds, 1, now()
  )
  on conflict (user_id, activity_date, category) do update set
    total_seconds = daily.total_seconds + excluded.total_seconds,
    event_count = daily.event_count + 1,
    updated_at = now();

  return true;
end;
$$;

revoke all on function public.record_engagement_daily(uuid, text, text, integer, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_engagement_daily(uuid, text, text, integer, timestamptz)
  to service_role;

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

analyze public.engagement_daily;
analyze public.engagement_event_receipts;
