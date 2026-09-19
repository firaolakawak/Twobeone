import { describe, expect, it } from 'vitest';
import { getHalfTextPreview } from '../contentPreview';

describe('getHalfTextPreview', () => {
  it('shows approximately half the content and marks it as collapsed', () => {
    const content = 'Please keep trusting God through every step of this prayer request.';
    const preview = getHalfTextPreview(content);

    expect(preview).toMatch(/…$/u);
    expect(Array.from(preview).length).toBeGreaterThanOrEqual(Math.ceil(Array.from(content).length * 0.4));
    expect(Array.from(preview).length).toBeLessThanOrEqual(Math.ceil(Array.from(content).length * 0.6));
    expect(content.startsWith(preview.slice(0, -1))).toBe(true);
  });

  it('does not split joined emoji or combining marks at the midpoint', () => {
    expect(getHalfTextPreview('🙏🏽A')).toBe('🙏🏽…');
    expect(getHalfTextPreview('👨‍👩‍👧‍👦A')).toBe('👨‍👩‍👧‍👦…');
    expect(getHalfTextPreview('e\u0301A')).toBe('e\u0301…');
  });

  it('leaves a single-character value unchanged', () => {
    expect(getHalfTextPreview('A')).toBe('A');
  });
});
