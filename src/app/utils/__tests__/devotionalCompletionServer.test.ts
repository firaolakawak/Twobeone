import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('devotional completion totals', () => {
  const source = readFileSync(
    join(process.cwd(), 'supabase/functions/server/index.tsx'),
    'utf8',
  );

  it('returns completion totals for initial loads and new completions', () => {
    expect(source).toContain('const getDevotionalCompletionStats = (completions: any[])');
    expect(source).toContain('totalCompleted: completions.length');
    expect(source).toContain('uniqueDevotionals: new Set(');
    expect(source).toContain('completionDays: new Set(completionDates).size');
    expect(source).toContain('completedToday: completionDates.filter');
    expect(source).toContain('return c.json({ completions, stats: getDevotionalCompletionStats(completions) });');
  });

  it('keeps repeat completion requests idempotent while returning current totals', () => {
    expect(source).toContain('alreadyCompleted: true');
    expect(source).toContain('stats: getDevotionalCompletionStats(completions)');
  });
});
