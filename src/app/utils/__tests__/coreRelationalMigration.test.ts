import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('core relational shadow migration', () => {
  const migrationSource = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260827210000_core_relational_shadow.sql'),
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
  const reconciliationSource = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260827211500_reconcile_auth_backed_core_orphans.sql'),
    'utf8',
  );
  const paritySource = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260827213000_core_cutover_parity_gate.sql'),
    'utf8',
  );

  it('preserves source identity and quarantines records that cannot be linked', () => {
    expect(migrationSource).toContain('create table if not exists public.kv_migration_quarantine');
    expect(migrationSource).toContain('create table if not exists public.kv_migration_runs');
    expect(migrationSource).toContain('add column if not exists source_key text unique');
    expect(migrationSource).toContain("add column if not exists kv_payload jsonb not null default '{}'::jsonb");
    expect(migrationSource).toContain("'No matching auth.users row'");
    expect(migrationSource).toContain("'Missing ID or valid author profile'");
  });

  it('normalizes couples, moods, and web push subscriptions', () => {
    expect(migrationSource).toContain('create table if not exists public.couple_members');
    expect(migrationSource).toContain('create table if not exists public.mood_entries');
    expect(migrationSource).toContain('create table if not exists public.web_push_subscriptions');
    expect(migrationSource).toContain('alter column id type text using id::text');
    expect(migrationSource).toContain('insert into public.couple_members');
  });

  it('removes anonymous access and installs owner-scoped RLS', () => {
    expect(migrationSource).toContain('revoke all on public.device_push_tokens from anon, authenticated');
    expect(migrationSource).toContain('revoke all on public.user_profiles, public.couples, public.couple_members');
    expect(migrationSource).toContain('create policy journal_select_owner_or_shared_partner');
    expect(migrationSource).toContain('create policy prayer_select_owner_or_shared_partner');
    expect(migrationSource).toContain('create policy web_push_owner_all');
  });

  it('mirrors core writes only after the KV write succeeds', () => {
    const kvUpsert = kvSource.indexOf('.from("kv_store_6d579fee").upsert');
    const mirrorCall = kvSource.indexOf('await mirrorCoreSet(key, value);');

    expect(kvUpsert).toBeGreaterThan(-1);
    expect(mirrorCall).toBeGreaterThan(kvUpsert);
    expect(kvSource).toContain("Deno.env.get('RELATIONAL_SHADOW_WRITES') === 'false'");
    expect(kvSource).toContain("console.warn(`[Relational Shadow] ${domain} write failed");
  });

  it('replays quarantined records only for identities verified by Auth', () => {
    expect(reconciliationSource).toContain('join auth.users auth_user');
    expect(reconciliationSource).toContain('join public.kv_migration_quarantine quarantine');
    expect(reconciliationSource).toContain('delete from public.kv_migration_quarantine quarantine');
    expect(reconciliationSource).toContain('where mood.source_key = quarantine.source_key');
  });

  it('blocks relational cutover when eligible source data is not identical', () => {
    expect(paritySource).toContain('create or replace view public.core_migration_parity');
    expect(paritySource).toContain('target.payload is distinct from source.payload');
    expect(paritySource).toContain('missing_count > 0 or stale_count > 0 or orphan_count > 0');
    expect(paritySource).toContain("raise exception 'Core relational cutover blocked: parity check failed'");
    expect(paritySource).toContain('revoke all on public.core_kv_source');
  });

  it('supports relational-primary reads with transparent KV fallback', () => {
    expect(kvSource).toContain("Deno.env.get('RELATIONAL_PRIMARY_READS') === 'true'");
    expect(kvSource).toContain('async function getCorePayload(key: string)');
    expect(kvSource).toContain('if (relational.handled) return relational.value');
    expect(kvSource).toContain('using KV');
    expect(kvSource).toContain(".select('kv_payload, created_at')");
    expect(serverSource).toContain("coreReads: Deno.env.get('RELATIONAL_PRIMARY_READS')");
    expect(serverSource).toContain("coreWrites: Deno.env.get('RELATIONAL_SHADOW_WRITES')");
  });
});
