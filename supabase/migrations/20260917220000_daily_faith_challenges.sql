-- One private daily answer per partner. Submission and its in-app notification
-- commit together; clients cannot read the table or invoke this RPC directly.
set lock_timeout = '10s';
set statement_timeout = '120s';

create table public.daily_faith_challenges (
  couple_key text not null,
  challenge_day date not null,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  partner_id uuid not null references public.user_profiles(id) on delete cascade,
  mission_id text not null check (mission_id ~ '^quest-(0[1-9]|[12][0-9]|30)$'),
  choice smallint not null check (choice between 0 and 2),
  guess smallint check (guess between 0 and 2),
  kindness_done boolean not null default false,
  submitted_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (couple_key, challenge_day, user_id),
  check (user_id <> partner_id)
);
alter table public.daily_faith_challenges enable row level security;
revoke all on public.daily_faith_challenges from public, anon, authenticated;
grant all on public.daily_faith_challenges to service_role;

create or replace function public.daily_faith_challenge(
  p_user_id uuid,
  p_action text default 'today',
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile jsonb;
  v_partner jsonb;
  v_partner_id uuid;
  v_partner_text text;
  v_pair text;
  v_now timestamptz;
  v_day date;
  v_number integer;
  v_mission text;
  v_mode integer;
  v_own public.daily_faith_challenges%rowtype;
  v_other public.daily_faith_challenges%rowtype;
  v_both boolean;
  v_notification jsonb;
  v_notification_id text;
  v_sender_name text;
  v_own_json jsonb;
  v_partner_json jsonb;
begin
  if p_action is null or p_action not in ('today', 'submit', 'complete') then
    return jsonb_build_object('code', 'invalid_submission');
  end if;

  -- The compatibility profile payload is what the existing linking routes write.
  select kv_payload into v_profile from public.user_profiles where id = p_user_id;
  v_partner_text := v_profile->>'partnerId';
  if v_partner_text is null or v_partner_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('code', 'partner_required');
  end if;
  v_partner_id := v_partner_text::uuid;
  if v_partner_id = p_user_id then
    return jsonb_build_object('code', 'partner_required');
  end if;
  v_pair := least(p_user_id::text, v_partner_id::text) || ':' || greatest(p_user_id::text, v_partner_id::text);

  -- Serialize both partners, retries and midnight rollover without a read/insert race.
  perform pg_advisory_xact_lock(hashtextextended('daily-faith:' || v_pair, 0));
  -- Keep both relationships stable until answer and notification have committed.
  perform 1 from public.user_profiles where id in (p_user_id, v_partner_id) order by id for share;
  select kv_payload into v_profile from public.user_profiles where id = p_user_id;
  select kv_payload into v_partner from public.user_profiles where id = v_partner_id;
  if v_profile->>'partnerId' is distinct from v_partner_id::text
    or v_partner->>'partnerId' is distinct from p_user_id::text then
    return jsonb_build_object('code', 'partner_required');
  end if;

  v_now := clock_timestamp();
  v_day := (v_now at time zone 'UTC')::date;
  v_number := ((v_day - date '2026-09-17') % 30 + 30) % 30 + 1;
  v_mission := 'quest-' || lpad(v_number::text, 2, '0');
  v_mode := (v_number - 1) % 3; -- 0 heart, 1 grace, 2 kindness

  if p_action <> 'today' then
    if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
      return jsonb_build_object('code', 'invalid_submission');
    end if;
    if p_payload->>'day' is distinct from v_day::text then
      return jsonb_build_object('code', 'day_changed');
    end if;
    if p_payload->>'missionId' is distinct from v_mission then
      return jsonb_build_object('code', 'mission_changed');
    end if;
  end if;

  select * into v_own from public.daily_faith_challenges
    where couple_key = v_pair and challenge_day = v_day and user_id = p_user_id;
  select * into v_other from public.daily_faith_challenges
    where couple_key = v_pair and challenge_day = v_day and user_id = v_partner_id;

  if p_action = 'submit' then
    if not coalesce(p_payload->'choice' in ('0'::jsonb, '1'::jsonb, '2'::jsonb), false)
      or (v_mode = 0 and not coalesce(p_payload->'guess' in ('0'::jsonb, '1'::jsonb, '2'::jsonb), false))
      or (p_payload ? 'guess' and not coalesce(p_payload->'guess' in ('0'::jsonb, '1'::jsonb, '2'::jsonb), false))
      or (v_mode = 2 and p_payload->'kindnessDone' is distinct from 'true'::jsonb) then
      return jsonb_build_object('code', 'invalid_submission');
    end if;
    if v_own.user_id is null then
      insert into public.daily_faith_challenges (
        couple_key, challenge_day, user_id, partner_id, mission_id, choice, guess, kindness_done, submitted_at
      ) values (
        v_pair, v_day, p_user_id, v_partner_id, v_mission,
        (p_payload->>'choice')::numeric::smallint,
        case when v_mode = 0 then (p_payload->>'guess')::numeric::smallint else null end,
        v_mode = 2, v_now
      ) returning * into v_own;

      v_sender_name := left(coalesce(nullif(btrim(v_profile->>'name'), ''), 'Your partner'), 120);
      v_notification_id := 'faith-challenge-' || v_day::text || '-' || p_user_id::text;
      v_notification := jsonb_build_object(
        'id', v_notification_id, 'userId', v_partner_id, 'recipientId', v_partner_id,
        'senderId', p_user_id, 'type', 'faith_challenge', 'title', '🎯 Your daily challenge',
        'message', v_sender_name || case when v_other.user_id is null
          then ' took today’s challenge and is waiting for you.'
          else ' took today’s challenge. Your cards are ready to reveal.' end,
        'data', jsonb_build_object('day', v_day::text, 'missionId', v_mission,
          'url', '/?daily-challenge=1', 'screen', 'daily-faith-challenge',
          'senderName', v_sender_name, 'readyToReveal', v_other.user_id is not null),
        'read', false, 'isRead', false, 'createdAt', v_now
      );
      insert into public.app_records(domain, source_key, record_type, owner_id, payload, created_at, updated_at)
      values ('notifications', 'notification:' || v_partner_id::text || ':' || v_notification_id,
        'notification', v_partner_id::text, v_notification, v_now, v_now)
      on conflict (domain, source_key) do nothing;
    end if;
  elsif p_action = 'complete' then
    if v_own.user_id is null or v_other.user_id is null then
      return jsonb_build_object('code', 'waiting_for_partner');
    end if;
    update public.daily_faith_challenges set completed_at = coalesce(completed_at, v_now)
      where couple_key = v_pair and challenge_day = v_day and user_id = p_user_id
      returning * into v_own;
  end if;

  v_both := v_own.user_id is not null and v_other.user_id is not null;
  v_own_json := case when v_own.user_id is null then null else jsonb_build_object(
    'choice', v_own.choice, 'submittedAt', v_own.submitted_at, 'completedAt', v_own.completed_at
  ) || case when v_own.guess is null then '{}'::jsonb else jsonb_build_object('guess', v_own.guess) end end;
  v_partner_json := jsonb_build_object('submitted', v_other.user_id is not null, 'completed', v_other.completed_at is not null);
  if v_other.user_id is not null then
    v_partner_json := v_partner_json || jsonb_build_object('submittedAt', v_other.submitted_at);
  end if;
  if v_both then
    v_partner_json := v_partner_json || jsonb_build_object('choice', v_other.choice)
      || case when v_other.guess is null then '{}'::jsonb else jsonb_build_object('guess', v_other.guess) end;
  end if;
  return jsonb_build_object('challenge', jsonb_build_object(
    'day', v_day::text, 'missionId', v_mission,
    'resetsAt', ((v_day + 1)::timestamp at time zone 'UTC'),
    'own', v_own_json, 'partner', v_partner_json, 'bothSubmitted', v_both
  ), 'notification', v_notification);
end;
$$;

revoke all on function public.daily_faith_challenge(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.daily_faith_challenge(uuid, text, jsonb) to service_role;
