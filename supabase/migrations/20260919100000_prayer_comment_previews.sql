-- Fetch the newest visible prayer comment for a page of prayer cards in one
-- bounded database call. The function repeats the prayer-sharing checks so a
-- service-role caller cannot accidentally expose a partner's private thread.

set lock_timeout = '10s';
set statement_timeout = '30s';

create index if not exists idx_prayer_comments_owner_prayer_created
on public.app_prayer_chats (
  (payload->>'prayerOwnerId'),
  (payload->>'prayerId'),
  created_at desc,
  source_key desc
)
where record_type = 'prayer-comment'
  and payload->>'kind' = 'prayer_request_comment';

create or replace function public.get_prayer_comment_previews(
  p_viewer_id uuid,
  p_prayer_ids text[]
)
returns table (
  prayer_id text,
  latest_comment jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with input_prayers as (
    -- The prayer route returns at most 200 records. Keep the database contract
    -- bounded too, even though only the service role may execute this function.
    select distinct input.prayer_id
    from (
      select unnest(coalesce(p_prayer_ids, array[]::text[])) as prayer_id
      limit 200
    ) input
    where nullif(input.prayer_id, '') is not null
  ), visible_prayers as (
    select
      prayer.id,
      prayer.requested_by,
      prayer.requested_by = p_viewer_id as viewer_is_owner,
      'couple:' || least(prayer.requested_by::text, p_viewer_id::text)
        || ':' || greatest(prayer.requested_by::text, p_viewer_id::text) as participant_scope
    from input_prayers input
    join public.prayer_requests prayer on prayer.id = input.prayer_id
    left join public.user_profiles viewer_profile on viewer_profile.id = p_viewer_id
    left join public.user_profiles owner_profile on owner_profile.id = prayer.requested_by
    where prayer.requested_by = p_viewer_id
      or (
        viewer_profile.partner_id = prayer.requested_by
        and owner_profile.partner_id = p_viewer_id
        and prayer.is_shared_with_partner
        and (
          not prayer.is_surprise
          or prayer.unlock_at is null
          or prayer.unlock_at <= now()
        )
      )
  ), ranked_comments as (
    select
      prayer.id as prayer_id,
      comment.payload,
      row_number() over (
        partition by prayer.id
        order by comment.created_at desc, comment.source_key desc
      ) as position
    from visible_prayers prayer
    join public.app_prayer_chats comment
      on comment.record_type = 'prayer-comment'
      and comment.payload->>'kind' = 'prayer_request_comment'
      and comment.payload->>'prayerOwnerId' = prayer.requested_by::text
      and comment.payload->>'prayerId' = prayer.id
    where prayer.viewer_is_owner
      or (
        comment.payload->>'participantScope' = prayer.participant_scope
        and comment.payload->>'authorId' in (prayer.requested_by::text, p_viewer_id::text)
      )
  )
  select
    comment.prayer_id,
    jsonb_build_object(
      'id', comment.payload->>'id',
      'prayerId', comment.prayer_id,
      'userId', comment.payload->>'authorId',
      'userName', comment.payload->>'authorName',
      'content', comment.payload->>'message',
      'createdAt', comment.payload->>'createdAt',
      'isMine', comment.payload->>'authorId' = p_viewer_id::text
    ) as latest_comment
  from ranked_comments comment
  where comment.position = 1;
$$;

revoke all on function public.get_prayer_comment_previews(uuid, text[]) from public, anon, authenticated;
grant execute on function public.get_prayer_comment_previews(uuid, text[]) to service_role;

analyze public.app_prayer_chats;
