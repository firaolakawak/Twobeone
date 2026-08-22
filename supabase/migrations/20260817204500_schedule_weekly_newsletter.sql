-- Prerequisites (create through Supabase Vault before this job first runs):
--   newsletter_project_url = https://jhraxjlvmixhzvzbjjsw.supabase.co
--   newsletter_cron_secret = the same value as the Edge secret NEWSLETTER_CRON_SECRET
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job where jobname = 'twobeone-weekly-newsletter';
  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

-- Saturday at 06:00 UTC, which is 09:00 in Africa/Addis_Ababa year-round.
select cron.schedule(
  'twobeone-weekly-newsletter',
  '0 6 * * 6',
  $job$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'newsletter_project_url'
        limit 1
      ) || '/functions/v1/make-server-6d579fee/newsletter/send-weekly',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Newsletter-Cron-Secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'newsletter_cron_secret'
          limit 1
        )
      ),
      body := jsonb_build_object('scheduled_at', now())
    );
  $job$
);
