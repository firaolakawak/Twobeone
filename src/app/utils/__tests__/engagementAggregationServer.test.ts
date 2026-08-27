import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('engagement daily aggregation', () => {
  const serverSource = readFileSync(
    join(process.cwd(), 'supabase/functions/server/index.tsx'),
    'utf8',
  );
  const migrationSource = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260827214500_aggregate_engagement_events.sql'),
    'utf8',
  );
  const cleanupSource = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260827220000_finalize_engagement_aggregation.sql'),
    'utf8',
  );

  it('backfills raw events into daily category totals', () => {
    expect(migrationSource).toContain('create table if not exists public.engagement_daily');
    expect(migrationSource).toContain('create table if not exists public.engagement_event_receipts');
    expect(migrationSource).toContain("where key like 'engagement:%'");
    expect(migrationSource).toContain('sum(source.seconds)::bigint as total_seconds');
  });

  it('records new slices atomically and idempotently', () => {
    expect(migrationSource).toContain('create or replace function public.record_engagement_daily');
    expect(migrationSource).toContain('on conflict (event_key) do nothing');
    expect(migrationSource).toContain('if claimed_count = 0 then return false');
    expect(migrationSource).toContain('daily.total_seconds + excluded.total_seconds');
    expect(serverSource).toContain("rpc('record_engagement_daily'");
    expect(serverSource).not.toContain('claimIdempotencyKey(key, { userId, category, seconds, createdAt, eventId })');
  });

  it('builds summaries from bounded aggregate rows', () => {
    expect(serverSource).toContain(".from('engagement_daily')");
    expect(serverSource).toContain(".select('activity_date, category, total_seconds')");
    expect(serverSource).toContain(".gte('activity_date', monthStartDate)");
    expect(serverSource).not.toContain('kv.getByPrefixSince(`engagement:${id}:`');
  });

  it('deletes raw events only after a receipt-backed delta pass', () => {
    expect(cleanupSource).toContain('left join public.engagement_event_receipts receipt');
    expect(cleanupSource).toContain("raise exception 'Engagement cleanup blocked");
    expect(cleanupSource).toContain("delete from public.kv_store_6d579fee where key like 'engagement:%'");
    expect(cleanupSource).toContain('delete from public.engagement_event_receipts where expires_at < now()');
  });
});
