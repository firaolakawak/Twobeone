import { describe, expect, it } from 'vitest';

const catalogs = import.meta.glob('../../locales/*.ts', { eager: true }) as Record<string, Record<string, unknown>>;
const placeholders = (value: string) => [...new Set([...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort();

describe('localized UI catalogs', () => {
  it('provides both translations and preserves interpolation values in every message', () => {
    const failures: string[] = [];
    let checked = 0;
    for (const [file, exports] of Object.entries(catalogs)) {
      for (const catalog of Object.values(exports)) {
        if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) continue;
        for (const [source, pair] of Object.entries(catalog)) {
          if (!Array.isArray(pair)) continue;
          checked++;
          if (pair.length !== 2 || pair.some(text => typeof text !== 'string' || !text.trim())) {
            failures.push(`${file}: ${source}: missing Amharic or Oromo translation`);
            continue;
          }
          pair.forEach((text, index) => {
            if (JSON.stringify(placeholders(text)) !== JSON.stringify(placeholders(source))) {
              failures.push(`${file}: ${source}: ${index === 0 ? 'am' : 'om'} placeholders differ`);
            }
          });
        }
      }
    }
    expect(checked).toBeGreaterThan(400);
    expect(failures).toEqual([]);
  });
});
