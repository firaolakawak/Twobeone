import { LoadingMark } from './BrandLoader';
import { useEffect, useRef, useState } from 'react';
import { Check, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { MOOD_EMOJI, type MoodValue } from '../utils/dailyMood';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const REMINDER_DELAY_MS = 1_000;
const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1_000;
const MOODS: MoodValue[] = ['great', 'good', 'okay', 'sad'];
// Use the same mood colors as the existing Mood Analytics selector.
const MOOD_COLORS = {
  great: { background: 'var(--success-50)', border: 'var(--success-500)', text: 'var(--success-700)' },
  good: { background: 'var(--secondary-50)', border: 'var(--secondary-500)', text: 'var(--secondary-700)' },
  okay: { background: 'var(--warning-50)', border: 'var(--warning-500)', text: 'var(--warning-700)' },
  sad: { background: 'var(--neutral-100)', border: 'var(--neutral-400)', text: 'var(--neutral-600)' },
} as const;

export interface DailyMoodCheckInProps {
  userId: string;
  userName: string;
  partnerName: string;
  mood: MoodValue | null;
  loaded: boolean;
  onSave: (mood: MoodValue) => Promise<void>;
  onViewAnalytics?: () => void;
  showControls?: boolean;
  openRequest?: number;
}

// A new account gets its own dialog, pending-save lifecycle and reminder state.
export function DailyMoodCheckIn(props: DailyMoodCheckInProps) {
  return <UserMoodCheckIn key={props.userId} {...props} />;
}

function UserMoodCheckIn({ userId, userName, partnerName, mood, loaded, onSave, onViewAnalytics, showControls = true, openRequest = 0 }: DailyMoodCheckInProps) {
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
  const handledOpenRequest = useRef(0);
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

  useEffect(() => {
    if (!openRequest || handledOpenRequest.current === openRequest) return;
    handledOpenRequest.current = openRequest;
    openManually();
  }, [openRequest, openManually]);

  return (
    <>
      {showControls && <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="tbo-action h-11 rounded-full border-rose-200/70 bg-card/80 px-4 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/30"
          aria-label={t.dashboard.todaysMood}
          onClick={openManually}
          disabled={!loaded}
        >
          {mood && <span className="text-base" aria-hidden="true">{MOOD_EMOJI[mood]}</span>}
          {t.dashboard.todaysMood}
        </Button>
        {onViewAnalytics && (
          <Button type="button" variant="link" size="sm" className="tbo-action h-11 rounded-lg px-1 text-muted-foreground hover:text-foreground" onClick={onViewAnalytics} aria-label={t.mood.analytics}>
            {t.mood.analytics}
          </Button>
        )}
      </div>}

      <Dialog open={open} onOpenChange={(next) => { if (next || canDismiss) setOpen(next); }}>
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-3xl border-border bg-card p-0 text-card-foreground shadow-xl sm:max-w-md"
          showCloseButton={canDismiss}
          onEscapeKeyDown={(event) => { if (!canDismiss) event.preventDefault(); }}
          onInteractOutside={(event) => { if (!canDismiss) event.preventDefault(); }}
        >
          <DialogHeader className="gap-3 border-b border-border bg-muted/40 px-5 py-5 text-left sm:px-6">
            <div className="tbo-label flex items-center gap-2 pr-6 text-primary">
              <Heart className="h-5 w-5" aria-hidden="true" />
              {t.dashboard.todaysMood}
            </div>
            <DialogTitle className="tbo-dialog-title text-foreground">{t.mood.howAreYouFeelingToday}</DialogTitle>
            <DialogDescription className="tbo-supporting">
              {t.mood.shareEmotionalState}
            </DialogDescription>
            <p className="tbo-caption flex flex-wrap items-center gap-1.5 text-muted-foreground">
              <span>{userName || t.mood.you}</span>
              {partnerName && <><span aria-hidden="true">&amp;</span><span>{partnerName}</span></>}
            </p>
          </DialogHeader>

          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div className="grid grid-cols-4 gap-2" role="group" aria-label={t.dashboard.yourMood}>
              {MOODS.map((value) => {
                const isSelected = selected === value;
                const colors = MOOD_COLORS[value];
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={t.mood[value]}
                    aria-pressed={isSelected}
                    disabled={saving}
                    onClick={() => setSelected(value)}
                    className="relative flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-1.5 py-3 text-muted-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                    style={isSelected ? { backgroundColor: colors.background, borderColor: colors.border, color: colors.text } : undefined}
                  >
                    {isSelected && <Check className="absolute right-1 top-1 h-3 w-3" strokeWidth={3} aria-hidden="true" />}
                    <span className="text-[1.75rem] leading-none" aria-hidden="true">{MOOD_EMOJI[value]}</span>
                    <span className="tbo-caption break-words text-center">{t.mood[value]}</span>
                  </button>
                );
              })}
            </div>
            {saveError && <p role="alert" className="tbo-supporting rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">{t.mood.failedSave}. {t.messages.tryAgainLater}</p>}
            <Button type="button" className="tbo-action h-12 w-full rounded-xl" disabled={!selected || saving} onClick={saveMood}>
              {saving && <LoadingMark />}
              {saving ? t.common.loading : t.mood.saveMood}
            </Button>
            {canDismiss && <Button type="button" variant="ghost" className="tbo-action w-full rounded-xl text-muted-foreground" onClick={() => setOpen(false)}>{t.common.close}</Button>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
