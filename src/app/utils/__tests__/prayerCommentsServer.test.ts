import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('prayer request comment server', () => {
  const server = readFileSync(join(process.cwd(), 'supabase/functions/server/index.tsx'), 'utf8');
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260919090000_prayer_request_comments.sql'),
    'utf8',
  );
  const previewMigration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260919100000_prayer_comment_previews.sql'),
    'utf8',
  );

  it('exposes authenticated list and create routes in a classified storage namespace', () => {
    expect(server).toContain("app.get('/make-server-6d579fee/prayer/:id/comments'");
    expect(server).toContain("app.post('/make-server-6d579fee/prayer/:id/comments'");
    expect(server).toContain("return `prayer-comment:${ownerId}:${prayerId}:`");
    expect(server).toContain("kind: PRAYER_COMMENT_KIND");
    expect(migration).toContain("when 'prayer-comment' then 'prayer_chats'");
  });

  it('only grants a reciprocal partner access to shared, unlocked prayers', () => {
    expect(server).toContain("String(ownerProfile?.partnerId || '') !== userId");
    expect(server).toContain('!prayerSharedWithPartner(partnerPrayer)');
    expect(server).toContain('prayerLockedForPartner(partnerPrayer)');
    expect(server).toContain("return c.json({ error: 'Prayer not found' }, 404)");
    expect(server).toContain('comment?.participantScope === access.participantScope');
  });

  it('derives identity on the server, validates content, pages reads, and purges on delete', () => {
    expect(server).toContain("typeof body?.message === 'string' ? body.message.trim() : ''");
    expect(server).toContain('if (message.length > 2000)');
    expect(server).toContain("checkRateLimit(`prayer-comment:${userId}`, 30, 60_000)");
    expect(server).toContain('authorId: userId');
    expect(server).toContain('authorName,');
    expect(server).toContain('kv.getByPrefixPage(prayerCommentPrefix(access.ownerId, prayerId)');
    expect(server).toContain('await deletePrayerComments(userId, prayerId)');
  });

  it('loads one optional latest-comment preview batch for the visible prayer page', () => {
    expect(server).toContain("getSupabase().rpc('get_prayer_comment_previews'");
    expect(server).toContain('p_viewer_id: userId');
    expect(server).toContain('p_prayer_ids: prayerIds');
    expect(server).toContain('latestComment: latestComment || null');
    expect(server).toContain('if (!commentPreviewLookupSucceeded) return prayer');
    expect(server).toContain("console.warn('[GET /prayer] Comment previews unavailable:'");
    expect(previewMigration).toContain('returns table (');
    expect(previewMigration).toContain('latest_comment jsonb');
    expect(previewMigration).toContain('where comment.position = 1');
  });

  it('rechecks partner access and comment scope inside the service-only preview RPC', () => {
    expect(previewMigration).toContain('viewer_profile.partner_id = prayer.requested_by');
    expect(previewMigration).toContain('owner_profile.partner_id = p_viewer_id');
    expect(previewMigration).toContain('and prayer.is_shared_with_partner');
    expect(previewMigration).toContain('or prayer.unlock_at <= now()');
    expect(previewMigration).toContain("comment.payload->>'participantScope' = prayer.participant_scope");
    expect(previewMigration).toContain("comment.payload->>'authorId' in (prayer.requested_by::text, p_viewer_id::text)");
    expect(previewMigration).toContain('revoke all on function public.get_prayer_comment_previews(uuid, text[]) from public, anon, authenticated');
    expect(previewMigration).toContain('grant execute on function public.get_prayer_comment_previews(uuid, text[]) to service_role');
  });

  it('indexes the owner and prayer fields used by the batched preview lookup', () => {
    expect(previewMigration).toContain('idx_prayer_comments_owner_prayer_created');
    expect(previewMigration).toContain("(payload->>'prayerOwnerId')");
    expect(previewMigration).toContain("(payload->>'prayerId')");
    expect(previewMigration).toContain('created_at desc');
    expect(previewMigration).toContain("payload->>'kind' = 'prayer_request_comment'");
  });
});
