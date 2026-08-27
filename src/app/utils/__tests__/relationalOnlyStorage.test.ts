import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('relational-only storage cutover', () => {
  const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
  const adapter = read('supabase/functions/server/kv_store.tsx');
  const server = read('supabase/functions/server/index.tsx');
  const recovery = read('supabase/functions/server/recovery_routes.tsx');
  const writers = read('supabase/migrations/20260827224500_relational_only_writers.sql');
  const retirement = read('supabase/migrations/20260827230000_retire_kv_store.sql');
  const verification = read('supabase/migrations/20260827231500_verify_relational_only_crud.sql');
  const classification = read('supabase/migrations/20260827233000_classify_future_record_families.sql');

  it('contains no runtime access to the retired KV table', () => {
    expect(adapter).not.toContain('kv_store_6d579fee');
    expect(server).not.toContain('kv_store_6d579fee');
    expect(recovery).not.toContain('kv_store_6d579fee');
  });

  it('routes atomic writers to designated partitions with service-only access', () => {
    expect(writers).toContain('function public.upsert_designated_record');
    expect(writers).toContain('function public.claim_designated_record');
    expect(writers).toContain("'rate_limits', p_key");
    expect(writers).toContain("'ai_cache', p_key");
    expect(writers).toContain('grant execute on function public.upsert_designated_record');
    expect(writers).toContain('to service_role');
  });

  it('blocks retirement unless all records are preserved', () => {
    expect(retirement).toContain('uncovered_count > 0 or unclassified_count > 0');
    expect(retirement).toContain('drop table public.kv_store_6d579fee restrict');
    expect(retirement).not.toContain('drop table public.kv_store_6d579fee cascade');
    expect(retirement).toContain('create or replace view public.designated_storage_health');
  });

  it('verifies create, read, update, and delete after retirement', () => {
    expect(verification).toContain("'{\"stage\":\"created\"}'::jsonb");
    expect(verification).toContain("'{\"stage\":\"updated\"}'::jsonb");
    expect(verification).toContain('perform public.delete_designated_record(probe_key)');
    expect(verification).toContain("to_regclass('public.kv_store_6d579fee') is not null");
  });

  it('classifies dormant families and rejects unknown record storage', () => {
    for (const family of ['response', 'devotional-progress', 'compatibility-overall', 'admin']) {
      expect(classification).toContain(`when '${family}' then`);
    }
    expect(classification).toContain("when p_key like 'webrtc_%'");
    expect(classification).toContain('app_unclassified_must_remain_empty check (false)');
  });
});
