-- Classify dormant runtime key families before they create their first rows.
-- Unknown families fail closed so app_unclassified remains an alerting guard,
-- not a long-term data store.

set lock_timeout = '10s';
set statement_timeout = '30s';

create or replace function public.kv_designated_domain(p_key text)
returns text
language sql
immutable
parallel safe
as $$
  select case
    when p_key like 'webrtc_%' then 'realtime_state'
    else case split_part(p_key, ':', 1)
      when 'question' then 'questions'
      when 'question_chat' then 'questions'
      when 'question-response' then 'question_responses'
      when 'question_response' then 'question_responses'
      when 'response' then 'question_responses'
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
      when 'devotional-progress' then 'progress'
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
      when 'compatibility-overall' then 'ai_cache'
      when 'ai-lease' then 'ai_cache'
      when 'auditlog' then 'audit_logs'
      when 'ratelimit' then 'rate_limits'
      when 'notification-dedupe' then 'deduplication'
      when 'live' then 'realtime_state'
      when 'location' then 'realtime_state'
      when 'disconnect' then 'realtime_state'
      when 'system' then 'realtime_state'
      when 'admin' then 'realtime_state'
      when 'landing_page' then 'realtime_state'
      when 'push-subscription' then 'realtime_state'
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
    end
  end;
$$;

alter table public.app_unclassified
  add constraint app_unclassified_must_remain_empty check (false);

revoke all on function public.kv_designated_domain(text) from public, anon, authenticated;
grant execute on function public.kv_designated_domain(text) to service_role;
