import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PWA deployment configuration', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  const vercelConfig = JSON.parse(
    readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'),
  );

  it('loads the manifest from the public production domain', () => {
    expect(html).toContain('href="https://www.twobeone.app/manifest.json"');
    expect(html).toContain('crossorigin="anonymous"');
  });

  it('allows protected preview origins to fetch the public manifest', () => {
    const manifestRule = vercelConfig.headers.find(
      (rule: { source: string }) => rule.source === '/manifest.json',
    );
    expect(manifestRule?.headers).toContainEqual({
      key: 'Access-Control-Allow-Origin',
      value: '*',
    });
    expect(manifestRule?.headers).toContainEqual({
      key: 'Content-Type',
      value: 'application/manifest+json',
    });
  });
});
