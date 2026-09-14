import { LoadingMark } from "./BrandLoader";
import { useUiCopy } from "../utils/uiTranslation";
import { publicAuthMessages } from "../locales/publicAuth";
import { useState } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Heart, CheckCircle2, Copy } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { LegalConsent } from './LegalConsent';
import { BackButton } from './BackButton';
import type { User } from '@supabase/supabase-js';

interface AuthPageProps {
  onAuthSuccess: (accessToken: string, user: User) => void;
  initialMode?: 'signin' | 'signup';
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export function isAuthNetworkError(error: unknown): boolean {
  const message = String((error as any)?.message || error || '').toLowerCase();
  return (error as any)?.name === 'TypeError' ||
    /failed to fetch|fetch failed|network|load failed|connection|timed out|timeout|\b52[12]\b/.test(message);
}

function authConnectionMessage() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Your phone is offline. Reconnect to Wi-Fi or mobile data, then tap Sign In again.';
  }
  return 'Cannot reach the sign-in service right now. Please tap Sign In again or switch between Wi-Fi and mobile data.';
}

export function AuthPage({ onAuthSuccess, initialMode = 'signin' }: AuthPageProps) {
  const tr = useUiCopy(publicAuthMessages);
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [generatedInviteCode, setGeneratedInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);

  const [forgotSent, setForgotSent] = useState(false);

  const [showLegalConsent, setShowLegalConsent] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<{
    email: string; password: string; name: string;
  } | null>(null);

  const { t, language } = useLanguage();

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError('');
    setForgotSent(false);
  };

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedInviteCode(code);
    setShowInviteCode(true);
    return code;
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedInviteCode);
    } catch {
      const el = document.createElement('textarea');
      el.value = generatedInviteCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    toast.success(tr("Invite code copied!"));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setPendingSignupData({ email, password, name });
    setShowLegalConsent(true);
  };

  const handleLegalConsentAccepted = async () => {
    if (!pendingSignupData) return;
    setIsLoading(true);
    setError('');
    try {
      const userInviteCode = generateInviteCode();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({
            email: pendingSignupData.email,
            password: pendingSignupData.password,
            name: pendingSignupData.name,
            partnerEmail: '',
            inviteCode: userInviteCode,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409 || data.error?.includes('already')) {
          setError('This email is already registered. Please sign in.');
          switchMode('signin');
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || 'Sign up failed');
      }
      const supabase = createClient();
      const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email: pendingSignupData.email,
        password: pendingSignupData.password,
      });
      if (signInError) throw signInError;
      if (sessionData.session?.access_token) {
        if (sessionData.user?.id) localStorage.setItem('twobeone_user_id', sessionData.user.id);
        toast.success(tr("Welcome to TwoBeOne 🙏"));
        onAuthSuccess(sessionData.session.access_token, sessionData.user!);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const supabase = createClient();
      let data: any = null;
      let signInError: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (result.error && isAuthNetworkError(result.error) && attempt < 3) {
            await new Promise(r => setTimeout(r, attempt * 1200));
            continue;
          }
          data = result.data;
          signInError = result.error;
          break;
        } catch (networkErr: any) {
          if (!isAuthNetworkError(networkErr) || attempt === 3) throw networkErr;
          await new Promise(r => setTimeout(r, attempt * 1200));
        }
      }
      if (signInError) {
        if (isAuthNetworkError(signInError)) {
          setError(authConnectionMessage());
          return;
        }
        if (signInError.message?.includes('Email not confirmed') || signInError.code === 'email_not_confirmed') {
          const confirmRes = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/auto-confirm-signin`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
              body: JSON.stringify({ email, password }),
            }
          );
          const confirmData = await confirmRes.json();
          if (confirmRes.ok && confirmData.access_token && confirmData.user) {
            if (confirmData.user.id) localStorage.setItem('twobeone_user_id', confirmData.user.id);
            await supabase.auth.setSession({ access_token: confirmData.access_token, refresh_token: confirmData.refresh_token });
            toast.success(tr("Welcome back!"));
            onAuthSuccess(confirmData.access_token, confirmData.user);
            return;
          }
          setError(confirmData.error || 'Failed to sign in.');
          setIsLoading(false);
          return;
        }
        setError(signInError.message?.includes('Invalid login credentials')
          ? 'Invalid email or password.'
          : signInError.message || 'Failed to sign in');
        setIsLoading(false);
        return;
      }
      if (data?.session?.access_token && data.user) {
        if (data.user.id) localStorage.setItem('twobeone_user_id', data.user.id);
        toast.success(tr("Welcome back!"));
        onAuthSuccess(data.session.access_token, data.user);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('BLOCKED_BY_CLIENT')) {
        setError('An ad blocker is blocking the request. Please disable it for this site.');
      } else if (isAuthNetworkError(err)) {
        setError(authConnectionMessage());
      } else {
        setError(msg || 'Failed to sign in.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const productionOrigin = 'https://www.twobeone.app';
      const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${isLocal ? window.location.origin : productionOrigin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
      toast.success(tr("Reset link sent! Check your inbox."));
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Shared input style ───────────────────────────────────────────────────
  const inputWrap: React.CSSProperties = {
    position: 'relative', display: 'flex', alignItems: 'center',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 'var(--spacing-3) var(--spacing-4) var(--spacing-3) 44px',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid var(--border)',
    background: 'var(--input-background)',
    fontSize: 'var(--type-field-size)',
    fontWeight: 'var(--type-field-weight)',
    lineHeight: 'var(--type-field-leading)',
    color: 'var(--foreground)',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    boxSizing: 'border-box',
  };
  const iconLeft: React.CSSProperties = {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--muted-foreground)', pointerEvents: 'none',
    width: 'var(--icon-sm)', height: 'var(--icon-sm)',
  };
  const iconRight: React.CSSProperties = {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--muted-foreground)', cursor: 'pointer', padding: 4,
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--type-label-size)',
    lineHeight: 'var(--type-label-leading)',
    fontWeight: 'var(--type-label-weight)',
    color: 'var(--foreground)',
    marginBottom: 'var(--spacing-2)',
  };
  const fieldGap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' };

  const primaryBtn: React.CSSProperties = {
    width: '100%',
    padding: 'var(--spacing-3) var(--spacing-4)',
    borderRadius: 'var(--radius-lg)',
    border: 'none',
    background: 'var(--glass-primary-paint)',
    color: '#fff',
    boxShadow: 'var(--glass-shadow)',
    fontSize: 'var(--type-action-size)',
    lineHeight: 'var(--type-action-leading)',
    fontWeight: 'var(--type-action-weight)',
    fontFamily: 'inherit',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 0.15s ease, transform 0.1s ease',
    minHeight: 48,
  };

  return (
    <div className="tbo-glass-app" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-4)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Language selector */}
      <div style={{ position: 'fixed', top: 'var(--spacing-4)', right: 'var(--spacing-4)', zIndex: 50 }}>
        <LanguageSelector />
      </div>

      {/* Card */}
      <div className="tbo-glass-raised" style={{
        width: '100%',
        maxWidth: 420,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* ── Brand header ── */}
        <div style={{
          padding: 'var(--spacing-8) var(--spacing-6) var(--spacing-6)',
          textAlign: 'center',
          background: 'var(--glass-inset-surface)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64, height: 64,
            borderRadius: '50%',
            background: 'var(--glass-orb)',
            boxShadow: '0 8px 24px -4px color-mix(in srgb, var(--primary-500) 40%, transparent)',
            marginBottom: 'var(--spacing-4)',
          }}>
            <Heart style={{ width: 30, height: 30, color: 'var(--primary-foreground)', fill: 'var(--primary-foreground)' }} />
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 'var(--text-title)',
            fontWeight: 800,
            color: 'var(--foreground)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            overflowWrap: 'anywhere',
          }}>
            TwoBeOne
          </h1>
          <p style={{
            margin: 'var(--spacing-1) 0 0',
            fontSize: 'var(--type-supporting-size)',
            color: 'var(--muted-foreground)',
            fontWeight: 'var(--type-supporting-weight)',
          }}>
            {tr("Growing Together in Faith")}</p>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: 'var(--spacing-6)' }}>

          {/* ─── FORGOT PASSWORD ─────────────────────────────────────── */}
          {authMode === 'forgot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
              <BackButton onClick={() => switchMode('signin')} label={tr("Back to Sign In")} showLabel className="self-start" />

              {forgotSent ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-6)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'color-mix(in srgb, var(--primary-500) 8%, transparent)',
                  border: '1.5px solid var(--primary-200)',
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'var(--primary-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--spacing-4)',
                  }}>
                    <Mail style={{ width: 26, height: 26, color: 'var(--glass-accent)' }} />
                  </div>
                  <p style={{ margin: '0 0 var(--spacing-2)', fontSize: 'var(--type-section-size)', lineHeight: 'var(--type-section-leading)', fontWeight: 'var(--type-section-weight)', color: 'var(--foreground)' }}>
                    {tr("Check your inbox")}</p>
                  <p style={{ margin: 0, fontSize: 'var(--type-supporting-size)', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                    {tr("If an account exists for this address, a password reset link was sent to")}<br />
                    <strong style={{ color: 'var(--foreground)' }}>{email}</strong>
                  </p>
                  <button
                    onClick={() => { setForgotSent(false); setError(''); }}
                    style={{
                      marginTop: 'var(--spacing-4)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 'var(--type-supporting-size)', color: 'var(--glass-accent)',
                      fontWeight: 'var(--type-action-weight)', fontFamily: 'inherit',
                    }}
                  >
                    {tr("Resend email")}</button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <div>
                    <p style={{ margin: '0 0 var(--spacing-4)', fontSize: 'var(--type-supporting-size)', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                      {tr("Enter your account email and we'll send you a link to reset your password.")}</p>
                  </div>
                  <div style={fieldGap}>
                    <label style={labelStyle}>{tr("Email address")}</label>
                    <div style={inputWrap}>
                      <Mail style={iconLeft} />
                      <input
                        type="email"
                        placeholder={tr("you@example.com")}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary-400)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary-400) 15%, transparent)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  {error && <ErrorBanner message={tr(error)} />}

                  <button type="submit" disabled={isLoading} style={primaryBtn}>
                    {isLoading && <LoadingMark size={16} />}
                    {tr("Send Reset Link")}</button>
                </form>
              )}
            </div>
          )}

          {/* ─── SIGN IN / SIGN UP TABS ────────────────────────────────── */}
          {(authMode === 'signin' || authMode === 'signup') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>

              {/* Tab pills */}
              <div style={{
                display: 'flex',
                background: 'var(--glass-inset-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: 3,
                gap: 3,
              }}>
                {(['signin', 'signup'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => switchMode(mode)}
                    style={{
                      flex: 1,
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      borderRadius: 'calc(var(--radius-lg) - 3px)',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'var(--type-supporting-size)',
                      fontWeight: 'var(--type-action-weight)',
                      color: authMode === mode ? 'var(--foreground)' : 'var(--muted-foreground)',
                      background: authMode === mode ? 'var(--card)' : 'transparent',
                      boxShadow: authMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {mode === 'signin' ? t.auth.signIn : t.auth.signUp}
                  </button>
                ))}
              </div>

              {/* ── Sign In form ── */}
              {authMode === 'signin' && (
                <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <div style={fieldGap}>
                    <label style={labelStyle}>{tr("Email")}</label>
                    <div style={inputWrap}>
                      <Mail style={iconLeft} />
                      <input
                        type="email"
                        placeholder={tr("you@example.com")}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary-400)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary-400) 15%, transparent)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <div style={fieldGap}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={labelStyle}>{tr("Password")}</label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 'var(--type-supporting-size)',
                          fontWeight: 'var(--type-action-weight)',
                          color: 'var(--glass-accent)',
                          fontFamily: 'inherit',
                          padding: 0,
                          marginBottom: 'var(--spacing-2)',
                        }}
                      >
                        {tr("Forgot password?")}</button>
                    </div>
                    <div style={inputWrap}>
                      <Lock style={iconLeft} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ ...inputStyle, paddingRight: 44 }}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary-400)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary-400) 15%, transparent)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} style={iconRight} aria-label={tr(showPassword ? 'Hide password' : 'Show password')}>
                        {showPassword
                          ? <EyeOff style={{ width: 16, height: 16 }} />
                          : <Eye style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>
                  </div>

                  {error && <ErrorBanner message={tr(error)} />}

                  <button type="submit" disabled={isLoading} style={primaryBtn}>
                    {isLoading && <LoadingMark size={16} />}
                    {tr("Sign In")}</button>

                  <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--type-supporting-size)', color: 'var(--muted-foreground)' }}>
                    {tr("Don't have an account?")}{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'var(--type-label-weight)', color: 'var(--glass-accent)' }}
                    >
                      {tr("Sign up")}</button>
                  </p>
                </form>
              )}

              {/* ── Sign Up form ── */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <div style={fieldGap}>
                    <label style={labelStyle}>{tr("Your name")}</label>
                    <div style={inputWrap}>
                      <UserIcon style={iconLeft} />
                      <input
                        type="text"
                        placeholder={tr("John Doe")}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary-400)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary-400) 15%, transparent)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <div style={fieldGap}>
                    <label style={labelStyle}>{tr("Email")}</label>
                    <div style={inputWrap}>
                      <Mail style={iconLeft} />
                      <input
                        type="email"
                        placeholder={tr("you@example.com")}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary-400)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary-400) 15%, transparent)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <div style={fieldGap}>
                    <label style={labelStyle}>{tr("Password")}</label>
                    <div style={inputWrap}>
                      <Lock style={iconLeft} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={tr("Min. 6 characters")}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        style={{ ...inputStyle, paddingRight: 44 }}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary-400)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary-400) 15%, transparent)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} style={iconRight} aria-label={tr(showPassword ? 'Hide password' : 'Show password')}>
                        {showPassword
                          ? <EyeOff style={{ width: 16, height: 16 }} />
                          : <Eye style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>
                  </div>

                  {showInviteCode && generatedInviteCode && (
                    <div style={{
                      padding: 'var(--spacing-4)',
                      borderRadius: 'var(--radius-xl)',
                      background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
                      border: '1.5px solid var(--primary-200)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                        <span style={{ fontSize: 'var(--type-supporting-size)', fontWeight: 'var(--type-label-weight)', color: 'var(--glass-accent)' }}>
                          {tr("Your Invite Code")}</span>
                        <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--glass-accent)' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <code style={{
                          flex: 1, fontSize: 'var(--text-title)', fontWeight: 'var(--font-weight-bold)',
                          letterSpacing: '0.15em', color: 'var(--glass-accent)',
                          background: 'var(--card)', padding: 'var(--spacing-2) var(--spacing-4)',
                          borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)',
                          textAlign: 'center',
                        }}>
                          {generatedInviteCode}
                        </code>
                        <button
                          type="button"
                          onClick={copyInviteCode}
                          aria-label={tr('Copy invite code')}
                          style={{
                            padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--primary-300)', background: 'var(--card)',
                            cursor: 'pointer', color: 'var(--glass-accent)', display: 'flex',
                          }}
                        >
                          <Copy style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                      <p style={{ margin: 'var(--spacing-2) 0 0', fontSize: 'var(--type-caption-size)', color: 'var(--muted-foreground)' }}>
                        {tr("Share with your partner to connect accounts later")}</p>
                    </div>
                  )}

                  {error && <ErrorBanner message={tr(error)} />}

                  <p style={{ margin: 0, fontSize: 'var(--type-caption-size)', lineHeight: 1.5, color: 'var(--muted-foreground)' }}>
                    {tr("Registered accounts receive Shabbat Shalom, one Saturday email with encouragement, relationship guidance, and TwoBeOne updates. Every email includes an unsubscribe link.")}</p>

                  <button type="submit" disabled={isLoading} style={primaryBtn}>
                    {isLoading && <LoadingMark size={16} />}
                    {tr("Create Account")}</button>

                  <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--type-supporting-size)', color: 'var(--muted-foreground)' }}>
                    {tr("Already have an account?")}{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'var(--type-label-weight)', color: 'var(--glass-accent)' }}
                    >
                      {tr("Sign in")}</button>
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legal Consent Dialog */}
      {showLegalConsent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--spacing-4)', zIndex: 50,
        }}>
          <div style={{
            width: '100%', maxWidth: 640, maxHeight: '90vh',
            background: 'var(--card)', borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--border)',
            boxShadow: '0 24px 64px -12px rgba(0,0,0,0.2)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--type-dialog-size)', lineHeight: 'var(--type-dialog-leading)', fontWeight: 'var(--type-dialog-weight)', color: 'var(--foreground)' }}>
                {t.legal.agreementRequired}
              </h2>
              <p style={{ margin: 'var(--spacing-1) 0 0', fontSize: 'var(--type-supporting-size)', color: 'var(--muted-foreground)' }}>
                {t.legal.agreementDescription}
              </p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)' }}>
              <LegalConsent
                language={language}
                onAccept={handleLegalConsentAccepted}
                isLoading={isLoading}
              />
            </div>
            <div style={{ padding: 'var(--spacing-4) var(--spacing-6)', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { setShowLegalConsent(false); setPendingSignupData(null); }}
                disabled={isLoading}
                style={{
                  padding: 'var(--spacing-2) var(--spacing-5)',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--foreground)',
                  fontSize: 'var(--type-supporting-size)',
                  fontWeight: 'var(--type-action-weight)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {tr("Cancel")}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: var(--muted-foreground); opacity: 0.7; }
      `}</style>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderRadius: 'var(--radius-md)',
      background: 'color-mix(in srgb, var(--destructive) 8%, transparent)',
      border: '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
      fontSize: 'var(--type-supporting-size)',
      color: 'var(--glass-accent)',
      lineHeight: 1.5,
    }}>
      {message}
    </div>
  );
}
