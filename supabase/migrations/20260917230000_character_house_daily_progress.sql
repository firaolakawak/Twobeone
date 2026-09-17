-- A locked shared goal. Construction is derived from real, mutually completed
-- daily activities; clients never write a block count or backdate a completion.
set lock_timeout = '10s';
set statement_timeout = '120s';

create table public.character_house_goals (
  couple_key text primary key,
  member_a uuid not null references public.user_profiles(id) on delete cascade,
  member_b uuid not null references public.user_profiles(id) on delete cascade,
  home_type text not null check (home_type in ('house', 'villa', 'townhouse', 'apartment', 'duplex', 'penthouse')),
  bedrooms smallint not null check (bedrooms between 1 and 7),
  started_at timestamptz not null default now(),
  baseline_days smallint not null default 0 check (baseline_days between 0 and 365),
  baseline_last_day date,
  legacy_blueprint jsonb not null default '{}'::jsonb,
  check (member_a::text < member_b::text),
  check (couple_key = member_a::text || ':' || member_b::text)
);
alter table public.character_house_goals enable row level security;
revoke all on public.character_house_goals from public, anon, authenticated;
grant all on public.character_house_goals to service_role;

-- Read only blueprints belonging to this mutually linked pair. Existing records
-- remain untouched, including decoration data the simplified UI no longer edits.
create function public.character_house_legacy(p_a uuid, p_b uuid, p_couple_id text)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select r.payload from public.app_records r
  where r.source_key in (
    'character-house:' || least(p_a::text, p_b::text) || ':' || greatest(p_a::text, p_b::text),
    'character-house:' || p_couple_id
  )
  and r.payload->>'homeType' in ('house', 'villa', 'townhouse', 'apartment', 'duplex', 'penthouse')
  and r.payload->>'bedrooms' ~ '^[1-7]$'
  and r.payload->>'submittedBy' in (p_a::text, p_b::text)
  and (r.payload->>'blueprintStatus' <> 'active' or (
    r.payload->>'approvedBy' in (p_a::text, p_b::text)
    and r.payload->>'submittedBy' <> r.payload->>'approvedBy'
  ))
  order by r.updated_at desc limit 1;
$$;
revoke all on function public.character_house_legacy(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.character_house_legacy(uuid, uuid, text) to service_role;

create function public.character_house_legacy_day(p_value text)
returns date language plpgsql immutable set search_path = public, pg_temp as $$
declare v_day date;
begin
  if p_value is null or p_value !~ '^\d{4}-\d{2}-\d{2}$' then return null; end if;
  v_day := p_value::date;
  if to_char(v_day, 'YYYY-MM-DD') <> p_value then return null; end if;
  return v_day;
exception when datetime_field_overflow or invalid_datetime_format then return null;
end;
$$;
revoke all on function public.character_house_legacy_day(text) from public, anon, authenticated;
grant execute on function public.character_house_legacy_day(text) to service_role;

-- Import approved server-stored designs. Browser prototype data is never used.
-- Preserve the old count as a baseline and count only daily activities from the
-- migration's UTC day onward, excluding an already credited legacy day.
insert into public.character_house_goals (
  couple_key, member_a, member_b, home_type, bedrooms, baseline_days, baseline_last_day, legacy_blueprint
)
select a.id::text || ':' || b.id::text, a.id, b.id, legacy.value->>'homeType',
  (legacy.value->>'bedrooms')::smallint,
  case when legacy.value->>'completedDays' ~ '^\d{1,3}$'
    then least(365, (legacy.value->>'completedDays')::integer) else 0 end,
  case when legacy.value->>'completedDays' ~ '^[1-9]\d{0,2}$'
    and public.character_house_legacy_day(legacy.value->>'lastBlockDate') <= (clock_timestamp() at time zone 'UTC')::date
    then public.character_house_legacy_day(legacy.value->>'lastBlockDate') end,
  legacy.value
from public.user_profiles a
join public.user_profiles b on b.kv_payload->>'partnerId' = a.id::text
  and a.kv_payload->>'partnerId' = b.id::text and a.id::text < b.id::text
cross join lateral (select public.character_house_legacy(a.id, b.id,
  case when a.kv_payload->>'coupleId' = b.kv_payload->>'coupleId' then a.kv_payload->>'coupleId' end) as value) legacy
where legacy.value->>'blueprintStatus' = 'active'
on conflict (couple_key) do nothing;

create function public.character_house_state(p_pair text, p_day date)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_goal public.character_house_goals%rowtype;
  v_days integer;
  v_last date;
  v_today boolean;
  v_count integer;
begin
  select * into v_goal from public.character_house_goals where couple_key = p_pair;
  if not found then
    return jsonb_build_object('blueprint', null, 'progress', jsonb_build_object(
      'completedDays', 0, 'totalDays', 365, 'todayContributed', false, 'lastBlockDate', null), 'day', p_day::text);
  end if;
  select count(*)::integer, max(d.challenge_day), coalesce(bool_or(d.challenge_day = p_day), false)
    into v_days, v_last, v_today
  from (
    select challenge_day from public.daily_faith_challenges
    where couple_key = p_pair and completed_at is not null
      and user_id in (v_goal.member_a, v_goal.member_b)
      and challenge_day >= (v_goal.started_at at time zone 'UTC')::date
      and challenge_day <= p_day
      and (v_goal.baseline_last_day is null or challenge_day > v_goal.baseline_last_day)
    group by challenge_day having count(distinct user_id) = 2
    order by challenge_day limit greatest(0, 365 - v_goal.baseline_days)
  ) d;
  v_count := least(365, v_goal.baseline_days + v_days);
  v_last := greatest(v_last, v_goal.baseline_last_day);
  return jsonb_build_object('blueprint', v_goal.legacy_blueprint || jsonb_build_object(
    'homeType', v_goal.home_type, 'bedrooms', v_goal.bedrooms,
    'homeName', coalesce(nullif(v_goal.legacy_blueprint->>'homeName', ''), 'Our Character House'),
    'blueprintStatus', 'active', 'locked', true, 'challengeStartedAt', v_goal.started_at,
    'completedDays', v_count, 'lastBlockDate', v_last
  ), 'progress', jsonb_build_object('completedDays', v_count, 'totalDays', 365,
    'todayContributed', v_today or coalesce(v_goal.baseline_last_day = p_day and v_goal.baseline_days > 0, false),
    'lastBlockDate', v_last), 'day', p_day::text);
end;
$$;
revoke all on function public.character_house_state(text, date) from public, anon, authenticated;
grant execute on function public.character_house_state(text, date) to service_role;

create function public.character_house(p_user_id uuid, p_action text default 'get', p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_profile jsonb;
  v_partner jsonb;
  v_partner_id uuid;
  v_pair text;
  v_now timestamptz;
  v_legacy jsonb;
  v_result jsonb;
begin
  if p_action is null or p_action not in ('get', 'start') then return jsonb_build_object('code', 'invalid_house'); end if;
  select kv_payload into v_profile from public.user_profiles where id = p_user_id;
  if not coalesce(v_profile->>'partnerId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', false)
    or v_profile->>'partnerId' = p_user_id::text then return jsonb_build_object('code', 'partner_required'); end if;
  v_partner_id := (v_profile->>'partnerId')::uuid;
  v_pair := least(p_user_id::text, v_partner_id::text) || ':' || greatest(p_user_id::text, v_partner_id::text);
  perform pg_advisory_xact_lock(hashtextextended('daily-faith:' || v_pair, 0));
  perform 1 from public.user_profiles where id in (p_user_id, v_partner_id) order by id for share;
  select kv_payload into v_profile from public.user_profiles where id = p_user_id;
  select kv_payload into v_partner from public.user_profiles where id = v_partner_id;
  if v_profile->>'partnerId' is distinct from v_partner_id::text or v_partner->>'partnerId' is distinct from p_user_id::text
    then return jsonb_build_object('code', 'partner_required'); end if;
  v_now := clock_timestamp();
  v_legacy := public.character_house_legacy(p_user_id, v_partner_id,
    case when v_profile->>'coupleId' = v_partner->>'coupleId' then v_profile->>'coupleId' end);
  if p_action = 'start' then
    if p_payload is null or jsonb_typeof(p_payload) <> 'object'
      or not coalesce(p_payload->>'homeType' in ('house', 'villa', 'townhouse', 'apartment', 'duplex', 'penthouse'), false)
      or jsonb_typeof(p_payload->'bedrooms') is distinct from 'number'
      or not coalesce(p_payload->>'bedrooms' ~ '^[1-7]$', false)
      then return jsonb_build_object('code', 'invalid_house'); end if;
    if not ((p_payload->>'bedrooms')::integer between
      case p_payload->>'homeType' when 'villa' then 3 when 'duplex' then 3 when 'townhouse' then 2 when 'penthouse' then 2 else 1 end
      and case p_payload->>'homeType' when 'villa' then 7 when 'duplex' then 6 when 'apartment' then 4 else 5 end)
      then return jsonb_build_object('code', 'invalid_house'); end if;
    insert into public.character_house_goals(couple_key, member_a, member_b, home_type, bedrooms, started_at, baseline_days, baseline_last_day, legacy_blueprint)
    values(v_pair, least(p_user_id::text, v_partner_id::text)::uuid, greatest(p_user_id::text, v_partner_id::text)::uuid,
      case when v_legacy->>'blueprintStatus' = 'active' then v_legacy->>'homeType' else p_payload->>'homeType' end,
      case when v_legacy->>'blueprintStatus' = 'active' then (v_legacy->>'bedrooms')::smallint else (p_payload->>'bedrooms')::smallint end,
      v_now,
      case when v_legacy->>'blueprintStatus' = 'active' and v_legacy->>'completedDays' ~ '^\d{1,3}$'
        then least(365, (v_legacy->>'completedDays')::integer) else 0 end,
      case when v_legacy->>'blueprintStatus' = 'active'
        and v_legacy->>'completedDays' ~ '^[1-9]\d{0,2}$'
        and public.character_house_legacy_day(v_legacy->>'lastBlockDate') <= (v_now at time zone 'UTC')::date
        then public.character_house_legacy_day(v_legacy->>'lastBlockDate') end,
      coalesce(v_legacy, '{}'::jsonb))
    on conflict (couple_key) do nothing;
  end if;
  v_result := public.character_house_state(v_pair, (v_now at time zone 'UTC')::date);
  if v_result->'blueprint' = 'null'::jsonb and v_legacy is not null then
    v_result := jsonb_set(v_result, '{blueprint}', v_legacy || jsonb_build_object('locked', false, 'completedDays', 0,
      'blueprintStatus', 'pending'));
  end if;
  return v_result;
end;
$$;
revoke all on function public.character_house(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.character_house(uuid, text, jsonb) to service_role;

-- Keep answer privacy, notifications and completion in the existing transaction.
-- The wrapper derives house progress after completion; no extra credit mutation
-- exists, so duplicate requests and concurrent partners cannot mint extra blocks.
alter function public.daily_faith_challenge(uuid, text, jsonb) rename to daily_faith_challenge_answers;
create function public.daily_faith_challenge(p_user_id uuid, p_action text default 'today', p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_result jsonb; v_partner text; v_pair text; v_house jsonb; v_summary jsonb;
begin
  v_result := public.daily_faith_challenge_answers(p_user_id, p_action, p_payload);
  if v_result ? 'challenge' then
    select kv_payload->>'partnerId' into v_partner from public.user_profiles where id = p_user_id;
    v_pair := least(p_user_id::text, v_partner) || ':' || greatest(p_user_id::text, v_partner);
    v_house := public.character_house_state(v_pair, (v_result->'challenge'->>'day')::date);
    v_summary := case when v_house->'blueprint' = 'null'::jsonb then 'null'::jsonb else
      v_house->'progress' || jsonb_build_object('configured', true,
        'homeType', v_house->'blueprint'->>'homeType', 'bedrooms', v_house->'blueprint'->'bedrooms') end;
    v_result := jsonb_set(v_result, '{challenge,house}', v_summary);
  end if;
  return v_result;
end;
$$;
revoke all on function public.daily_faith_challenge(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.daily_faith_challenge(uuid, text, jsonb) to service_role;
