import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('private partner chat server', () => {
  const source = readFileSync(join(process.cwd(), 'supabase/functions/server/index.tsx'), 'utf8');

  it('uses one deterministic channel and verifies the active partner connection', () => {
    expect(source).toContain("return [userId, partnerId].sort().join(':')");
    expect(source).toContain("String(partnerProfile.partnerId || '') !== userId");
    expect(source).toContain('message?.channelId === channelId');
  });

  it('supports messages, read receipts, limits, notifications, and push', () => {
    expect(source).toContain("app.get('/make-server-6d579fee/chat/messages'");
    expect(source).toContain("app.post('/make-server-6d579fee/chat/messages'");
    expect(source).toContain("app.post('/make-server-6d579fee/chat/read'");
    expect(source).toContain('if (text.length > 2000)');
    expect(source).toContain("type: 'chat'");
    expect(source).toContain('sendPartnerChatPush');
  });
});
