import { useState } from 'react';
import { AlertTriangle, BellRing, CheckCircle2, Send, Users } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import '../../styles/push-console.css';

const APPRECIATION_MESSAGE = {
  title: 'Thank you for being part of TwoBeOne 💕',
  body: 'We truly appreciate you using the TwoBeOne app. Share it with your friends, loved ones, and family.',
};

interface PushNotificationsManagerProps {
  accessToken?: string;
}

interface DeliveryResult {
  totalSubscribers: number;
  sent: number;
  failed: number;
  invalidSubscriptions: number;
}

export function PushNotificationsManager({ accessToken }: PushNotificationsManagerProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [error, setError] = useState('');

  const sendAppreciation = async () => {
    if (!confirmed || sending) return;
    setSending(true);
    setResult(null);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/push/appreciation`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The notification could not be sent.');
      setResult({
        totalSubscribers: Number(data.totalSubscribers) || 0,
        sent: Number(data.sent) || 0,
        failed: Number(data.failed) || 0,
        invalidSubscriptions: Number(data.invalidSubscriptions) || 0,
      });
      setConfirmed(false);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'The notification could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="push-console">
      <header className="push-console__hero">
        <p className="admin-eyebrow">Member communication</p>
        <h1>Push notifications</h1>
        <p>Send the prepared appreciation message to everyone who has enabled browser notifications.</p>
      </header>

      <div className="push-console__layout">
        <section className="push-console__composer" aria-labelledby="appreciation-heading">
          <div className="push-console__section-heading">
            <span className="push-console__section-icon"><BellRing aria-hidden="true" /></span>
            <div>
              <h2 id="appreciation-heading">Appreciation message</h2>
              <p>The message is locked for this test broadcast.</p>
            </div>
          </div>

          <div className="push-console__preview" aria-label="Notification preview">
            <div className="push-console__app-icon" aria-hidden="true">♥</div>
            <div>
              <span>TwoBeOne · now</span>
              <strong>{APPRECIATION_MESSAGE.title}</strong>
              <p>{APPRECIATION_MESSAGE.body}</p>
            </div>
          </div>

          <div className="push-console__audience">
            <Users aria-hidden="true" />
            <div><strong>All subscribed users</strong><span>Only devices that have granted push permission will receive it.</span></div>
          </div>

          <label className="push-console__confirmation">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span>I have reviewed the message and audience.</span>
          </label>

          <button className="push-console__send" type="button" disabled={!confirmed || sending} onClick={sendAppreciation}>
            <Send aria-hidden="true" />
            {sending ? 'Sending notification…' : 'Send appreciation push'}
          </button>

          <div className="push-console__feedback" aria-live="polite">
            {result && (
              <div className="push-console__result">
                <CheckCircle2 aria-hidden="true" />
                <div>
                  <strong>Broadcast complete</strong>
                  <span>{result.sent} of {result.totalSubscribers} subscribed device{result.totalSubscribers === 1 ? '' : 's'} reached.</span>
                  {(result.failed > 0 || result.invalidSubscriptions > 0) && <small>{result.failed} failed · {result.invalidSubscriptions} expired subscription{result.invalidSubscriptions === 1 ? '' : 's'} removed</small>}
                </div>
              </div>
            )}
            {error && <div className="push-console__error" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>}
          </div>
        </section>

        <aside className="push-console__guidance">
          <span className="push-console__guidance-icon"><BellRing aria-hidden="true" /></span>
          <h2>Before you send</h2>
          <p>This is a real broadcast, not an on-screen preview. It may appear immediately on members’ devices.</p>
          <ul>
            <li>Admin authentication is verified by the server.</li>
            <li>Expired subscriptions are removed automatically.</li>
            <li>The delivery result is added to the audit log.</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}

