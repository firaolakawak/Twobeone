import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DistanceConnector } from '../DistanceConnector';
import { RelationshipSummary } from '../RelationshipJourney';
import type { MouseEventHandler } from 'react';
import { LanguageProvider } from '../../contexts/LanguageContext';

describe('embedded distance connector', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('pairs first names in the main heading and keeps live distance without city or country labels', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        userLocation: { userId: 'one', locationType: 'manual', location: { latitude: 24.4539, longitude: 54.3773, city: 'Abu Dhabi', country: 'United Arab Emirates' } },
        partnerLocation: { userId: 'two', locationType: 'manual', location: { latitude: 9.03, longitude: 38.74, city: 'Addis Ababa', country: 'Ethiopia' } },
      }),
    }));

    render(
      <LanguageProvider>
        <DistanceConnector
          embedded
          userId="one"
          userName="Firaol Akawak"
          userAvatar="one.jpg"
          partnerId="two"
          partnerName="Keti Abira"
          partnerAvatar="two.jpg"
          accessToken="token"
          userOnline
          partnerOnline
        />
      </LanguageProvider>,
    );

    expect(await screen.findByText(/km$/i)).toBeInTheDocument();
    expect(screen.queryByText('Abu Dhabi')).not.toBeInTheDocument();
    expect(screen.queryByText('Addis Ababa')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^Firaol & Keti$/);
    expect(screen.queryByText('Firaol Akawak')).not.toBeInTheDocument();
    expect(screen.queryByText('Keti Abira')).not.toBeInTheDocument();
    expect(screen.queryByText(/\(UAE\)|\(ETH\)/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Keti Abira: online')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Location settings' })).toBeInTheDocument();
  });

  it('passes the live distance to the relationship summary and keeps mood beside the partner name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        userLocation: { userId: 'one', locationType: 'manual', location: { latitude: 0, longitude: 0, city: 'First city' } },
        partnerLocation: { userId: 'two', locationType: 'manual', location: { latitude: 0, longitude: 1, city: 'Second city' } },
      }),
    }));
    const summary = vi.fn((distance: number | null) => (
      <p>{distance === null ? 'Distance pending' : `${distance} km apart`}</p>
    ));

    render(
      <LanguageProvider>
        <DistanceConnector
          embedded
          userId="one"
          userName="Firaol"
          partnerId="two"
          partnerName="Keti"
          accessToken="token"
          userOnline
          partnerOnline={false}
          summaryContent={summary}
          partnerMood={<span role="img" aria-label="Keti: Good today">😊</span>}
        />
      </LanguageProvider>,
    );

    expect(await screen.findByText('111.2 km apart')).toBeInTheDocument();
    expect(summary).toHaveBeenLastCalledWith(111.2, expect.any(Function));
    expect(screen.queryByText('111 km')).not.toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/^Firaol & Keti/);
    expect(within(heading).getByRole('img', { name: 'Keti: Good today' })).toBeInTheDocument();
    expect(within(heading).queryByRole('img', { name: /^Firaol:/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Keti: offline')).toBeInTheDocument();
  });

  it('omits countries and mood when unset and keeps location setup available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ userLocation: null, partnerLocation: null }),
    }));
    const startDate = new Date(Date.now() - 102 * 86_400_000).toISOString();
    const summary = vi.fn((distanceKm: number | null, onLocationClick: MouseEventHandler<HTMLButtonElement>) => (
      <RelationshipSummary startDate={startDate} distanceKm={distanceKm} onLocationClick={onLocationClick} />
    ));

    render(
      <LanguageProvider>
        <DistanceConnector
          embedded
          userId="one"
          userName="Firaol"
          partnerId="two"
          partnerName="Keti"
          accessToken="token"
          userOnline
          partnerOnline
          summaryContent={summary}
        />
      </LanguageProvider>,
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(summary).toHaveBeenLastCalledWith(null, expect.any(Function));
    expect(document.querySelector('[data-relationship-counter]')).toHaveTextContent('102 Days Together');
    expect(screen.queryByText(/\(UAE\)|\(ETH\)/)).not.toBeInTheDocument();
    expect(within(screen.getByRole('heading', { name: 'Firaol & Keti', level: 2 })).queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/km apart/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share.*location/i })).toBeInTheDocument();

    const settingsButton = screen.getByRole('button', { name: /Location settings:.*share.*location/i });
    fireEvent.click(settingsButton);
    expect(await screen.findByRole('dialog', { name: 'Location Settings' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Abu Dhabi, UAE')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(settingsButton).toHaveFocus());
  });

  it('trims surrounding whitespace and handles a single-name partner', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        userLocation: { userId: 'one', locationType: 'manual', location: { latitude: 24, longitude: 54, city: 'Abu Dhabi', country: ' AE ' } },
        partnerLocation: { userId: 'two', locationType: 'manual', location: { latitude: 51, longitude: -0.1, city: 'London', country: 'United Kingdom' } },
      }),
    }));

    render(
      <LanguageProvider>
        <DistanceConnector embedded userId="one" userName="  Firaol   Akawak  " partnerId="two" partnerName="Keti" accessToken="token" userOnline partnerOnline />
      </LanguageProvider>,
    );

    expect(await screen.findByText(/km$/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Firaol & Keti', level: 2 })).toBeInTheDocument();
    expect(screen.queryByText('(UAE)')).not.toBeInTheDocument();
    expect(screen.queryByText('(United Kingdom)')).not.toBeInTheDocument();
  });

  it('updates avatar presence dots in place when online status changes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ userLocation: null, partnerLocation: null }),
    }));
    const connector = (userOnline: boolean, partnerOnline: boolean) => (
      <LanguageProvider>
        <DistanceConnector
          embedded
          userId="one"
          userName="Firaol"
          partnerId="two"
          partnerName="Keti"
          accessToken="token"
          userOnline={userOnline}
          partnerOnline={partnerOnline}
        />
      </LanguageProvider>
    );
    const { container, rerender } = render(connector(true, false));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const avatars = container.querySelector<HTMLElement>('[data-couple-avatars]');
    expect(avatars).toBeInTheDocument();
    const userPresence = within(avatars!).getByRole('img', { name: 'Firaol: online' });
    const partnerPresence = within(avatars!).getByRole('img', { name: 'Keti: offline' });

    expect(userPresence).toHaveAttribute('data-online', 'true');
    expect(partnerPresence).toHaveAttribute('data-online', 'false');
    expect(avatars!.querySelector('svg')).toBeNull();

    rerender(connector(false, true));

    expect(within(avatars!).getByRole('img', { name: 'Firaol: offline' })).toBe(userPresence);
    expect(within(avatars!).getByRole('img', { name: 'Keti: online' })).toBe(partnerPresence);
    expect(userPresence).toHaveAttribute('data-online', 'false');
    expect(partnerPresence).toHaveAttribute('data-online', 'true');
    expect(avatars!.querySelector('svg')).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
