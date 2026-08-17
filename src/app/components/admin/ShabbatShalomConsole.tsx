import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarClock, CheckCircle2, Loader2, Mail, RefreshCw, Send, UserCheck, UserMinus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../../utils/supabase/info';

interface ShabbatShalomConsoleProps {
  accessToken?: string;
}

interface AdminOverview {
  audience: {
    total: number;
    registeredUsers: number;
    registeredRecipients: number;
    standaloneSubscribers: number;
    pendingConfirmation: number;
    optedOut: number;
  };
  schedule: { enabled: boolean; label: string };
  lastCampaign?: { weekKey?: string; status?: string; sent?: number; completedAt?: string } | null;
}

interface NewsletterPreview {
  edition: {
    weekKey: string;
    subject: string;
    title: string;
    scripture: string;
    scriptureReference: string;
    encouragement: string;
    guidance: string;
    weeklyPractice: string;
    appFeature: string;
  };
}

const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/newsletter`;

export function ShabbatShalomConsole({ accessToken }: ShabbatShalomConsoleProps) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [preview, setPreview] = useState<NewsletterPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const headers = useCallback(() => ({
    Authorization: `Bearer ${accessToken || ''}`,
    'Content-Type': 'application/json',
  }), [accessToken]);

  const loadConsole = useCallback(async () => {
    if (!accessToken) {
      setError('An admin session is required to load Shabbat Shalom.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [overviewResponse, previewResponse] = await Promise.all([
        fetch(`${apiBase}/admin-overview`, { headers: headers() }),
        fetch(`${apiBase}/preview`, { headers: headers() }),
      ]);
      const overviewData = await overviewResponse.json().catch(() => ({}));
      const previewData = await previewResponse.json().catch(() => ({}));
      if (!overviewResponse.ok) throw new Error(overviewData.error || 'Unable to load the audience overview.');
      if (!previewResponse.ok) throw new Error(previewData.error || 'Unable to load the weekly preview.');
      setOverview(overviewData);
      setPreview(previewData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Shabbat Shalom.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, headers]);

  useEffect(() => {
    void loadConsole();
  }, [loadConsole]);

  const sendTest = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !testEmail.trim()) return;
    setSending(true);
    try {
      const response = await fetch(`${apiBase}/test`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email: testEmail.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to send the test email.');
      toast.success(`Shabbat Shalom test sent to ${testEmail.trim()}`);
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : 'Unable to send the test email.');
    } finally {
      setSending(false);
    }
  };

  const metrics = overview ? [
    { label: 'Total audience', value: overview.audience.total, icon: Users },
    { label: 'Registered recipients', value: overview.audience.registeredRecipients, icon: UserCheck },
    { label: 'Standalone subscribers', value: overview.audience.standaloneSubscribers, icon: Mail },
    { label: 'Opted out', value: overview.audience.optedOut, icon: UserMinus },
  ] : [];

  return (
    <section className="admin-panel admin-shabbat" aria-labelledby="shabbat-console-title" aria-busy={loading}>
      <div className="admin-shabbat__header">
        <div className="admin-shabbat__title">
          <span className="admin-shabbat__icon"><Mail aria-hidden="true" /></span>
          <div>
            <p className="admin-eyebrow">Weekly email operations</p>
            <h2 id="shabbat-console-title">Shabbat Shalom</h2>
            <p>Encouragement, Scripture, relationship guidance, appreciation, and TwoBeOne updates.</p>
          </div>
        </div>
        <div className="admin-shabbat__actions">
          <span className="admin-shabbat__status"><CheckCircle2 aria-hidden="true" /> Scheduled</span>
          <button type="button" className="admin-secondary-button" onClick={() => void loadConsole()} disabled={loading}>
            <RefreshCw aria-hidden="true" /> {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="admin-shabbat__error" role="alert">{error}</div>}

      {loading && !overview ? (
        <div className="admin-shabbat__loading"><Loader2 aria-hidden="true" /> Loading Shabbat Shalom…</div>
      ) : overview && preview ? (
        <>
          <div className="admin-shabbat__schedule">
            <CalendarClock aria-hidden="true" />
            <div><strong>Automatic delivery</strong><span>{overview.schedule.label}</span></div>
            {overview.lastCampaign?.weekKey && (
              <small>Last: {overview.lastCampaign.weekKey} · {overview.lastCampaign.sent || 0} sent · {overview.lastCampaign.status}</small>
            )}
          </div>

          <div className="admin-shabbat__metrics" aria-label="Shabbat Shalom audience">
            {metrics.map(({ label, value, icon: Icon }) => (
              <article key={label}><Icon aria-hidden="true" /><span>{label}</span><strong>{value.toLocaleString()}</strong></article>
            ))}
          </div>

          <div className="admin-shabbat__workspace">
            <article className="admin-shabbat__preview">
              <p className="admin-eyebrow">Edition preview · {preview.edition.weekKey}</p>
              <h3>{preview.edition.subject}</h3>
              <p>{preview.edition.encouragement}</p>
              <blockquote>“{preview.edition.scripture}” <cite>— {preview.edition.scriptureReference}</cite></blockquote>
              <dl>
                <div><dt>Guidance</dt><dd>{preview.edition.guidance}</dd></div>
                <div><dt>Weekly practice</dt><dd>{preview.edition.weeklyPractice}</dd></div>
                <div><dt>Featured app tool</dt><dd>{preview.edition.appFeature}</dd></div>
              </dl>
            </article>

            <form className="admin-shabbat__test" onSubmit={sendTest}>
              <p className="admin-eyebrow">Delivery test</p>
              <h3>Send this edition to yourself</h3>
              <p>This sends one test only. It does not start the user campaign.</p>
              <label htmlFor="shabbat-test-email">Test email address</label>
              <input id="shabbat-test-email" type="email" value={testEmail} onChange={event => setTestEmail(event.target.value)} placeholder="admin@example.com" required />
              <button className="admin-shabbat__send" type="submit" disabled={sending || !testEmail.trim()}>
                {sending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
                {sending ? 'Sending…' : 'Send test email'}
              </button>
              <small>{overview.audience.pendingConfirmation} standalone subscriber(s) awaiting confirmation.</small>
            </form>
          </div>
        </>
      ) : null}
    </section>
  );
}
