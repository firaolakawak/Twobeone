import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DistanceConnector } from '../DistanceConnector';

describe('embedded distance connector', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps each location with its profile and shows the distance in kilometers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        userLocation: { userId: 'one', locationType: 'manual', location: { latitude: 24.4539, longitude: 54.3773, city: 'Abu Dhabi' } },
        partnerLocation: { userId: 'two', locationType: 'manual', location: { latitude: 9.03, longitude: 38.74, city: 'Addis Ababa' } },
      }),
    }));

    render(
      <DistanceConnector
        embedded
        userId="one"
        userName="Partner One"
        userAvatar="one.jpg"
        partnerId="two"
        partnerName="Partner Two"
        partnerAvatar="two.jpg"
        accessToken="token"
      />,
    );

    expect(await screen.findByText('Abu Dhabi')).toBeInTheDocument();
    expect(await screen.findByText('Addis Ababa')).toBeInTheDocument();
    expect(await screen.findByText(/km$/i)).toBeInTheDocument();
    expect(screen.getByText('Partner One')).toBeInTheDocument();
    expect(screen.getByText('Partner Two')).toBeInTheDocument();
    expect(screen.getByTestId('love-flow')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Location settings' })).toBeInTheDocument();
  });
});
