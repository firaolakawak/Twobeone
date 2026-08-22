import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('private and surprise sharing enforcement', () => {
  const prayerServer = readFileSync(join(process.cwd(), 'supabase/functions/server/index.tsx'), 'utf8');
  const calendarServer = readFileSync(join(process.cwd(), 'supabase/functions/server/calendar_routes.tsx'), 'utf8');

  it('omits private partner prayers and redacts locked surprises', () => {
    expect(prayerServer).toContain('.filter((prayer: any) => prayerSharedWithPartner(prayer))');
    expect(prayerServer).toContain("title: 'Surprise'");
    expect(prayerServer).toContain('isLockedForPartner: true');
    expect(prayerServer).toContain("Only the creator can delete this prayer");
  });

  it('omits private calendar items and protects linked prayers and reminders', () => {
    expect(calendarServer).toContain('.filter(sharedWithPartner)');
    expect(calendarServer).toContain('calendarItemForPartner(item, now)');
    expect(calendarServer).toContain('isSharedWithPartner, isSurprise, unlockAt');
    expect(calendarServer).toContain('sharedWithPartner(item) && !lockedForPartner(item, now)');
  });
});
