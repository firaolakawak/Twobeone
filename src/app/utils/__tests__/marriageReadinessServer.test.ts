import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('marriage readiness prayer synchronization', () => {
  const source = readFileSync(
    join(process.cwd(), 'supabase/functions/server/index.tsx'),
    'utf8',
  );
  const routeStart = source.indexOf("app.get('/make-server-6d579fee/ai/marriage-readiness'");
  const routeEnd = source.indexOf('// ── Overall (General) Compatibility', routeStart);
  const readinessRoute = source.slice(routeStart, routeEnd);

  it('counts answered prayers from current and legacy record shapes', () => {
    expect(routeStart).toBeGreaterThan(-1);
    expect(readinessRoute).toContain('p?.isAnswered');
    expect(readinessRoute).toContain('p?.is_answered');
    expect(readinessRoute).toContain('p?.answered');
  });

  it('invalidates the shared readiness cache after prayer mutations', () => {
    const prayerRoutesStart = source.indexOf("app.post('/make-server-6d579fee/prayer'");
    const prayerRoutesEnd = source.indexOf('// MOODS', prayerRoutesStart);
    const prayerRoutes = source.slice(prayerRoutesStart, prayerRoutesEnd);

    expect(prayerRoutes.match(/await invalidateMarriageReadiness\(userId\)/g)).toHaveLength(3);
    expect(source).toContain("const MARRIAGE_READINESS_CACHE_VERSION = 'v2'");
  });
});
