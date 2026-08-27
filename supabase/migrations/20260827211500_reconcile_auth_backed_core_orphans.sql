-- Reconcile historical core records whose Auth identity exists but whose KV
-- profile document is missing. These rows were intentionally quarantined by
-- the first pass rather than manufacturing an unverified user relationship.

set lock_timeout = '10s';
set statement_timeout = '60s';

with referenced_users as (
  select distinct (value->>'userId')::uuid as user_id
  from public.kv_store_6d579fee
  where key like 'mood:%'
    and jsonb_typeof(value) = 'object'
    and value->>'userId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  union
  select distinct (value->>'userId')::uuid
  from public.kv_store_6d579fee
  where key like 'journal:%'
    and jsonb_typeof(value) = 'object'
    and value->>'userId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  union
  select distinct (value->>'userId')::uuid
  from public.kv_store_6d579fee
  where key like 'prayer:%'
    and jsonb_typeof(value) = 'object'
    and value->>'userId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
insert into public.user_profiles (
  id, full_name, email, preferred_language, kv_payload, created_at, updated_at
)
select
  auth_user.id,
  coalesce(
    nullif(auth_user.raw_user_meta_data->>'full_name', ''),
    nullif(auth_user.raw_user_meta_data->>'name', ''),
    split_part(auth_user.email, '@', 1),
    'User'
  ),
  auth_user.email,
  coalesce(nullif(auth_user.raw_user_meta_data->>'language', ''), 'en'),
  '{}'::jsonb,
  coalesce(auth_user.created_at, now()),
  now()
from referenced_users referenced
join auth.users auth_user on auth_user.id = referenced.user_id
left join public.user_profiles profile on profile.id = referenced.user_id
where profile.id is null
on conflict (id) do nothing;

with source as (
  select kv.key, kv.value
  from public.kv_store_6d579fee kv
  join public.kv_migration_quarantine quarantine
    on quarantine.source_key = kv.key and quarantine.domain = 'mood'
  where kv.key like 'mood:%' and jsonb_typeof(kv.value) = 'object'
)
insert into public.mood_entries(id, source_key, user_id, mood, note, created_at, kv_payload)
select
  source.value->>'id', source.key, profile.id, source.value->>'mood',
  coalesce(source.value->>'note', ''),
  case
    when source.value->>'createdAt' ~ '^\d{4}-\d{2}-\d{2}'
      then (source.value->>'createdAt')::timestamptz
    else now()
  end,
  source.value
from source
join public.user_profiles profile on profile.id::text = source.value->>'userId'
where nullif(source.value->>'id', '') is not null
  and source.value->>'mood' in ('great', 'good', 'okay', 'sad')
on conflict (id) do update set
  mood = excluded.mood,
  note = excluded.note,
  created_at = excluded.created_at,
  kv_payload = excluded.kv_payload;

delete from public.kv_migration_quarantine quarantine
where quarantine.domain = 'mood'
  and exists (
    select 1 from public.mood_entries mood
    where mood.source_key = quarantine.source_key
  );

insert into public.kv_migration_runs(
  migration_name, status, source_counts, target_counts, quarantine_counts, completed_at
)
select
  '20260827211500_reconcile_auth_backed_core_orphans',
  'verified',
  jsonb_build_object(
    'moods', (select count(*) from public.kv_store_6d579fee where key like 'mood:%' and jsonb_typeof(value) = 'object')
  ),
  jsonb_build_object(
    'moods', (select count(*) from public.mood_entries where source_key is not null)
  ),
  coalesce((
    select jsonb_object_agg(domain, item_count)
    from (
      select domain, count(*) as item_count
      from public.kv_migration_quarantine
      group by domain
    ) counts
  ), '{}'::jsonb),
  now();

analyze public.user_profiles;
analyze public.mood_entries;
