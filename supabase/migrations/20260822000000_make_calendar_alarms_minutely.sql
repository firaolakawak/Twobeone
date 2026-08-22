-- Upgrade existing projects from five-minute reminder checks to minutely
-- checks so one-hour alarms arrive as close to the target time as possible.
do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job where jobname = 'twobeone-couple-calendar-reminders';
  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'twobeone-couple-calendar-reminders',
  '* * * * *',
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
