import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from '../pwa';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('service worker registration', () => {
  it('does not install the offline worker during Vite development', async () => {
    vi.stubEnv('DEV', true);
    const register = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { register } });

    expect(await registerServiceWorker()).toBeNull();
    expect(register).not.toHaveBeenCalled();
  });

  it('still registers and updates the worker in production', async () => {
    vi.stubEnv('DEV', false);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const registration = {
      scope: 'https://www.twobeone.app/',
      waiting: { postMessage: vi.fn() },
      addEventListener: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const register = vi.fn().mockResolvedValue(registration);
    vi.stubGlobal('navigator', { serviceWorker: { register } });

    expect(await registerServiceWorker()).toBe(registration);
    expect(register).toHaveBeenCalledWith('/service-worker.js', { scope: '/' });
    expect(registration.waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(registration.update).toHaveBeenCalledOnce();
  });
});
