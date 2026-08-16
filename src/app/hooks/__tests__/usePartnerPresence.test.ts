import { describe, expect, it } from 'vitest';
import { shouldNotifyPartnerOnline } from '../usePartnerPresence';

describe('partner presence transitions', () => {
  it('does not notify for the initial presence snapshot', () => {
    expect(shouldNotifyPartnerOnline(false, false, true)).toBe(false);
  });

  it('notifies when the partner transitions from offline to online', () => {
    expect(shouldNotifyPartnerOnline(true, false, true)).toBe(true);
  });

  it('does not notify again while the partner remains online', () => {
    expect(shouldNotifyPartnerOnline(true, true, true)).toBe(false);
  });

  it('does not notify when the partner goes offline', () => {
    expect(shouldNotifyPartnerOnline(true, true, false)).toBe(false);
  });
});
