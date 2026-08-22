import { useEffect, useMemo, useRef, useState } from 'react';
import { AlarmClock, CalendarDays, Volume2, X } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import type { CoupleCalendarItem } from '../data/couple-calendar';
import { Button } from './ui/button';

interface CalendarAlarmManagerProps {
  accessToken: string;
  onOpenCalendar: () => void;
}

interface DueAlarm {
  item: CoupleCalendarItem;
  occurrence: Date;
  storageKey: string;
}

const ALARM_LOOKBACK_MS = 10 * 60_000;
const ONE_HOUR_MS = 60 * 60_000;

function monthlyOccurrence(first: Date, target: Date) {
  const candidates = [-1, 0, 1].map(offset => {
    const candidate = new Date(target);
    candidate.setDate(1);
    candidate.setMonth(candidate.getMonth() + offset);
    const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
    candidate.setDate(Math.min(first.getDate(), lastDay));
    candidate.setHours(first.getHours(), first.getMinutes(), first.getSeconds(), first.getMilliseconds());
    return candidate;
  });
  return candidates.sort((left, right) => Math.abs(left.getTime() - target.getTime()) - Math.abs(right.getTime() - target.getTime()))[0];
}

export function alarmOccurrence(item: CoupleCalendarItem, now = new Date()): Date | null {
  const first = new Date(item.startsAt);
  if (!Number.isFinite(first.getTime())) return null;
  const target = new Date(now.getTime() + ONE_HOUR_MS);
  if (item.recurrence === 'none') return first;
  if (item.recurrence === 'monthly') return monthlyOccurrence(first, target);
  const period = item.recurrence === 'daily' ? 86_400_000 : 7 * 86_400_000;
  const index = Math.max(0, Math.round((target.getTime() - first.getTime()) / period));
  return new Date(first.getTime() + index * period);
}

export function findDueCalendarAlarm(items: CoupleCalendarItem[], now = new Date()): DueAlarm | null {
  return items
    .filter(item => (item.type === 'event' || item.type === 'plan') && item.status !== 'completed' && item.reminderMinutes === 60 && !item.isLockedForPartner)
    .map(item => {
      const occurrence = alarmOccurrence(item, now);
      if (!occurrence) return null;
      const alarmAt = occurrence.getTime() - ONE_HOUR_MS;
      const storageKey = `twobeone:calendar-alarm:${item.id}:${occurrence.toISOString()}`;
      return { item, occurrence, storageKey, alarmAt };
    })
    .filter((alarm): alarm is DueAlarm & { alarmAt: number } => alarm !== null)
    .filter(alarm => now.getTime() >= alarm.alarmAt && now.getTime() - alarm.alarmAt < ALARM_LOOKBACK_MS)
    .filter(alarm => window.localStorage.getItem(alarm.storageKey) !== 'dismissed')
    .sort((left, right) => left.alarmAt - right.alarmAt)[0] || null;
}

export function CalendarAlarmManager({ accessToken, onOpenCalendar }: CalendarAlarmManagerProps) {
  const [items, setItems] = useState<CoupleCalendarItem[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [dismissedVersion, setDismissedVersion] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dueAlarm = useMemo(() => findDueCalendarAlarm(items, now), [items, now, dismissedVersion]);

  useEffect(() => {
    const primeAudio = () => {
      const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextConstructor) return;
      audioContextRef.current ||= new AudioContextConstructor();
      void audioContextRef.current.resume();
    };
    document.addEventListener('pointerdown', primeAudio, { once: true });
    document.addEventListener('keydown', primeAudio, { once: true });
    return () => {
      document.removeEventListener('pointerdown', primeAudio);
      document.removeEventListener('keydown', primeAudio);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/calendar`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        // The next poll retries silently; alarms should not interrupt the rest of the app.
      }
    };
    void load();
    const refreshInterval = window.setInterval(load, 30_000);
    const clockInterval = window.setInterval(() => setNow(new Date()), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.clearInterval(clockInterval);
    };
  }, [accessToken]);

  useEffect(() => {
    if (!dueAlarm) return;
    const ring = () => {
      const context = audioContextRef.current;
      if (!context) return;
      void context.resume();
      [0, 0.32, 0.64].forEach((offset, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'square';
        oscillator.frequency.value = index % 2 === 0 ? 880 : 660;
        gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.35, context.currentTime + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + 0.24);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + offset);
        oscillator.stop(context.currentTime + offset + 0.26);
      });
    };
    ring();
    const ringInterval = window.setInterval(ring, 1_500);
    return () => window.clearInterval(ringInterval);
  }, [dueAlarm?.storageKey]);

  if (!dueAlarm) return null;

  const dismiss = () => {
    window.localStorage.setItem(dueAlarm.storageKey, 'dismissed');
    setDismissedVersion(version => version + 1);
  };
  const eventTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(dueAlarm.occurrence);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="calendar-alarm-title" aria-describedby="calendar-alarm-description">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-2xl">
        <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 px-6 py-8 text-center text-white">
          <button type="button" onClick={dismiss} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/20 hover:bg-white/30" aria-label="Dismiss alarm"><X className="h-5 w-5" /></button>
          <span className="mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full bg-white/20 ring-4 ring-white/20"><AlarmClock className="h-11 w-11" /></span>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[.18em]"><Volume2 className="h-4 w-4" />One-hour alarm</p>
          <h2 id="calendar-alarm-title" className="mt-2 text-2xl font-black">{dueAlarm.item.title}</h2>
        </div>
        <div className="space-y-5 p-6 text-center">
          <p id="calendar-alarm-description" className="text-base leading-7 text-slate-700">This {dueAlarm.item.type} begins at <strong>{eventTime}</strong>—in one hour.</p>
          {dueAlarm.item.location && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">{dueAlarm.item.location}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={dismiss} className="h-12 rounded-xl">Dismiss</Button>
            <Button type="button" onClick={() => { dismiss(); onOpenCalendar(); }} className="h-12 rounded-xl bg-rose-600 text-white hover:bg-rose-700"><CalendarDays className="h-4 w-4" />Open calendar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
