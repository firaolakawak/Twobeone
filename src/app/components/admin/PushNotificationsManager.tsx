import { BrandLoader, LoadingMark } from '../BrandLoader';
import { useUiCopy } from "../../utils/uiTranslation";
import { adminMessagingMessages } from "../../locales/adminMessaging";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellRing, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, FilePlus2, RefreshCw, Send, Sparkles, Users } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import '../../styles/push-console.css';

type TemplateCategory = 'Devotion & prayer' | 'Journal & check-ins' | 'Encouragement' | 'Habits & streaks';
interface PushTemplate { id: string; category: TemplateCategory; name: string; title: string; body: string; url: string; }

export const PUSH_TEMPLATES: PushTemplate[] = [
  { id: 'morning-devotional', category: 'Devotion & prayer', name: 'Morning devotional', title: 'Good morning 🌅', body: 'Take 3 minutes together in God’s Word today. Your new devotional is ready.', url: '/?tab=devotions' },
  { id: 'evening-reflection', category: 'Devotion & prayer', name: 'Evening reflection', title: 'Pause and reflect ✨', body: 'Today’s gratitude and reflection prompt is waiting for you in TwoBeOne.', url: '/?tab=journal' },
  { id: 'prayer-reminder', category: 'Devotion & prayer', name: 'Prayer reminder', title: 'Pray together 🙏', body: 'Set aside a moment now—today’s couple prayer guide is ready.', url: '/?tab=prayer' },
  { id: 'journal-reminder', category: 'Journal & check-ins', name: 'Couple journal reminder', title: 'Capture today’s moments 📝', body: 'Add a quick note to your shared journal before the day ends.', url: '/?tab=journal' },
  { id: 'weekly-check-in', category: 'Journal & check-ins', name: 'Weekly check-in', title: 'Heart check ❤️', body: 'This week’s relationship check-in questions are live. Answer them together.', url: '/?tab=questions' },
  { id: 'milestone-memory', category: 'Journal & check-ins', name: 'Milestone memory', title: 'Celebrate your journey 🎉', body: 'Add a memory or photo to your timeline today.', url: '/?tab=journal' },
  { id: 'verse-of-day', category: 'Encouragement', name: 'Verse of the day', title: 'Today’s verse for you both 📖', body: '“[Add a short verse]” — open TwoBeOne to read and reflect.', url: '/?tab=devotions' },
  { id: 'encouragement', category: 'Encouragement', name: 'Encouragement nudge', title: 'Speak life today 💬', body: 'Send your spouse a word of encouragement through the app.', url: '/' },
  { id: 'conflict-grace', category: 'Encouragement', name: 'Conflict grace reminder', title: 'Choose grace 🤍', body: 'Before you respond, take a breath and read today’s peacemaking tip.', url: '/' },
  { id: 'streak-reminder', category: 'Habits & streaks', name: 'Streak reminder', title: 'You’re on a roll 🔥', body: 'Don’t lose your devotional streak—today’s session is one tap away.', url: '/?tab=devotions' },
  { id: 'goal-progress', category: 'Habits & streaks', name: 'Goal progress', title: 'Small steps, big change 🌱', body: 'Check your progress on your shared goals.', url: '/' },
  { id: 'new-challenge', category: 'Habits & streaks', name: 'New challenge', title: 'A new 7-day couple challenge 💪', body: 'Grow together in prayer, communication, and intimacy.', url: '/' },
];

const DESTINATIONS = [
  { value: '/', label: 'Home' }, { value: '/?tab=devotions', label: 'Daily devotionals' },
  { value: '/?tab=prayer', label: 'Prayer' }, { value: '/?tab=journal', label: 'Journal' },
  { value: '/?tab=questions', label: 'Relationship questions' },
];

interface PushNotificationsManagerProps { accessToken?: string; }
interface DeliveryResult { totalSubscribers: number; sent: number; failed: number; invalidSubscriptions: number; failureReasons: Array<{ reason: string; count: number }>; }
interface PushSubscriber { userId: string; name: string; email: string; status: 'enabled'; }

export function PushNotificationsManager({ accessToken }: PushNotificationsManagerProps) {
  const tr = useUiCopy(adminMessagingMessages);
  const initial = PUSH_TEMPLATES[0];
  const [selectedId, setSelectedId] = useState(initial.id);
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [url, setUrl] = useState(initial.url);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [error, setError] = useState('');
  const [subscribers, setSubscribers] = useState<PushSubscriber[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [subscribersError, setSubscribersError] = useState('');
  const [subscribersExpanded, setSubscribersExpanded] = useState(false);
  const [subscriberPage, setSubscriberPage] = useState(1);
  const subscribersPerPage = 10;
  const subscriberPageCount = Math.max(1, Math.ceil(subscribers.length / subscribersPerPage));
  const currentSubscriberPage = Math.min(subscriberPage, subscriberPageCount);
  const visibleSubscribers = subscribers.slice((currentSubscriberPage - 1) * subscribersPerPage, currentSubscriberPage * subscribersPerPage);
  const categories = useMemo(() => Array.from(new Set(PUSH_TEMPLATES.map((template) => template.category))), []);
  const hasPlaceholder = body.includes('[Add a short verse]');
  const canSend = Boolean(title.trim() && body.trim() && confirmed && !sending && !hasPlaceholder);

  const resetFeedback = () => { setConfirmed(false); setResult(null); setError(''); };
  const chooseTemplate = (template: PushTemplate) => { setSelectedId(template.id); setTitle(template.title); setBody(template.body); setUrl(template.url); resetFeedback(); };
  const createNew = () => { setSelectedId('custom'); setTitle(''); setBody(''); setUrl('/'); resetFeedback(); };

  const loadSubscribers = useCallback(async () => {
    setSubscribersLoading(true);
    setSubscribersError('');
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/push/subscribers`, {
        headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Subscribed users could not be loaded.');
      setSubscribers(Array.isArray(data.subscribers) ? data.subscribers : []);
    } catch (loadError) {
      setSubscribersError(loadError instanceof Error ? loadError.message : 'Subscribed users could not be loaded.');
    } finally {
      setSubscribersLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void loadSubscribers(); }, [loadSubscribers]);

  const sendNotification = async () => {
    if (!canSend) return;
    setSending(true); setResult(null); setError('');
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/push/broadcast`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken || publicAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url, templateId: selectedId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The notification could not be sent.');
      setResult({
        totalSubscribers: Number(data.totalSubscribers) || 0,
        sent: Number(data.sent) || 0,
        failed: Number(data.failed) || 0,
        invalidSubscriptions: Number(data.invalidSubscriptions) || 0,
        failureReasons: Array.isArray(data.failureReasons) ? data.failureReasons : [],
      });
      setConfirmed(false);
      void loadSubscribers();
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : 'The notification could not be sent.'); }
    finally { setSending(false); }
  };

  return (
    <main className="push-console">
      <header className="push-console__hero">
        <div><span className="push-console__eyebrow"><Sparkles aria-hidden="true" />{tr("Member communication")}</span><h1>{tr("Push Notifications")}</h1><p>{tr("Start with a thoughtful template or create a new message for subscribed members.")}</p></div>
        <div className="push-console__hero-actions">
          <span><i className={subscribersLoading ? 'is-pulsing' : ''} />{subscribersLoading ? tr("Syncing subscribers") : tr("Delivery service connected")}</span>
          <button type="button" className="admin-secondary-button" onClick={createNew}><FilePlus2 aria-hidden="true" />{tr("Create new")}</button>
        </div>
      </header>

      <section className="push-console__templates" aria-labelledby="template-heading">
        <div className="push-console__templates-heading"><div><h2 id="template-heading">{tr("Message templates")}</h2><p>{tr("Select a template, then personalize it before sending.")}</p></div><span>{tr('{count} templates', { count: PUSH_TEMPLATES.length })}</span></div>
        <label className="push-console__template-select">
          <span>{tr("Choose a message template")}</span>
          <select
            value={selectedId}
            onChange={(event) => {
              if (event.target.value === 'custom') return createNew();
              const template = PUSH_TEMPLATES.find((item) => item.id === event.target.value);
              if (template) chooseTemplate(template);
            }}
          >
            <option value="custom">{tr("Custom notification")}</option>
            {categories.map((category) => (
              <optgroup label={tr(category)} key={category}>
                {PUSH_TEMPLATES.filter((template) => template.category === category).map((template) => <option value={template.id} key={template.id}>{tr(template.name)}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
      </section>

      <div className="push-console__layout">
        <section className="push-console__composer" aria-labelledby="composer-heading">
          <div className="push-console__section-heading"><span className="push-console__section-icon"><BellRing aria-hidden="true" /></span><div><h2 id="composer-heading">{selectedId === 'custom' ? tr("Create new notification") : tr("Edit notification")}</h2><p>{tr("Keep it warm, clear, and easy to act on.")}</p></div></div>
          <div className="push-console__fields">
            <label><span>{tr("Title")}{' '}<small>{title.length}/80</small></span><input value={title} maxLength={80} onChange={(event) => { setTitle(event.target.value); resetFeedback(); }} placeholder={tr("Notification title")} /></label>
            <label><span>{tr("Message")}{' '}<small>{body.length}/240</small></span><textarea value={body} maxLength={240} rows={4} onChange={(event) => { setBody(event.target.value); resetFeedback(); }} placeholder={tr("Write a short, meaningful message")} /></label>
            <label><span>{tr("Open this page")}</span><select value={url} onChange={(event) => { setUrl(event.target.value); resetFeedback(); }}>{DESTINATIONS.map((destination) => <option value={destination.value} key={destination.value}>{tr(destination.label)}</option>)}</select></label>
          </div>
          {hasPlaceholder && <div className="push-console__placeholder-note"><AlertTriangle aria-hidden="true" />{tr("Replace the verse placeholder before sending.")}</div>}
          <div className="push-console__preview" aria-label={tr("Notification preview")}><div className="push-console__app-icon" aria-hidden="true">♥</div><div><span>{tr("TwoBeOne · now")}</span><strong>{title || tr("Your notification title")}</strong><p>{body || tr("Your message will appear here.")}</p></div></div>
          <div className="push-console__audience"><Users aria-hidden="true" /><div><strong>{tr("All subscribed users")}</strong><span>{tr("Only devices that granted push permission will receive it.")}</span></div></div>
          <label className="push-console__confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>{tr("I have reviewed the message, destination, and audience.")}</span></label>
          <button className="push-console__send" type="button" disabled={!canSend} onClick={sendNotification}><>{sending ? <LoadingMark /> : <Send aria-hidden="true" />}</>{sending ? tr("Sending notification…") : tr("Send push notification")}</button>
          <div className="push-console__feedback" aria-live="polite">{result && <div className={result.sent === 0 && result.totalSubscribers > 0 ? 'push-console__error' : 'push-console__result'}>{result.sent === 0 && result.totalSubscribers > 0 ? <AlertTriangle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}<div><strong>{result.sent === 0 && result.totalSubscribers > 0 ? tr("Broadcast failed") : tr("Broadcast complete")}</strong><span>{tr('{sent} of {total} subscribed devices reached.', { sent: result.sent, total: result.totalSubscribers })}</span>{(result.failed > 0 || result.invalidSubscriptions > 0) && <small>{tr('{failed} failed · {expired} expired subscriptions removed', { failed: result.failed, expired: result.invalidSubscriptions })}</small>}{result.failureReasons.map((failure) => <small key={failure.reason}>{tr(failure.reason)}{failure.count > 1 ? ` ${tr('({count} devices)', { count: failure.count })}` : ''}</small>)}</div></div>}{error && <div className="push-console__error" role="alert"><AlertTriangle aria-hidden="true" /><span>{tr(error)}</span></div>}</div>
        </section>
        <aside className="push-console__guidance"><span className="push-console__guidance-icon"><BellRing aria-hidden="true" /></span><h2>{tr("Before you send")}</h2><p>{tr("This is a real broadcast and may appear immediately on members’ devices.")}</p><ul><li>{tr("Use a clear title and one focused action.")}</li><li>{tr("Admin authorization is verified by the server.")}</li><li>{tr("Expired subscriptions are removed automatically.")}</li><li>{tr("Every delivery is recorded in the audit log.")}</li></ul></aside>
      </div>

      <section className="push-console__subscribers" aria-labelledby="subscribers-heading">
        <div className="push-console__subscribers-heading">
          <div>
            <p className="admin-eyebrow">{tr("Push audience")}</p>
            <h2 id="subscribers-heading">{tr("Subscribed users")}</h2>
            <p>{tr("Members with an active browser notification subscription.")}</p>
          </div>
          <div className="push-console__subscribers-actions">
            <span className="push-console__subscriber-count"><span aria-hidden="true" />{subscribersLoading ? tr("Loading…") : tr('{count} enabled', { count: subscribers.length })}</span>
            <button type="button" className="push-console__refresh" onClick={() => void loadSubscribers()} disabled={subscribersLoading} aria-label={tr("Refresh subscribed users")}>
              {subscribersLoading ? <LoadingMark /> : <RefreshCw aria-hidden="true" />}
              {tr("Refresh")}</button>
            <button type="button" className="push-console__expand" onClick={() => setSubscribersExpanded((expanded) => !expanded)} aria-expanded={subscribersExpanded} aria-controls="push-subscriber-list">
              {subscribersExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
              {subscribersExpanded ? tr("Hide list") : tr("Show list")}
            </button>
          </div>
        </div>

        {subscribersExpanded && <div id="push-subscriber-list">
          {subscribersError && <div className="push-console__subscriber-error" role="alert"><AlertTriangle aria-hidden="true" /><span>{tr(subscribersError)}</span></div>}
          {subscribersLoading && subscribers.length === 0 ? (
            <BrandLoader className="push-console__subscriber-state" label={tr("Loading subscribed users…")} />
          ) : subscribers.length === 0 ? (
            <div className="push-console__subscriber-state"><BellRing aria-hidden="true" /><strong>{tr("No subscribed users yet")}</strong><span>{tr("Enabled members will appear here after their browser subscription is saved.")}</span></div>
          ) : (
            <>
              <div className="push-console__subscriber-table-wrap">
                <table className="push-console__subscriber-table">
                  <thead><tr><th scope="col">{tr("Name")}</th><th scope="col">{tr("Email")}</th></tr></thead>
                  <tbody>{visibleSubscribers.map((subscriber) => (
                    <tr key={subscriber.userId}>
                      <td><strong>{subscriber.name}</strong></td>
                      <td>{subscriber.email || tr("No email available")}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <nav className="push-console__pagination" aria-label={tr("Subscribed users pagination")}>
                <span>{tr('Showing {from}–{to} of {total}', { from: (currentSubscriberPage - 1) * subscribersPerPage + 1, to: Math.min(currentSubscriberPage * subscribersPerPage, subscribers.length), total: subscribers.length })}</span>
                <div>
                  <button type="button" onClick={() => setSubscriberPage((page) => Math.max(1, page - 1))} disabled={currentSubscriberPage === 1} aria-label={tr("Previous subscriber page")}><ChevronLeft aria-hidden="true" />{tr("Previous")}</button>
                  <strong>{tr('Page {page} of {pages}', { page: currentSubscriberPage, pages: subscriberPageCount })}</strong>
                  <button type="button" onClick={() => setSubscriberPage((page) => Math.min(subscriberPageCount, page + 1))} disabled={currentSubscriberPage === subscriberPageCount} aria-label={tr("Next subscriber page")}>{tr("Next")}<ChevronRight aria-hidden="true" /></button>
                </div>
              </nav>
            </>
          )}
        </div>}
      </section>
    </main>
  );
}
