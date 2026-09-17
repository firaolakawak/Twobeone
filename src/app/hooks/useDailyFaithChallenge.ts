import { useCallback, useEffect, useRef, useState } from 'react';
import { dailyFaithChallengeApi, DailyFaithChallengeError, type DailyFaithChallengeState, type DailyFaithSubmission } from '../utils/dailyFaithChallengeApi';

export function useDailyFaithChallenge(enabled: boolean) {
  const [challenge, setChallenge] = useState<DailyFaithChallengeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorOperation, setErrorOperation] = useState<'load' | 'save' | 'complete' | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const mounted = useRef(false);
  const sequence = useRef(0);
  const reading = useRef<AbortController | null>(null);
  const writing = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !mounted.current || writing.current || document.visibilityState === 'hidden') return;
    reading.current?.abort();
    const controller = new AbortController();
    reading.current = controller;
    const current = ++sequence.current;
    setLoading(true);
    try {
      const result = await dailyFaithChallengeApi.today(controller.signal);
      if (mounted.current && current === sequence.current) { setChallenge(result); setError(null); setErrorOperation(null); }
    } catch (reason) {
      if (mounted.current && current === sequence.current && !controller.signal.aborted) {
        setError(reason instanceof DailyFaithChallengeError ? reason.code : 'load');
        setErrorOperation('load');
      }
    } finally {
      if (current === sequence.current) { reading.current = null; if (mounted.current) setLoading(false); }
    }
  }, [enabled]);

  useEffect(() => {
    mounted.current = true;
    // An enabled/session boundary starts a new view. Previous writes may still
    // finish on the server, but their results must not restore the old view.
    writing.current = null;
    setChallenge(null);
    setError(null);
    setErrorOperation(null);
    setLoading(false);
    setSaving(false);
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 30_000);
    const foreground = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', foreground);
    document.addEventListener('visibilitychange', foreground);
    return () => {
      mounted.current = false;
      sequence.current++;
      reading.current?.abort();
      reading.current = null;
      writing.current = null;
      clearInterval(interval);
      window.removeEventListener('focus', foreground);
      document.removeEventListener('visibilitychange', foreground);
    };
  }, [refresh]);

  const write = async (operation: 'save' | 'complete', work: () => Promise<DailyFaithChallengeState>) => {
    if (!enabled || !mounted.current || writing.current !== null) return false;
    reading.current?.abort();
    const current = ++sequence.current;
    writing.current = current;
    setSaving(true); setLoading(false); setError(null); setErrorOperation(null);
    try {
      const result = await work();
      if (mounted.current && current === sequence.current) { setChallenge(result); return true; }
    } catch (reason) {
      if (mounted.current && current === sequence.current) {
        setError(reason instanceof DailyFaithChallengeError ? reason.code : operation);
        setErrorOperation(operation);
      }
    } finally {
      // A settled write from an earlier enabled/session boundary cannot unlock
      // a newer write that has since claimed the current operation slot.
      if (writing.current === current) writing.current = null;
      if (mounted.current && current === sequence.current) setSaving(false);
    }
    return false;
  };
  return { challenge, error, errorOperation, loading, saving, refresh,
    submit: (value: DailyFaithSubmission) => write('save', () => dailyFaithChallengeApi.submit(value)),
    complete: (value: Pick<DailyFaithSubmission, 'day' | 'missionId'>) => write('complete', () => dailyFaithChallengeApi.complete(value)),
  };
}
