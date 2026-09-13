import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { URL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const workerSource = readFileSync(resolve('src/app/public/service-worker.js'), 'utf8');
const origin = 'https://twobeone.example';

async function requestAsset(path: string, destination: string, contentType: string, body: string) {
  const request = { url: `${origin}${path}`, method: 'GET', mode: 'cors', destination };
  const networkResponse = new Response(body, { headers: { 'Content-Type': contentType } });
  const fetch = vi.fn().mockResolvedValue(networkResponse);
  const put = vi.fn().mockResolvedValue(undefined);
  const caches = {
    open: vi.fn().mockResolvedValue({ put }),
    match: vi.fn().mockResolvedValue(undefined),
  };
  const listeners = new Map<string, (event: unknown) => void>();
  runInNewContext(workerSource, {
    URL,
    Response,
    fetch,
    caches,
    self: {
      location: { origin },
      addEventListener: (name: string, listener: (event: unknown) => void) => listeners.set(name, listener),
    },
  });

  const respondWith = vi.fn();
  listeners.get('fetch')!({ request, respondWith });
  expect(respondWith).toHaveBeenCalledOnce();
  const response: Response = await respondWith.mock.calls[0][0];
  return { request, response, fetch, put };
}

describe('service worker code assets', () => {
  it.each([
    ['Vite CSS-module imports', '/src/app/components/OnboardingScreen.module.css', 'script', 'text/javascript'],
    ['stylesheets with query parameters', '/assets/app.css?v=2', 'style', 'text/css'],
    ['production JavaScript', '/assets/index-123.js', 'script', 'application/javascript'],
    ['CSS assets without a destination', '/assets/app.css?v=2', '', 'text/css'],
    ['JavaScript assets without a destination', '/assets/app.js?v=2', '', 'text/javascript'],
  ])('serves and caches %s with the correct MIME type', async (_name, path, destination, contentType) => {
    const body = contentType === 'text/css' ? 'body { color: blue; }' : 'export default {};';
    const { request, response, fetch, put } = await requestAsset(path, destination, contentType, body);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(body);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(put).toHaveBeenCalledOnce();
    expect(put.mock.calls[0][0]).toBe(request);
    expect(await put.mock.calls[0][1].text()).toBe(body);
  });

  it.each([
    ['/assets/obsolete.js', 'script'],
    ['/assets/obsolete.css?v=2', 'style'],
  ])('rejects an HTML fallback for %s without caching it', async (path, destination) => {
    const { response, put } = await requestAsset(path, destination, 'text/html', '<html>App shell</html>');

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Asset version is no longer available');
    expect(put).not.toHaveBeenCalled();
  });
});
