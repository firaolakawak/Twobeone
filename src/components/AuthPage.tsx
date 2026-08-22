import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Heart, Loader2, Mail, Key, Users, CheckCircle2, Copy, Link2 } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface AuthPageProps {
  onAuthSuccess: (accessToken: string) => void;
}

type AuthMode = 'signin' | 'signup' | 'link';

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Sign In / Sign Up fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Couple Linking fields
  const [linkMethod, setLinkMethod] = useState<'email' | 'code'>('email');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedInviteCode, setGeneratedInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);

  // Email verification
  const [emailSent, setEmailSent] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const generateInviteCode = () => {
    // Generate a 6-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedInviteCode(code);
    setShowInviteCode(true);
    return code;
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(generatedInviteCode);
    toast.success('Invite code copied to clipboard!');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      console.log('[AuthPage] Starting sign up...');
      
      // Generate invite code for this user
      const userInviteCode = generateInviteCode();
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ 
            email, 
            password, 
            name, 
            partnerEmail: '',
            inviteCode: userInviteCode
          })
        }
      );

      const data = await response.json();
      console.log('[AuthPage] Sign up response:', { ok: response.ok, status: response.status, data });

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409 || 
            data.error?.includes('already registered') || 
            data.error?.includes('already been registered') ||
            data.error?.includes('User already registered')) {
          setError('This email is already registered. Please sign in instead.');
          setAuthMode('signin');
          toast.info('This email is already registered. Please sign in.');
          setIsLoading(false);
          return;
        }
        
        if (data.error?.includes('Invalid email')) {
          setError('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }
        
        if (data.error?.includes('Password')) {
          setError(data.error);
          setIsLoading(false);
          return;
        }
        
        throw new Error(data.error || 'Sign up failed');
      }

      console.log('[AuthPage] Sign up successful, now signing in...');
      
      // After successful sign up, sign in
      const supabase = createClient();
      const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('[AuthPage] Sign in response:', { 
        hasSession: !!sessionData.session, 
        hasAccessToken: !!sessionData.session?.access_token, 
        error: signInError?.message 
      });

      if (signInError) throw signInError;

      if (sessionData.session?.access_token) {
        // Store user ID and couple ID in localStorage for secure access
        const userId = sessionData.user?.id;
        if (userId) {
          localStorage.setItem('twobeone_user_id', userId);
          console.log('[AuthPage] User ID stored:', userId);
        }
        
        console.log('[AuthPage] Calling onAuthSuccess with access token');
        toast.success('Account created successfully!');
        setEmailSent(true);
        onAuthSuccess(sessionData.session.access_token);
      }
    } catch (err: any) {
      console.error('[AuthPage] Sign up error:', err);
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
      console.log('[AuthPage] Starting sign in...');
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('[AuthPage] Sign in response:', { 
        hasSession: !!data.session, 
        hasAccessToken: !!data.session?.access_token, 
        error: signInError?.message 
      });

      if (signInError) {
        // Handle specific error cases
        if (signInError.message?.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (signInError.message?.includes('Email not confirmed')) {
          setError('Please verify your email before signing in.');
          setVerificationSent(true);
        } else {
          setError(signInError.message || 'Failed to sign in');
        }
        setIsLoading(false);
        return;
      }

      if (data.session?.access_token) {
        // Store user ID and couple ID in localStorage
        const userId = data.user?.id;
        if (userId) {
          localStorage.setItem('twobeone_user_id', userId);
          console.log('[AuthPage] User ID stored:', userId);
        }
        
        console.log('[AuthPage] Calling onAuthSuccess with access token');
        toast.success('Welcome back!');
        onAuthSuccess(data.session.access_token);
      }
    } catch (err: any) {
      console.error('[AuthPage] Sign in error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('[AuthPage] Linking couple...');
      
      // First, authenticate the user
      const supabase = createClient();
      const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError('Please sign in first before linking with your partner');
        setIsLoading(false);
        return;
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setError('Authentication failed');
        setIsLoading(false);
        return;
      }

      // Link with partner
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/link-couple`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ 
            method: linkMethod,
            partnerEmail: linkMethod === 'email' ? partnerEmail : undefined,
            inviteCode: linkMethod === 'code' ? inviteCode : undefined
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link couple');
      }

      // Store couple ID
      if (data.coupleId) {
        localStorage.setItem('twobeone_couple_id', data.coupleId);
        console.log('[AuthPage] Couple ID stored:', data.coupleId);
      }

      toast.success('Successfully linked with your partner!');
      onAuthSuccess(accessToken);
    } catch (err: any) {
      console.error('[AuthPage] Link couple error:', err);
      setError(err.message || 'Failed to link couple');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;
      
      toast.success('Verification email sent!');
      setVerificationSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            <CardTitle className="text-3xl">TwoBeOne</CardTitle>
          </div>
          <CardDescription>
            Growing Together in Faith
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as AuthMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin" className="text-xs">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs">Sign Up</TabsTrigger>
              <TabsTrigger value="link" className="text-xs">Link Couple</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4 mt-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">
                    <Key className="w-4 h-4 inline mr-2" />
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                    {error}
                    {verificationSent && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={handleResendVerification}
                      >
                        Resend verification email
                      </Button>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Your Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">
                    <Key className="w-4 h-4 inline mr-2" />
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 characters
                  </p>
                </div>

                {showInviteCode && generatedInviteCode && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm">Your Invite Code</Label>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-2xl font-bold tracking-wider text-purple-700 bg-white px-4 py-2 rounded border">
                        {generatedInviteCode}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyInviteCode}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this code with your partner to connect your accounts
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                {emailSent && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                    Verification email sent! Please check your inbox.
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>

            {/* Link Couple Tab */}
            <TabsContent value="link" className="space-y-4 mt-4">
              <div className="text-center mb-4">
                <Users className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Connect with your partner to share your spiritual journey
                </p>
              </div>

              <form onSubmit={handleLinkCouple} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link-email">Your Email</Label>
                  <Input
                    id="link-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link-password">Your Password</Label>
                  <Input
                    id="link-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="border-t pt-4">
                  <Label className="mb-3 block">Choose Link Method</Label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button
                      type="button"
                      variant={linkMethod === 'email' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLinkMethod('email')}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={linkMethod === 'code' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLinkMethod('code')}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Invite Code
                    </Button>
                  </div>

                  {linkMethod === 'email' ? (
                    <div className="space-y-2">
                      <Label htmlFor="partner-email">Partner's Email</Label>
                      <Input
                        id="partner-email"
                        type="email"
                        placeholder="partner@example.com"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your partner's registered email address
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="invite-code">Partner's Invite Code</Label>
                      <Input
                        id="invite-code"
                        type="text"
                        placeholder="ABC123"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        required
                        maxLength={6}
                        className="uppercase tracking-wider text-center text-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the 6-character code your partner shared with you
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Users className="mr-2 h-4 w-4" />
                  Link with Partner
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 border-t pt-4">
          <div className="text-xs text-center text-muted-foreground">
            {authMode === 'signin' && (
              <>Need an account? Switch to <strong>Sign Up</strong> tab</>
            )}
            {authMode === 'signup' && (
              <>Already have an account? Switch to <strong>Sign In</strong> tab</>
            )}
            {authMode === 'link' && (
              <>Link your account with your partner to share your journey</>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}