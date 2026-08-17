import { useMemo, useState } from 'react';
import { CheckCircle2, Heart, Loader2, MailCheck, MailX } from 'lucide-react';
import { projectId } from '../utils/supabase/info';

type NewsletterAction = 'confirm' | 'unsubscribe';

export function NewsletterPreferencePage({ action, onComplete }: { action: NewsletterAction; onComplete: () => void }) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'complete' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', []);
  const isConfirmation = action === 'confirm';

  const submit = async () => {
    if (!token) {
      setStatus('error');
      setMessage('This email preference link is incomplete or invalid.');
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/newsletter/${action}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to update your email preference.');
      setStatus('complete');
      setMessage(data.message || (isConfirmation ? 'Your subscription is confirmed.' : 'You have been unsubscribed.'));
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to update your email preference.');
    }
  };

  const Icon = status === 'complete' ? CheckCircle2 : isConfirmation ? MailCheck : MailX;
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 px-4 py-12">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-rose-100 bg-white shadow-[0_24px_70px_-28px_rgba(136,19,55,.35)]">
        <header className="bg-gradient-to-br from-rose-500 to-pink-600 px-7 py-7 text-white">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-lg"><Heart className="h-6 w-6 fill-rose-500 text-rose-500" /></div>
          <h1 className="text-2xl font-bold text-white">TwoBeOne Saturday Email</h1>
          <p className="mt-1 text-sm text-white/85">Encouragement and practical guidance for the week ahead.</p>
        </header>
        <div className="space-y-5 p-7 text-center">
          <Icon className={`mx-auto h-12 w-12 ${status === 'error' ? 'text-red-500' : 'text-rose-600'}`} />
          <div>
            <h2 className="text-lg font-semibold">
              {status === 'complete' ? (isConfirmation ? 'Subscription confirmed' : 'Email preference updated') : isConfirmation ? 'Confirm your subscription' : 'Unsubscribe from weekly email?'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {message || (isConfirmation
                ? 'Confirm to receive one thoughtful email each Saturday. You can unsubscribe at any time.'
                : 'You will stop receiving weekly encouragement and app updates. Essential account emails are unaffected.')}
            </p>
          </div>
          {status !== 'complete' && (
            <button type="button" onClick={submit} disabled={status === 'saving'} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-rose-600 font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
              {status === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === 'saving' ? 'Updating…' : isConfirmation ? 'Confirm subscription' : 'Unsubscribe'}
            </button>
          )}
          <button type="button" onClick={onComplete} className="w-full text-sm font-semibold text-rose-600">Return to TwoBeOne</button>
        </div>
      </section>
    </main>
  );
}
