import '../styles/feature-glass.css';
import { createUiDateTimeFormat } from '../utils/uiDateTime';
import { BrandLoader, LoadingMark } from './BrandLoader';
import { useUiCopy } from '../utils/uiTranslation';
import { systemMessages } from '../locales/system';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3,
  BookHeart, Heart, ListTodo,  Lock, MapPin, Pencil, Plus, Repeat2, Sparkles, Trophy, Trash2, UserRound, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import {
  buildPrayerFallback, CALENDAR_CATEGORY_EMOJI, CALENDAR_EVENT_EMOJIS, CALENDAR_TYPE_META, CalendarCategory,
  CalendarDraft, CalendarItemType, CalendarRecurrence, CoupleCalendarItem,
  coupleCalendarCopy, getMonthGridDays, getWeekDays, getYearMonths, isSameLocalDay, occursOnDay, startOfWeek,
} from '../data/couple-calendar';
import { createClient } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BackButton } from './BackButton';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';

interface CoupleCalendarProps {
  accessToken: string;
  userId: string;
  userName?: string;
  partnerName?: string;
  onBack: () => void;
  onPrayerChanged?: () => void | Promise<void>;
  milestones?: CalendarMilestone[];
  journalEntries?: CalendarJournalEntry[];
  onOpenMilestones?: () => void;
  onOpenJournal?: () => void;
  onDataRefresh?: () => void | Promise<void>;
}

interface CalendarMilestone {
  id: string;
  title: string;
  description?: string;
  date?: string;
  createdAt?: string;
  category?: string;
  icon?: string;
  isPartner?: boolean;
}

interface CalendarJournalEntry {
  id: string;
  title?: string | null;
  content: string;
  createdAt?: string;
  created_at?: string;
  userId?: string;
  author_id?: string;
  isPartner?: boolean;
  emoji?: string | null;
}

type RecordedActivityType = 'prayer' | 'devotional' | 'qa' | 'journal' | 'verse' | 'mood' | 'stage';

interface RecordedActivity {
  id: string;
  sourceId?: string;
  userId: string;
  type: RecordedActivityType;
  title: string;
  description?: string;
  date: string;
  emoji: string;
  stageIndex?: number;
  isPartner?: boolean;
}

type CalendarView = 'calendar' | 'events';
type CalendarPeriod = 'weekly' | 'monthly' | 'yearly';

const localeByLanguage = { en: 'en-US', am: 'am-ET', om: 'om-ET' } as const;

function toLocalDateTimeInput(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function initialDraft(language: 'en' | 'am' | 'om'): CalendarDraft {
  const starts = new Date();
  starts.setMinutes(0, 0, 0);
  starts.setHours(starts.getHours() + 1);
  const ends = new Date(starts.getTime() + 60 * 60_000);
  return {
    title: '', description: '', type: 'plan', category: 'faith', emoji: '💕',
    startsAt: toLocalDateTimeInput(starts), endsAt: toLocalDateTimeInput(ends),
    allDay: false, recurrence: 'none', reminderMinutes: 60,
    location: '', createPrayer: true, language, isSharedWithPartner: true, isSurprise: false,
  };
}

function itemAccent(type: CalendarItemType) {
  return {
    plan: 'border-[var(--glass-border)] bg-[var(--glass-inset-surface)] text-[var(--glass-accent)]',
    event: 'border-[var(--glass-border)] bg-[var(--glass-inset-surface)] text-[var(--glass-accent)]',
    reminder: 'border-amber-200 bg-amber-50/70 text-amber-800',
    routine: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
  }[type];
}

export function CoupleCalendar({
  accessToken, userId, userName, partnerName, onBack, onPrayerChanged,
  milestones = [], journalEntries = [], onOpenMilestones, onOpenJournal, onDataRefresh,
}: CoupleCalendarProps) {
  const tr = useUiCopy(systemMessages);
  const { language } = useLanguage();
  const copy = coupleCalendarCopy[language];
  const locale = localeByLanguage[language];
  const [items, setItems] = useState<CoupleCalendarItem[]>([]);
  const [recordedActivities, setRecordedActivities] = useState<RecordedActivity[]>([]);
  const [view, setView] = useState<CalendarView>('calendar');
  const [period, setPeriod] = useState<CalendarPeriod>('weekly');
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CoupleCalendarItem | null>(null);
  const [draft, setDraft] = useState<CalendarDraft>(() => initialDraft(language));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const onDataRefreshRef = useRef(onDataRefresh);
  const prayerUpgradeAttemptsRef = useRef(new Set<string>());

  const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/calendar`;

  const loadItems = async (silent = false) => {
    try {
      const [response, activityResponse] = await Promise.all([
        fetch(apiUrl, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${apiUrl}/activity`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      if (!response.ok) throw new Error('Calendar request failed');
      const data = await response.json();
      const loadedItems: CoupleCalendarItem[] = Array.isArray(data.items) ? data.items : [];
      setItems(loadedItems);
      const legacyPrayerItems = loadedItems.filter(item =>
        item.userId === userId &&
        Boolean(item.prayerId) &&
        item.prayerGenerationSource !== 'ai' &&
        !prayerUpgradeAttemptsRef.current.has(item.id)
      ).slice(0, 3);
      for (const legacyItem of legacyPrayerItems) {
        prayerUpgradeAttemptsRef.current.add(legacyItem.id);
        void fetch(`${apiUrl}/${legacyItem.id}/regenerate-prayer`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(async upgradeResponse => {
          if (!upgradeResponse.ok) return;
          const upgraded = await upgradeResponse.json();
          if (!upgraded.item) return;
          setItems(current => current.map(item => item.id === upgraded.item.id ? upgraded.item : item));
          await onPrayerChanged?.();
        }).catch(error => console.warn('[CoupleCalendar] Legacy prayer upgrade deferred:', error));
      }
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecordedActivities(Array.isArray(activityData.activities) ? activityData.activities : []);
      }
    } catch (error) {
      console.error('[CoupleCalendar] Load failed:', error);
      if (!silent) toast.error(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    onDataRefreshRef.current = onDataRefresh;
  }, [onDataRefresh]);
  useEffect(() => {
    void loadItems();
    const refresh = () => {
      void loadItems(true);
      void onDataRefreshRef.current?.();
    };
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    const interval = window.setInterval(() => {
      refresh();
    }, 30_000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('twobeone:activity-recorded', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      window.removeEventListener('twobeone:activity-recorded', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [accessToken, userId, language]);
  useEffect(() => { setDraft(current => ({ ...current, language })); }, [language]);

  const weekDays = useMemo(() => getWeekDays(calendarAnchor), [calendarAnchor]);
  const monthDays = useMemo(() => getMonthGridDays(calendarAnchor), [calendarAnchor]);
  const yearMonths = useMemo(() => getYearMonths(calendarAnchor), [calendarAnchor]);
  const selectedItems = useMemo(
    () => items.filter(item => item.status !== 'completed' && occursOnDay(item, selectedDay))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [items, selectedDay],
  );
  const upcomingItems = useMemo(() => items
    .filter(item => item.status !== 'completed' && new Date(item.startsAt).getTime() >= startOfWeek(new Date()).getTime())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [items]);
  const linkedPrayerItems = useMemo(() => items.filter(item => item.prayerId && item.prayerText), [items]);
  const recentMilestones = useMemo(() => [...milestones]
    .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
    .slice(0, 3), [milestones]);
  const recentJournalEntries = useMemo(() => [...journalEntries]
    .sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime())
    .slice(0, 3), [journalEntries]);
  const selectedMilestones = useMemo(() => milestones.filter(milestone => {
    const date = milestone.date || milestone.createdAt;
    return Boolean(date) && isSameLocalDay(new Date(date!), selectedDay);
  }), [milestones, selectedDay]);
  const selectedJournalEntries = useMemo(() => journalEntries.filter(entry => {
    const date = entry.createdAt || entry.created_at;
    return Boolean(date) && isSameLocalDay(new Date(date!), selectedDay);
  }), [journalEntries, selectedDay]);
  const selectedRecordedActivities = useMemo(() => recordedActivities.filter(activity =>
    activity.type !== 'journal' && isSameLocalDay(new Date(activity.date), selectedDay)
  ), [recordedActivities, selectedDay]);
  const weekCount = items.filter(item => weekDays.some(day => occursOnDay(item, day)) && item.status !== 'completed').length;

  const openCreate = (type: CalendarItemType = 'plan', day?: Date) => {
    const next = initialDraft(language);
    next.type = type;
    next.emoji = type === 'event' ? '🎉' : type === 'reminder' ? '🔔' : type === 'routine' ? '🙏' : '💕';
    if (type === 'routine') next.recurrence = 'weekly';
    if (type === 'reminder') next.endsAt = '';
    if (day) {
      const chosen = new Date(day);
      const source = new Date(next.startsAt);
      chosen.setHours(source.getHours(), source.getMinutes(), 0, 0);
      next.startsAt = toLocalDateTimeInput(chosen);
      next.endsAt = toLocalDateTimeInput(new Date(chosen.getTime() + 60 * 60_000));
    }
    setDraft(next);
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEdit = (item: CoupleCalendarItem) => {
    if (item.isPartner) return;
    setEditingItem(item);
    setDraft({
      title: item.title, description: item.description || '', type: item.type, category: item.category,
      emoji: item.emoji || CALENDAR_CATEGORY_EMOJI[item.category], startsAt: toLocalDateTimeInput(new Date(item.startsAt)),
      endsAt: item.endsAt ? toLocalDateTimeInput(new Date(item.endsAt)) : '', allDay: item.allDay,
      recurrence: item.recurrence, reminderMinutes: item.reminderMinutes, location: item.location || '',
      createPrayer: Boolean(item.prayerId || item.createPrayer), language,
      isSharedWithPartner: item.isSharedWithPartner !== false, isSurprise: Boolean(item.isSurprise),
    });
    setDialogOpen(true);
  };

  const moveCalendar = (direction: -1 | 1) => {
    setCalendarAnchor(current => period === 'weekly'
      ? new Date(current.getFullYear(), current.getMonth(), current.getDate() + direction * 7)
      : period === 'monthly'
        ? new Date(current.getFullYear(), current.getMonth() + direction, 1)
        : new Date(current.getFullYear() + direction, current.getMonth(), 1));
  };

  const selectCalendarDay = (day: Date) => {
    setSelectedDay(day);
  };

  type DayMark = CalendarItemType | 'milestone' | RecordedActivityType;
  const marksForDay = (day: Date): DayMark[] => {
    const types: DayMark[] = items
      .filter(item => item.status !== 'completed' && occursOnDay(item, day))
      .map(item => item.type);
    if (milestones.some(milestone => {
      const date = milestone.date || milestone.createdAt;
      return Boolean(date) && isSameLocalDay(new Date(date!), day);
    })) types.push('milestone');
    if (journalEntries.some(entry => {
      const date = entry.createdAt || entry.created_at;
      return Boolean(date) && isSameLocalDay(new Date(date!), day);
    })) types.push('journal');
    for (const activity of recordedActivities) {
      if (isSameLocalDay(new Date(activity.date), day)) types.push(activity.type);
    }
    return Array.from(new Set(types));
  };

  const emojiForDay = (day: Date) => {
    const calendarItem = items.find(item => item.status !== 'completed' && occursOnDay(item, day));
    if (calendarItem) return calendarItem.emoji || CALENDAR_CATEGORY_EMOJI[calendarItem.category];
    const milestone = milestones.find(entry => {
      const date = entry.date || entry.createdAt;
      return Boolean(date) && isSameLocalDay(new Date(date!), day);
    });
    if (milestone) return milestone.icon && milestone.icon.length <= 4 ? milestone.icon : '🏆';
    const journal = journalEntries.find(entry => {
      const date = entry.createdAt || entry.created_at;
      return Boolean(date) && isSameLocalDay(new Date(date!), day);
    });
    if (journal) return journal.emoji || '📖';
    return recordedActivities.find(activity => isSameLocalDay(new Date(activity.date), day))?.emoji || '';
  };

  const markerColor: Record<DayMark, string> = {
    plan: 'bg-rose-500', event: 'bg-violet-500', reminder: 'bg-amber-500', routine: 'bg-emerald-500',
    milestone: 'bg-fuchsia-500', journal: 'bg-sky-500', prayer: 'bg-pink-500', devotional: 'bg-indigo-500',
    qa: 'bg-cyan-500', verse: 'bg-yellow-500', mood: 'bg-orange-500', stage: 'bg-lime-600',
  };

  const activityLabels: Record<RecordedActivityType, string> = {
    prayer: copy.prayerActivity, devotional: copy.devotionalActivity, qa: copy.qaActivity,
    journal: copy.journal, verse: copy.verseActivity, mood: copy.moodActivity, stage: copy.stageActivity,
  };

  const activityTitle = (activity: RecordedActivity) => activity.type === 'stage' && activity.stageIndex !== undefined
    ? [copy.seedStage, copy.growthStage, copy.unityStage, copy.commitmentStage, copy.covenantStage][activity.stageIndex] || copy.stageActivity
    : activity.type === 'devotional' ? copy.devotionalCompleted
      : activity.type === 'qa' ? copy.questionAnswered
        : activity.type === 'mood' ? `${copy.moodActivity}: ${activity.title === 'great' ? copy.moodGreat : activity.title === 'good' ? copy.moodGood : activity.title === 'sad' ? copy.moodSad : copy.moodOkay}`
          : activity.title;

  const periodTitle = period === 'yearly'
    ? createUiDateTimeFormat(locale, { year: 'numeric' }).format(calendarAnchor)
    : period === 'monthly'
      ? createUiDateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(calendarAnchor)
      : `${createUiDateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(weekDays[0])} – ${createUiDateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(weekDays[6])}`;

  const renderDayCircle = (day: Date, compact = false) => {
    const marks = marksForDay(day);
    const selected = isSameLocalDay(day, selectedDay);
    const today = isSameLocalDay(day, new Date());
    const emoji = emojiForDay(day);
    return <span className={`relative grid aspect-square w-full min-w-0 shrink-0 place-items-center rounded-full tbo-label transition-all ${compact ? 'max-w-8' : 'max-w-10 sm:max-w-12'} ${selected ? 'bg-rose-600 text-white shadow-md shadow-rose-200 ring-2 ring-rose-300 ring-offset-2' : marks.length ? 'bg-[var(--glass-inset-surface)] text-foreground ring-2 ring-rose-500 ring-offset-1' : today ? 'bg-[var(--glass-inset-surface)] text-[var(--glass-accent)] ring-1 ring-rose-300' : 'text-foreground'}`}>
      {day.getDate()}
      {emoji && <span aria-hidden="true" className={`pointer-events-none absolute z-10 drop-shadow-sm motion-safe:animate-[bounce_1.8s_ease-in-out_infinite] ${compact ? '-right-1.5 -top-1.5 text-xs' : '-right-2 -top-2 text-lg'}`}>{emoji}</span>}
    </span>;
  };

  const updateDraft = <K extends keyof CalendarDraft>(key: K, value: CalendarDraft[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.startsAt) return;
    setSaving(true);
    try {
      const url = editingItem ? `${apiUrl}/${editingItem.id}` : apiUrl;
      const request: RequestInit = {
        method: editingItem ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, startsAt: new Date(draft.startsAt).toISOString(), endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null }),
      };
      let response = await fetch(url, request);
      if (response.status === 401) {
        const { data: refreshed } = await createClient().auth.refreshSession();
        const freshToken = refreshed.session?.access_token;
        if (!freshToken) throw new Error(copy.sessionExpired);
        response = await fetch(url, { ...request, headers: { ...request.headers, Authorization: `Bearer ${freshToken}` } });
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) throw new Error(copy.sessionExpired);
        if (response.status === 400) throw new Error(copy.invalidPlan);
        if (response.status === 404) throw new Error(copy.calendarUnavailable);
        if (response.status >= 500) throw new Error(copy.serverUnavailable);
        throw new Error(data.error || copy.failed);
      }
      setItems(current => editingItem
        ? current.map(item => item.id === editingItem.id ? data.item : item)
        : [data.item, ...current]);
      setDialogOpen(false);
      toast.success(editingItem ? copy.updated : copy.created);
      if (data.prayer || editingItem?.prayerId) await onPrayerChanged?.();
      setEditingItem(null);
      await loadItems(true);
    } catch (error) {
      console.error('[CoupleCalendar] Save failed:', error);
      const message = error instanceof TypeError
        ? copy.connectionFailed
        : error instanceof Error ? error.message : copy.failed;
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (item: CoupleCalendarItem) => {
    const status = item.status === 'completed' ? 'upcoming' : 'completed';
    try {
      const response = await fetch(`${apiUrl}/${item.id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Update failed');
      const data = await response.json().catch(() => ({}));
      setItems(current => current.map(entry => entry.id === item.id ? (data.item || { ...entry, status }) : entry));
      if (data.prayer) await onPrayerChanged?.();
      await loadItems(true);
    } catch { toast.error(copy.failed); }
  };

  const deleteItem = async (item: CoupleCalendarItem) => {
    if (!window.confirm(copy.deleteConfirm)) return;
    try {
      const response = await fetch(`${apiUrl}/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error('Delete failed');
      setItems(current => current.filter(entry => entry.id !== item.id));
      if (item.prayerId) await onPrayerChanged?.();
      await loadItems(true);
    } catch { toast.error(copy.failed); }
  };

  const formatTime = (item: CoupleCalendarItem) => item.allDay
    ? copy.allDay
    : createUiDateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(item.startsAt));

  const formatRelatedDate = (value?: string) => value
    ? createUiDateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
    : '';

  const renderItem = (item: CoupleCalendarItem) => (
    <article key={item.id} className={`group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${itemAccent(item.type)} ${item.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--glass-inset-surface)] text-lg shadow-sm">{item.isLockedForPartner ? <Lock className="h-5 w-5 text-[var(--glass-accent)]" /> : item.emoji || CALENDAR_CATEGORY_EMOJI[item.category]}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`tbo-card-title text-foreground ${item.status === 'completed' ? 'line-through' : ''}`}>{item.title}</h3>
            {item.isPartner && <Badge variant="outline" className="max-w-full whitespace-normal h-auto min-h-6 tbo-caption border-white/80 bg-[var(--glass-inset-surface)]">{copy.partner}</Badge>}
            {!item.isPartner && <Badge variant="outline" className="max-w-full whitespace-normal h-auto min-h-6 tbo-caption border-white/80 bg-[var(--glass-inset-surface)]">{item.isSharedWithPartner === false ? <><UserRound className="mr-1 h-3 w-3" />{copy.private}</> : item.isSurprise ? <><Lock className="mr-1 h-3 w-3" />{copy.surprise}</> : <><Users className="mr-1 h-3 w-3" />{copy.shared}</>}</Badge>}
            {item.recurrence !== 'none' && <Repeat2 className="h-3.5 w-3.5" aria-label={copy.repeats} />}
          </div>
          <p className="tbo-caption mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-80">
            <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatTime(item)}</span>
            {item.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.location}</span>}
            {item.reminderMinutes !== null && <span className="flex items-center gap-1"><Bell className="h-3.5 w-3.5" />{copy.reminderLabel}</span>}
          </p>
          {item.isLockedForPartner ? <p className="tbo-supporting mt-2 text-[var(--glass-accent)]">{copy.lockedUntil} {createUiDateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(item.unlockAt || item.startsAt))}</p> : item.description && <p className="tbo-supporting mt-2 line-clamp-2 text-muted-foreground">{item.description}</p>}
          {item.prayerId && <div className="tbo-caption mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--glass-inset-surface)] px-2.5 py-1 text-[var(--glass-accent)]"><Heart className="h-3 w-3 fill-rose-500" />{copy.prayerReady}</div>}
        </div>
        {!item.isPartner && (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => openEdit(item)} className="tbo-action grid h-9 w-9 place-items-center rounded-full bg-[var(--glass-inset-surface)] text-muted-foreground hover:bg-[var(--glass-inset-surface)]" aria-label={copy.edit}><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => void updateStatus(item)} className="tbo-action grid h-9 w-9 place-items-center rounded-full bg-[var(--glass-inset-surface)] text-muted-foreground hover:bg-[var(--glass-inset-surface)]" aria-label={copy.complete}><Check className="h-4 w-4" /></button>
            <button type="button" onClick={() => void deleteItem(item)} className="tbo-action grid h-9 w-9 place-items-center rounded-full bg-[var(--glass-inset-surface)] text-muted-foreground hover:bg-red-50 hover:text-red-600" aria-label={copy.delete}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </article>
  );

  const prayerPreview = buildPrayerFallback(draft.title, draft.category, language);

  return (
    <div className="tbo-feature-layout couple-calendar-mobile mx-auto min-h-screen w-full min-w-0 max-w-4xl pb-32 [overflow-wrap:anywhere] [&_button]:min-w-0 [&_button]:whitespace-normal">
      <header className="tbo-feature-header relative isolate overflow-hidden rounded-[2rem] border border-[var(--glass-border)] tbo-glass-raised px-5 py-6 shadow-[0_24px_70px_-45px_rgba(190,24,93,.5)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--glass-inset-surface)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[var(--glass-inset-surface)] blur-3xl" />
        <div className="relative">
          <div className="tbo-feature-header-actions flex items-center justify-between gap-3">
            <BackButton label={copy.back} onClick={onBack} />
            <div className="tbo-feature-header-badge tbo-eyebrow inline-flex min-h-9 min-w-0 items-center gap-2 rounded-full bg-[var(--glass-inset-surface)] px-3 py-2 text-[var(--glass-accent)] shadow-sm ring-1 ring-[var(--glass-rim)]"><Heart className="h-4 w-4 shrink-0 fill-rose-500" />{copy.eyebrow}</div>
            <button type="button" onClick={() => openCreate()} className="tbo-action app-icon-button grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-200" aria-label={copy.newItem}><Plus className="h-[24px] w-[24px]" /></button>
          </div>
          <div className="mt-7 max-w-2xl">
            <p className="tbo-supporting text-[var(--glass-accent)]">{userName || copy.you} {partnerName ? `& ${partnerName}` : ''}</p>
            <h1 className="tbo-page-title mt-1 text-foreground">{copy.title}</h1>
            <p className="tbo-body mt-3 max-w-xl text-foreground">{copy.subtitle}</p>
          </div>
          <div className="tbo-feature-stats mt-7 grid grid-cols-3 gap-2 border-t border-[var(--glass-border)] pt-5 sm:gap-4">
            <div><p className="text-2xl font-bold text-foreground">{weekCount}</p><p className="tbo-caption text-muted-foreground">{copy.plansThisWeek}</p></div>
            <div className="border-l border-[var(--glass-border)] pl-3"><p className="text-2xl font-bold text-foreground">{linkedPrayerItems.length}</p><p className="tbo-caption text-muted-foreground">{copy.linkedPrayers}</p></div>
            <div className="border-l border-[var(--glass-border)] pl-3"><p className="text-2xl font-bold text-foreground">{items.filter(item => item.type === 'routine').length}</p><p className="tbo-caption text-muted-foreground">{copy.routines}</p></div>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 4.5rem), 1fr))' }}>
        {(['plan', 'event', 'reminder', 'routine'] as CalendarItemType[]).map(type => (
          <button key={type} type="button" onClick={() => openCreate(type)} className={`tbo-action flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 ${itemAccent(type)}`}>
            <span className="text-2xl">{CALENDAR_TYPE_META[type].icon}</span>{copy[type]}
          </button>
        ))}
      </div>

      <nav className="mt-6 grid grid-cols-2 gap-1 rounded-2xl tbo-glass-inset p-1.5" aria-label={copy.title}>
        {([
          ['calendar', CalendarDays, copy.calendar], ['events', ListTodo, copy.events],
        ] as const).map(([id, Icon, label]) => (
          <button key={id} type="button" onClick={() => setView(id)} className={`tbo-action flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 transition-all ${view === id ? 'bg-[var(--glass-inset-surface)] text-[var(--glass-accent)] shadow-sm' : 'text-muted-foreground'}`}><Icon className="h-5 w-5" />{label}</button>
        ))}
      </nav>

      {loading ? (
        <BrandLoader className="min-h-64" />
      ) : view === 'calendar' ? (
        <section className="mt-6 space-y-5">
          <div className="grid gap-1 rounded-2xl border border-[var(--glass-border)] tbo-glass-inset p-1.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 5.5rem), 1fr))' }}>
            {([['weekly', copy.weekly], ['monthly', copy.monthlyView], ['yearly', copy.yearly]] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setPeriod(id)} className={`tbo-action min-h-12 rounded-xl px-3 transition-all ${period === id ? 'bg-[var(--glass-inset-surface)] text-[var(--glass-accent)] shadow-sm ring-1 ring-[var(--glass-rim)]' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-inset-surface)] p-2 shadow-sm">
            <button type="button" onClick={() => moveCalendar(-1)} className="tbo-action app-icon-button grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full text-foreground hover:bg-[var(--glass-inset-surface)]" aria-label={tr("Previous")}><ChevronLeft className="h-[20px] w-[20px]" /></button>
            <div className="min-w-0 flex-1 text-center"><p className="tbo-body text-foreground">{periodTitle}</p><button type="button" onClick={() => { setCalendarAnchor(new Date()); setSelectedDay(new Date()); }} className="tbo-action mt-1 min-h-8 rounded-full px-3 text-[var(--glass-accent)]">{copy.today}</button></div>
            <button type="button" onClick={() => moveCalendar(1)} className="tbo-action app-icon-button grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full text-foreground hover:bg-[var(--glass-inset-surface)]" aria-label={tr("Next")}><ChevronRight className="h-[20px] w-[20px]" /></button>
          </div>

          {period === 'weekly' && (
            <div className="grid grid-cols-7 divide-x divide-slate-100 overflow-hidden rounded-[1.5rem] border border-[var(--glass-border)] bg-[var(--glass-inset-surface)] px-2 shadow-sm">
              {weekDays.map(day => {
                const marks = marksForDay(day);
                return <button type="button" key={day.toISOString()} onClick={() => selectCalendarDay(day)} aria-label={`${createUiDateTimeFormat(locale, { dateStyle: 'full' }).format(day)}, ${marks.length} ${copy.items}`} className="tbo-action relative flex min-h-28 flex-col items-center justify-center border-y border-[var(--glass-border)] py-3 text-center transition-colors hover:bg-[var(--glass-inset-surface)]">
                  <span className="tbo-eyebrow mb-3 text-muted-foreground">{createUiDateTimeFormat(locale, { weekday: 'narrow' }).format(day)}</span>
                  {renderDayCircle(day)}
                </button>;
              })}
            </div>
          )}

          {period === 'monthly' && (
            <div className="overflow-hidden rounded-[1.75rem] border border-[var(--glass-border)] bg-[var(--glass-inset-surface)] px-4 py-4 shadow-sm sm:px-7 sm:py-6">
              <div className="grid grid-cols-7 border-b-2 border-rose-300">{weekDays.map(day => <div key={day.getDay()} className="tbo-eyebrow pb-3 text-center text-muted-foreground">{createUiDateTimeFormat(locale, { weekday: 'narrow' }).format(day)}</div>)}</div>
              <div className="grid grid-cols-7">
                {monthDays.map(day => {
                  const inMonth = day.getMonth() === calendarAnchor.getMonth();
                  const marks = marksForDay(day);
                  return <button type="button" key={day.toISOString()} onClick={() => selectCalendarDay(day)} aria-label={`${createUiDateTimeFormat(locale, { dateStyle: 'full' }).format(day)}, ${marks.length} ${copy.items}`} className={`tbo-action flex min-h-16 items-center justify-center border-b-2 border-[var(--glass-border)] py-2 transition-colors sm:min-h-20 ${inMonth ? 'hover:bg-[var(--glass-inset-surface)]' : 'opacity-35 hover:bg-[var(--glass-inset-surface)]'}`}>
                    {renderDayCircle(day)}
                  </button>;
                })}
              </div>
            </div>
          )}

          {period === 'yearly' && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {yearMonths.map(month => {
                return <article key={month.getMonth()} className="overflow-hidden rounded-2xl border border-[var(--glass-border)] tbo-glass-inset p-3 shadow-sm">
                  <button type="button" onClick={() => { setCalendarAnchor(month); setPeriod('monthly'); }} className="tbo-action mb-3 w-full text-left text-foreground hover:text-[var(--glass-accent)]">{createUiDateTimeFormat(locale, { month: 'long' }).format(month)}</button>
                  <div className="grid grid-cols-7 border-b border-rose-300">{getWeekDays(month).map(day => <span key={day.getDay()} className="tbo-caption pb-1.5 text-center text-muted-foreground">{createUiDateTimeFormat(locale, { weekday: 'narrow' }).format(day)}</span>)}</div>
                  <div className="grid grid-cols-7">{getMonthGridDays(month).map(day => {
                    const inMonth = day.getMonth() === month.getMonth();
                    const marks = marksForDay(day);
                    return <button type="button" key={day.toISOString()} disabled={!inMonth} onClick={() => selectCalendarDay(day)} aria-label={inMonth ? `${createUiDateTimeFormat(locale, { dateStyle: 'full' }).format(day)}, ${marks.length} ${copy.items}` : undefined} className={`tbo-action flex aspect-square items-center justify-center border-b border-[var(--glass-border)] transition-colors ${inMonth ? 'hover:bg-[var(--glass-inset-surface)]' : 'pointer-events-none'}`}>
                      {inMonth && renderDayCircle(day, true)}
                    </button>;
                  })}</div>
                </article>;
              })}
            </div>
          )}

          <div className="tbo-caption flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-[var(--glass-inset-surface)] px-4 py-3 text-muted-foreground"><span className="mr-1 uppercase tracking-wider text-muted-foreground">{copy.markedDays}</span>{(['plan', 'event', 'reminder', 'routine', 'milestone', 'journal'] as DayMark[]).map(type => <span key={type} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${markerColor[type]}`} />{copy[type]}</span>)}</div>

          <section className="rounded-2xl border border-[var(--glass-border)] bg-gradient-to-r from-indigo-50/70 via-white to-rose-50/70 p-4" aria-label={copy.syncedActivity}>
            <div className="mb-3 flex items-center justify-between gap-3"><div><p className="tbo-eyebrow text-[var(--glass-accent)]">{copy.syncedActivity}</p><p className="tbo-caption mt-1 text-muted-foreground">{copy.syncedActivityHint}</p></div><span className="tbo-caption rounded-full bg-[var(--glass-inset-surface)] px-3 py-1 text-[var(--glass-accent)] shadow-sm">{recordedActivities.length}</span></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(['prayer', 'devotional', 'qa', 'journal', 'verse', 'mood', 'stage'] as RecordedActivityType[]).map(type => {
              const count = recordedActivities.filter(activity => activity.type === type).length;
              const emoji = { prayer: '🙏', devotional: '📖', qa: '💬', journal: '✍️', verse: '📜', mood: '😊', stage: '🌱' }[type];
              return <div key={type} className="flex items-center gap-2 rounded-xl border border-white bg-[var(--glass-inset-surface)] px-3 py-2 shadow-sm"><span className="text-base">{emoji}</span><span className="min-w-0"><span className="tbo-caption block truncate text-muted-foreground">{activityLabels[type]}</span><span className="tbo-label block text-foreground">{count}</span></span></div>;
            })}</div>
          </section>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1 basis-48"><p className="tbo-eyebrow text-[var(--glass-accent)]">{copy.selectedAgenda} · {createUiDateTimeFormat(locale, { weekday: 'long' }).format(selectedDay)}</p><h2 className="tbo-section-title mt-1 text-foreground">{createUiDateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(selectedDay)}</h2></div>
            <Button onClick={() => openCreate('plan', selectedDay)} className="tbo-action rounded-full"><Plus className="h-4 w-4" />{copy.newItem}</Button>
          </div>
          <div className="space-y-3">
            {selectedItems.map(renderItem)}
            {selectedMilestones.map(milestone => <button type="button" key={`milestone-${milestone.id}`} onClick={onOpenMilestones} className="flex w-full items-start gap-3 rounded-2xl border border-[var(--glass-border)] bg-fuchsia-50/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--glass-inset-surface)] text-xl shadow-sm">{milestone.icon && milestone.icon.length <= 4 ? milestone.icon : '🏆'}</span><span><span className="tbo-eyebrow text-[var(--glass-accent)]">{copy.milestone}</span><span className="mt-1 block font-bold text-foreground">{milestone.title}</span>{milestone.description && <span className="tbo-supporting mt-1 line-clamp-2 block text-muted-foreground">{milestone.description}</span>}</span></button>)}
            {selectedJournalEntries.map(entry => <button type="button" key={`journal-${entry.id}`} onClick={onOpenJournal} className="flex w-full items-start gap-3 rounded-2xl border border-[var(--glass-border)] bg-sky-50/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--glass-inset-surface)] text-xl shadow-sm">{entry.emoji || '📖'}</span><span><span className="tbo-eyebrow text-[var(--glass-accent)]">{copy.journal}</span><span className="mt-1 block font-bold text-foreground">{entry.title || copy.untitledJournal}</span><span className="tbo-supporting mt-1 line-clamp-2 block text-muted-foreground">{entry.content}</span></span></button>)}
            {selectedRecordedActivities.map(activity => <article key={activity.id} className="flex items-start gap-3 rounded-2xl border border-[var(--glass-border)] tbo-glass p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--glass-inset-surface)] text-xl shadow-sm ring-1 ring-indigo-100">{activity.emoji}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="tbo-eyebrow text-[var(--glass-accent)]">{activityLabels[activity.type]}</span>{activity.isPartner && <Badge variant="outline" className="max-w-full whitespace-normal h-auto min-h-6 tbo-caption bg-[var(--glass-inset-surface)]">{copy.partner}</Badge>}</div><h3 className="tbo-card-title mt-1 text-foreground">{activityTitle(activity)}</h3>{activity.description && <p className="tbo-supporting mt-1 line-clamp-2 text-muted-foreground">{activity.description}</p>}</div></article>)}
            {selectedItems.length === 0 && selectedMilestones.length === 0 && selectedJournalEntries.length === 0 && selectedRecordedActivities.length === 0 && <Card className="rounded-[1.75rem] border-dashed border-[var(--glass-border)] tbo-glass"><CardContent className="p-9 text-center"><Sparkles className="mx-auto h-8 w-8 text-amber-400" /><h3 className="tbo-card-title mt-3 text-foreground">{copy.emptyDay}</h3><p className="tbo-supporting mt-1 text-muted-foreground">{copy.emptyDayHint}</p></CardContent></Card>}
          </div>
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          <div><p className="tbo-eyebrow text-[var(--glass-accent)]">{copy.upcoming}</p><h2 className="tbo-section-title mt-1 text-foreground">{copy.events}</h2></div>
          {upcomingItems.length ? upcomingItems.map(item => <div key={item.id}><p className="tbo-caption mb-2 ml-1 text-muted-foreground">{createUiDateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(item.startsAt))}</p>{renderItem(item)}</div>) : <p className="tbo-supporting rounded-2xl border border-dashed p-8 text-center text-muted-foreground">{copy.noUpcoming}</p>}
        </section>
      )}

      <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-label={copy.sharedMemories}>
        <article className="overflow-hidden rounded-[1.75rem] border border-[var(--glass-border)] tbo-glass shadow-sm">
          <header className="tbo-feature-header flex items-center justify-between gap-3 border-b border-[var(--glass-border)] px-5 py-4">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-fuchsia-100 text-[var(--glass-accent)]"><Trophy className="h-5 w-5" /></span><div><p className="tbo-eyebrow text-[var(--glass-accent)]">{copy.ourJourney}</p><h2 className="tbo-section-title text-foreground">{copy.relationshipMilestones}</h2></div></div>
            {onOpenMilestones && <button type="button" onClick={onOpenMilestones} className="tbo-action rounded-full px-3 py-2 text-[var(--glass-accent)] hover:bg-fuchsia-50">{copy.viewAll}</button>}
          </header>
          <div className="space-y-1 p-3">
            {recentMilestones.length ? recentMilestones.map((milestone, index) => <button type="button" key={milestone.id} onClick={onOpenMilestones} className="flex w-full items-start gap-3 rounded-2xl p-3 text-left hover:bg-[var(--glass-inset-surface)] hover:shadow-sm"><span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-lg">{milestone.icon && milestone.icon.length <= 4 ? milestone.icon : '💞'}{index < recentMilestones.length - 1 && <span className="absolute left-1/2 top-10 h-5 w-px bg-fuchsia-200" />}</span><span className="min-w-0"><span className="tbo-label block truncate text-foreground">{milestone.title}</span><span className="tbo-caption mt-1 block text-muted-foreground">{formatRelatedDate(milestone.date || milestone.createdAt)}{milestone.category ? ` · ${milestone.category}` : ''}</span></span></button>) : <div className="p-7 text-center"><Trophy className="mx-auto h-7 w-7 text-fuchsia-200" /><p className="tbo-supporting mt-2 text-muted-foreground">{copy.noMilestones}</p></div>}
          </div>
        </article>

        <article className="overflow-hidden rounded-[1.75rem] border border-[var(--glass-border)] tbo-glass shadow-sm">
          <header className="tbo-feature-header flex items-center justify-between gap-3 border-b border-[var(--glass-border)] px-5 py-4">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-[var(--glass-accent)]"><BookHeart className="h-5 w-5" /></span><div><p className="tbo-eyebrow text-[var(--glass-accent)]">{copy.sharedMemories}</p><h2 className="tbo-section-title text-foreground">{copy.recentJournalEntries}</h2></div></div>
            {onOpenJournal && <button type="button" onClick={onOpenJournal} className="tbo-action rounded-full px-3 py-2 text-[var(--glass-accent)] hover:bg-sky-50">{copy.viewAll}</button>}
          </header>
          <div className="space-y-1 p-3">
            {recentJournalEntries.length ? recentJournalEntries.map(entry => {
              const isPartner = entry.isPartner || (entry.userId && entry.userId !== userId) || (entry.author_id && entry.author_id !== userId);
              return <button type="button" key={entry.id} onClick={onOpenJournal} className="flex w-full items-start gap-3 rounded-2xl p-3 text-left hover:bg-[var(--glass-inset-surface)] hover:shadow-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-lg">{entry.emoji || '📖'}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="tbo-label truncate text-foreground">{entry.title || copy.untitledJournal}</span>{isPartner && <Badge variant="outline" className="max-w-full whitespace-normal h-auto min-h-6 tbo-caption shrink-0 bg-[var(--glass-inset-surface)]">{copy.partner}</Badge>}</span><span className="tbo-caption mt-1 line-clamp-2 block text-muted-foreground">{entry.content}</span><span className="tbo-caption mt-1 block text-[var(--glass-accent)]">{formatRelatedDate(entry.createdAt || entry.created_at)}</span></span></button>;
            }) : <div className="p-7 text-center"><BookHeart className="mx-auto h-7 w-7 text-sky-200" /><p className="tbo-supporting mt-2 text-muted-foreground">{copy.noJournalEntries}</p></div>}
          </div>
        </article>
      </section>

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditingItem(null); }}>
        <DialogContent className="max-h-[94dvh] overflow-y-auto rounded-[1.75rem] border-[var(--glass-border)] p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-[var(--glass-border)] tbo-glass-inset px-6 py-6 pr-12 text-left">
            <DialogTitle className="tbo-dialog-title text-foreground">{editingItem ? copy.editTitle : copy.newTitle}</DialogTitle>
            <DialogDescription className="tbo-supporting text-muted-foreground">{copy.newDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5 p-6">
            <div className="space-y-2"><Label className="tbo-label">{copy.itemType}</Label><div className="grid grid-cols-4 gap-2">{(['plan', 'event', 'reminder', 'routine'] as CalendarItemType[]).map(type => <button key={type} type="button" onClick={() => updateDraft('type', type)} className={`tbo-action min-h-16 rounded-xl border px-2 ${draft.type === type ? itemAccent(type) + ' ring-2 ring-current/10' : 'border-[var(--glass-border)] bg-[var(--glass-inset-surface)] text-muted-foreground'}`}><span className="block text-lg">{CALENDAR_TYPE_META[type].icon}</span>{copy[type]}</button>)}</div></div>
            <div className="space-y-2"><div><Label className="tbo-label">{copy.chooseEmoji}</Label><p className="tbo-caption mt-1 text-muted-foreground">{copy.chooseEmojiHint}</p></div><div className="grid grid-cols-8 gap-2 rounded-2xl border border-[var(--glass-border)] tbo-glass-inset p-3">{CALENDAR_EVENT_EMOJIS.map(emoji => <button key={emoji} type="button" onClick={() => updateDraft('emoji', emoji)} aria-label={`${copy.chooseEmoji}: ${emoji}`} aria-pressed={draft.emoji === emoji} className={`grid aspect-square place-items-center rounded-full text-xl transition-all hover:-translate-y-0.5 ${draft.emoji === emoji ? 'bg-[var(--glass-inset-surface)] shadow-md ring-2 ring-rose-500 ring-offset-2' : 'hover:bg-[var(--glass-inset-surface)]'}`}>{emoji}</button>)}</div></div>
            <div className="space-y-2"><Label className="tbo-label" htmlFor="calendar-title">{copy.titleLabel}</Label><Input id="calendar-title" required value={draft.title} onChange={e => updateDraft('title', e.target.value)} placeholder={copy.titlePlaceholder} className="tbo-field h-12 rounded-xl" /></div>
            <div className="space-y-2"><Label className="tbo-label" htmlFor="calendar-notes">{copy.descriptionLabel}</Label><Textarea id="calendar-notes" value={draft.description} onChange={e => updateDraft('description', e.target.value)} placeholder={copy.descriptionPlaceholder} className="tbo-field min-h-24 rounded-xl" /></div>
            <div className="space-y-2"><Label className="tbo-label">{copy.category}</Label><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{(['faith', 'relationship', 'family', 'health', 'finance', 'service', 'other'] as CalendarCategory[]).map(category => <button key={category} type="button" onClick={() => updateDraft('category', category)} className={`tbo-action min-h-16 rounded-xl border px-1 ${draft.category === category ? 'border-rose-300 bg-[var(--glass-inset-surface)] text-[var(--glass-accent)]' : 'border-[var(--glass-border)] bg-[var(--glass-inset-surface)] text-muted-foreground'}`}><span className="block text-lg">{CALENDAR_CATEGORY_EMOJI[category]}</span>{copy[category]}</button>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label className="tbo-label" htmlFor="calendar-start">{copy.starts}</Label><Input id="calendar-start" type="datetime-local" required value={draft.startsAt} onChange={e => updateDraft('startsAt', e.target.value)} className="tbo-field h-12 rounded-xl" /></div><div className="space-y-2"><Label className="tbo-label" htmlFor="calendar-end">{copy.ends}</Label><Input id="calendar-end" type="datetime-local" value={draft.endsAt} onChange={e => updateDraft('endsAt', e.target.value)} className="tbo-field h-12 rounded-xl" /></div></div>
            <label className="tbo-label flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--glass-inset-surface)] px-4 py-3 text-foreground"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-rose-500" />{copy.allDay}</span><Switch checked={draft.allDay} onCheckedChange={checked => updateDraft('allDay', checked)} /></label>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label className="tbo-label" htmlFor="calendar-repeat">{copy.repeats}</Label><select id="calendar-repeat" value={draft.recurrence} onChange={e => updateDraft('recurrence', e.target.value as CalendarRecurrence)} className="tbo-field h-12 w-full rounded-xl border border-input bg-[var(--glass-inset-surface)] px-3"><option value="none">{copy.none}</option><option value="daily">{copy.daily}</option><option value="weekly">{copy.weeklyRepeat}</option><option value="monthly">{copy.monthly}</option></select></div><div className="space-y-2"><Label className="tbo-label" htmlFor="calendar-reminder">{copy.reminderLabel}</Label><select id="calendar-reminder" value={draft.reminderMinutes ?? 'none'} onChange={e => updateDraft('reminderMinutes', e.target.value === 'none' ? null : Number(e.target.value))} className="tbo-field h-12 w-full rounded-xl border border-input bg-[var(--glass-inset-surface)] px-3"><option value="none">{copy.noReminder}</option><option value="0">{copy.atTime}</option><option value="15">{copy.fifteen}</option><option value="60">{copy.hour}</option><option value="1440">{copy.day}</option></select></div></div>
            <div className="space-y-2"><Label className="tbo-label" htmlFor="calendar-location">{copy.location}</Label><Input id="calendar-location" value={draft.location} onChange={e => updateDraft('location', e.target.value)} placeholder={copy.locationPlaceholder} className="tbo-field h-12 rounded-xl" /></div>
            <div className="space-y-3 rounded-2xl border border-[var(--glass-border)] tbo-glass-inset p-4">
              <label className="tbo-label flex items-center justify-between gap-4 text-foreground"><span><span className="flex items-center gap-2"><Users className="h-4 w-4 text-[var(--glass-accent)]" />{copy.shareWithPartner}</span><span className="tbo-caption mt-1 block text-muted-foreground">{copy.shareWithPartnerHint}</span></span><Switch checked={draft.isSharedWithPartner} onCheckedChange={checked => setDraft(current => ({ ...current, isSharedWithPartner: checked, isSurprise: checked ? current.isSurprise : false }))} /></label>
              {draft.isSharedWithPartner && <label className="tbo-label flex items-center justify-between gap-4 border-t border-[var(--glass-border)] pt-3 text-foreground"><span><span className="flex items-center gap-2"><Lock className="h-4 w-4 text-[var(--glass-accent)]" />{copy.makeSurprise}</span><span className="tbo-caption mt-1 block text-muted-foreground">{copy.makeSurpriseHint}</span></span><Switch checked={draft.isSurprise} onCheckedChange={checked => updateDraft('isSurprise', checked)} /></label>}
            </div>
            <div className="rounded-2xl border border-[var(--glass-border)] tbo-glass-inset p-4"><div className="flex items-start justify-between gap-4"><div><p className="tbo-body flex items-center gap-2 text-foreground"><Sparkles className="h-4 w-4 text-amber-500" />{copy.prayerLink}</p><p className="tbo-caption mt-1 text-muted-foreground">{copy.prayerLinkHint}</p></div><Switch checked={draft.createPrayer} disabled={Boolean(editingItem?.prayerId)} onCheckedChange={checked => updateDraft('createPrayer', checked)} aria-label={copy.prayerLink} /></div>{draft.createPrayer && <div className="mt-4 rounded-xl tbo-glass-inset p-4 ring-1 ring-[var(--glass-rim)]"><p className="tbo-eyebrow text-[var(--glass-accent)]">{copy.prayerPreview}</p><p className="tbo-supporting mt-2 text-foreground">{prayerPreview.title}</p><p className="tbo-caption mt-1 text-muted-foreground">{prayerPreview.text}</p><p className="tbo-caption mt-2 text-[var(--glass-accent)]">{prayerPreview.scripture}</p></div>}</div>
            <div className="flex gap-3 pt-1"><Button type="button" variant="outline" className="tbo-action h-12 flex-1 rounded-xl" onClick={() => { setDialogOpen(false); setEditingItem(null); }}>{copy.cancel}</Button><Button type="submit" disabled={saving || !draft.title.trim()} className="tbo-action h-12 flex-[1.4] rounded-xl">{saving ? <><LoadingMark className="h-4 w-4" />{editingItem ? copy.updating : copy.creating}</> : editingItem ? <><Pencil className="h-4 w-4" />{copy.update}</> : <><Plus className="h-4 w-4" />{copy.create}</>}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
