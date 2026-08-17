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

  it('shows one compact iOS guide and allows dismissal', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 932 });
    // Old prompt flags must not suppress the consolidated installer.
    localStorage.setItem('ios-install-prompt-seen', 'true');

    render(<PWAInstallPrompt />);
    await act(async () => vi.advanceTimersByTime(500));

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByTestId('ios-install-steps')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows install instructions on Android even without a native install event', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36',
    });

    render(<PWAInstallPrompt />);
    await act(async () => vi.advanceTimersByTime(500));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('android-install-steps')).toBeInTheDocument();
    expect(screen.getByText('Install TwoBeOne')).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: /Install App/i }));
    expect(installEvent.prompt).toHaveBeenCalledOnce();
  });

  it('does not show an install banner after the app has been installed', async () => {
    vi.useFakeTimers();
    localStorage.setItem('twobeone_app_installed', 'true');
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    });

    render(<PWAInstallPrompt />);
    await act(async () => vi.advanceTimersByTime(1000));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
