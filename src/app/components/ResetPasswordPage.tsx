import { BrandLoader, LoadingMark } from "./BrandLoader";
import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Heart, LockKeyhole } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { useLanguage } from '../contexts/LanguageContext';

interface ResetPasswordPageProps {
  onComplete: () => void;
}

export function ResetPasswordPage({ onComplete }: ResetPasswordPageProps) {
  const { t } = useLanguage();
  const copy = t.resetPassword;
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<keyof typeof copy | ''>('');

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        setReady(true);
        setChecking(false);
        setError('');
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (data.session) setReady(true);
      else if (sessionError) setError('invalidLink');
      else setError('invalidLink');
      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [copy.invalidLink]);

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('minimumLength');
    if (password !== confirmation) return setError('mismatch');

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError('updateFailed');
      setSaving(false);
      return;
    }
    await supabase.auth.signOut();
    window.history.replaceState({}, '', '/');
    setComplete(true);
    setSaving(false);
  };

  return (
    <main className="min-h-screen tbo-glass-app text-foreground px-4 py-10">
      <section className="tbo-glass-raised mx-auto w-full max-w-md overflow-hidden">
        <header className="bg-accent px-7 py-7 text-foreground">
          <div className="tbo-glass-orb mb-4 grid h-12 w-12 place-items-center">
            <Heart className="h-6 w-6 fill-current text-white" />
          </div>
          <h1 className="tbo-page-title text-foreground">{copy.title}</h1>
          <p className="mt-1 tbo-supporting text-muted-foreground">{copy.subtitle}</p>
        </header>

        <div className="p-7">
          {checking ? (
            <div className="flex items-center justify-center gap-2 py-10 tbo-supporting text-muted-foreground" role="status">
              <BrandLoader label={copy.verifying} />
            </div>
          ) : complete ? (
            <div className="space-y-5 py-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <div><h2 className="tbo-dialog-title">{copy.updated}</h2><p className="mt-1 tbo-supporting text-muted-foreground">{copy.updatedDescription}</p></div>
              <button type="button" onClick={onComplete} className="h-12 w-full rounded-full tbo-glass-primary tbo-action">{copy.continueToSignIn}</button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={updatePassword}>
              <label className="grid gap-2 tbo-label">
                {copy.newPassword}
                <span className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" disabled={!ready || saving} className="tbo-field h-12 w-full rounded-xl border border-border bg-input-background pl-11 pr-12 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-muted-foreground" aria-label={showPassword ? copy.hidePassword : copy.showPassword}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </span>
              </label>
              <label className="grid gap-2 tbo-label">
                {copy.confirmPassword}
                <input type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" disabled={!ready || saving} className="tbo-field h-12 w-full rounded-xl border border-border bg-input-background px-4 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" required />
              </label>
              {error && <div role="alert" className="rounded-xl bg-red-50 p-3 tbo-supporting text-red-700">{copy[error]}</div>}
              <button type="submit" disabled={!ready || saving} className="flex h-12 w-full items-center justify-center gap-2 rounded-full tbo-glass-primary tbo-action disabled:cursor-not-allowed disabled:opacity-50">
                {saving && <LoadingMark className="h-4 w-4" />}{saving ? copy.updating : copy.updatePassword}
              </button>
              {!ready && <button type="button" onClick={onComplete} className="w-full tbo-action text-rose-600">{copy.requestNewLink}</button>}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
