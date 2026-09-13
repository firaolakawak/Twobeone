import { useUiCopy } from "../../utils/uiTranslation";
import { adminMessagingMessages } from "../../locales/adminMessaging";
import { BrandLoader, LoadingMark } from "../BrandLoader";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarClock, CheckCircle2, Mail, RefreshCw, Send, UserCheck, UserMinus, Users } from 'lucide-react';
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
  const tr = useUiCopy(adminMessagingMessages);
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
    const confirmed = window.confirm(tr('Send the actual Shabbat Shalom edition to {count} selected registered users now?', { count: selectedIds.size }));
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
      toast.success(data.skipped ? tr('Shabbat Shalom sent to {sent} users; {skipped} skipped.', { sent: data.sent || 0, skipped: data.skipped }) : tr('Shabbat Shalom sent to {count} user(s).', { count: data.sent || 0 }));
      await loadConsole();
    } catch (sendError) {
      toast.error(tr('Unable to send Shabbat Shalom.'));
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
            <p className="admin-eyebrow">{tr("Weekly email operations")}</p>
            <h2 id="shabbat-console-title">{tr("Shabbat Shalom")}</h2>
            <p>{tr("Encouragement, Scripture, relationship guidance, appreciation, and TwoBeOne updates.")}</p>
          </div>
        </div>
        <div className="admin-shabbat__actions">
          <span className="admin-shabbat__status"><CheckCircle2 aria-hidden="true" /> {' '}{tr("Scheduled")}</span>
          <button type="button" className="admin-secondary-button" onClick={() => void loadConsole()} disabled={loading}>
            {loading ? <LoadingMark /> : <RefreshCw aria-hidden="true" />} {loading ? tr("Refreshing…") : tr("Refresh")}
          </button>
        </div>
      </div>

      {error && <div className="admin-shabbat__error" role="alert">{tr(error)}</div>}

      {loading && !overview ? (
        <BrandLoader className="admin-shabbat__loading" label={tr("Loading Shabbat Shalom…")} />
      ) : overview && preview ? (
        <>
          <div className="admin-shabbat__schedule">
            <CalendarClock aria-hidden="true" />
            <div><strong>{tr("Automatic delivery")}</strong><span>{tr(overview.schedule.label)}</span></div>
            {overview.lastCampaign?.weekKey && (
              <small>{tr('Last: {week} · {sent} sent · {status}', { week: overview.lastCampaign.weekKey, sent: overview.lastCampaign.sent || 0, status: tr(overview.lastCampaign.status || '') })}</small>
            )}
          </div>

          <div className="admin-shabbat__metrics" aria-label={tr("Shabbat Shalom audience")}>
            {metrics.map(({ label, value, icon: Icon }) => (
              <article key={label}><Icon aria-hidden="true" /><span>{tr(label)}</span><strong>{value.toLocaleString()}</strong></article>
            ))}
          </div>

          <div className="admin-shabbat__workspace">
            <article className="admin-shabbat__preview">
              <p className="admin-eyebrow">{tr('Edition preview · {week}', { week: preview.edition.weekKey })}</p>
              <h3>{preview.edition.subject}</h3>
              <p>{preview.edition.encouragement}</p>
              <blockquote>“{preview.edition.scripture}” <cite>— {preview.edition.scriptureReference}</cite></blockquote>
              <dl>
                <div><dt>{tr("Guidance")}</dt><dd>{preview.edition.guidance}</dd></div>
                <div><dt>{tr("Weekly practice")}</dt><dd>{preview.edition.weeklyPractice}</dd></div>
                <div><dt>{tr("Featured app tool")}</dt><dd>{preview.edition.appFeature}</dd></div>
              </dl>
            </article>

            <form className="admin-shabbat__delivery" onSubmit={sendSelected}>
              <p className="admin-eyebrow">{tr("Actual delivery")}</p>
              <h3>{tr("Select registered users")}</h3>
              <p>{tr("Send the current edition now. Opted-out users and users already sent this week cannot be selected.")}</p>
              <label htmlFor="shabbat-recipient-search">{tr("Search registered users")}</label>
              <input id="shabbat-recipient-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={tr("Name or email")} />
              <div className="admin-shabbat__selection-actions">
                <button type="button" onClick={selectVisible}>{tr("Select eligible shown")}</button>
                <button type="button" onClick={() => setSelectedIds(new Set())}>{tr("Clear")}</button>
                <strong>{tr('{count} selected', { count: selectedIds.size })}</strong>
              </div>
              <div className="admin-shabbat__recipient-list" role="group" aria-label={tr("Registered email recipients")}>
                {visibleRecipients.length ? visibleRecipients.map(recipient => (
                  <label key={recipient.id} data-disabled={!recipient.eligible || undefined}>
                    <input type="checkbox" checked={selectedIds.has(recipient.id)} disabled={!recipient.eligible} onChange={() => toggleRecipient(recipient)} />
                    <span><strong>{recipient.name || tr("TwoBeOne user")}</strong><small>{recipient.email}</small></span>
                    <em>{recipient.status === 'ready' ? 'Ready' : recipient.status === 'opted_out' ? tr("Opted out") : tr("Sent this week")}</em>
                  </label>
                )) : <p className="admin-empty">{tr("No registered users match this search.")}</p>}
              </div>
              <button className="admin-shabbat__send" type="submit" disabled={sending || !selectedIds.size}>
                {sending ? <LoadingMark /> : <Send aria-hidden="true" />}
                {sending ? tr("Sending actual email…") : `Send now to ${tr('{count} selected', { count: selectedIds.size })}`}
              </button>
              <small>{tr("Manual recipients are recorded and will not receive this edition again from Saturday automation.")}</small>
            </form>
          </div>
        </>
      ) : null}
    </section>
  );
}
