import { useMemo, useState } from 'react';
import { AlertTriangle, BellRing, CheckCircle2, FilePlus2, Send, Users } from 'lucide-react';
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
interface DeliveryResult { totalSubscribers: number; sent: number; failed: number; invalidSubscriptions: number; }

export function PushNotificationsManager({ accessToken }: PushNotificationsManagerProps) {
  const initial = PUSH_TEMPLATES[0];
  const [selectedId, setSelectedId] = useState(initial.id);
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [url, setUrl] = useState(initial.url);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [error, setError] = useState('');
  const categories = useMemo(() => Array.from(new Set(PUSH_TEMPLATES.map((template) => template.category))), []);
  const hasPlaceholder = body.includes('[Add a short verse]');
  const canSend = Boolean(title.trim() && body.trim() && confirmed && !sending && !hasPlaceholder);

  const resetFeedback = () => { setConfirmed(false); setResult(null); setError(''); };
  const chooseTemplate = (template: PushTemplate) => { setSelectedId(template.id); setTitle(template.title); setBody(template.body); setUrl(template.url); resetFeedback(); };
  const createNew = () => { setSelectedId('custom'); setTitle(''); setBody(''); setUrl('/'); resetFeedback(); };

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
      setResult({ totalSubscribers: Number(data.totalSubscribers) || 0, sent: Number(data.sent) || 0, failed: Number(data.failed) || 0, invalidSubscriptions: Number(data.invalidSubscriptions) || 0 });
      setConfirmed(false);
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : 'The notification could not be sent.'); }
    finally { setSending(false); }
  };

  return (
    <main className="push-console">
      <header className="push-console__hero">
        <div><p className="admin-eyebrow">Member communication</p><h1>Push notifications</h1><p>Start with a thoughtful template or create a new message for subscribed members.</p></div>
        <button type="button" className="admin-secondary-button" onClick={createNew}><FilePlus2 aria-hidden="true" />Create new</button>
      </header>

      <section className="push-console__templates" aria-labelledby="template-heading">
        <div className="push-console__templates-heading"><div><h2 id="template-heading">Message templates</h2><p>Select a template, then personalize it before sending.</p></div><span>{PUSH_TEMPLATES.length} templates</span></div>
        <label className="push-console__template-select">
          <span>Choose a message template</span>
          <select
            value={selectedId}
            onChange={(event) => {
              if (event.target.value === 'custom') return createNew();
              const template = PUSH_TEMPLATES.find((item) => item.id === event.target.value);
              if (template) chooseTemplate(template);
            }}
          >
            <option value="custom">Custom notification</option>
            {categories.map((category) => (
              <optgroup label={category} key={category}>
                {PUSH_TEMPLATES.filter((template) => template.category === category).map((template) => <option value={template.id} key={template.id}>{template.name} — {template.title}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
      </section>

      <div className="push-console__layout">
        <section className="push-console__composer" aria-labelledby="composer-heading">
          <div className="push-console__section-heading"><span className="push-console__section-icon"><BellRing aria-hidden="true" /></span><div><h2 id="composer-heading">{selectedId === 'custom' ? 'Create new notification' : 'Edit notification'}</h2><p>Keep it warm, clear, and easy to act on.</p></div></div>
          <div className="push-console__fields">
            <label><span>Title <small>{title.length}/80</small></span><input value={title} maxLength={80} onChange={(event) => { setTitle(event.target.value); resetFeedback(); }} placeholder="Notification title" /></label>
            <label><span>Message <small>{body.length}/240</small></span><textarea value={body} maxLength={240} rows={4} onChange={(event) => { setBody(event.target.value); resetFeedback(); }} placeholder="Write a short, meaningful message" /></label>
            <label><span>Open this page</span><select value={url} onChange={(event) => { setUrl(event.target.value); resetFeedback(); }}>{DESTINATIONS.map((destination) => <option value={destination.value} key={destination.value}>{destination.label}</option>)}</select></label>
          </div>
          {hasPlaceholder && <div className="push-console__placeholder-note"><AlertTriangle aria-hidden="true" />Replace the verse placeholder before sending.</div>}
          <div className="push-console__preview" aria-label="Notification preview"><div className="push-console__app-icon" aria-hidden="true">♥</div><div><span>TwoBeOne · now</span><strong>{title || 'Your notification title'}</strong><p>{body || 'Your message will appear here.'}</p></div></div>
          <div className="push-console__audience"><Users aria-hidden="true" /><div><strong>All subscribed users</strong><span>Only devices that granted push permission will receive it.</span></div></div>
          <label className="push-console__confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I have reviewed the message, destination, and audience.</span></label>
          <button className="push-console__send" type="button" disabled={!canSend} onClick={sendNotification}><Send aria-hidden="true" />{sending ? 'Sending notification…' : 'Send push notification'}</button>
          <div className="push-console__feedback" aria-live="polite">{result && <div className="push-console__result"><CheckCircle2 aria-hidden="true" /><div><strong>Broadcast complete</strong><span>{result.sent} of {result.totalSubscribers} subscribed device{result.totalSubscribers === 1 ? '' : 's'} reached.</span>{(result.failed > 0 || result.invalidSubscriptions > 0) && <small>{result.failed} failed · {result.invalidSubscriptions} expired subscription{result.invalidSubscriptions === 1 ? '' : 's'} removed</small>}</div></div>}{error && <div className="push-console__error" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>}</div>
        </section>
        <aside className="push-console__guidance"><span className="push-console__guidance-icon"><BellRing aria-hidden="true" /></span><h2>Before you send</h2><p>This is a real broadcast and may appear immediately on members’ devices.</p><ul><li>Use a clear title and one focused action.</li><li>Admin authorization is verified by the server.</li><li>Expired subscriptions are removed automatically.</li><li>Every delivery is recorded in the audit log.</li></ul></aside>
      </div>
    </main>
  );
}
