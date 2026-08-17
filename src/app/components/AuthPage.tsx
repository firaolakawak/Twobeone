import { useState } from 'react';
import { Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowLeft, Heart, CheckCircle2, Copy } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { LegalConsent } from './LegalConsent';
import type { User } from '@supabase/supabase-js';

interface AuthPageProps {
  onAuthSuccess: (accessToken: string, user: User) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

const FloatingOrb = ({ style }: { style: React.CSSProperties }) => (
  <div style={{
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
    ...style,
  }} />
);

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
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

  const { t } = useLanguage();

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
    toast.success('Invite code copied!');
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
        toast.success('Welcome to TwoBeOne 🙏');
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
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await supabase.auth.signInWithPassword({ email, password });
          data = result.data; signInError = result.error; break;
        } catch (networkErr: any) {
          if (attempt === 2) throw networkErr;
          await new Promise(r => setTimeout(r, 2500));
        }
      }
      if (signInError) {
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
            toast.success('Welcome back!');
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
        toast.success('Welcome back!');
        onAuthSuccess(data.session.access_token, data.user);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('BLOCKED_BY_CLIENT')) {
        setError('An ad blocker is blocking the request. Please disable it for this site.');
      } else if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        setError('Connection error — please try again in a moment.');
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
      toast.success('Reset link sent! Check your inbox.');
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
    fontSize: 'var(--text-callout)',
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
    fontSize: 'var(--text-caption)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--foreground)',
    marginBottom: 'var(--spacing-2)',
  };
  const fieldGap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' };

  const primaryBtn: React.CSSProperties = {
    width: '100%',
    padding: 'var(--spacing-3) var(--spacing-4)',
    borderRadius: 'var(--radius-lg)',
    border: 'none',
    background: 'var(--primary-600)',
    color: 'var(--primary-foreground)',
    fontSize: 'var(--text-callout)',
    fontWeight: 'var(--font-weight-semibold)',
    fontFamily: 'inherit',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 0.15s ease, transform 0.1s ease',
    minHeight: 48,
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-4)',
      background: 'var(--background)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background orbs */}
      <FloatingOrb style={{ width: 400, height: 400, background: 'var(--primary-100)', top: '-120px', right: '-100px', opacity: 0.6 }} />
      <FloatingOrb style={{ width: 300, height: 300, background: 'var(--primary-50)', bottom: '-80px', left: '-80px', opacity: 0.8 }} />
      <FloatingOrb style={{ width: 200, height: 200, background: 'var(--secondary-100)', top: '40%', left: '5%', opacity: 0.5 }} />

      {/* Language selector */}
      <div style={{ position: 'fixed', top: 'var(--spacing-4)', right: 'var(--spacing-4)', zIndex: 50 }}>
        <LanguageSelector />
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--card)',
        borderRadius: 'var(--radius-2xl)',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* ── Brand header ── */}
        <div style={{
          padding: 'var(--spacing-8) var(--spacing-6) var(--spacing-6)',
          textAlign: 'center',
          background: 'linear-gradient(160deg, var(--primary-50) 0%, var(--card) 60%)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64, height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
            boxShadow: '0 8px 24px -4px color-mix(in srgb, var(--primary-500) 40%, transparent)',
            marginBottom: 'var(--spacing-4)',
          }}>
            <Heart style={{ width: 30, height: 30, color: 'var(--primary-foreground)', fill: 'var(--primary-foreground)' }} />
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 'var(--text-title)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            TwoBeOne
          </h1>
          <p style={{
            margin: 'var(--spacing-1) 0 0',
            fontSize: 'var(--text-caption)',
            color: 'var(--muted-foreground)',
            fontWeight: 'var(--font-weight-normal)',
          }}>
            Growing Together in Faith
          </p>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: 'var(--spacing-6)' }}>

          {/* ─── FORGOT PASSWORD ─────────────────────────────────────── */}
          {authMode === 'forgot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
              <button
                onClick={() => switchMode('signin')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, fontFamily: 'inherit',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--muted-foreground)',
                }}
              >
                <ArrowLeft style={{ width: 15, height: 15 }} />
                Back to Sign In
              </button>

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
                    <Mail style={{ width: 26, height: 26, color: 'var(--primary-600)' }} />
                  </div>
                  <p style={{ margin: '0 0 var(--spacing-2)', fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                    Check your inbox
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                    If an account exists for this address, a password reset link was sent to<br />
                    <strong style={{ color: 'var(--foreground)' }}>{email}</strong>
                  </p>
                  <button
                    onClick={() => { setForgotSent(false); setError(''); }}
                    style={{
                      marginTop: 'var(--spacing-4)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 'var(--text-caption)', color: 'var(--primary-600)',
                      fontWeight: 'var(--font-weight-medium)', fontFamily: 'inherit',
                    }}
                  >
                    Resend email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <div>
                    <p style={{ margin: '0 0 var(--spacing-4)', fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                      Enter your account email and we'll send you a link to reset your password.
                    </p>
                  </div>
                  <div style={fieldGap}>
                    <label style={labelStyle}>Email address</label>
                    <div style={inputWrap}>
                      <Mail style={iconLeft} />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary-400)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary-400) 15%, transparent)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  {error && <ErrorBanner message={error} />}

                  <button type="submit" disabled={isLoading} style={primaryBtn}>
                    {isLoading && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
                    Send Reset Link
                  </button>
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
                background: 'var(--muted)',
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
                      fontSize: 'var(--text-caption)',
                      fontWeight: authMode === mode ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
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
                    <label style={labelStyle}>Email</label>
                    <div style={inputWrap}>
                      <Mail style={iconLeft} />
                      <input
                        type="email"
                        placeholder="you@example.com"
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
                      <label style={labelStyle}>Password</label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 'var(--text-caption)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--primary-600)',
                          fontFamily: 'inherit',
                          padding: 0,
                          marginBottom: 'var(--spacing-2)',
                        }}
                      >
                        Forgot password?
                      </button>
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
                      <button type="button" onClick={() => setShowPassword(v => !v)} style={iconRight}>
                        {showPassword
                          ? <EyeOff style={{ width: 16, height: 16 }} />
                          : <Eye style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>
                  </div>

                  {error && <ErrorBanner message={error} />}

                  <button type="submit" disabled={isLoading} style={primaryBtn}>
                    {isLoading && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
                    Sign In
                  </button>

                  <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary-600)' }}
                    >
                      Sign up
                    </button>
                  </p>
                </form>
              )}

              {/* ── Sign Up form ── */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <div style={fieldGap}>
                    <label style={labelStyle}>Your name</label>
                    <div style={inputWrap}>
                      <UserIcon style={iconLeft} />
                      <input
                        type="text"
                        placeholder="John Doe"
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
                    <label style={labelStyle}>Email</label>
                    <div style={inputWrap}>
                      <Mail style={iconLeft} />
                      <input
                        type="email"
                        placeholder="you@example.com"
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
                    <label style={labelStyle}>Password</label>
                    <div style={inputWrap}>
                      <Lock style={iconLeft} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        style={{ ...inputStyle, paddingRight: 44 }}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary-400)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary-400) 15%, transparent)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} style={iconRight}>
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
                        <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary-700)' }}>
                          Your Invite Code
                        </span>
                        <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--primary-600)' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <code style={{
                          flex: 1, fontSize: 'var(--text-title)', fontWeight: 'var(--font-weight-bold)',
                          letterSpacing: '0.15em', color: 'var(--primary-700)',
                          background: 'var(--card)', padding: 'var(--spacing-2) var(--spacing-4)',
                          borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)',
                          textAlign: 'center',
                        }}>
                          {generatedInviteCode}
                        </code>
                        <button
                          type="button"
                          onClick={copyInviteCode}
                          style={{
                            padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--primary-300)', background: 'var(--card)',
                            cursor: 'pointer', color: 'var(--primary-600)', display: 'flex',
                          }}
                        >
                          <Copy style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                      <p style={{ margin: 'var(--spacing-2) 0 0', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>
                        Share with your partner to connect accounts later
                      </p>
                    </div>
                  )}

                  {error && <ErrorBanner message={error} />}

                  <p style={{ margin: 0, fontSize: 'var(--text-label)', lineHeight: 1.5, color: 'var(--muted-foreground)' }}>
                    Registered accounts receive Shabbat Shalom, one Saturday email with encouragement,
                    relationship guidance, and TwoBeOne updates. Every email includes an unsubscribe link.
                  </p>

                  <button type="submit" disabled={isLoading} style={primaryBtn}>
                    {isLoading && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
                    Create Account
                  </button>

                  <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary-600)' }}
                    >
                      Sign in
                    </button>
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
              <h2 style={{ margin: 0, fontSize: 'var(--text-heading)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>
                Legal Agreement Required
              </h2>
              <p style={{ margin: 'var(--spacing-1) 0 0', fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                Please review and accept our legal documents to continue
              </p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)' }}>
              <LegalConsent
                language={t.currentLanguage as 'en' | 'am'}
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
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--font-weight-medium)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
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
      fontSize: 'var(--text-caption)',
      color: 'var(--primary-700)',
      lineHeight: 1.5,
    }}>
      {message}
    </div>
  );
}
