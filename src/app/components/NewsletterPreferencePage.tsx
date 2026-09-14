import { LoadingMark } from "./BrandLoader";
import { useUiCopy } from "../utils/uiTranslation";
import { publicAuthMessages } from "../locales/publicAuth";
import { useMemo, useState } from 'react';
import { CheckCircle2, Heart, MailCheck, MailX } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../contexts/LanguageContext';
import { BackButton } from './BackButton';

type NewsletterAction = 'confirm' | 'unsubscribe';

export function NewsletterPreferencePage({ action, onComplete }: { action: NewsletterAction; onComplete: () => void }) {
  const tr = useUiCopy(publicAuthMessages);
  const { t } = useLanguage();
  const copy = t.newsletter;
  const [status, setStatus] = useState<'idle' | 'saving' | 'complete' | 'error'>('idle');
  const [message, setMessage] = useState<keyof typeof copy | ''>('');
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', []);
  const isConfirmation = action === 'confirm';

  const submit = async () => {
    if (!token) {
      setStatus('error');
      setMessage('invalidLink');
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/newsletter/${action}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
            apikey: publicAnonKey,
          },
          body: JSON.stringify({ token }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(copy.updateFailed);
      setStatus('complete');
      setMessage(isConfirmation ? 'confirmedMessage' : 'unsubscribedMessage');
    } catch (error) {
      setStatus('error');
      setMessage('updateFailed');
    }
  };

  const Icon = status === 'complete' ? CheckCircle2 : isConfirmation ? MailCheck : MailX;
  return (
    <main className="min-h-screen tbo-glass-app text-foreground px-4 py-12">
      <section className="tbo-glass-raised mx-auto w-full max-w-md overflow-hidden">
        <header className="bg-accent px-7 py-7 text-foreground">
          <div className="tbo-glass-orb mb-4 grid h-12 w-12 place-items-center"><Heart className="h-6 w-6 fill-current text-white" /></div>
          <h1 className="tbo-page-title text-foreground">{tr("Shabbat Shalom")}</h1>
          <p className="mt-1 tbo-supporting text-muted-foreground">{copy.subtitle}</p>
        </header>
        <div className="space-y-5 p-7 text-center">
          <Icon className={`mx-auto h-12 w-12 ${status === 'error' ? 'text-red-500' : 'text-rose-600'}`} />
          <div>
            <h2 className="tbo-dialog-title">
              {status === 'complete' ? (isConfirmation ? copy.subscriptionConfirmed : copy.preferenceUpdated) : isConfirmation ? copy.confirmTitle : copy.unsubscribeTitle}
            </h2>
            <p className="mt-2 tbo-supporting text-muted-foreground">
              {(message ? copy[message] : '') || (isConfirmation
                ? copy.confirmDescription
                : copy.unsubscribeDescription)}
            </p>
          </div>
          {status !== 'complete' && (
            <button type="button" onClick={submit} disabled={status === 'saving'} className="flex h-12 w-full items-center justify-center gap-2 rounded-full tbo-glass-primary tbo-action disabled:opacity-60">
              {status === 'saving' && <LoadingMark className="h-4 w-4" />}
              {status === 'saving' ? copy.updating : isConfirmation ? copy.confirm : copy.unsubscribe}
            </button>
          )}
          <BackButton onClick={onComplete} label={copy.returnToApp} showLabel className="mx-auto" />
        </div>
      </section>
    </main>
  );
}
