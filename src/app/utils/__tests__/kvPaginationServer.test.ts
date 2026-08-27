import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('KV list query bounds', () => {
  const kvSource = readFileSync(
    join(process.cwd(), 'supabase/functions/server/kv_store.tsx'),
    'utf8',
  );
  const serverSource = readFileSync(
    join(process.cwd(), 'supabase/functions/server/index.tsx'),
    'utf8',
  );
  const calendarSource = readFileSync(
    join(process.cwd(), 'supabase/functions/server/calendar_routes.tsx'),
    'utf8',
  );

  it('hard-limits legacy scans and supports timestamp cursor pages', () => {
    expect(kvSource).toContain('const MAX_PREFIX_RESULTS = 1000');
    expect(kvSource).toContain('export const getByPrefixPage');
    expect(kvSource).toContain('.limit(limit + 1)');
    expect(kvSource).toContain('query.lt(selector, options.before)');
    expect(kvSource).toContain('query.gt(selector, options.after)');
    expect(kvSource).toContain('.range(values.length, values.length + requested - 1)');
  });

  it('pages complete scheduled scans instead of issuing one unbounded query', () => {
    expect(kvSource).toContain('export const getAllByPrefix');
    expect(kvSource).toContain('.gt("key", afterKey)');
    expect(calendarSource).toContain("kv.getAllByPrefix('calendar:', 10_000, 500)");
  });

  it('applies API limits and date windows before loading history', () => {
    expect(serverSource).toContain("c.req.query('days') || '30'");
    expect(serverSource).toContain("c.req.query('unread') === 'true'");
    expect(serverSource).toContain("kv.getByPrefixPage(`journal:${userId}:`");
    expect(serverSource).toContain("kv.getByPrefixPage(`prayer:${userId}:`");
    expect(serverSource).toContain("kv.getByPrefixPage(`couple-chat:${channelId}:`");
    expect(calendarSource).toContain("timestampField: 'startsAt'");
  });
});
