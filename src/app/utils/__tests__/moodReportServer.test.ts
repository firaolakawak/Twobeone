import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('weekly mood report server wiring', () => {
  const source = readFileSync(
    join(process.cwd(), 'supabase/functions/server/index.tsx'),
    'utf8',
  );
  const routeStart = source.indexOf("app.post('/make-server-6d579fee/moods/weekly-report'");
  const routeEnd = source.indexOf('// ============================================\n// NOTIFICATIONS', routeStart);
  const weeklyRoute = source.slice(routeStart, routeEnd);

  it('initializes engagement data before using it in every language report', () => {
    const declaration = weeklyRoute.indexOf('const engagementSummary = await getEngagementSummary');
    const firstUse = weeklyRoute.indexOf('engagementPromptContext(engagementSummary)');

    expect(routeStart).toBeGreaterThan(-1);
    expect(declaration).toBeGreaterThan(-1);
    expect(firstUse).toBeGreaterThan(declaration);
  });

  it('uses the explicitly requested English, Amharic, or Afaan Oromo language', () => {
    expect(weeklyRoute).toContain("requestBody?.language === 'am'");
    expect(weeklyRoute).toContain("requestBody?.language === 'om'");
    expect(weeklyRoute).toContain('const userLanguage = requestedUserLanguage');
  });
});
