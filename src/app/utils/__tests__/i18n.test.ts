import { describe, expect, it } from 'vitest';
import { translations } from '../i18n';

function leafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix];
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function leafValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(leafValues);
}

describe('three-language UI catalog', () => {
  it('keeps English, Amharic, and Afaan Oromo complete and structurally aligned', () => {
    const expected = leafPaths(translations.en).sort();

    for (const language of ['am', 'om'] as const) {
      expect(leafPaths(translations[language]).sort()).toEqual(expected);
      expect(leafValues(translations[language]).every((value) => value.trim().length > 0)).toBe(true);
    }
  });
});
