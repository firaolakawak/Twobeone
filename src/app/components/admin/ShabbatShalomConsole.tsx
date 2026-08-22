import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
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

interface RegisteredRecipient {
  id: string;
  email: string;
  name: string;
  eligible: boolean;
  status: 'ready' | 'opted_out' | 'already_sent';
}

const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/newsletter`;

export function ShabbatShalomConsole({ accessToken }: ShabbatShalomConsoleProps) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [preview, setPreview] = useState<NewsletterPreview | null>(null);
  const [recipients, setRecipients] = useState<RegisteredRecipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
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
      const [overviewResponse, previewResponse, recipientsResponse] = await Promise.all([
        fetch(`${apiBase}/admin-overview`, { headers: headers() }),
        fetch(`${apiBase}/preview`, { headers: headers() }),
        fetch(`${apiBase}/admin-recipients`, { headers: headers() }),
      ]);
      const overviewData = await overviewResponse.json().catch(() => ({}));
      const previewData = await previewResponse.json().catch(() => ({}));
      const recipientsData = await recipientsResponse.json().catch(() => ({}));
      if (!overviewResponse.ok) throw new Error(overviewData.error || 'Unable to load the audience overview.');
      if (!previewResponse.ok) throw new Error(previewData.error || 'Unable to load the weekly preview.');
      if (!recipientsResponse.ok) throw new Error(recipientsData.error || 'Unable to load registered users.');
      setOverview(overviewData);
      setPreview(previewData);
      setRecipients(Array.isArray(recipientsData.users) ? recipientsData.users : []);
      setSelectedIds(new Set());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Shabbat Shalom.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, headers]);

  useEffect(() => {
    void loadConsole();
  }, [loadConsole]);

  const sendSelected = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !selectedIds.size) return;
    const confirmed = window.confirm(`Send the actual Shabbat Shalom edition to ${selectedIds.size} selected registered user(s) now?`);
    if (!confirmed) return;
    setSending(true);
    try {
      const response = await fetch(`${apiBase}/send-selected`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ userIds: [...selectedIds], requestId: crypto.randomUUID() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to send Shabbat Shalom.');
      toast.success(`Shabbat Shalom sent to ${data.sent || 0} user(s)${data.skipped ? `; ${data.skipped} skipped` : ''}.`);
      await loadConsole();
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : 'Unable to send Shabbat Shalom.');
    } finally {
      setSending(false);
    }
  };

  const visibleRecipients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recipients;
    return recipients.filter(recipient => `${recipient.name} ${recipient.email}`.toLowerCase().includes(query));
  }, [recipients, search]);

  const toggleRecipient = (recipient: RegisteredRecipient) => {
    if (!recipient.eligible) return;
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(recipient.id)) next.delete(recipient.id);
      else next.add(recipient.id);
      return next;
    });
  };

  const selectVisible = () => {
    setSelectedIds(current => {
      const next = new Set(current);
      visibleRecipients.filter(recipient => recipient.eligible).forEach(recipient => next.add(recipient.id));
      return next;
    });
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

            <form className="admin-shabbat__delivery" onSubmit={sendSelected}>
              <p className="admin-eyebrow">Actual delivery</p>
              <h3>Select registered users</h3>
              <p>Send the current edition now. Opted-out users and users already sent this week cannot be selected.</p>
              <label htmlFor="shabbat-recipient-search">Search registered users</label>
              <input id="shabbat-recipient-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name or email" />
              <div className="admin-shabbat__selection-actions">
                <button type="button" onClick={selectVisible}>Select eligible shown</button>
                <button type="button" onClick={() => setSelectedIds(new Set())}>Clear</button>
                <strong>{selectedIds.size} selected</strong>
              </div>
              <div className="admin-shabbat__recipient-list" role="group" aria-label="Registered email recipients">
                {visibleRecipients.length ? visibleRecipients.map(recipient => (
                  <label key={recipient.id} data-disabled={!recipient.eligible || undefined}>
                    <input type="checkbox" checked={selectedIds.has(recipient.id)} disabled={!recipient.eligible} onChange={() => toggleRecipient(recipient)} />
                    <span><strong>{recipient.name || 'TwoBeOne user'}</strong><small>{recipient.email}</small></span>
                    <em>{recipient.status === 'ready' ? 'Ready' : recipient.status === 'opted_out' ? 'Opted out' : 'Sent this week'}</em>
                  </label>
                )) : <p className="admin-empty">No registered users match this search.</p>}
              </div>
              <button className="admin-shabbat__send" type="submit" disabled={sending || !selectedIds.size}>
                {sending ? <Loader2 className="admin-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
                {sending ? 'Sending actual email…' : `Send now to ${selectedIds.size} selected`}
              </button>
              <small>Manual recipients are recorded and will not receive this edition again from Saturday automation.</small>
            </form>
          </div>
        </>
      ) : null}
    </section>
  );
}
