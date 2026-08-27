-- Prevent concurrent Edge Function instances from generating the same AI
-- response. Leases expire automatically so a crashed request cannot block a
-- later attempt indefinitely.
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
declare
  acquired_key text;
begin
  insert into public.kv_store_6d579fee as lease (key, value)
  values (
    p_key,
    jsonb_build_object(
      'token', p_token,
      'expiresAt', to_char(p_expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  )
  on conflict (key) do update
  set value = excluded.value
  where coalesce((lease.value->>'expiresAt')::timestamptz, '-infinity'::timestamptz) < now()
  returning key into acquired_key;

  return acquired_key is not null;
end;
$$;

create or replace function public.release_generation_lease(
  p_key text,
  p_token text
)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.kv_store_6d579fee
  where key = p_key
    and value->>'token' = p_token;
$$;

revoke all on function public.acquire_generation_lease(text, text, timestamptz) from public;
revoke all on function public.release_generation_lease(text, text) from public;
grant execute on function public.acquire_generation_lease(text, text, timestamptz) to service_role;
grant execute on function public.release_generation_lease(text, text) to service_role;

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
    ) or (
      key like 'ai-lease:%'
      and value->>'expiresAt' < to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
  $job$
);
