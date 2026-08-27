import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('remaining KV domain migration', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260827223000_migrate_remaining_kv_domains.sql'),
    'utf8',
  );
  const kvSource = readFileSync(
    join(process.cwd(), 'supabase/functions/server/kv_store.tsx'),
    'utf8',
  );
  const serverSource = readFileSync(
    join(process.cwd(), 'supabase/functions/server/index.tsx'),
    'utf8',
  );

  it('creates a physical partition for every requested domain', () => {
    for (const table of [
      'app_questions', 'app_question_responses', 'app_notifications',
      'app_devotionals', 'app_highlights', 'app_couple_chats',
      'app_prayer_chats', 'app_invitations', 'app_community',
      'app_newsletter_state', 'app_calendar', 'app_progress',
      'app_ai_cache', 'app_audit_logs', 'app_rate_limits',
      'app_deduplication', 'app_realtime_state',
    ]) {
      expect(migration).toContain(`public.${table} partition of public.app_records`);
    }
  });

  it('mirrors direct KV writes and deletes at the database boundary', () => {
    expect(migration).toContain('create or replace function public.mirror_kv_to_designated_table');
    expect(migration).toContain('after insert or update or delete on public.kv_store_6d579fee');
    expect(migration).toContain('delete from public.app_records where source_key = old.key');
    expect(migration).toContain('on conflict (domain, source_key) do update');
  });

  it('blocks deployment unless every classified payload is identical', () => {
    expect(migration).toContain('create or replace view public.remaining_kv_migration_parity');
    expect(migration).toContain('target.payload is distinct from kv.value');
    expect(migration).toContain('or unclassified_count > 0');
    expect(migration).toContain("raise exception 'Remaining KV migration blocked");
  });

  it('uses designated relational reads without KV fallback', () => {
    expect(kvSource).toContain('async function getDesignatedPayload(key: string)');
    expect(kvSource).toContain(".from('app_records')");
    expect(kvSource).toContain('if (designated.handled) return designated.value');
    expect(kvSource).not.toContain('.from("kv_store_6d579fee")');
    expect(serverSource).toContain("designatedReads: 'relational-only'");
    expect(serverSource).toContain('kvFallbackReads: false');
  });
});
