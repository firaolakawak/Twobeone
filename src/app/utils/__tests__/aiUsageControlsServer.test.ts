import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AI usage controls', () => {
  const serverSource = readFileSync(
    join(process.cwd(), 'supabase/functions/server/index.tsx'),
    'utf8',
  );
  const calendarSource = readFileSync(
    join(process.cwd(), 'supabase/functions/server/calendar_routes.tsx'),
    'utf8',
  );
  const migrationSource = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260827190000_retain_recent_operational_events.sql'),
    'utf8',
  );
  const leaseMigrationSource = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260827200000_ai_generation_leases.sql'),
    'utf8',
  );
  const assistantSource = readFileSync(
    join(process.cwd(), 'src/app/components/AIAssistant.tsx'),
    'utf8',
  );
  const apiSource = readFileSync(
    join(process.cwd(), 'src/app/utils/api.ts'),
    'utf8',
  );

  it('bounds Gemini fan-out, prompts, outputs, and request duration', () => {
    expect(serverSource).toContain('const MAX_GEMINI_PROMPT_CHARS = 24_000');
    expect(serverSource).toContain('const attempts = modelIndex === 0 ? 2 : 1');
    expect(serverSource).toContain('signal: AbortSignal.timeout(20_000)');
    expect(serverSource).toContain("'gemini-3.1-flash-lite'");
    expect(serverSource).toContain("'gemini-3.5-flash-lite'");
    expect(serverSource).not.toContain("'gemini-2.5-flash-lite'");
    expect(serverSource.match(/\.slice\(0, 18_000\)/g)).toHaveLength(3);
    expect(serverSource).toContain('maxOutputTokens: options.maxOutputTokens');
  });

  it('enforces per-user AI quotas through an atomic database function', () => {
    expect(serverSource).toContain("getSupabase().rpc('consume_rate_limit'");
    expect(serverSource).toContain('`ai:assistant:${userId}`, 10, 3_600_000');
    expect(serverSource).toContain('`ai:question-compatibility:${userId}`, 20, 3_600_000');
    expect(serverSource).toContain('`ai:marriage-readiness:${userId}`, 4, 3_600_000');
    expect(serverSource).toContain('`ai:overall-compatibility:${userId}`, 4, 3_600_000');
    expect(serverSource).toContain('`ai:mood-test:${userId}`, 3, 3_600_000');
    expect(calendarSource).toContain('`ratelimit:ai:calendar-prayer:${userId}:${windowNumber}`');
    expect(calendarSource).toContain('p_max_requests: 12');
    expect(migrationSource).toContain('create or replace function public.consume_rate_limit');
    expect(migrationSource).toContain('on conflict (key) do update');
    expect(migrationSource).toContain('p_max_requests');
  });

  it('records token usage and limits client request duplication', () => {
    expect(serverSource).toContain("console.log('[Gemini Usage]'");
    expect(calendarSource).toContain("console.log('[Gemini Usage]'");
    expect(assistantSource).toContain("feature === 'verse'");
    expect(assistantSource).toContain('questions.slice(0, 5)');
    expect(apiSource).toContain('Generation requests must not be replayed automatically.');
    expect(serverSource).toContain("rpc('acquire_generation_lease'");
    expect(serverSource).toContain("rpc('release_generation_lease'");
    expect(serverSource).toContain("code = 'AI_GENERATION_IN_PROGRESS'");
    expect(leaseMigrationSource).toContain('create or replace function public.acquire_generation_lease');
    expect(leaseMigrationSource).toContain('create or replace function public.release_generation_lease');
    expect(leaseMigrationSource).toContain("key like 'ai-lease:%'");
  });

  it('retains only recent operational events', () => {
    expect(migrationSource).toContain("interval '45 days'");
    expect(migrationSource).toContain("key like 'engagement:%'");
    expect(migrationSource).toContain("key like 'ratelimit:%'");
    expect(migrationSource).toContain("'twobeone-operational-event-retention'");
  });
});
