import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Heart, Loader2, LockKeyhole } from 'lucide-react';
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
  const [error, setError] = useState('');

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
      else if (sessionError) setError(copy.invalidLink);
      else setError(copy.invalidLink);
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
    if (password.length < 8) return setError(copy.minimumLength);
    if (password !== confirmation) return setError(copy.mismatch);

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(copy.updateFailed);
      setSaving(false);
      return;
    }
    await supabase.auth.signOut();
    window.history.replaceState({}, '', '/');
    setComplete(true);
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 px-4 py-10">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-rose-100 bg-white shadow-[0_24px_70px_-28px_rgba(136,19,55,.35)]">
        <header className="bg-gradient-to-br from-rose-500 to-pink-600 px-7 py-7 text-white">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-lg">
            <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">{copy.title}</h1>
          <p className="mt-1 text-sm text-white/85">{copy.subtitle}</p>
        </header>

        <div className="p-7">
          {checking ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground" role="status">
              <Loader2 className="h-5 w-5 animate-spin" /> {copy.verifying}
            </div>
          ) : complete ? (
            <div className="space-y-5 py-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <div><h2 className="text-lg font-semibold">{copy.updated}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.updatedDescription}</p></div>
              <button type="button" onClick={onComplete} className="h-12 w-full rounded-full bg-rose-600 font-semibold text-white hover:bg-rose-700">{copy.continueToSignIn}</button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={updatePassword}>
              <label className="grid gap-2 text-sm font-semibold">
                {copy.newPassword}
                <span className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" disabled={!ready || saving} className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-12 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-muted-foreground" aria-label={showPassword ? copy.hidePassword : copy.showPassword}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </span>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                {copy.confirmPassword}
                <input type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" disabled={!ready || saving} className="h-12 w-full rounded-xl border border-border bg-white px-4 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" required />
              </label>
              {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={!ready || saving} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-rose-600 font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? copy.updating : copy.updatePassword}
              </button>
              {!ready && <button type="button" onClick={onComplete} className="w-full text-sm font-semibold text-rose-600">{copy.requestNewLink}</button>}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
