-- Phase 1: establish relational shadow tables for durable TwoBeOne data.
-- KV remains the source of truth until reconciliation and an observation
-- window complete. Every migrated row retains its source key and raw payload.

set lock_timeout = '10s';
set statement_timeout = '120s';

-- Supabase grants function execution to API roles by default. These helpers
-- are service-only because they mutate operational security records.
revoke execute on function public.consume_rate_limit(text, integer, timestamptz) from anon, authenticated;
revoke execute on function public.acquire_generation_lease(text, text, timestamptz) from anon, authenticated;
revoke execute on function public.release_generation_lease(text, text) from anon, authenticated;

create table if not exists public.kv_migration_quarantine (
  id bigint generated always as identity primary key,
  source_key text not null unique,
  domain text not null,
  reason text not null,
  payload jsonb not null,
  quarantined_at timestamptz not null default now()
);

create table if not exists public.kv_migration_runs (
  id bigint generated always as identity primary key,
  migration_name text not null,
  status text not null check (status in ('running', 'verified', 'failed')),
  source_counts jsonb not null default '{}'::jsonb,
  target_counts jsonb not null default '{}'::jsonb,
  quarantine_counts jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.kv_migration_quarantine enable row level security;
alter table public.kv_migration_runs enable row level security;
revoke all on public.kv_migration_quarantine, public.kv_migration_runs from anon, authenticated;
grant all on public.kv_migration_quarantine, public.kv_migration_runs to service_role;

-- The existing domain tables are empty in production, but their UUID primary
-- keys cannot represent the IDs already used by the application. Convert them
-- to text while preserving their names and any future UUID-shaped values.
-- Policies containing subqueries against couples.id are schema dependencies,
-- so remove them before changing the key type. Replacement policies are
-- created below after the relational membership table exists.
drop policy if exists couples_manage_own_journal_entries on public.journal_entries;
drop policy if exists couples_manage_own_prayer_requests on public.prayer_requests;
drop policy if exists couples_manage_own_progress on public.couple_progress;
drop policy if exists users_manage_own_couples on public.couples;

alter table public.couple_progress drop constraint if exists couple_progress_couple_id_fkey;
alter table public.journal_entries drop constraint if exists journal_entries_couple_id_fkey;
alter table public.prayer_requests drop constraint if exists prayer_requests_couple_id_fkey;

alter table public.couples alter column id drop default;
alter table public.couples alter column id type text using id::text;
alter table public.couple_progress alter column couple_id type text using couple_id::text;
alter table public.journal_entries alter column couple_id type text using couple_id::text;
alter table public.prayer_requests alter column couple_id type text using couple_id::text;

alter table public.journal_entries alter column id drop default;
alter table public.journal_entries alter column id type text using id::text;
alter table public.prayer_requests alter column id drop default;
alter table public.prayer_requests alter column id type text using id::text;

alter table public.couple_progress
  add constraint couple_progress_couple_id_fkey
  foreign key (couple_id) references public.couples(id) on delete cascade;
alter table public.journal_entries
  add constraint journal_entries_couple_id_fkey
  foreign key (couple_id) references public.couples(id) on delete cascade;
alter table public.prayer_requests
  add constraint prayer_requests_couple_id_fkey
  foreign key (couple_id) references public.couples(id) on delete cascade;

alter table public.user_profiles
  add column if not exists email text,
  add column if not exists invite_code text,
  add column if not exists partner_id uuid references public.user_profiles(id) on delete set null,
  add column if not exists couple_id text references public.couples(id) on delete set null,
  add column if not exists phone text,
  add column if not exists location text,
  add column if not exists cover_url text,
  add column if not exists relationship_started_at timestamptz,
  add column if not exists source_key text unique,
  add column if not exists kv_payload jsonb not null default '{}'::jsonb;

alter table public.couples
  add column if not exists relationship_started_at timestamptz,
  add column if not exists source_key text unique,
  add column if not exists kv_payload jsonb not null default '{}'::jsonb;

alter table public.journal_entries
  add column if not exists source_key text unique,
  add column if not exists entry_type text not null default 'journal',
  add column if not exists location text,
  add column if not exists emoji text,
  add column if not exists media_files jsonb,
  add column if not exists comments jsonb,
  add column if not exists kv_payload jsonb not null default '{}'::jsonb;

alter table public.prayer_requests
  add column if not exists source_key text unique,
  add column if not exists is_shared boolean not null default true,
  add column if not exists is_shared_with_partner boolean not null default true,
  add column if not exists is_surprise boolean not null default false,
  add column if not exists unlock_at timestamptz,
  add column if not exists reminder_at timestamptz,
  add column if not exists you_prayed boolean not null default false,
  add column if not exists partner_prayed boolean not null default false,
  add column if not exists prayer_count integer not null default 0,
  add column if not exists scripture text,
  add column if not exists language text,
  add column if not exists generation_source text,
  add column if not exists source_type text,
  add column if not exists source_plan_id text,
  add column if not exists kv_payload jsonb not null default '{}'::jsonb;

create table if not exists public.couple_members (
  couple_id text not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  member_role text not null check (member_role in ('partner1', 'partner2')),
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id),
  unique (user_id)
);

create table if not exists public.mood_entries (
  id text primary key,
  source_key text not null unique,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  couple_id text references public.couples(id) on delete set null,
  mood text not null check (mood in ('great', 'good', 'okay', 'sad')),
  note text not null default '',
  created_at timestamptz not null,
  kv_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.web_push_subscriptions (
  id bigint generated always as identity primary key,
  source_key text not null unique,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  endpoint text not null unique,
  expiration_time timestamptz,
  p256dh text,
  auth text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kv_payload jsonb not null default '{}'::jsonb
);

create index if not exists idx_profiles_partner on public.user_profiles(partner_id);
create index if not exists idx_profiles_couple on public.user_profiles(couple_id);
create index if not exists idx_couple_members_user on public.couple_members(user_id);
create index if not exists idx_journal_author_created on public.journal_entries(author_id, created_at desc);
create index if not exists idx_journal_couple_created on public.journal_entries(couple_id, created_at desc) where is_shared;
create index if not exists idx_prayer_author_created on public.prayer_requests(requested_by, created_at desc);
create index if not exists idx_prayer_couple_created on public.prayer_requests(couple_id, created_at desc) where is_shared_with_partner;
create index if not exists idx_mood_user_created on public.mood_entries(user_id, created_at desc);
create index if not exists idx_mood_couple_created on public.mood_entries(couple_id, created_at desc);

create or replace function public.assign_core_couple_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  if new.couple_id is not null then return new; end if;
  owner_id := nullif(to_jsonb(new)->>tg_argv[0], '')::uuid;
  select couple_id into new.couple_id
  from public.couple_members
  where user_id = owner_id;
  return new;
end;
$$;

revoke all on function public.assign_core_couple_id() from public, anon, authenticated;
grant execute on function public.assign_core_couple_id() to service_role;

drop trigger if exists journal_assign_couple on public.journal_entries;
create trigger journal_assign_couple before insert or update of author_id, couple_id
on public.journal_entries for each row execute function public.assign_core_couple_id('author_id');
drop trigger if exists prayer_assign_couple on public.prayer_requests;
create trigger prayer_assign_couple before insert or update of requested_by, couple_id
on public.prayer_requests for each row execute function public.assign_core_couple_id('requested_by');
drop trigger if exists mood_assign_couple on public.mood_entries;
create trigger mood_assign_couple before insert or update of user_id, couple_id
on public.mood_entries for each row execute function public.assign_core_couple_id('user_id');

-- Replace permissive legacy policies with ownership-based policies.
drop policy if exists "Anyone can view user profiles" on public.user_profiles;
drop policy if exists "Users can view own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Users can create own profile with matching ID" on public.user_profiles;
drop policy if exists "Allow profile upsert for authenticated users" on public.user_profiles;
create policy profiles_select_self_or_partner on public.user_profiles for select to authenticated
using (id = (select auth.uid()) or partner_id = (select auth.uid()));
create policy profiles_insert_self on public.user_profiles for insert to authenticated
with check (id = (select auth.uid()));
create policy profiles_update_self on public.user_profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists users_manage_own_couples on public.couples;
create policy couples_select_members on public.couples for select to authenticated
using (partner1_id = (select auth.uid()) or partner2_id = (select auth.uid()));

alter table public.couple_members enable row level security;
create policy couple_members_select_own_couple on public.couple_members for select to authenticated
using (exists (
  select 1 from public.couples c
  where c.id = couple_members.couple_id
    and ((select auth.uid()) = c.partner1_id or (select auth.uid()) = c.partner2_id)
));

drop policy if exists couples_manage_own_journal_entries on public.journal_entries;
create policy journal_select_owner_or_shared_partner on public.journal_entries for select to authenticated
using (
  author_id = (select auth.uid())
  or (is_shared and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = journal_entries.couple_id and cm.user_id = (select auth.uid())
  ))
);
create policy journal_insert_owner on public.journal_entries for insert to authenticated
with check (author_id = (select auth.uid()));
create policy journal_update_owner on public.journal_entries for update to authenticated
using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy journal_delete_owner on public.journal_entries for delete to authenticated
using (author_id = (select auth.uid()));

drop policy if exists couples_manage_own_prayer_requests on public.prayer_requests;
create policy prayer_select_owner_or_shared_partner on public.prayer_requests for select to authenticated
using (
  requested_by = (select auth.uid())
  or (is_shared_with_partner and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = prayer_requests.couple_id and cm.user_id = (select auth.uid())
  ))
);
create policy prayer_insert_owner on public.prayer_requests for insert to authenticated
with check (requested_by = (select auth.uid()));
create policy prayer_update_owner on public.prayer_requests for update to authenticated
using (requested_by = (select auth.uid())) with check (requested_by = (select auth.uid()));
create policy prayer_delete_owner on public.prayer_requests for delete to authenticated
using (requested_by = (select auth.uid()));

alter table public.mood_entries enable row level security;
create policy mood_select_couple on public.mood_entries for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.couple_members cm
    where cm.couple_id = mood_entries.couple_id and cm.user_id = (select auth.uid())
  )
);
create policy mood_insert_owner on public.mood_entries for insert to authenticated
with check (user_id = (select auth.uid()));
create policy mood_update_owner on public.mood_entries for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy mood_delete_owner on public.mood_entries for delete to authenticated
using (user_id = (select auth.uid()));

-- Push tokens are private credentials. Remove anonymous mutation entirely.
drop policy if exists "Allow anonymous token insert" on public.device_push_tokens;
drop policy if exists "Allow anonymous token update" on public.device_push_tokens;
drop policy if exists "Allow service role to delete tokens" on public.device_push_tokens;
drop policy if exists "Allow service role to read tokens" on public.device_push_tokens;
alter table public.device_push_tokens enable row level security;
revoke all on public.device_push_tokens from anon, authenticated;
grant all on public.device_push_tokens to service_role;

alter table public.web_push_subscriptions enable row level security;
revoke all on public.web_push_subscriptions from anon;
grant select, insert, update, delete on public.web_push_subscriptions to authenticated;
grant all on public.web_push_subscriptions to service_role;
create policy web_push_owner_all on public.web_push_subscriptions for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.user_profiles, public.couples,
  public.couple_members, public.journal_entries, public.prayer_requests,
  public.mood_entries to authenticated;
grant all on public.user_profiles, public.couples, public.couple_members,
  public.journal_entries, public.prayer_requests, public.mood_entries to service_role;
revoke all on public.user_profiles, public.couples, public.couple_members,
  public.journal_entries, public.prayer_requests, public.mood_entries from anon;
grant usage, select on sequence public.web_push_subscriptions_id_seq to authenticated, service_role;

-- Backfill profiles that still have a live Supabase Auth identity.
with source as (
  select kv.key, kv.value, substring(kv.key from 6)::uuid as user_id
  from public.kv_store_6d579fee kv
  where kv.key ~ '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and jsonb_typeof(kv.value) = 'object'
)
insert into public.user_profiles (
  id, full_name, email, phone_number, phone, preferred_language, location_uae,
  location, avatar_url, cover_url, bio, relationship_started_at, invite_code,
  source_key, kv_payload, created_at, updated_at
)
select
  source.user_id,
  coalesce(nullif(source.value->>'name', ''), nullif(auth_user.raw_user_meta_data->>'full_name', ''), split_part(auth_user.email, '@', 1), 'User'),
  coalesce(nullif(source.value->>'email', ''), auth_user.email),
  nullif(source.value->>'phone', ''), nullif(source.value->>'phone', ''),
  coalesce(nullif(source.value->>'language', ''), 'en'),
  nullif(source.value->>'location', ''), nullif(source.value->>'location', ''),
  nullif(source.value->>'profilePicture', ''), nullif(source.value->>'coverPicture', ''),
  nullif(source.value->>'bio', ''),
  case when source.value->>'relationshipStart' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'relationshipStart')::timestamptz end,
  nullif(source.value->>'inviteCode', ''), source.key, source.value,
  case when source.value->>'createdAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'createdAt')::timestamptz else now() end,
  case when source.value->>'updatedAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'updatedAt')::timestamptz else now() end
from source
join auth.users auth_user on auth_user.id = source.user_id
on conflict (id) do update set
  full_name = excluded.full_name, email = excluded.email, phone_number = excluded.phone_number,
  phone = excluded.phone, preferred_language = excluded.preferred_language,
  location_uae = excluded.location_uae, location = excluded.location,
  avatar_url = excluded.avatar_url, cover_url = excluded.cover_url, bio = excluded.bio,
  relationship_started_at = excluded.relationship_started_at,
  invite_code = excluded.invite_code, source_key = excluded.source_key,
  kv_payload = excluded.kv_payload, updated_at = excluded.updated_at;

insert into public.kv_migration_quarantine(source_key, domain, reason, payload)
select kv.key, 'profile', 'No matching auth.users row', kv.value
from public.kv_store_6d579fee kv
where kv.key ~ '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and jsonb_typeof(kv.value) = 'object'
  and not exists (select 1 from public.user_profiles p where p.source_key = kv.key)
on conflict (source_key) do update set reason = excluded.reason, payload = excluded.payload;

with source as (
  select kv.key, kv.value, kv.value->>'id' as couple_id
  from public.kv_store_6d579fee kv
  where kv.key like 'couple:%' and kv.key not like 'couple-chat:%'
    and jsonb_typeof(kv.value) = 'object'
)
insert into public.couples (
  id, couple_code, partner1_id, partner2_id, relationship_status,
  anniversary_date, relationship_started_at, source_key, kv_payload,
  created_at, updated_at
)
select
  source.couple_id,
  coalesce(p1.invite_code, 'KV-' || upper(substr(md5(source.couple_id), 1, 12))),
  p1.id, p2.id,
  case when p2.id is null then 'single' else 'connected' end,
  case when source.value->>'relationshipStartDate' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'relationshipStartDate')::date end,
  case when source.value->>'relationshipStartDate' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'relationshipStartDate')::timestamptz end,
  source.key, source.value,
  case when source.value->>'createdAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'createdAt')::timestamptz else now() end,
  now()
from source
join public.user_profiles p1 on p1.id::text = source.value->>'partner1Id'
left join public.user_profiles p2 on p2.id::text = source.value->>'partner2Id'
where source.couple_id is not null
on conflict (id) do update set
  couple_code = excluded.couple_code, partner1_id = excluded.partner1_id,
  partner2_id = excluded.partner2_id, relationship_status = excluded.relationship_status,
  anniversary_date = excluded.anniversary_date,
  relationship_started_at = excluded.relationship_started_at,
  source_key = excluded.source_key, kv_payload = excluded.kv_payload,
  updated_at = excluded.updated_at;

insert into public.kv_migration_quarantine(source_key, domain, reason, payload)
select kv.key, 'couple', 'Missing valid couple ID or primary partner', kv.value
from public.kv_store_6d579fee kv
where kv.key like 'couple:%' and kv.key not like 'couple-chat:%'
  and jsonb_typeof(kv.value) = 'object'
  and not exists (select 1 from public.couples c where c.source_key = kv.key)
on conflict (source_key) do update set reason = excluded.reason, payload = excluded.payload;

insert into public.couple_members(couple_id, user_id, member_role, joined_at)
select id, partner1_id, 'partner1', created_at from public.couples where partner1_id is not null
on conflict (user_id) do update set couple_id = excluded.couple_id, member_role = excluded.member_role;
insert into public.couple_members(couple_id, user_id, member_role, joined_at)
select id, partner2_id, 'partner2', created_at from public.couples where partner2_id is not null
on conflict (user_id) do update set couple_id = excluded.couple_id, member_role = excluded.member_role;

update public.user_profiles profile set
  couple_id = member.couple_id,
  partner_id = case when couple.partner1_id = profile.id then couple.partner2_id else couple.partner1_id end
from public.couple_members member
join public.couples couple on couple.id = member.couple_id
where member.user_id = profile.id;

with source as (
  select kv.key, kv.value
  from public.kv_store_6d579fee kv
  where kv.key like 'journal:%' and jsonb_typeof(kv.value) = 'object'
)
insert into public.journal_entries (
  id, source_key, author_id, title, content, entry_date, is_shared, mood,
  entry_type, location, emoji, media_files, comments, kv_payload,
  created_at, updated_at
)
select
  source.value->>'id', source.key, profile.id,
  coalesce(nullif(source.value->>'title', ''), 'Journal entry'),
  coalesce(source.value->>'content', ''),
  case when source.value->>'createdAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'createdAt')::date else current_date end,
  coalesce((source.value->>'isShared')::boolean, false), nullif(source.value->>'mood', ''),
  coalesce(nullif(source.value->>'entryType', ''), 'journal'),
  nullif(source.value->>'location', ''), nullif(source.value->>'emoji', ''),
  source.value->'mediaFiles', source.value->'comments', source.value,
  case when source.value->>'createdAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'createdAt')::timestamptz else now() end,
  case when source.value->>'updatedAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'updatedAt')::timestamptz else now() end
from source
join public.user_profiles profile on profile.id::text = source.value->>'userId'
where nullif(source.value->>'id', '') is not null
on conflict (id) do update set
  title = excluded.title, content = excluded.content, is_shared = excluded.is_shared,
  entry_type = excluded.entry_type, location = excluded.location, emoji = excluded.emoji,
  media_files = excluded.media_files, comments = excluded.comments,
  kv_payload = excluded.kv_payload, updated_at = excluded.updated_at;

insert into public.kv_migration_quarantine(source_key, domain, reason, payload)
select kv.key, 'journal', 'Missing ID or valid author profile', kv.value
from public.kv_store_6d579fee kv
where kv.key like 'journal:%' and jsonb_typeof(kv.value) = 'object'
  and not exists (select 1 from public.journal_entries item where item.source_key = kv.key)
on conflict (source_key) do update set reason = excluded.reason, payload = excluded.payload;

with source as (
  select kv.key, kv.value
  from public.kv_store_6d579fee kv
  where kv.key like 'prayer:%' and jsonb_typeof(kv.value) = 'object'
)
insert into public.prayer_requests (
  id, source_key, requested_by, title, description, is_answered, answered_at,
  prayer_category, is_private, is_shared, is_shared_with_partner, is_surprise,
  unlock_at, reminder_at, you_prayed, partner_prayed, prayer_count,
  scripture, language, generation_source, source_type, source_plan_id,
  kv_payload, created_at, updated_at
)
select
  source.value->>'id', source.key, profile.id,
  coalesce(nullif(source.value->>'title', ''), 'Prayer'),
  coalesce(source.value->>'description', ''),
  coalesce((source.value->>'isAnswered')::boolean, false),
  case when source.value->>'answeredAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'answeredAt')::timestamptz end,
  coalesce(nullif(source.value->>'category', ''), 'General'),
  not coalesce((source.value->>'isSharedWithPartner')::boolean, (source.value->>'isShared')::boolean, true),
  coalesce((source.value->>'isShared')::boolean, true),
  coalesce((source.value->>'isSharedWithPartner')::boolean, (source.value->>'isShared')::boolean, true),
  coalesce((source.value->>'isSurprise')::boolean, false),
  case when source.value->>'unlockAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'unlockAt')::timestamptz end,
  case when source.value->>'reminderDate' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'reminderDate')::timestamptz end,
  coalesce((source.value->>'youPrayed')::boolean, false),
  coalesce((source.value->>'partnerPrayed')::boolean, false),
  coalesce((source.value->>'prayerCount')::integer, 0),
  nullif(source.value->>'scripture', ''), nullif(source.value->>'language', ''),
  nullif(source.value->>'generationSource', ''), nullif(source.value->>'source', ''),
  nullif(source.value->>'sourcePlanId', ''), source.value,
  case when source.value->>'createdAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'createdAt')::timestamptz else now() end,
  case when source.value->>'updatedAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'updatedAt')::timestamptz else now() end
from source
join public.user_profiles profile on profile.id::text = source.value->>'userId'
where nullif(source.value->>'id', '') is not null
on conflict (id) do update set
  title = excluded.title, description = excluded.description,
  is_answered = excluded.is_answered, answered_at = excluded.answered_at,
  prayer_category = excluded.prayer_category, is_private = excluded.is_private,
  is_shared = excluded.is_shared, is_shared_with_partner = excluded.is_shared_with_partner,
  is_surprise = excluded.is_surprise, unlock_at = excluded.unlock_at,
  reminder_at = excluded.reminder_at, you_prayed = excluded.you_prayed,
  partner_prayed = excluded.partner_prayed, prayer_count = excluded.prayer_count,
  scripture = excluded.scripture, language = excluded.language,
  generation_source = excluded.generation_source, source_type = excluded.source_type,
  source_plan_id = excluded.source_plan_id, kv_payload = excluded.kv_payload,
  updated_at = excluded.updated_at;

insert into public.kv_migration_quarantine(source_key, domain, reason, payload)
select kv.key, 'prayer', 'Missing ID or valid owner profile', kv.value
from public.kv_store_6d579fee kv
where kv.key like 'prayer:%' and jsonb_typeof(kv.value) = 'object'
  and not exists (select 1 from public.prayer_requests item where item.source_key = kv.key)
on conflict (source_key) do update set reason = excluded.reason, payload = excluded.payload;

with source as (
  select kv.key, kv.value
  from public.kv_store_6d579fee kv
  where kv.key like 'mood:%' and jsonb_typeof(kv.value) = 'object'
)
insert into public.mood_entries(id, source_key, user_id, mood, note, created_at, kv_payload)
select
  source.value->>'id', source.key, profile.id, source.value->>'mood',
  coalesce(source.value->>'note', ''),
  case when source.value->>'createdAt' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'createdAt')::timestamptz else now() end,
  source.value
from source
join public.user_profiles profile on profile.id::text = source.value->>'userId'
where nullif(source.value->>'id', '') is not null
  and source.value->>'mood' in ('great', 'good', 'okay', 'sad')
on conflict (id) do update set
  mood = excluded.mood, note = excluded.note, created_at = excluded.created_at,
  kv_payload = excluded.kv_payload;

insert into public.kv_migration_quarantine(source_key, domain, reason, payload)
select kv.key, 'mood', 'Missing ID, valid owner profile, or supported mood value', kv.value
from public.kv_store_6d579fee kv
where kv.key like 'mood:%' and jsonb_typeof(kv.value) = 'object'
  and not exists (select 1 from public.mood_entries item where item.source_key = kv.key)
on conflict (source_key) do update set reason = excluded.reason, payload = excluded.payload;

with source as (
  select kv.key, kv.value, split_part(kv.key, ':', 2)::uuid as user_id
  from public.kv_store_6d579fee kv
  where kv.key ~ '^push_subscription:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and jsonb_typeof(kv.value) = 'object'
)
insert into public.web_push_subscriptions(
  source_key, user_id, endpoint, expiration_time, p256dh, auth, kv_payload
)
select
  source.key, profile.id, source.value->>'endpoint',
  case when source.value->>'expirationTime' ~ '^\d{4}-\d{2}-\d{2}' then (source.value->>'expirationTime')::timestamptz end,
  source.value->'keys'->>'p256dh', source.value->'keys'->>'auth', source.value
from source
join public.user_profiles profile on profile.id = source.user_id
where nullif(source.value->>'endpoint', '') is not null
on conflict (source_key) do update set
  endpoint = excluded.endpoint, expiration_time = excluded.expiration_time,
  p256dh = excluded.p256dh, auth = excluded.auth, kv_payload = excluded.kv_payload,
  updated_at = now();

insert into public.kv_migration_quarantine(source_key, domain, reason, payload)
select kv.key, 'web_push', 'Missing endpoint or valid owner profile', kv.value
from public.kv_store_6d579fee kv
where kv.key like 'push_subscription:%' and jsonb_typeof(kv.value) = 'object'
  and not exists (select 1 from public.web_push_subscriptions item where item.source_key = kv.key)
on conflict (source_key) do update set reason = excluded.reason, payload = excluded.payload;

insert into public.kv_migration_runs(
  migration_name, status, source_counts, target_counts, quarantine_counts, completed_at
)
select
  '20260827210000_core_relational_shadow',
  'verified',
  jsonb_build_object(
    'profiles', (select count(*) from public.kv_store_6d579fee where key ~ '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and jsonb_typeof(value) = 'object'),
    'couples', (select count(*) from public.kv_store_6d579fee where key like 'couple:%' and key not like 'couple-chat:%' and jsonb_typeof(value) = 'object'),
    'journals', (select count(*) from public.kv_store_6d579fee where key like 'journal:%' and jsonb_typeof(value) = 'object'),
    'prayers', (select count(*) from public.kv_store_6d579fee where key like 'prayer:%' and jsonb_typeof(value) = 'object'),
    'moods', (select count(*) from public.kv_store_6d579fee where key like 'mood:%' and jsonb_typeof(value) = 'object'),
    'web_push', (select count(*) from public.kv_store_6d579fee where key like 'push_subscription:%' and jsonb_typeof(value) = 'object')
  ),
  jsonb_build_object(
    'profiles', (select count(*) from public.user_profiles where source_key is not null),
    'couples', (select count(*) from public.couples where source_key is not null),
    'journals', (select count(*) from public.journal_entries where source_key is not null),
    'prayers', (select count(*) from public.prayer_requests where source_key is not null),
    'moods', (select count(*) from public.mood_entries where source_key is not null),
    'web_push', (select count(*) from public.web_push_subscriptions where source_key is not null)
  ),
  coalesce((
    select jsonb_object_agg(domain, item_count)
    from (select domain, count(*) as item_count from public.kv_migration_quarantine group by domain) counts
  ), '{}'::jsonb),
  now();

analyze public.user_profiles;
analyze public.couples;
analyze public.couple_members;
analyze public.journal_entries;
analyze public.prayer_requests;
analyze public.mood_entries;
analyze public.web_push_subscriptions;
