-- Move every remaining database-side writer from KV to designated tables.
-- The Edge Function can enable RELATIONAL_ONLY after this migration lands.

set lock_timeout = '10s';
set statement_timeout = '120s';

create or replace function public.upsert_designated_record(p_key text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_domain text := coalesce(public.kv_designated_domain(p_key), 'unclassified');
  owner_candidate text;
  couple_candidate text;
begin
  owner_candidate := coalesce(p_payload->>'userId', p_payload->>'recipientId',
    p_payload->>'ownerId', p_payload->>'authorId', p_payload->>'requestedBy',
    split_part(p_key, ':', 2));
  if owner_candidate !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then owner_candidate := null; end if;
  couple_candidate := coalesce(p_payload->>'coupleId', p_payload->>'channelId');

  insert into public.app_records(
    domain, source_key, record_type, owner_id, couple_id, payload, created_at, updated_at
  ) values (
    target_domain, p_key, split_part(p_key, ':', 1), owner_candidate,
    nullif(couple_candidate, ''), p_payload, public.kv_record_timestamp(p_payload), now()
  )
  on conflict (domain, source_key) do update set
    record_type = excluded.record_type, owner_id = excluded.owner_id,
    couple_id = excluded.couple_id, payload = excluded.payload,
    created_at = excluded.created_at, updated_at = now();
end;
$$;

create or replace function public.delete_designated_record(p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.app_records where source_key = p_key;
$$;

create or replace function public.claim_designated_record(p_key text, p_payload jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare inserted_key text;
begin
  insert into public.app_records(
    domain, source_key, record_type, payload, created_at, updated_at
  ) values (
    coalesce(public.kv_designated_domain(p_key), 'unclassified'), p_key,
    split_part(p_key, ':', 1), p_payload, public.kv_record_timestamp(p_payload), now()
  )
  on conflict (domain, source_key) do nothing
  returning source_key into inserted_key;
  return inserted_key is not null;
end;
$$;

revoke all on function public.upsert_designated_record(text, jsonb) from public, anon, authenticated;
revoke all on function public.delete_designated_record(text) from public, anon, authenticated;
revoke all on function public.claim_designated_record(text, jsonb) from public, anon, authenticated;
grant execute on function public.upsert_designated_record(text, jsonb) to service_role;
grant execute on function public.delete_designated_record(text) to service_role;
grant execute on function public.claim_designated_record(text, jsonb) to service_role;

create or replace function public.consume_rate_limit(
  p_key text,
  p_max_requests integer,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare resulting_count integer;
begin
  insert into public.app_records as rate_bucket(
    domain, source_key, record_type, payload, created_at, updated_at
  ) values (
    'rate_limits', p_key, 'ratelimit',
    jsonb_build_object('count', 1, 'expiresAt', to_char(p_expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
    now(), now()
  )
  on conflict (domain, source_key) do update set
    payload = jsonb_build_object(
      'count', coalesce((rate_bucket.payload->>'count')::integer, 0) + 1,
      'expiresAt', to_char(p_expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ),
    updated_at = now()
  where coalesce((rate_bucket.payload->>'count')::integer, 0) < p_max_requests
  returning (payload->>'count')::integer into resulting_count;
  return resulting_count is not null and resulting_count <= p_max_requests;
end;
$$;

create or replace function public.acquire_generation_lease(
  p_key text,
  p_token text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare acquired_key text;
begin
  insert into public.app_records as lease(
    domain, source_key, record_type, payload, created_at, updated_at
  ) values (
    'ai_cache', p_key, 'ai-lease',
    jsonb_build_object('token', p_token, 'expiresAt', to_char(p_expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
    now(), now()
  )
  on conflict (domain, source_key) do update set payload = excluded.payload, updated_at = now()
  where coalesce((lease.payload->>'expiresAt')::timestamptz, '-infinity'::timestamptz) < now()
  returning source_key into acquired_key;
  return acquired_key is not null;
end;
$$;

create or replace function public.release_generation_lease(p_key text, p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.app_records
  where domain = 'ai_cache' and source_key = p_key and payload->>'token' = p_token;
$$;

revoke all on function public.consume_rate_limit(text, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.acquire_generation_lease(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.release_generation_lease(text, text) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, timestamptz) to service_role;
grant execute on function public.acquire_generation_lease(text, text, timestamptz) to service_role;
grant execute on function public.release_generation_lease(text, text) to service_role;

do $$
declare existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job where jobname = 'twobeone-operational-event-retention';
  if existing_job_id is not null then perform cron.unschedule(existing_job_id); end if;
end $$;

select cron.schedule(
  'twobeone-operational-event-retention', '17 2 * * *',
  $job$
    delete from public.app_records
    where (domain = 'rate_limits' or (domain = 'ai_cache' and source_key like 'ai-lease:%'))
      and payload->>'expiresAt' < to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    delete from public.app_records
    where domain = 'deduplication' and payload->>'expiresAt' is not null
      and payload->>'expiresAt' < to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    delete from public.engagement_event_receipts where expires_at < now();
    delete from public.engagement_daily where activity_date < current_date - 45;
  $job$
);
