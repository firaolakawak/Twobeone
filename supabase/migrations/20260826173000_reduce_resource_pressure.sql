-- Reduce database and Edge Function pressure from background work.

-- Replace the minutely global calendar scan with a five-minute schedule.
do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'twobeone-couple-calendar-reminders';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'twobeone-couple-calendar-reminders',
  '*/5 * * * *',
  $job$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'calendar_project_url'
        limit 1
      ) || '/functions/v1/make-server-6d579fee/cron/calendar-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'calendar_cron_secret'
          limit 1
        )
      ),
      body := jsonb_build_object('scheduled_at', now())
    );
  $job$
);

-- Engagement summaries filter by createdAt and only need the latest 30 days.
-- Pair the existing prefix index with the JSON timestamp expression used by
-- the bounded query in kv_store.tsx.
create index if not exists idx_kv_store_key_created_at
  on public.kv_store_6d579fee
  using btree (key text_pattern_ops, (value->>'createdAt') desc);
