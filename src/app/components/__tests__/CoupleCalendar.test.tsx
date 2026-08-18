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
    await user.click(screen.getByRole('button', { name: 'Choose an event emoji: 🎉' }));
    expect(screen.getByRole('switch', { name: 'Create a prayer automatically' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Add to our calendar' }));

    await waitFor(() => expect(onPrayerChanged).toHaveBeenCalledOnce());
    const createCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(createCall).toBeTruthy();
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      title: 'Marriage retreat',
      emoji: '🎉',
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

  it('unifies milestones and recent journals with the calendar page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ items: [] }) })));
    const onOpenMilestones = vi.fn();
    const onOpenJournal = vi.fn();
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <CoupleCalendar
          accessToken="token"
          userId="user-1"
          onBack={vi.fn()}
          milestones={[{ id: 'milestone-1', title: 'Our engagement', date: '2026-08-18T12:00:00.000Z', icon: '💍' }]}
          journalEntries={[{ id: 'journal-1', title: 'A joyful day', content: 'We prayed and celebrated.', createdAt: '2026-08-18T13:00:00.000Z' }]}
          onOpenMilestones={onOpenMilestones}
          onOpenJournal={onOpenJournal}
        />
      </LanguageProvider>,
    );

    expect(await screen.findByText('Relationship Milestones')).toBeInTheDocument();
    expect(screen.getByText('Recent Journal Entries')).toBeInTheDocument();
    expect(screen.getAllByText('Our engagement').length).toBeGreaterThan(0);
    expect(screen.getAllByText('A joyful day').length).toBeGreaterThan(0);

    const viewAllButtons = screen.getAllByRole('button', { name: 'View all' });
    await user.click(viewAllButtons[0]);
    await user.click(viewAllButtons[1]);
    expect(onOpenMilestones).toHaveBeenCalledOnce();
    expect(onOpenJournal).toHaveBeenCalledOnce();
  });

  it('loads every recorded couple activity into the calendar sync summary', async () => {
    const activities = [
      ['prayer-1', 'prayer', 'Prayer', '🙏'], ['devotional-1', 'devotional', 'Devotional completed', '📖'],
      ['qa-1', 'qa', 'Question answered', '💬'], ['journal-1', 'journal', 'Journal reflection', '✍️'],
      ['verse-1', 'verse', 'John 3:16', '📜'], ['mood-1', 'mood', 'great', '🤩'],
      ['stage-1', 'stage', 'Couple stage 1', '🌱'],
    ].map(([id, type, title, emoji]) => ({ id, type, title, emoji, userId: 'user-1', date: '2026-08-18T12:00:00.000Z' }));
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/activity')
      ? { ok: true, json: async () => ({ activities }) }
      : { ok: true, json: async () => ({ items: [] }) }));

    render(
      <LanguageProvider>
        <CoupleCalendar accessToken="token" userId="user-1" onBack={vi.fn()} />
      </LanguageProvider>,
    );

    const summary = await screen.findByLabelText('Synced couple activity');
    expect(summary).toHaveTextContent('Prayer');
    expect(summary).toHaveTextContent('Devotional');
    expect(summary).toHaveTextContent('Q&A');
    expect(summary).toHaveTextContent('Journal');
    expect(summary).toHaveTextContent('Shared verses');
    expect(summary).toHaveTextContent('Daily moods');
    expect(summary).toHaveTextContent('Couple stage');
  });

  it('upgrades an existing calendar fallback prayer without creating a new link', async () => {
    const legacyItem = {
      id: 'cal-legacy', userId: 'user-1', title: 'Keti Invite to UAE', description: 'Prepare the invitation together',
      type: 'plan', category: 'relationship', startsAt: '2026-09-20T18:00:00.000Z', allDay: false,
      recurrence: 'none', reminderMinutes: 60, status: 'upcoming', createPrayer: true,
      prayerId: 'prayer-existing', prayerTitle: 'Prayer for Keti Invite to UAE',
      prayerText: 'Lord, we place our plan in Your hands.', scripture: 'Ecclesiastes 4:9–10',
      createdAt: '2026-08-18T12:00:00.000Z', updatedAt: '2026-08-18T12:00:00.000Z',
    };
    const upgradedItem = {
      ...legacyItem,
      prayerTitle: 'Prayer for Keti’s Journey',
      prayerText: 'Lord, guide every step of Keti’s invitation and unite us in wisdom and peace. Amen.',
      prayerGenerationSource: 'ai',
    };
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/activity')) return { ok: true, json: async () => ({ activities: [] }) };
      if (url.endsWith('/cal-legacy/regenerate-prayer') && init?.method === 'POST') {
        return { ok: true, json: async () => ({ success: true, item: upgradedItem }) };
      }
      return { ok: true, json: async () => ({ items: [legacyItem] }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const onPrayerChanged = vi.fn();

    render(
      <LanguageProvider>
        <CoupleCalendar accessToken="token" userId="user-1" onBack={vi.fn()} onPrayerChanged={onPrayerChanged} />
      </LanguageProvider>,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/calendar/cal-legacy/regenerate-prayer'),
      expect.objectContaining({ method: 'POST' }),
    ));
    await waitFor(() => expect(onPrayerChanged).toHaveBeenCalledOnce());
  });

  it('offers edit, delete, and answered actions for an owned linked prayer', async () => {
    const item = {
      id: 'cal-actions', userId: 'user-1', title: 'Church visit', description: 'Attend together',
      type: 'event', category: 'faith', emoji: '⛪', startsAt: '2026-09-20T18:00:00.000Z', allDay: false,
      recurrence: 'none', reminderMinutes: 60, status: 'upcoming', createPrayer: true,
      prayerId: 'prayer-actions', prayerTitle: 'Prayer for Church visit', prayerText: 'Lord, guide our worship. Amen.',
      scripture: 'Proverbs 3:5–6', prayerGenerationSource: 'ai',
      createdAt: '2026-08-18T12:00:00.000Z', updatedAt: '2026-08-18T12:00:00.000Z',
    };
    const answeredItem = { ...item, status: 'completed', prayerAnsweredAt: '2026-09-20T19:00:00.000Z' };
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/activity')) return { ok: true, json: async () => ({ activities: [] }) };
      if (url.endsWith('/cal-actions/answer-prayer') && init?.method === 'POST') {
        return { ok: true, json: async () => ({ item: answeredItem, prayer: { id: 'prayer-actions', isAnswered: true } }) };
      }
      return { ok: true, json: async () => ({ items: [item] }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const onPrayerChanged = vi.fn();
    const user = userEvent.setup();

    render(<LanguageProvider><CoupleCalendar accessToken="token" userId="user-1" onBack={vi.fn()} onPrayerChanged={onPrayerChanged} /></LanguageProvider>);
    await user.click(await screen.findByRole('button', { name: 'Prayer list' }));
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mark prayer answered' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/cal-actions/answer-prayer'),
      expect.objectContaining({ method: 'POST' }),
    ));
    expect(await screen.findByText('Answered')).toBeInTheDocument();
    expect(onPrayerChanged).toHaveBeenCalledOnce();
  });
});
