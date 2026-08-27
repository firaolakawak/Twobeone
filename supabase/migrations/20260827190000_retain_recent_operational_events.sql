-- Reports use at most 30 days of engagement data. Keep a 15-day safety margin
-- and remove expired rate-limit buckets so operational KV records stay bounded.
create extension if not exists pg_cron with schema pg_catalog;

-- Atomically increments one fixed-window rate-limit bucket. The conditional
-- upsert prevents concurrent requests from exceeding the configured limit.
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
declare
  resulting_count integer;
begin
  insert into public.kv_store_6d579fee as rate_bucket (key, value)
  values (
    p_key,
    jsonb_build_object(
      'count', 1,
      'expiresAt', to_char(p_expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  )
  on conflict (key) do update
  set value = jsonb_build_object(
    'count', (
      case
        when jsonb_typeof(rate_bucket.value) = 'number'
          then (rate_bucket.value #>> '{}')::integer
        else coalesce((rate_bucket.value->>'count')::integer, 0)
      end
    ) + 1,
    'expiresAt', to_char(p_expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  )
  where (
    case
      when jsonb_typeof(rate_bucket.value) = 'number'
        then (rate_bucket.value #>> '{}')::integer
      else coalesce((rate_bucket.value->>'count')::integer, 0)
    end
  ) < p_max_requests
  returning (value->>'count')::integer into resulting_count;

  return resulting_count is not null and resulting_count <= p_max_requests;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, timestamptz) from public;
grant execute on function public.consume_rate_limit(text, integer, timestamptz) to service_role;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'twobeone-operational-event-retention';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'twobeone-operational-event-retention',
  '17 2 * * *',
  $job$
    delete from public.kv_store_6d579fee
    where (
      key like 'engagement:%'
      and value->>'createdAt' < to_char(
        now() - interval '45 days',
        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
      )
    ) or (
      key like 'ratelimit:%'
      and value->>'expiresAt' < to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
  $job$
);
