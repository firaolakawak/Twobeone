-- Prerequisites are mapped into Vault by supabase/config.toml:
--   calendar_project_url  = the linked Supabase project URL
--   calendar_cron_secret = the same CRON_SECRET configured on the Edge Function
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job where jobname = 'twobeone-couple-calendar-reminders';
  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

-- Check every five minutes. The endpoint has per-event occurrence idempotency,
-- so retries or overlapping calls cannot create duplicate reminders.
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
