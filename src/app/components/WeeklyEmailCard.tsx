import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Loader2, Mail, PauseCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ShabbatShalomConsoleProps {
  accessToken?: string;
}

const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/newsletter/preference`;

function requestHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: publicAnonKey,
    'Content-Type': 'application/json',
  };
}

export function ShabbatShalomConsole({ accessToken }: ShabbatShalomConsoleProps) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(endpoint, { headers: requestHeaders(accessToken), signal: controller.signal })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to load email preference.');
        setEnabled(Boolean(data.enabled));
      })
      .catch(error => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setMessage(error instanceof Error ? error.message : 'Unable to load email preference.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [accessToken]);

  if (!accessToken) return null;

  const updatePreference = async () => {
    if (enabled === null || saving) return;
    const nextEnabled = !enabled;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: requestHeaders(accessToken),
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to update email preference.');
      setEnabled(Boolean(data.enabled));
      setMessage(data.message || 'Your Shabbat Shalom preference was updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update email preference.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50 shadow-[0_14px_38px_-24px_rgba(190,24,93,.5)]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-200">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-600">TwoBeOne Saturday console</p>
                <h2 className="mt-1 text-lg font-bold text-foreground">Shabbat Shalom</h2>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${enabled === false ? 'bg-neutral-100 text-neutral-600' : 'bg-emerald-100 text-emerald-700'}`}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : enabled === false ? <PauseCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {loading ? 'Checking' : enabled === false ? 'Paused' : 'Active'}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Encouragement, Scripture, practical relationship guidance, appreciation, and app updates for your week.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-foreground/75">
              <CalendarDays className="h-4 w-4 text-rose-500" aria-hidden="true" />
              Every Saturday at 9:00 AM Ethiopia time
            </div>
            {message && <p className="mt-3 text-xs leading-5 text-muted-foreground" role="status">{message}</p>}
            <Button
              type="button"
              variant={enabled === false ? 'default' : 'outline'}
              size="sm"
              onClick={updatePreference}
              disabled={loading || saving || enabled === null}
              className="mt-4 rounded-full"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Updating…' : enabled === false ? 'Resume Shabbat Shalom' : 'Pause Shabbat Shalom'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
