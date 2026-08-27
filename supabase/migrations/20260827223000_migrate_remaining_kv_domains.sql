-- Migrate every remaining KV family into a designated relational partition.
-- The parent provides one routing/query contract while each domain remains a
-- separate physical table with independent indexes and retention controls.

set lock_timeout = '10s';
set statement_timeout = '120s';

create table if not exists public.app_records (
  domain text not null,
  source_key text not null,
  record_type text not null,
  owner_id text,
  couple_id text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (domain, source_key)
) partition by list (domain);

create table if not exists public.app_questions partition of public.app_records for values in ('questions');
create table if not exists public.app_question_responses partition of public.app_records for values in ('question_responses');
create table if not exists public.app_notifications partition of public.app_records for values in ('notifications');
create table if not exists public.app_devotionals partition of public.app_records for values in ('devotionals');
create table if not exists public.app_highlights partition of public.app_records for values in ('highlights');
create table if not exists public.app_couple_chats partition of public.app_records for values in ('couple_chats');
create table if not exists public.app_prayer_chats partition of public.app_records for values in ('prayer_chats');
create table if not exists public.app_invitations partition of public.app_records for values in ('invitations');
create table if not exists public.app_community partition of public.app_records for values in ('community');
create table if not exists public.app_newsletter_state partition of public.app_records for values in ('newsletter_state');
create table if not exists public.app_calendar partition of public.app_records for values in ('calendar');
create table if not exists public.app_progress partition of public.app_records for values in ('progress');
create table if not exists public.app_ai_cache partition of public.app_records for values in ('ai_cache');
create table if not exists public.app_audit_logs partition of public.app_records for values in ('audit_logs');
create table if not exists public.app_rate_limits partition of public.app_records for values in ('rate_limits');
create table if not exists public.app_deduplication partition of public.app_records for values in ('deduplication');
create table if not exists public.app_realtime_state partition of public.app_records for values in ('realtime_state');
create table if not exists public.app_unclassified partition of public.app_records for values in ('unclassified');

create index if not exists idx_app_records_source_key on public.app_records(source_key text_pattern_ops);
create index if not exists idx_app_records_owner_created on public.app_records(owner_id, created_at desc);
create index if not exists idx_app_records_couple_created on public.app_records(couple_id, created_at desc);
create index if not exists idx_app_records_updated on public.app_records(updated_at desc);

alter table public.app_records enable row level security;
revoke all on public.app_records, public.app_questions, public.app_question_responses,
  public.app_notifications, public.app_devotionals, public.app_highlights,
  public.app_couple_chats, public.app_prayer_chats, public.app_invitations,
  public.app_community, public.app_newsletter_state, public.app_calendar,
  public.app_progress, public.app_ai_cache, public.app_audit_logs,
  public.app_rate_limits, public.app_deduplication, public.app_realtime_state,
  public.app_unclassified from public, anon, authenticated;
grant all on public.app_records, public.app_questions, public.app_question_responses,
  public.app_notifications, public.app_devotionals, public.app_highlights,
  public.app_couple_chats, public.app_prayer_chats, public.app_invitations,
  public.app_community, public.app_newsletter_state, public.app_calendar,
  public.app_progress, public.app_ai_cache, public.app_audit_logs,
  public.app_rate_limits, public.app_deduplication, public.app_realtime_state,
  public.app_unclassified to service_role;

create or replace function public.kv_designated_domain(p_key text)
returns text
language sql
immutable
parallel safe
as $$
  select case split_part(p_key, ':', 1)
    when 'question' then 'questions'
    when 'question_chat' then 'questions'
    when 'question-response' then 'question_responses'
    when 'notification' then 'notifications'
    when 'notif' then 'notifications'
    when 'devotional' then 'devotionals'
    when 'highlight' then 'highlights'
    when 'couple-chat' then 'couple_chats'
    when 'couple-chat-read' then 'couple_chats'
    when 'prayer-chat' then 'prayer_chats'
    when 'invite' then 'invitations'
    when 'group' then 'community'
    when 'groups' then 'community'
    when 'event' then 'community'
    when 'newsletter' then 'newsletter_state'
    when 'newsletter_token' then 'newsletter_state'
    when 'newsletter_delivery' then 'newsletter_state'
    when 'newsletter_admin_send' then 'newsletter_state'
    when 'calendar' then 'calendar'
    when 'completion' then 'progress'
    when 'lesson-completion' then 'progress'
    when 'lesson-note' then 'progress'
    when 'module' then 'progress'
    when 'seeded' then 'progress'
    when 'user-verse' then 'progress'
    when 'memory-streak' then 'progress'
    when 'streak' then 'progress'
    when 'milestone' then 'progress'
    when 'mood-analysis' then 'ai_cache'
    when 'mood-analysis-cache' then 'ai_cache'
    when 'marriage-readiness' then 'ai_cache'
    when 'compatibility' then 'ai_cache'
    when 'ai-lease' then 'ai_cache'
    when 'auditlog' then 'audit_logs'
    when 'ratelimit' then 'rate_limits'
    when 'notification-dedupe' then 'deduplication'
    when 'live' then 'realtime_state'
    when 'location' then 'realtime_state'
    when 'disconnect' then 'realtime_state'
    when 'system' then 'realtime_state'
    when 'landing_page' then 'realtime_state'
    else case
      when p_key ~ '^user:[0-9a-f-]{36}:(groups|notifications)$' then 'community'
      when p_key ~ '^user:[0-9a-f-]{36}$' then null
      when p_key like 'couple:%' and p_key not like 'couple-chat:%' then null
      when p_key like 'journal:%' then null
      when p_key like 'prayer:%' and p_key not like 'prayer-chat:%' then null
      when p_key like 'mood:%' and p_key not like 'mood-analysis%' then null
      when p_key like 'push_subscription:%' then null
      else 'unclassified'
    end
  end;
$$;

create or replace function public.kv_record_timestamp(p_payload jsonb)
returns timestamptz
language plpgsql
stable
as $$
declare candidate text;
begin
  candidate := coalesce(p_payload->>'createdAt', p_payload->>'timestamp',
    p_payload->>'startsAt', p_payload->>'completedAt', p_payload->>'updatedAt');
  if candidate is null then return now(); end if;
  return candidate::timestamptz;
exception when others then return now();
end;
$$;

create or replace function public.mirror_kv_to_designated_table()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  key_value text := coalesce(new.key, old.key);
  target_domain text;
  owner_candidate text;
  couple_candidate text;
begin
  target_domain := public.kv_designated_domain(key_value);
  if target_domain is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    delete from public.app_records where source_key = old.key;
    return old;
  end if;

  owner_candidate := coalesce(new.value->>'userId', new.value->>'recipientId',
    new.value->>'ownerId', new.value->>'authorId', new.value->>'requestedBy',
    split_part(new.key, ':', 2));
  if owner_candidate !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then owner_candidate := null; end if;
  couple_candidate := coalesce(new.value->>'coupleId', new.value->>'channelId');

  insert into public.app_records(
    domain, source_key, record_type, owner_id, couple_id, payload, created_at, updated_at
  ) values (
    target_domain, new.key, split_part(new.key, ':', 1), owner_candidate,
    nullif(couple_candidate, ''), new.value, public.kv_record_timestamp(new.value), now()
  )
  on conflict (domain, source_key) do update set
    record_type = excluded.record_type,
    owner_id = excluded.owner_id,
    couple_id = excluded.couple_id,
    payload = excluded.payload,
    created_at = excluded.created_at,
    updated_at = now();
  return new;
end;
$$;

revoke all on function public.kv_designated_domain(text) from public, anon, authenticated;
revoke all on function public.kv_record_timestamp(jsonb) from public, anon, authenticated;
revoke all on function public.mirror_kv_to_designated_table() from public, anon, authenticated;
grant execute on function public.kv_designated_domain(text), public.kv_record_timestamp(jsonb),
  public.mirror_kv_to_designated_table() to service_role;

drop trigger if exists kv_designated_table_mirror on public.kv_store_6d579fee;
create trigger kv_designated_table_mirror
after insert or update or delete on public.kv_store_6d579fee
for each row execute function public.mirror_kv_to_designated_table();

insert into public.app_records(domain, source_key, record_type, owner_id, couple_id, payload, created_at, updated_at)
select
  public.kv_designated_domain(kv.key), kv.key, split_part(kv.key, ':', 1),
  case when coalesce(kv.value->>'userId', kv.value->>'recipientId', kv.value->>'ownerId',
    kv.value->>'authorId', kv.value->>'requestedBy', split_part(kv.key, ':', 2))
    ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then coalesce(kv.value->>'userId', kv.value->>'recipientId', kv.value->>'ownerId',
      kv.value->>'authorId', kv.value->>'requestedBy', split_part(kv.key, ':', 2)) end,
  nullif(coalesce(kv.value->>'coupleId', kv.value->>'channelId'), ''),
  kv.value, public.kv_record_timestamp(kv.value), now()
from public.kv_store_6d579fee kv
where public.kv_designated_domain(kv.key) is not null
on conflict (domain, source_key) do update set
  record_type = excluded.record_type, owner_id = excluded.owner_id,
  couple_id = excluded.couple_id, payload = excluded.payload,
  created_at = excluded.created_at, updated_at = now();

create or replace view public.remaining_kv_migration_parity
with (security_invoker = true)
as
select
  (select count(*) from public.kv_store_6d579fee kv where public.kv_designated_domain(kv.key) is not null) as source_count,
  (select count(*) from public.app_records) as target_count,
  (select count(*) from public.kv_store_6d579fee kv
    where public.kv_designated_domain(kv.key) is not null
      and not exists (select 1 from public.app_records target where target.source_key = kv.key)) as missing_count,
  (select count(*) from public.kv_store_6d579fee kv join public.app_records target on target.source_key = kv.key
    where target.payload is distinct from kv.value) as stale_count,
  (select count(*) from public.app_records target
    where not exists (select 1 from public.kv_store_6d579fee kv where kv.key = target.source_key)) as orphan_count,
  (select count(*) from public.app_unclassified) as unclassified_count;

revoke all on public.remaining_kv_migration_parity from public, anon, authenticated;
grant select on public.remaining_kv_migration_parity to service_role;

do $$
begin
  if exists (select 1 from public.remaining_kv_migration_parity
    where missing_count > 0 or stale_count > 0 or orphan_count > 0 or unclassified_count > 0)
  then raise exception 'Remaining KV migration blocked: parity or classification failed'; end if;
end;
$$;

insert into public.kv_migration_runs(migration_name, status, source_counts, target_counts, quarantine_counts, completed_at)
select '20260827223000_migrate_remaining_kv_domains', 'verified',
  jsonb_build_object('remaining_kv', source_count),
  jsonb_build_object('designated_records', target_count),
  jsonb_build_object('unclassified', unclassified_count), now()
from public.remaining_kv_migration_parity;

analyze public.app_records;
