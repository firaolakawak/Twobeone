import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3,
  BookHeart, Heart, ListTodo, Loader2, MapPin, Pencil, Plus, Repeat2, Sparkles, Trophy, Trash2,
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
    location: '', createPrayer: true, language,
  };
}

function itemAccent(type: CalendarItemType) {
  return {
    plan: 'border-rose-200 bg-rose-50/70 text-rose-700',
    event: 'border-violet-200 bg-violet-50/70 text-violet-700',
    reminder: 'border-amber-200 bg-amber-50/70 text-amber-800',
    routine: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
  }[type];
}

export function CoupleCalendar({
  accessToken, userId, userName, partnerName, onBack, onPrayerChanged,
  milestones = [], journalEntries = [], onOpenMilestones, onOpenJournal, onDataRefresh,
}: CoupleCalendarProps) {
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
    ? new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(calendarAnchor)
    : period === 'monthly'
      ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(calendarAnchor)
      : `${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(weekDays[0])} – ${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(weekDays[6])}`;

  const renderDayCircle = (day: Date, compact = false) => {
    const marks = marksForDay(day);
    const selected = isSameLocalDay(day, selectedDay);
    const today = isSameLocalDay(day, new Date());
    const emoji = emojiForDay(day);
    return <span className={`relative grid shrink-0 place-items-center rounded-full font-black transition-all ${compact ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm sm:h-12 sm:w-12 sm:text-sm'} ${selected ? 'bg-rose-600 text-white shadow-md shadow-rose-200 ring-2 ring-rose-300 ring-offset-2' : marks.length ? 'bg-rose-50 text-slate-950 ring-2 ring-rose-500 ring-offset-1' : today ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-300' : 'text-slate-800'}`}>
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
    : new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(item.startsAt));

  const formatRelatedDate = (value?: string) => value
    ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
    : '';

  const renderItem = (item: CoupleCalendarItem) => (
    <article key={item.id} className={`group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${itemAccent(item.type)} ${item.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/80 text-lg shadow-sm">{item.emoji || CALENDAR_CATEGORY_EMOJI[item.category]}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-bold text-slate-900 ${item.status === 'completed' ? 'line-through' : ''}`}>{item.title}</h3>
            {item.isPartner && <Badge variant="outline" className="border-white/80 bg-white/70 text-[10px]">{copy.partner}</Badge>}
            {item.recurrence !== 'none' && <Repeat2 className="h-3.5 w-3.5" aria-label={copy.repeats} />}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium opacity-80">
            <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatTime(item)}</span>
            {item.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.location}</span>}
            {item.reminderMinutes !== null && <span className="flex items-center gap-1"><Bell className="h-3.5 w-3.5" />{copy.reminderLabel}</span>}
          </p>
          {item.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>}
          {item.prayerId && <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[11px] font-bold text-rose-700"><Heart className="h-3 w-3 fill-rose-500" />{copy.prayerReady}</div>}
        </div>
        {!item.isPartner && (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => openEdit(item)} className="grid h-9 w-9 place-items-center rounded-full bg-white/75 text-slate-600 hover:bg-white" aria-label={copy.edit}><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => void updateStatus(item)} className="grid h-9 w-9 place-items-center rounded-full bg-white/75 text-slate-600 hover:bg-white" aria-label={copy.complete}><Check className="h-4 w-4" /></button>
            <button type="button" onClick={() => void deleteItem(item)} className="grid h-9 w-9 place-items-center rounded-full bg-white/75 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={copy.delete}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </article>
  );

  const prayerPreview = buildPrayerFallback(draft.title, draft.category, language);

  return (
    <div className="couple-calendar-mobile mx-auto min-h-screen w-full max-w-4xl pb-32">
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-violet-50 px-5 py-6 shadow-[0_24px_70px_-45px_rgba(190,24,93,.5)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-rose-200/35 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="app-icon-button grid h-11 w-11 place-items-center rounded-full border border-white bg-white/90 text-slate-700 shadow-sm" aria-label={copy.back}><ArrowLeft className="h-6 w-6" /></button>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-extrabold uppercase tracking-[.12em] text-rose-700 shadow-sm ring-1 ring-rose-100"><Heart className="h-4 w-4 shrink-0 fill-rose-500" />{copy.eyebrow}</div>
            <button type="button" onClick={() => openCreate()} className="app-icon-button grid h-11 w-11 place-items-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-200" aria-label={copy.newItem}><Plus className="h-6 w-6" /></button>
          </div>
          <div className="mt-7 max-w-2xl">
            <p className="text-sm font-semibold text-rose-600">{userName || copy.you} {partnerName ? `& ${partnerName}` : ''}</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-.04em] text-slate-950 sm:text-4xl">{copy.title}</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-700">{copy.subtitle}</p>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2 border-t border-rose-100 pt-5 sm:gap-4">
            <div><p className="text-2xl font-black text-slate-950">{weekCount}</p><p className="text-xs font-semibold text-slate-500">{copy.plansThisWeek}</p></div>
            <div className="border-l border-rose-100 pl-3"><p className="text-2xl font-black text-slate-950">{linkedPrayerItems.length}</p><p className="text-xs font-semibold text-slate-500">{copy.linkedPrayers}</p></div>
            <div className="border-l border-rose-100 pl-3"><p className="text-2xl font-black text-slate-950">{items.filter(item => item.type === 'routine').length}</p><p className="text-xs font-semibold text-slate-500">{copy.routines}</p></div>
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-4 gap-2">
        {(['plan', 'event', 'reminder', 'routine'] as CalendarItemType[]).map(type => (
          <button key={type} type="button" onClick={() => openCreate(type)} className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border text-sm font-extrabold shadow-sm transition-all hover:-translate-y-0.5 ${itemAccent(type)}`}>
            <span className="text-2xl">{CALENDAR_TYPE_META[type].icon}</span>{copy[type]}
          </button>
        ))}
      </div>

      <nav className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5" aria-label={copy.title}>
        {([
          ['calendar', CalendarDays, copy.calendar], ['events', ListTodo, copy.events],
        ] as const).map(([id, Icon, label]) => (
          <button key={id} type="button" onClick={() => setView(id)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-extrabold transition-all ${view === id ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600'}`}><Icon className="h-5 w-5" />{label}</button>
        ))}
      </nav>

      {loading ? (
        <div className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-rose-500" /></div>
      ) : view === 'calendar' ? (
        <section className="mt-6 space-y-5">
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-rose-100 bg-rose-50/60 p-1.5">
            {([['weekly', copy.weekly], ['monthly', copy.monthlyView], ['yearly', copy.yearly]] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setPeriod(id)} className={`min-h-12 rounded-xl px-3 text-sm font-black transition-all ${period === id ? 'bg-white text-rose-700 shadow-sm ring-1 ring-rose-100' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <button type="button" onClick={() => moveCalendar(-1)} className="app-icon-button grid h-11 w-11 place-items-center rounded-full text-slate-700 hover:bg-slate-100" aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
            <div className="text-center"><p className="text-base font-black text-slate-950">{periodTitle}</p><button type="button" onClick={() => { setCalendarAnchor(new Date()); setSelectedDay(new Date()); }} className="mt-1 min-h-8 rounded-full px-3 text-xs font-black uppercase tracking-wider text-rose-700">{copy.today}</button></div>
            <button type="button" onClick={() => moveCalendar(1)} className="app-icon-button grid h-11 w-11 place-items-center rounded-full text-slate-700 hover:bg-slate-100" aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
          </div>

          {period === 'weekly' && (
            <div className="grid grid-cols-7 divide-x divide-slate-100 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white px-2 shadow-sm">
              {weekDays.map(day => {
                const marks = marksForDay(day);
                return <button type="button" key={day.toISOString()} onClick={() => selectCalendarDay(day)} aria-label={`${new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(day)}, ${marks.length} ${copy.items}`} className="relative flex min-h-28 flex-col items-center justify-center border-y border-rose-200/90 py-3 text-center transition-colors hover:bg-rose-50/50">
                  <span className="mb-3 text-xs font-black uppercase text-slate-600">{new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(day)}</span>
                  {renderDayCircle(day)}
                </button>;
              })}
            </div>
          )}

          {period === 'monthly' && (
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-7 sm:py-6">
              <div className="grid grid-cols-7 border-b-2 border-rose-300">{weekDays.map(day => <div key={day.getDay()} className="pb-3 text-center text-xs font-black uppercase text-slate-600">{new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(day)}</div>)}</div>
              <div className="grid grid-cols-7">
                {monthDays.map(day => {
                  const inMonth = day.getMonth() === calendarAnchor.getMonth();
                  const marks = marksForDay(day);
                  return <button type="button" key={day.toISOString()} onClick={() => selectCalendarDay(day)} aria-label={`${new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(day)}, ${marks.length} ${copy.items}`} className={`flex min-h-16 items-center justify-center border-b-2 border-rose-200/90 py-2 transition-colors sm:min-h-20 ${inMonth ? 'hover:bg-rose-50/40' : 'opacity-35 hover:bg-slate-50'}`}>
                    {renderDayCircle(day)}
                  </button>;
                })}
              </div>
            </div>
          )}

          {period === 'yearly' && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {yearMonths.map(month => {
                return <article key={month.getMonth()} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <button type="button" onClick={() => { setCalendarAnchor(month); setPeriod('monthly'); }} className="mb-3 w-full text-left text-sm font-black text-slate-900 hover:text-rose-700">{new Intl.DateTimeFormat(locale, { month: 'long' }).format(month)}</button>
                  <div className="grid grid-cols-7 border-b border-rose-300">{getWeekDays(month).map(day => <span key={day.getDay()} className="pb-1.5 text-center text-[8px] font-black uppercase text-slate-300">{new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(day)}</span>)}</div>
                  <div className="grid grid-cols-7">{getMonthGridDays(month).map(day => {
                    const inMonth = day.getMonth() === month.getMonth();
                    const marks = marksForDay(day);
                    return <button type="button" key={day.toISOString()} disabled={!inMonth} onClick={() => selectCalendarDay(day)} aria-label={inMonth ? `${new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(day)}, ${marks.length} ${copy.items}` : undefined} className={`flex aspect-square items-center justify-center border-b border-rose-200/80 transition-colors ${inMonth ? 'hover:bg-rose-50/50' : 'pointer-events-none'}`}>
                      {inMonth && renderDayCircle(day, true)}
                    </button>;
                  })}</div>
                </article>;
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-slate-50 px-4 py-3 text-[10px] font-bold text-slate-500"><span className="mr-1 uppercase tracking-wider text-slate-400">{copy.markedDays}</span>{(['plan', 'event', 'reminder', 'routine', 'milestone', 'journal'] as DayMark[]).map(type => <span key={type} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${markerColor[type]}`} />{copy[type]}</span>)}</div>

          <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-rose-50/70 p-4" aria-label={copy.syncedActivity}>
            <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-indigo-600">{copy.syncedActivity}</p><p className="mt-1 text-xs text-slate-500">{copy.syncedActivityHint}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-700 shadow-sm">{recordedActivities.length}</span></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(['prayer', 'devotional', 'qa', 'journal', 'verse', 'mood', 'stage'] as RecordedActivityType[]).map(type => {
              const count = recordedActivities.filter(activity => activity.type === type).length;
              const emoji = { prayer: '🙏', devotional: '📖', qa: '💬', journal: '✍️', verse: '📜', mood: '😊', stage: '🌱' }[type];
              return <div key={type} className="flex items-center gap-2 rounded-xl border border-white bg-white/80 px-3 py-2 shadow-sm"><span className="text-base">{emoji}</span><span className="min-w-0"><span className="block truncate text-[10px] font-bold text-slate-500">{activityLabels[type]}</span><span className="block text-sm font-black text-slate-900">{count}</span></span></div>;
            })}</div>
          </section>

          <div className="flex items-end justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[.14em] text-rose-600">{copy.selectedAgenda} · {new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(selectedDay)}</p><h2 className="mt-1 text-xl font-black text-slate-950">{new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(selectedDay)}</h2></div>
            <Button onClick={() => openCreate('plan', selectedDay)} className="rounded-full bg-slate-950 text-white"><Plus className="h-4 w-4" />{copy.newItem}</Button>
          </div>
          <div className="space-y-3">
            {selectedItems.map(renderItem)}
            {selectedMilestones.map(milestone => <button type="button" key={`milestone-${milestone.id}`} onClick={onOpenMilestones} className="flex w-full items-start gap-3 rounded-2xl border border-fuchsia-100 bg-fuchsia-50/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm">{milestone.icon && milestone.icon.length <= 4 ? milestone.icon : '🏆'}</span><span><span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-600">{copy.milestone}</span><span className="mt-1 block font-black text-slate-900">{milestone.title}</span>{milestone.description && <span className="mt-1 line-clamp-2 block text-sm text-slate-600">{milestone.description}</span>}</span></button>)}
            {selectedJournalEntries.map(entry => <button type="button" key={`journal-${entry.id}`} onClick={onOpenJournal} className="flex w-full items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm">{entry.emoji || '📖'}</span><span><span className="text-[10px] font-black uppercase tracking-wider text-sky-600">{copy.journal}</span><span className="mt-1 block font-black text-slate-900">{entry.title || copy.untitledJournal}</span><span className="mt-1 line-clamp-2 block text-sm text-slate-600">{entry.content}</span></span></button>)}
            {selectedRecordedActivities.map(activity => <article key={activity.id} className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/50 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xl shadow-sm ring-1 ring-indigo-100">{activity.emoji}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{activityLabels[activity.type]}</span>{activity.isPartner && <Badge variant="outline" className="bg-white text-[9px]">{copy.partner}</Badge>}</div><h3 className="mt-1 font-black text-slate-900">{activityTitle(activity)}</h3>{activity.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{activity.description}</p>}</div></article>)}
            {selectedItems.length === 0 && selectedMilestones.length === 0 && selectedJournalEntries.length === 0 && selectedRecordedActivities.length === 0 && <Card className="rounded-[1.75rem] border-dashed border-rose-200 bg-gradient-to-br from-white to-rose-50/50"><CardContent className="p-9 text-center"><Sparkles className="mx-auto h-8 w-8 text-amber-400" /><h3 className="mt-3 font-black text-slate-900">{copy.emptyDay}</h3><p className="mt-1 text-sm text-slate-500">{copy.emptyDayHint}</p></CardContent></Card>}
          </div>
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          <div><p className="text-xs font-bold uppercase tracking-[.14em] text-rose-600">{copy.upcoming}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{copy.events}</h2></div>
          {upcomingItems.length ? upcomingItems.map(item => <div key={item.id}><p className="mb-2 ml-1 text-xs font-bold text-slate-400">{new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(item.startsAt))}</p>{renderItem(item)}</div>) : <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">{copy.noUpcoming}</p>}
        </section>
      )}

      <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-label={copy.sharedMemories}>
        <article className="overflow-hidden rounded-[1.75rem] border border-fuchsia-100 bg-gradient-to-br from-white via-white to-fuchsia-50/60 shadow-sm">
          <header className="flex items-center justify-between gap-3 border-b border-fuchsia-100 px-5 py-4">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-fuchsia-100 text-fuchsia-700"><Trophy className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-fuchsia-600">{copy.ourJourney}</p><h2 className="font-black text-slate-950">{copy.relationshipMilestones}</h2></div></div>
            {onOpenMilestones && <button type="button" onClick={onOpenMilestones} className="rounded-full px-3 py-2 text-xs font-black text-fuchsia-700 hover:bg-fuchsia-50">{copy.viewAll}</button>}
          </header>
          <div className="space-y-1 p-3">
            {recentMilestones.length ? recentMilestones.map((milestone, index) => <button type="button" key={milestone.id} onClick={onOpenMilestones} className="flex w-full items-start gap-3 rounded-2xl p-3 text-left hover:bg-white hover:shadow-sm"><span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-lg">{milestone.icon && milestone.icon.length <= 4 ? milestone.icon : '💞'}{index < recentMilestones.length - 1 && <span className="absolute left-1/2 top-10 h-5 w-px bg-fuchsia-200" />}</span><span className="min-w-0"><span className="block truncate text-sm font-black text-slate-900">{milestone.title}</span><span className="mt-1 block text-xs font-semibold text-slate-500">{formatRelatedDate(milestone.date || milestone.createdAt)}{milestone.category ? ` · ${milestone.category}` : ''}</span></span></button>) : <div className="p-7 text-center"><Trophy className="mx-auto h-7 w-7 text-fuchsia-200" /><p className="mt-2 text-sm font-bold text-slate-500">{copy.noMilestones}</p></div>}
          </div>
        </article>

        <article className="overflow-hidden rounded-[1.75rem] border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50/60 shadow-sm">
          <header className="flex items-center justify-between gap-3 border-b border-sky-100 px-5 py-4">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-700"><BookHeart className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-sky-600">{copy.sharedMemories}</p><h2 className="font-black text-slate-950">{copy.recentJournalEntries}</h2></div></div>
            {onOpenJournal && <button type="button" onClick={onOpenJournal} className="rounded-full px-3 py-2 text-xs font-black text-sky-700 hover:bg-sky-50">{copy.viewAll}</button>}
          </header>
          <div className="space-y-1 p-3">
            {recentJournalEntries.length ? recentJournalEntries.map(entry => {
              const isPartner = entry.isPartner || (entry.userId && entry.userId !== userId) || (entry.author_id && entry.author_id !== userId);
              return <button type="button" key={entry.id} onClick={onOpenJournal} className="flex w-full items-start gap-3 rounded-2xl p-3 text-left hover:bg-white hover:shadow-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-lg">{entry.emoji || '📖'}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-black text-slate-900">{entry.title || copy.untitledJournal}</span>{isPartner && <Badge variant="outline" className="shrink-0 bg-white text-[9px]">{copy.partner}</Badge>}</span><span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{entry.content}</span><span className="mt-1 block text-[10px] font-bold text-sky-700">{formatRelatedDate(entry.createdAt || entry.created_at)}</span></span></button>;
            }) : <div className="p-7 text-center"><BookHeart className="mx-auto h-7 w-7 text-sky-200" /><p className="mt-2 text-sm font-bold text-slate-500">{copy.noJournalEntries}</p></div>}
          </div>
        </article>
      </section>

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditingItem(null); }}>
        <DialogContent className="max-h-[94dvh] overflow-y-auto rounded-[1.75rem] border-rose-100 p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-rose-100 bg-gradient-to-br from-rose-50 via-white to-violet-50 px-6 py-6 pr-12 text-left">
            <DialogTitle className="text-2xl font-black text-slate-950">{editingItem ? copy.editTitle : copy.newTitle}</DialogTitle>
            <DialogDescription className="leading-6 text-slate-600">{copy.newDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5 p-6">
            <div className="space-y-2"><Label>{copy.itemType}</Label><div className="grid grid-cols-4 gap-2">{(['plan', 'event', 'reminder', 'routine'] as CalendarItemType[]).map(type => <button key={type} type="button" onClick={() => updateDraft('type', type)} className={`min-h-16 rounded-xl border px-2 text-xs font-bold ${draft.type === type ? itemAccent(type) + ' ring-2 ring-current/10' : 'border-slate-200 bg-white text-slate-500'}`}><span className="block text-lg">{CALENDAR_TYPE_META[type].icon}</span>{copy[type]}</button>)}</div></div>
            <div className="space-y-2"><div><Label>{copy.chooseEmoji}</Label><p className="mt-1 text-xs text-slate-500">{copy.chooseEmojiHint}</p></div><div className="grid grid-cols-8 gap-2 rounded-2xl border border-rose-100 bg-rose-50/40 p-3">{CALENDAR_EVENT_EMOJIS.map(emoji => <button key={emoji} type="button" onClick={() => updateDraft('emoji', emoji)} aria-label={`${copy.chooseEmoji}: ${emoji}`} aria-pressed={draft.emoji === emoji} className={`grid aspect-square place-items-center rounded-full text-xl transition-all hover:-translate-y-0.5 ${draft.emoji === emoji ? 'bg-white shadow-md ring-2 ring-rose-500 ring-offset-2' : 'hover:bg-white/80'}`}>{emoji}</button>)}</div></div>
            <div className="space-y-2"><Label htmlFor="calendar-title">{copy.titleLabel}</Label><Input id="calendar-title" required value={draft.title} onChange={e => updateDraft('title', e.target.value)} placeholder={copy.titlePlaceholder} className="h-12 rounded-xl" /></div>
            <div className="space-y-2"><Label htmlFor="calendar-notes">{copy.descriptionLabel}</Label><Textarea id="calendar-notes" value={draft.description} onChange={e => updateDraft('description', e.target.value)} placeholder={copy.descriptionPlaceholder} className="min-h-24 rounded-xl" /></div>
            <div className="space-y-2"><Label>{copy.category}</Label><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{(['faith', 'relationship', 'family', 'health', 'finance', 'service', 'other'] as CalendarCategory[]).map(category => <button key={category} type="button" onClick={() => updateDraft('category', category)} className={`min-h-16 rounded-xl border px-1 text-[10px] font-bold ${draft.category === category ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white text-slate-500'}`}><span className="block text-lg">{CALENDAR_CATEGORY_EMOJI[category]}</span>{copy[category]}</button>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="calendar-start">{copy.starts}</Label><Input id="calendar-start" type="datetime-local" required value={draft.startsAt} onChange={e => updateDraft('startsAt', e.target.value)} className="h-12 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="calendar-end">{copy.ends}</Label><Input id="calendar-end" type="datetime-local" value={draft.endsAt} onChange={e => updateDraft('endsAt', e.target.value)} className="h-12 rounded-xl" /></div></div>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-rose-500" />{copy.allDay}</span><Switch checked={draft.allDay} onCheckedChange={checked => updateDraft('allDay', checked)} /></label>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="calendar-repeat">{copy.repeats}</Label><select id="calendar-repeat" value={draft.recurrence} onChange={e => updateDraft('recurrence', e.target.value as CalendarRecurrence)} className="h-12 w-full rounded-xl border border-input bg-white px-3 text-sm"><option value="none">{copy.none}</option><option value="daily">{copy.daily}</option><option value="weekly">{copy.weeklyRepeat}</option><option value="monthly">{copy.monthly}</option></select></div><div className="space-y-2"><Label htmlFor="calendar-reminder">{copy.reminderLabel}</Label><select id="calendar-reminder" value={draft.reminderMinutes ?? 'none'} onChange={e => updateDraft('reminderMinutes', e.target.value === 'none' ? null : Number(e.target.value))} className="h-12 w-full rounded-xl border border-input bg-white px-3 text-sm"><option value="none">{copy.noReminder}</option><option value="0">{copy.atTime}</option><option value="15">{copy.fifteen}</option><option value="60">{copy.hour}</option><option value="1440">{copy.day}</option></select></div></div>
            <div className="space-y-2"><Label htmlFor="calendar-location">{copy.location}</Label><Input id="calendar-location" value={draft.location} onChange={e => updateDraft('location', e.target.value)} placeholder={copy.locationPlaceholder} className="h-12 rounded-xl" /></div>
            <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-amber-50 p-4"><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 font-black text-slate-900"><Sparkles className="h-4 w-4 text-amber-500" />{copy.prayerLink}</p><p className="mt-1 text-xs leading-5 text-slate-600">{copy.prayerLinkHint}</p></div><Switch checked={draft.createPrayer} disabled={Boolean(editingItem?.prayerId)} onCheckedChange={checked => updateDraft('createPrayer', checked)} aria-label={copy.prayerLink} /></div>{draft.createPrayer && <div className="mt-4 rounded-xl bg-white/80 p-4 ring-1 ring-rose-100"><p className="text-[10px] font-black uppercase tracking-[.14em] text-rose-600">{copy.prayerPreview}</p><p className="mt-2 text-sm font-bold text-slate-900">{prayerPreview.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{prayerPreview.text}</p><p className="mt-2 text-[11px] font-bold text-rose-700">{prayerPreview.scripture}</p></div>}</div>
            <div className="flex gap-3 pt-1"><Button type="button" variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => { setDialogOpen(false); setEditingItem(null); }}>{copy.cancel}</Button><Button type="submit" disabled={saving || !draft.title.trim()} className="h-12 flex-[1.4] rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />{editingItem ? copy.updating : copy.creating}</> : editingItem ? <><Pencil className="h-4 w-4" />{copy.update}</> : <><Plus className="h-4 w-4" />{copy.create}</>}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
