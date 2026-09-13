import { useEffect, useRef, useState } from 'react';
import { BarChart3, Heart, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { MOOD_EMOJI, type MoodValue } from '../utils/dailyMood';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const REMINDER_DELAY_MS = 1_000;
const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1_000;
const MOODS: MoodValue[] = ['great', 'good', 'okay', 'sad'];

export interface DailyMoodCheckInProps {
  userId: string;
  userName: string;
  partnerName: string;
  mood: MoodValue | null;
  loaded: boolean;
  onSave: (mood: MoodValue) => Promise<void>;
  onViewAnalytics?: () => void;
}

// A new account gets its own dialog, pending-save lifecycle and reminder state.
export function DailyMoodCheckIn(props: DailyMoodCheckInProps) {
  return <UserMoodCheckIn key={props.userId} {...props} />;
}

function UserMoodCheckIn({ userId, userName, partnerName, mood, loaded, onSave, onViewAnalytics }: DailyMoodCheckInProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [automatic, setAutomatic] = useState(false);
  const [selected, setSelected] = useState<MoodValue | null>(mood);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const storageUnavailable = useRef(false);
  const lastShown = useRef(0);
  const mounted = useRef(true);
  const saveInProgress = useRef(false);
  const reminderKey = `twobeone:mood-check-in:last-shown:${userId}`;
  const canDismiss = !saving && (!automatic || saveError);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (mood && automatic && !saving) setOpen(false);
  }, [mood, automatic, saving]);

  useEffect(() => {
    if (!userId || !loaded || mood || open || storageUnavailable.current) return;

    let stopped = false;
    let timer: ReturnType<typeof window.setTimeout> | undefined;
    let waitingForDialog = false;
    const hasOtherDialog = () => Boolean(document.querySelector(
      '[role="dialog"]:not([data-state="closed"]), [role="alertdialog"]:not([data-state="closed"])',
    ));
    const clearTimer = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
    };
    const remainingCooldown = () => {
      const stored = Number(localStorage.getItem(reminderKey));
      const storedTime = Number.isFinite(stored) && stored > 0 ? stored : 0;
      return Math.max(storedTime, lastShown.current) + REMINDER_COOLDOWN_MS - Date.now();
    };

    const evaluate = () => {
      clearTimer();
      waitingForDialog = false;
      if (stopped || storageUnavailable.current || document.visibilityState !== 'visible') return;

      try {
        const remaining = remainingCooldown();
        if (remaining > 0) {
          // Cap long waits in case another device supplied a future timestamp.
          timer = window.setTimeout(evaluate, Math.min(remaining, 2_147_483_647));
          return;
        }
      } catch {
        storageUnavailable.current = true;
        return;
      }

      if (hasOtherDialog()) {
        waitingForDialog = true;
        return;
      }

      timer = window.setTimeout(() => {
        timer = undefined;
        if (stopped || document.visibilityState !== 'visible') return;
        if (hasOtherDialog()) {
          waitingForDialog = true;
          return;
        }
        try {
          // Recheck immediately before opening: another tab may have shown it.
          if (remainingCooldown() > 0) {
            evaluate();
            return;
          }
          const shownAt = Date.now();
          localStorage.setItem(reminderKey, String(shownAt));
          lastShown.current = shownAt;
        } catch {
          storageUnavailable.current = true;
          return;
        }
        setSelected(null);
        setSaveError(false);
        setAutomatic(true);
        setOpen(true);
      }, REMINDER_DELAY_MS);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === reminderKey || event.key === null) evaluate();
    };
    // Only reconsider DOM changes while blocked by another dialog; regular
    // dashboard updates must not keep restarting the opening delay.
    const observer = new MutationObserver(() => {
      if (waitingForDialog && !hasOtherDialog()) evaluate();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state', 'role'] });
    window.addEventListener('focus', evaluate);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', evaluate);
    evaluate();

    return () => {
      stopped = true;
      clearTimer();
      observer.disconnect();
      window.removeEventListener('focus', evaluate);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', evaluate);
    };
  }, [loaded, mood, open, reminderKey, userId]);

  const openManually = () => {
    lastShown.current = Date.now();
    try {
      localStorage.setItem(reminderKey, String(lastShown.current));
    } catch {
      storageUnavailable.current = true;
    }
    setSelected(mood);
    setSaveError(false);
    setAutomatic(false);
    setOpen(true);
  };

  const saveMood = async () => {
    if (!selected || saveInProgress.current) return;
    saveInProgress.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      await onSave(selected);
      if (mounted.current) setOpen(false);
    } catch {
      if (mounted.current) setSaveError(true);
    } finally {
      saveInProgress.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full border-rose-200 bg-white/80 text-rose-700 hover:bg-rose-50"
          aria-label={t.dashboard.todaysMood}
          onClick={openManually}
          disabled={!loaded}
        >
          {mood ? <span className="text-lg" aria-hidden="true">{MOOD_EMOJI[mood]}</span> : <Heart className="h-4 w-4" aria-hidden="true" />}
          {t.dashboard.todaysMood}
        </Button>
        {onViewAnalytics && (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-violet-600 hover:bg-violet-50" onClick={onViewAnalytics} aria-label={t.mood.analytics} title={t.mood.analytics}>
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(next) => { if (next || canDismiss) setOpen(next); }}>
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[1.75rem] border-rose-100 p-6 shadow-xl sm:max-w-md"
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 55%, #f5f3ff 100%)' }}
          showCloseButton={canDismiss}
          onEscapeKeyDown={(event) => { if (!canDismiss) event.preventDefault(); }}
          onInteractOutside={(event) => { if (!canDismiss) event.preventDefault(); }}
        >
          <DialogHeader className="items-center text-center sm:text-center">
            <span className="mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-white text-rose-500 shadow-sm"><Heart className="h-7 w-7" aria-hidden="true" /></span>
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-600">{userName || t.mood.you}</p>
            <DialogTitle className="text-xl font-bold leading-tight text-slate-950">{t.mood.howAreYouFeelingToday}</DialogTitle>
            <DialogDescription className="max-w-xs leading-relaxed">
              {t.mood.shareEmotionalState}
              {partnerName && <span className="mt-1 block font-medium text-violet-700">{partnerName}</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-2 py-3" role="group" aria-label={t.dashboard.yourMood}>
            {MOODS.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={t.mood[value]}
                aria-pressed={selected === value}
                disabled={saving}
                onClick={() => setSelected(value)}
                className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border px-1 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60 ${selected === value ? 'border-rose-400 bg-white text-rose-800 shadow-md ring-2 ring-rose-200' : 'border-white bg-white/60 text-slate-600 hover:border-rose-200 hover:bg-white'}`}
              >
                <span className="text-4xl" aria-hidden="true">{MOOD_EMOJI[value]}</span>
                <span className="break-words text-center text-xs font-semibold">{t.mood[value]}</span>
              </button>
            ))}
          </div>
          {saveError && <p role="alert" className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700">{t.mood.failedSave}. {t.messages.tryAgainLater}</p>}
          <Button type="button" className="h-11 w-full rounded-full bg-rose-600 font-semibold text-white hover:bg-rose-700" disabled={!selected || saving} onClick={saveMood}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {saving ? t.common.loading : t.mood.saveMood}
          </Button>
          {canDismiss && <Button type="button" variant="ghost" className="rounded-full text-slate-500" onClick={() => setOpen(false)}>{t.common.close}</Button>}
        </DialogContent>
      </Dialog>
    </>
  );
}
