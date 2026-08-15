import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PWAInstallPrompt } from '../PWAInstallPrompt';

describe('PWAInstallPrompt', () => {
  const originalUserAgent = navigator.userAgent;
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUserAgent });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
  });

  it('shows one compact iOS guide and remembers dismissal', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 932 });
    // Old prompt flags must not suppress the consolidated installer.
    localStorage.setItem('ios-install-prompt-seen', 'true');

    render(<PWAInstallPrompt />);
    await act(async () => vi.advanceTimersByTime(4000));

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByTestId('ios-install-steps')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss install prompt' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem('twobeone-install-dismissed-at-v2')).toBeTruthy();
  });

  it('does not open automatically on a large screen but can be opened from settings', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    const user = userEvent.setup();
    render(<PWAInstallPrompt />);

    const installEvent = Object.assign(new Event('beforeinstallprompt'), {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });
    window.dispatchEvent(installEvent);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await act(async () => window.dispatchEvent(new Event('twobeone:open-install')));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Install TwoBeOne/i }));
    expect(installEvent.prompt).toHaveBeenCalledOnce();
  });
});
