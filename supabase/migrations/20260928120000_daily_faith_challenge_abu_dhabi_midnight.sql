-- Use the UAE civil day for the shared daily faith challenge. Asia/Dubai is
-- UTC+04:00 year-round, so a new challenge begins at 00:00 in Abu Dhabi and
-- the response's resetsAt instant is 20:00 UTC on the preceding UTC date.
--
-- Preserve the start day of every existing house under the UTC convention
-- that was active when it began. Without this persisted boundary, changing
-- the interpretation of started_at could remove a legitimately earned first
-- block from a house started between 20:00 and 23:59 UTC.
set lock_timeout = '10s';
set statement_timeout = '120s';

alter table public.character_house_goals
  add column started_challenge_day date;

update public.character_house_goals
set started_challenge_day = (started_at at time zone 'UTC')::date;

alter table public.character_house_goals
  alter column started_challenge_day set not null;

create function public.character_house_set_started_challenge_day()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.started_challenge_day := (new.started_at at time zone 'Asia/Dubai')::date;
  return new;
end;
$$;

revoke all on function public.character_house_set_started_challenge_day() from public, anon, authenticated;

create trigger character_house_set_started_challenge_day
before insert on public.character_house_goals
for each row execute function public.character_house_set_started_challenge_day();

-- Rewrite only the established day-boundary expressions. Keeping the rest of
-- each current definition intact avoids changing answer privacy, notification
-- atomicity, house-credit rules, or viewer-specific completion statuses.
do $migration$
declare
  v_definition text;
  v_occurrences integer;
begin
  select pg_get_functiondef('public.character_house_state(text,date)'::regprocedure)
    into strict v_definition;
  v_occurrences := (
    length(v_definition) - length(replace(
      v_definition,
      '(v_goal.started_at at time zone ''UTC'')::date',
      ''
    ))
  ) / length('(v_goal.started_at at time zone ''UTC'')::date');

  if v_occurrences <> 1 then
    raise exception 'Expected the UTC house start-day expression once, found %', v_occurrences;
  end if;

  execute replace(
    v_definition,
    '(v_goal.started_at at time zone ''UTC'')::date',
    'v_goal.started_challenge_day'
  );

  select pg_get_functiondef('public.daily_faith_challenge_answers(uuid,text,jsonb)'::regprocedure)
    into strict v_definition;
  v_occurrences := (
    length(v_definition) - length(replace(
      v_definition,
      '(v_now at time zone ''UTC'')::date',
      ''
    ))
  ) / length('(v_now at time zone ''UTC'')::date');
  if v_occurrences <> 1 then
    raise exception 'Expected the UTC challenge-day expression once, found %', v_occurrences;
  end if;
  v_occurrences := (
    length(v_definition) - length(replace(
      v_definition,
      '((v_day + 1)::timestamp at time zone ''UTC'')',
      ''
    ))
  ) / length('((v_day + 1)::timestamp at time zone ''UTC'')');
  if v_occurrences <> 1 then
    raise exception 'Expected the UTC reset expression once, found %', v_occurrences;
  end if;
  execute replace(
    replace(
      v_definition,
      '(v_now at time zone ''UTC'')::date',
      '(v_now at time zone ''Asia/Dubai'')::date'
    ),
    '((v_day + 1)::timestamp at time zone ''UTC'')',
    '((v_day + 1)::timestamp at time zone ''Asia/Dubai'')'
  );

  select pg_get_functiondef('public.character_house(uuid,text,jsonb)'::regprocedure)
    into strict v_definition;
  v_occurrences := (
    length(v_definition) - length(replace(
      v_definition,
      '(v_now at time zone ''UTC'')::date',
      ''
    ))
  ) / length('(v_now at time zone ''UTC'')::date');
  if v_occurrences <> 1 then
    raise exception 'Expected the UTC current-house-day expression once, found %', v_occurrences;
  end if;
  execute replace(
    v_definition,
    '(v_now at time zone ''UTC'')::date',
    '(v_now at time zone ''Asia/Dubai'')::date'
  );

  -- The public wrapper has no clock of its own: it consumes the localized day
  -- returned above and passes that same date to character_house_state.
  select pg_get_functiondef('public.daily_faith_challenge(uuid,text,jsonb)'::regprocedure)
    into strict v_definition;
  if position('public.daily_faith_challenge_answers' in v_definition) = 0
    or position('public.character_house_state' in v_definition) = 0 then
    raise exception 'Unexpected daily faith challenge wrapper definition';
  end if;
  execute v_definition;
end;
$migration$;
