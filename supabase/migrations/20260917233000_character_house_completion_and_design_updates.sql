-- Add viewer-specific daily completion and allow an established couple to
-- update both constrained design fields without rewriting earned progress.
set lock_timeout = '10s';
set statement_timeout = '120s';

create or replace function public.character_house(p_user_id uuid, p_action text default 'get', p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_profile jsonb;
  v_partner jsonb;
  v_partner_id uuid;
  v_pair text;
  v_now timestamptz;
  v_day date;
  v_current_user_completed boolean;
  v_legacy jsonb;
  v_result jsonb;
begin
  if p_action is null or p_action not in ('get', 'start', 'update') then return jsonb_build_object('code', 'invalid_house'); end if;
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
  v_day := (v_now at time zone 'UTC')::date;
  v_legacy := public.character_house_legacy(p_user_id, v_partner_id,
    case when v_profile->>'coupleId' = v_partner->>'coupleId' then v_profile->>'coupleId' end);
  if p_action in ('start', 'update') then
    if p_payload is null or jsonb_typeof(p_payload) <> 'object'
      or not coalesce(p_payload->>'homeType' in ('house', 'villa', 'townhouse', 'apartment', 'duplex', 'penthouse'), false)
      or jsonb_typeof(p_payload->'bedrooms') is distinct from 'number'
      or not coalesce(p_payload->>'bedrooms' ~ '^[1-7]$', false)
      then return jsonb_build_object('code', 'invalid_house'); end if;
    if not ((p_payload->>'bedrooms')::integer between
      case p_payload->>'homeType' when 'villa' then 3 when 'duplex' then 3 when 'townhouse' then 2 when 'penthouse' then 2 else 1 end
      and case p_payload->>'homeType' when 'villa' then 7 when 'duplex' then 6 when 'apartment' then 4 else 5 end)
      then return jsonb_build_object('code', 'invalid_house'); end if;
  end if;
  if p_action = 'start' then
    insert into public.character_house_goals(couple_key, member_a, member_b, home_type, bedrooms, started_at, baseline_days, baseline_last_day, legacy_blueprint)
    values(v_pair, least(p_user_id::text, v_partner_id::text)::uuid, greatest(p_user_id::text, v_partner_id::text)::uuid,
      case when v_legacy->>'blueprintStatus' = 'active' then v_legacy->>'homeType' else p_payload->>'homeType' end,
      case when v_legacy->>'blueprintStatus' = 'active' then (v_legacy->>'bedrooms')::smallint else (p_payload->>'bedrooms')::smallint end,
      v_now,
      case when v_legacy->>'blueprintStatus' = 'active' and v_legacy->>'completedDays' ~ '^\d{1,3}$'
        then least(365, (v_legacy->>'completedDays')::integer) else 0 end,
      case when v_legacy->>'blueprintStatus' = 'active'
        and v_legacy->>'completedDays' ~ '^[1-9]\d{0,2}$'
        and public.character_house_legacy_day(v_legacy->>'lastBlockDate') <= v_day
        then public.character_house_legacy_day(v_legacy->>'lastBlockDate') end,
      coalesce(v_legacy, '{}'::jsonb))
    on conflict (couple_key) do nothing;
  elsif p_action = 'update' then
    update public.character_house_goals
      set home_type = p_payload->>'homeType', bedrooms = (p_payload->>'bedrooms')::smallint
      where couple_key = v_pair;
    if not found then return jsonb_build_object('code', 'house_not_started'); end if;
  end if;
  v_result := public.character_house_state(v_pair, v_day);
  select exists (
    select 1 from public.daily_faith_challenges
    where couple_key = v_pair and challenge_day = v_day
      and user_id = p_user_id and completed_at is not null
  ) into v_current_user_completed;
  v_result := jsonb_set(v_result, '{progress,currentUserCompletedToday}', to_jsonb(v_current_user_completed), true);
  if v_result->'blueprint' = 'null'::jsonb and v_legacy is not null then
    v_result := jsonb_set(v_result, '{blueprint}', v_legacy || jsonb_build_object('locked', false, 'completedDays', 0,
      'blueprintStatus', 'pending'));
  end if;
  return v_result;
end;
$$;
revoke all on function public.character_house(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.character_house(uuid, text, jsonb) to service_role;

-- Retain the daily challenge response shape while adding the same viewer flag
-- to configured house summaries returned from the existing answer transaction.
create or replace function public.daily_faith_challenge(p_user_id uuid, p_action text default 'today', p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_result jsonb; v_partner text; v_pair text; v_house jsonb; v_summary jsonb;
begin
  v_result := public.daily_faith_challenge_answers(p_user_id, p_action, p_payload);
  if v_result ? 'challenge' then
    select kv_payload->>'partnerId' into v_partner from public.user_profiles where id = p_user_id;
    v_pair := least(p_user_id::text, v_partner) || ':' || greatest(p_user_id::text, v_partner);
    v_house := public.character_house_state(v_pair, (v_result->'challenge'->>'day')::date);
    v_summary := case when v_house->'blueprint' = 'null'::jsonb then 'null'::jsonb else
      v_house->'progress' || jsonb_build_object(
        'currentUserCompletedToday', (v_result->'challenge'->'own'->>'completedAt') is not null,
        'configured', true,
        'homeType', v_house->'blueprint'->>'homeType', 'bedrooms', v_house->'blueprint'->'bedrooms') end;
    v_result := jsonb_set(v_result, '{challenge,house}', v_summary);
  end if;
  return v_result;
end;
$$;
revoke all on function public.daily_faith_challenge(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.daily_faith_challenge(uuid, text, jsonb) to service_role;
