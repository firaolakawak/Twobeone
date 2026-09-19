import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('prayer request comment server', () => {
  const server = readFileSync(join(process.cwd(), 'supabase/functions/server/index.tsx'), 'utf8');
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260919090000_prayer_request_comments.sql'),
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
});

