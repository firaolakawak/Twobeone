import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { CoupleCalendar } from '../CoupleCalendar';

describe('CoupleCalendar', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates one synchronized calendar item with automatic prayer enabled', async () => {
    const item = {
      id: 'cal-1', userId: 'user-1', title: 'Marriage retreat', description: '', type: 'plan',
      category: 'faith', startsAt: '2026-08-20T18:00:00.000Z', allDay: false,
      recurrence: 'none', reminderMinutes: 60, status: 'upcoming', createPrayer: true,
      prayerId: 'prayer-1', prayerTitle: 'Prayer for Marriage retreat', prayerText: 'Lord, guide us.',
      scripture: 'Proverbs 3:5–6', createdAt: '2026-08-18T12:00:00.000Z', updatedAt: '2026-08-18T12:00:00.000Z',
    };
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return { ok: true, json: async () => ({ item, prayer: { id: 'prayer-1' } }) };
      }
      return { ok: true, json: async () => ({ items: [] }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const onPrayerChanged = vi.fn();
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <CoupleCalendar
          accessToken="token"
          userId="user-1"
          userName="Alex"
          partnerName="Sam"
          onBack={vi.fn()}
          onPrayerChanged={onPrayerChanged}
        />
      </LanguageProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Couple Calendar' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Create together' })[0]);
    await user.type(screen.getByLabelText('Title'), 'Marriage retreat');
    expect(screen.getByRole('switch', { name: 'Create a prayer automatically' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Add to our calendar' }));

    await waitFor(() => expect(onPrayerChanged).toHaveBeenCalledOnce());
    const createCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(createCall).toBeTruthy();
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      title: 'Marriage retreat',
      createPrayer: true,
      language: 'en',
    });
  });

  it('switches between weekly, monthly, and yearly marked-day views', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ items: [] }) })));
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <CoupleCalendar accessToken="token" userId="user-1" onBack={vi.fn()} />
      </LanguageProvider>,
    );

    expect(await screen.findByRole('button', { name: 'Weekly' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Monthly' }));
    expect(screen.getByText('Marked days')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yearly' }));
    expect(screen.getByRole('button', { name: 'January' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'December' })).toBeInTheDocument();
  });
});
