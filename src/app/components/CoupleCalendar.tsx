import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3,
  Heart, ListTodo, Loader2, MapPin, Plus, Repeat2, Sparkles, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import {
  buildPrayerFallback, CALENDAR_CATEGORY_EMOJI, CALENDAR_TYPE_META, CalendarCategory,
  CalendarDraft, CalendarItemType, CalendarRecurrence, CoupleCalendarItem,
  coupleCalendarCopy, getWeekDays, isSameLocalDay, occursOnDay, startOfWeek,
} from '../data/couple-calendar';
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
}

type CalendarView = 'weekly' | 'events' | 'prayers';

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
    title: '', description: '', type: 'plan', category: 'faith',
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

export function CoupleCalendar({ accessToken, userId, userName, partnerName, onBack, onPrayerChanged }: CoupleCalendarProps) {
  const { language } = useLanguage();
  const copy = coupleCalendarCopy[language];
  const locale = localeByLanguage[language];
  const [items, setItems] = useState<CoupleCalendarItem[]>([]);
  const [view, setView] = useState<CalendarView>('weekly');
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<CalendarDraft>(() => initialDraft(language));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/calendar`;

  const loadItems = async (silent = false) => {
    try {
      const response = await fetch(apiUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error('Calendar request failed');
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error('[CoupleCalendar] Load failed:', error);
      if (!silent) toast.error(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
    const interval = window.setInterval(() => void loadItems(true), 30_000);
    return () => window.clearInterval(interval);
  }, [accessToken, userId, language]);
  useEffect(() => { setDraft(current => ({ ...current, language })); }, [language]);

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);
  const selectedItems = useMemo(
    () => items.filter(item => item.status !== 'completed' && occursOnDay(item, selectedDay))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [items, selectedDay],
  );
  const upcomingItems = useMemo(() => items
    .filter(item => item.status !== 'completed' && new Date(item.startsAt).getTime() >= startOfWeek(new Date()).getTime())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [items]);
  const linkedPrayerItems = useMemo(() => items.filter(item => item.prayerId && item.prayerText), [items]);
  const weekCount = items.filter(item => weekDays.some(day => occursOnDay(item, day)) && item.status !== 'completed').length;

  const openCreate = (type: CalendarItemType = 'plan', day?: Date) => {
    const next = initialDraft(language);
    next.type = type;
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
    setDialogOpen(true);
  };

  const moveWeek = (days: number) => {
    setWeekAnchor(current => new Date(current.getFullYear(), current.getMonth(), current.getDate() + days));
    setSelectedDay(current => new Date(current.getFullYear(), current.getMonth(), current.getDate() + days));
  };

  const updateDraft = <K extends keyof CalendarDraft>(key: K, value: CalendarDraft[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.startsAt) return;
    setSaving(true);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, startsAt: new Date(draft.startsAt).toISOString(), endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Calendar create failed');
      setItems(current => [data.item, ...current]);
      setDialogOpen(false);
      toast.success(copy.created);
      if (data.prayer) await onPrayerChanged?.();
    } catch (error) {
      console.error('[CoupleCalendar] Create failed:', error);
      toast.error(copy.failed);
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
      setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status } : entry));
    } catch { toast.error(copy.failed); }
  };

  const deleteItem = async (item: CoupleCalendarItem) => {
    if (!window.confirm(copy.deleteConfirm)) return;
    try {
      const response = await fetch(`${apiUrl}/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error('Delete failed');
      setItems(current => current.filter(entry => entry.id !== item.id));
      if (item.prayerId) await onPrayerChanged?.();
    } catch { toast.error(copy.failed); }
  };

  const formatTime = (item: CoupleCalendarItem) => item.allDay
    ? copy.allDay
    : new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(item.startsAt));

  const renderItem = (item: CoupleCalendarItem) => (
    <article key={item.id} className={`group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${itemAccent(item.type)} ${item.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/80 text-lg shadow-sm">{CALENDAR_CATEGORY_EMOJI[item.category]}</div>
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
            <button type="button" onClick={() => void updateStatus(item)} className="grid h-9 w-9 place-items-center rounded-full bg-white/75 text-slate-600 hover:bg-white" aria-label={copy.complete}><Check className="h-4 w-4" /></button>
            <button type="button" onClick={() => void deleteItem(item)} className="grid h-9 w-9 place-items-center rounded-full bg-white/75 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={copy.delete}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </article>
  );

  const prayerPreview = buildPrayerFallback(draft.title, draft.category, language);

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl pb-28">
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-violet-50 px-5 py-6 shadow-[0_24px_70px_-45px_rgba(190,24,93,.5)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-rose-200/35 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full border border-white bg-white/80 text-slate-600 shadow-sm" aria-label={copy.back}><ArrowLeft className="h-5 w-5" /></button>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-rose-700 shadow-sm ring-1 ring-rose-100"><Heart className="h-3.5 w-3.5 fill-rose-500" />{copy.eyebrow}</div>
            <button type="button" onClick={() => openCreate()} className="grid h-10 w-10 place-items-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-200" aria-label={copy.newItem}><Plus className="h-5 w-5" /></button>
          </div>
          <div className="mt-7 max-w-2xl">
            <p className="text-sm font-semibold text-rose-600">{userName || copy.you} {partnerName ? `& ${partnerName}` : ''}</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-.04em] text-slate-950 sm:text-4xl">{copy.title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">{copy.subtitle}</p>
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
          <button key={type} type="button" onClick={() => openCreate(type)} className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-bold shadow-sm transition-all hover:-translate-y-0.5 ${itemAccent(type)}`}>
            <span className="text-xl">{CALENDAR_TYPE_META[type].icon}</span>{copy[type]}
          </button>
        ))}
      </div>

      <nav className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1.5" aria-label={copy.title}>
        {([
          ['weekly', CalendarDays, copy.weekly], ['events', ListTodo, copy.events], ['prayers', Heart, copy.prayers],
        ] as const).map(([id, Icon, label]) => (
          <button key={id} type="button" onClick={() => setView(id)} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold transition-all sm:text-sm ${view === id ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500'}`}><Icon className="h-4 w-4" />{label}</button>
        ))}
      </nav>

      {loading ? (
        <div className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-rose-500" /></div>
      ) : view === 'weekly' ? (
        <section className="mt-6 space-y-5">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <button type="button" onClick={() => moveWeek(-7)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => { setWeekAnchor(new Date()); setSelectedDay(new Date()); }} className="text-sm font-bold text-slate-800">{copy.today}</button>
            <button type="button" onClick={() => moveWeek(7)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map(day => {
              const selected = isSameLocalDay(day, selectedDay);
              const today = isSameLocalDay(day, new Date());
              const count = items.filter(item => item.status !== 'completed' && occursOnDay(item, day)).length;
              return <button type="button" key={day.toISOString()} onClick={() => setSelectedDay(day)} className={`relative flex min-h-20 flex-col items-center justify-center rounded-2xl border text-center transition-all ${selected ? 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-200' : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200'}`}>
                <span className="text-[10px] font-bold uppercase">{new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)}</span>
                <span className="mt-1 text-xl font-black">{day.getDate()}</span>
                {count > 0 && <span className={`mt-1 h-1.5 w-1.5 rounded-full ${selected ? 'bg-white' : 'bg-rose-500'}`} />}
                {today && !selected && <span className="absolute inset-x-2 bottom-1 text-[8px] font-bold uppercase text-rose-600">{copy.today}</span>}
              </button>;
            })}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[.14em] text-rose-600">{new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(selectedDay)}</p><h2 className="mt-1 text-xl font-black text-slate-950">{new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(selectedDay)}</h2></div>
            <Button onClick={() => openCreate('plan', selectedDay)} className="rounded-full bg-slate-950 text-white"><Plus className="h-4 w-4" />{copy.newItem}</Button>
          </div>
          <div className="space-y-3">
            {selectedItems.length ? selectedItems.map(renderItem) : <Card className="rounded-[1.75rem] border-dashed border-rose-200 bg-gradient-to-br from-white to-rose-50/50"><CardContent className="p-9 text-center"><Sparkles className="mx-auto h-8 w-8 text-amber-400" /><h3 className="mt-3 font-black text-slate-900">{copy.emptyDay}</h3><p className="mt-1 text-sm text-slate-500">{copy.emptyDayHint}</p></CardContent></Card>}
          </div>
        </section>
      ) : view === 'events' ? (
        <section className="mt-6 space-y-4">
          <div><p className="text-xs font-bold uppercase tracking-[.14em] text-rose-600">{copy.upcoming}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{copy.events}</h2></div>
          {upcomingItems.length ? upcomingItems.map(item => <div key={item.id}><p className="mb-2 ml-1 text-xs font-bold text-slate-400">{new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(item.startsAt))}</p>{renderItem(item)}</div>) : <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">{copy.noUpcoming}</p>}
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          <div><p className="text-xs font-bold uppercase tracking-[.14em] text-rose-600">{copy.linkedPrayers}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{copy.prayers}</h2></div>
          {linkedPrayerItems.length ? linkedPrayerItems.map(item => <article key={item.id} className="rounded-[1.5rem] border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 p-5 shadow-sm"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-100">🙏</div><div><h3 className="font-black text-slate-900">{item.prayerTitle}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.prayerText}</p>{item.scripture && <p className="mt-3 text-xs font-bold text-rose-700">{copy.scripture}: {item.scripture}</p>}</div></div></article>) : <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">{copy.noUpcoming}</p>}
        </section>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[94dvh] overflow-y-auto rounded-[1.75rem] border-rose-100 p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-rose-100 bg-gradient-to-br from-rose-50 via-white to-violet-50 px-6 py-6 pr-12 text-left">
            <DialogTitle className="text-2xl font-black text-slate-950">{copy.newTitle}</DialogTitle>
            <DialogDescription className="leading-6 text-slate-600">{copy.newDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5 p-6">
            <div className="space-y-2"><Label>{copy.itemType}</Label><div className="grid grid-cols-4 gap-2">{(['plan', 'event', 'reminder', 'routine'] as CalendarItemType[]).map(type => <button key={type} type="button" onClick={() => updateDraft('type', type)} className={`min-h-16 rounded-xl border px-2 text-xs font-bold ${draft.type === type ? itemAccent(type) + ' ring-2 ring-current/10' : 'border-slate-200 bg-white text-slate-500'}`}><span className="block text-lg">{CALENDAR_TYPE_META[type].icon}</span>{copy[type]}</button>)}</div></div>
            <div className="space-y-2"><Label htmlFor="calendar-title">{copy.titleLabel}</Label><Input id="calendar-title" required value={draft.title} onChange={e => updateDraft('title', e.target.value)} placeholder={copy.titlePlaceholder} className="h-12 rounded-xl" /></div>
            <div className="space-y-2"><Label htmlFor="calendar-notes">{copy.descriptionLabel}</Label><Textarea id="calendar-notes" value={draft.description} onChange={e => updateDraft('description', e.target.value)} placeholder={copy.descriptionPlaceholder} className="min-h-24 rounded-xl" /></div>
            <div className="space-y-2"><Label>{copy.category}</Label><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{(['faith', 'relationship', 'family', 'health', 'finance', 'service', 'other'] as CalendarCategory[]).map(category => <button key={category} type="button" onClick={() => updateDraft('category', category)} className={`min-h-16 rounded-xl border px-1 text-[10px] font-bold ${draft.category === category ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white text-slate-500'}`}><span className="block text-lg">{CALENDAR_CATEGORY_EMOJI[category]}</span>{copy[category]}</button>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="calendar-start">{copy.starts}</Label><Input id="calendar-start" type="datetime-local" required value={draft.startsAt} onChange={e => updateDraft('startsAt', e.target.value)} className="h-12 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="calendar-end">{copy.ends}</Label><Input id="calendar-end" type="datetime-local" value={draft.endsAt} onChange={e => updateDraft('endsAt', e.target.value)} className="h-12 rounded-xl" /></div></div>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-rose-500" />{copy.allDay}</span><Switch checked={draft.allDay} onCheckedChange={checked => updateDraft('allDay', checked)} /></label>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="calendar-repeat">{copy.repeats}</Label><select id="calendar-repeat" value={draft.recurrence} onChange={e => updateDraft('recurrence', e.target.value as CalendarRecurrence)} className="h-12 w-full rounded-xl border border-input bg-white px-3 text-sm"><option value="none">{copy.none}</option><option value="daily">{copy.daily}</option><option value="weekly">{copy.weeklyRepeat}</option><option value="monthly">{copy.monthly}</option></select></div><div className="space-y-2"><Label htmlFor="calendar-reminder">{copy.reminderLabel}</Label><select id="calendar-reminder" value={draft.reminderMinutes ?? 'none'} onChange={e => updateDraft('reminderMinutes', e.target.value === 'none' ? null : Number(e.target.value))} className="h-12 w-full rounded-xl border border-input bg-white px-3 text-sm"><option value="none">{copy.noReminder}</option><option value="0">{copy.atTime}</option><option value="15">{copy.fifteen}</option><option value="60">{copy.hour}</option><option value="1440">{copy.day}</option></select></div></div>
            <div className="space-y-2"><Label htmlFor="calendar-location">{copy.location}</Label><Input id="calendar-location" value={draft.location} onChange={e => updateDraft('location', e.target.value)} placeholder={copy.locationPlaceholder} className="h-12 rounded-xl" /></div>
            <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-amber-50 p-4"><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 font-black text-slate-900"><Sparkles className="h-4 w-4 text-amber-500" />{copy.prayerLink}</p><p className="mt-1 text-xs leading-5 text-slate-600">{copy.prayerLinkHint}</p></div><Switch checked={draft.createPrayer} onCheckedChange={checked => updateDraft('createPrayer', checked)} aria-label={copy.prayerLink} /></div>{draft.createPrayer && <div className="mt-4 rounded-xl bg-white/80 p-4 ring-1 ring-rose-100"><p className="text-[10px] font-black uppercase tracking-[.14em] text-rose-600">{copy.prayerPreview}</p><p className="mt-2 text-sm font-bold text-slate-900">{prayerPreview.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{prayerPreview.text}</p><p className="mt-2 text-[11px] font-bold text-rose-700">{prayerPreview.scripture}</p></div>}</div>
            <div className="flex gap-3 pt-1"><Button type="button" variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setDialogOpen(false)}>{copy.cancel}</Button><Button type="submit" disabled={saving || !draft.title.trim()} className="h-12 flex-[1.4] rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />{copy.creating}</> : <><Plus className="h-4 w-4" />{copy.create}</>}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
