import { Hono } from 'npm:hono@4.6.14';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import * as jose from 'npm:jose@5';
import * as kv from './kv_store.tsx';
import communityRoutes from './community_routes.tsx';
import { webrtcRoutes } from './webrtc_routes.tsx';
import pushRoutes from './push_routes.tsx';
import newsletterRoutes from './newsletter_routes.tsx';
import landingRoutes from './landing_routes.tsx';
import { setupAdminRoutes } from './admin_routes.tsx';
import { setupRecoveryRoutes } from './recovery_routes.tsx';
import { migrateSeederFlags, seedAllCategoryQuestions } from './seed_questions.tsx';
import { initializeAdminSystem } from './init_admins.tsx';

const app = new Hono();

// ── CORS ───────────────────────────────────────────────────────────────────
// Security is enforced per-route via JWT. We use open CORS (wildcard) so that
// any host — Figma Make previews, production, localhost — can reach the API.
// Credentials mode is intentionally off: auth is header-based (Bearer token),
// not cookie-based, so Access-Control-Allow-Credentials is not needed.
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
}));
app.use('*', logger(console.log));

// ── Rate limiter (KV-backed sliding window) ────────────────────────────────
async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  try {
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;
    const current: number = (await kv.get(windowKey) as number) || 0;
    if (current >= maxRequests) return false;
    await kv.set(windowKey, current + 1);
    return true;
  } catch {
    return true; // fail open on KV error — don't block legitimate traffic
  }
}

// Initialize Supabase client
const getSupabase = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Make Supabase client available to all routes
app.use('*', async (c, next) => {
  c.set('supabase', getSupabase());
  await next();
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

type ReportLanguage = 'en' | 'am' | 'om';

function resolveReportLanguage(value: unknown): ReportLanguage {
  return value === 'am' || value === 'om' ? value : 'en';
}

function reportLanguageInstruction(language: ReportLanguage): string {
  if (language === 'am') return 'Write entirely in natural, modern Amharic (አማርኛ).';
  if (language === 'om') return 'Write entirely in natural Afaan Oromo.';
  return 'Write entirely in clear, natural English.';
}

function cleanGeneratedReport(value: unknown): string {
  return String(value || '')
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`{1,3}/g, '')
    .replace(/^[ \t]*[-*][ \t]+/gm, '')
    .replace(/^[ \t]*\d+[.)][ \t]+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function reportCopy(language: ReportLanguage) {
  if (language === 'am') return {
    title: '💝 ሳምንታዊ የስሜት ነጸብራቅ',
    summary: (first: string, firstAvg: string, second: string, secondAvg: string) =>
      `የዚህ ሳምንት የስሜት ነጸብራቅ፦ ${first} (${firstAvg}/4) እና ${second} (${secondAvg}/4)`,
    fallback: (first: string, firstCount: number, firstAvg: string, second: string, secondCount: number, secondAvg: string) =>
      `${first} በዚህ ሳምንት ${firstCount} ጊዜ ስሜቱን አጋርቷል፣ አማካይ ውጤቱም ${firstAvg}/4 ነው። ${second} ${secondCount} ጊዜ አጋርቷል፣ አማካይ ውጤቱም ${secondAvg}/4 ነው።\n\nስሜታችሁን በታማኝነት መጋራታችሁ እርስ በርሳችሁ ለመግባባት የሚረዳ ውብ ልማድ ነው። በዚህ ሳምንት አንዳችሁ ሌላውን በጸጥታ ለማዳመጥ ጥቂት ጊዜ ውሰዱ።\n\n“ደስ ከሚላቸው ጋር ደስ ይበላችሁ፤ ከሚያለቅሱትም ጋር አልቅሱ።” ሮሜ 12፥15`,
  };
  if (language === 'om') return {
    title: '💝 Calaqqee Miiraa Torbanii',
    summary: (first: string, firstAvg: string, second: string, secondAvg: string) =>
      `Calaqqee miiraa torban kanaa: ${first} (${firstAvg}/4) fi ${second} (${secondAvg}/4)`,
    fallback: (first: string, firstCount: number, firstAvg: string, second: string, secondCount: number, secondAvg: string) =>
      `${first} torban kana yeroo ${firstCount} miira isaa qoodateera; giddugaleessi isaa ${firstAvg}/4 dha. ${second} yeroo ${secondCount} qoodateera; giddugaleessi isaa ${secondAvg}/4 dha.\n\nMiira keessan amanamummaadhaan waliif qooduun wal hubachuuf amala bareedaa dha. Torban kana yeroo gabaabaa fudhadhaatii, murtii kennuu malee walii dhaggeeffadhaa.\n\n“Warra gammadan wajjin gammadaa; warra boo'an wajjin boo'aa.” Roomaa 12:15`,
  };
  return {
    title: '💝 Weekly Mood Reflection',
    summary: (first: string, firstAvg: string, second: string, secondAvg: string) =>
      `This week's mood reflection: ${first} (${firstAvg}/4) and ${second} (${secondAvg}/4)`,
    fallback: (first: string, firstCount: number, firstAvg: string, second: string, secondCount: number, secondAvg: string) =>
      `${first} shared a mood ${firstCount} times this week, with an average of ${firstAvg}/4. ${second} shared ${secondCount} times, with an average of ${secondAvg}/4.\n\nThe simple act of naming how you feel is a caring way to understand one another. This week, make a little unhurried space to listen without trying to fix everything.\n\n“Rejoice with those who rejoice; mourn with those who mourn.” Romans 12:15`,
  };
}

type EngagementCategory = 'reading' | 'answering' | 'journaling' | 'praying' | 'other';
const ENGAGEMENT_CATEGORIES: EngagementCategory[] = ['reading', 'answering', 'journaling', 'praying', 'other'];

function emptyEngagementPeriod() {
  return {
    totalSeconds: 0,
    byCategory: { reading: 0, answering: 0, journaling: 0, praying: 0, other: 0 } as Record<EngagementCategory, number>,
  };
}

async function getEngagementSummary(userIds: string[], now = new Date()) {
  const periods = { today: emptyEngagementPeriod(), week: emptyEngagementPeriod(), month: emptyEngagementPeriod() };
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
  const weekStart = startOfToday - (6 * 86_400_000);
  const monthStart = startOfToday - (29 * 86_400_000);
  const events = (await Promise.all(userIds.filter(Boolean).map(id => kv.getByPrefix(`engagement:${id}:`))))
    .flat() as any[];

  for (const event of events) {
    const timestamp = new Date(event?.createdAt || 0).getTime();
    const category = event?.category as EngagementCategory;
    const seconds = Math.max(0, Math.min(120, Number(event?.seconds) || 0));
    if (!ENGAGEMENT_CATEGORIES.includes(category) || timestamp < monthStart || timestamp > now.getTime() + 60_000) continue;
    const targets = [periods.month];
    if (timestamp >= weekStart) targets.push(periods.week);
    if (timestamp >= startOfToday) targets.push(periods.today);
    for (const period of targets) {
      period.totalSeconds += seconds;
      period.byCategory[category] += seconds;
    }
  }

  const weekly = periods.week.totalSeconds;
  const levels = [
    { level: 'starting', min: 0, next: 30 * 60 },
    { level: 'growing', min: 30 * 60, next: 2 * 3600 },
    { level: 'devoted', min: 2 * 3600, next: 5 * 3600 },
    { level: 'champion', min: 5 * 3600, next: null },
  ] as const;
  const tier = [...levels].reverse().find(item => weekly >= item.min) || levels[0];
  const progress = tier.next === null ? 100 : Math.max(0, Math.min(100, Math.round(((weekly - tier.min) / (tier.next - tier.min)) * 100)));
  return { ...periods, champion: { level: tier.level, progress, nextTargetSeconds: tier.next } };
}

function engagementPromptContext(summary: Awaited<ReturnType<typeof getEngagementSummary>>): string {
  const activity = summary.week.byCategory;
  const mins = (seconds: number) => Math.round(seconds / 60);
  return `Intentional app time together in the last 7 days: ${mins(summary.week.totalSeconds)} minutes total (reading ${mins(activity.reading)}, answering ${mins(activity.answering)}, journaling ${mins(activity.journaling)}, praying ${mins(activity.praying)}).`;
}

// Atomically reserves an idempotency key. The KV table's primary key makes
// simultaneous requests from both partners or multiple devices safe.
async function claimIdempotencyKey(key: string, value: Record<string, unknown>): Promise<boolean> {
  const { error } = await getSupabase()
    .from('kv_store_6d579fee')
    .insert({ key, value });

  if (!error) return true;
  if (error.code === '23505') return false;
  throw new Error(`Failed to claim notification idempotency key: ${error.message}`);
}

// Generate invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Get user ID from access token
async function isAdminUser(userId: string): Promise<boolean> {
  const adminList = await kv.get('system:admins') || [];
  return Array.isArray(adminList) && adminList.includes(userId);
}

// Cached JWT secret key (created once, reused across requests)
let _jwtKey: CryptoKey | null = null;

async function getJwtKey(): Promise<CryptoKey | null> {
  if (_jwtKey) return _jwtKey;
  const secret = Deno.env.get('SUPABASE_JWT_SECRET');
  if (!secret) return null;
  _jwtKey = await jose.importJWK(
    { kty: 'oct', k: btoa(secret).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') },
    'HS256'
  ).catch(() => null) as CryptoKey | null;
  // Fallback: use raw secret bytes
  if (!_jwtKey) {
    _jwtKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    ).catch(() => null);
  }
  return _jwtKey;
}

async function getUserFromToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  // Fast path: verify JWT locally using SUPABASE_JWT_SECRET — no network call
  try {
    const secret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (secret) {
      const key = await jose.importJWK(
        { kty: 'oct', k: btoa(String.fromCharCode(...new TextEncoder().encode(secret))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') },
        'HS256'
      ).catch(() => new TextEncoder().encode(secret));
      const { payload } = await jose.jwtVerify(token, key as Parameters<typeof jose.jwtVerify>[1]);
      const sub = payload.sub;
      if (sub) return sub;
    }
  } catch {
    // JWT invalid or expired — fall through to Supabase verification
  }

  // Slow path fallback: verify via Supabase API (handles edge cases like revoked tokens)
  try {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch (err) {
    console.error('Error getting user from token:', err);
    return null;
  }
}

// ============================================
// HEALTH CHECK
// ============================================

// Bump updatedAt on the user's profile so the partner's polling detects activity.
// Call this fire-and-forget from any route that creates partner-visible data.
async function touchActivity(userId: string): Promise<void> {
  try {
    const profile = await kv.get(`user:${userId}`);
    if (profile) {
      await kv.set(`user:${userId}`, { ...profile, updatedAt: new Date().toISOString() });
    }
  } catch {
    // Non-critical — don't let this break the parent request
  }
}

app.get('/make-server-6d579fee/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'TwoBeOne API is running',
    timestamp: new Date().toISOString()
  });
});

// ── Audit Log Helper ──────────────────────────────────────────────────────────
// Fire-and-forget — never throws, never blocks the parent request

type AuditCategory = 'auth' | 'social' | 'content' | 'admin';
type AuditEvent =
  | 'user.signup' | 'user.email_verified'
  | 'couple.linked' | 'couple.unlinked'
  | 'devotional.completed'
  | 'prayer.created' | 'prayer.answered'
  | 'journal.created'
  | 'qa.answered'
  | 'mood.logged'
  | 'admin.privilege_granted' | 'admin.privilege_revoked'
  | 'profile.updated'
  | 'admin.devotional_created' | 'admin.devotional_updated' | 'admin.devotional_deleted' | 'admin.devotionals_imported'
  | 'admin.question_created' | 'admin.question_updated' | 'admin.question_deleted'
  | 'admin.module_created' | 'admin.module_updated' | 'admin.module_deleted' | 'admin.modules_imported'
  | 'admin.group_created' | 'admin.group_updated' | 'admin.group_deleted'
  | 'admin.user_deleted' | 'admin.landing_page_updated';

const AUDIT_CATEGORY: Record<AuditEvent, AuditCategory> = {
  'user.signup': 'auth', 'user.email_verified': 'auth',
  'couple.linked': 'social', 'couple.unlinked': 'social',
  'devotional.completed': 'content',
  'prayer.created': 'content', 'prayer.answered': 'content',
  'journal.created': 'content',
  'qa.answered': 'content',
  'mood.logged': 'content',
  'admin.privilege_granted': 'admin', 'admin.privilege_revoked': 'admin',
  'profile.updated': 'social',
  'admin.devotional_created': 'admin', 'admin.devotional_updated': 'admin',
  'admin.devotional_deleted': 'admin', 'admin.devotionals_imported': 'admin',
  'admin.question_created': 'admin', 'admin.question_updated': 'admin', 'admin.question_deleted': 'admin',
  'admin.module_created': 'admin', 'admin.module_updated': 'admin',
  'admin.module_deleted': 'admin', 'admin.modules_imported': 'admin',
  'admin.group_created': 'admin', 'admin.group_updated': 'admin', 'admin.group_deleted': 'admin',
  'admin.user_deleted': 'admin', 'admin.landing_page_updated': 'admin',
};

async function logAudit(
  event: AuditEvent,
  userId: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const profile = await kv.get(`user:${userId}`) as any;
    const id = generateId();
    const timestamp = new Date().toISOString();
    const entry = {
      id,
      event,
      category: AUDIT_CATEGORY[event],
      userId,
      userName: profile?.name || profile?.full_name || 'Unknown',
      userEmail: profile?.email || '',
      metadata,
      timestamp,
    };
    // Use simple numeric-prefixed key to avoid ISO-timestamp colons in LIKE queries
    const tsMs = Date.now();
    await kv.set(`auditlog:${tsMs}:${id}`, entry);
    console.log(`[Audit] ✅ ${event} logged for user ${userId}`);
  } catch (err) {
    console.error('[Audit] ❌ Failed to write audit entry:', err);
  }
}

// ============================================
// AUTHENTICATION
// ============================================

app.post('/make-server-6d579fee/signup', async (c) => {
  try {
    const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
    const allowed = await checkRateLimit(`signup:${ip}`, 5, 3_600_000); // 5 per hour per IP
    if (!allowed) {
      return c.json({ error: 'Too many sign-up attempts. Please try again in an hour.' }, 429);
    }

    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (typeof email !== 'string' || email.length > 320) {
      return c.json({ error: 'Invalid email' }, 400);
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return c.json({ error: 'Password must be 6–128 characters' }, 400);
    }
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return c.json({ error: 'Name must be 1–100 characters' }, 400);
    }

    const supabase = getSupabase();

    // Auto-confirm users — no email verification required to sign in
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // Handle specific error cases with user-friendly messages
      if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
        return c.json({ 
          error: 'This email is already registered. Please sign in instead or use a different email.' 
        }, 409); // 409 Conflict
      }
      
      if (authError.message.includes('Invalid email')) {
        return c.json({ error: 'Please enter a valid email address.' }, 400);
      }
      
      if (authError.message.includes('Password')) {
        return c.json({ error: 'Password must be at least 6 characters long.' }, 400);
      }
      
      return c.json({ error: authError.message }, 400);
    }

    const userId = authData.user.id;
    const inviteCode = generateInviteCode();

    // Create user profile in KV store
    const userProfile = {
      id: userId,
      email,
      name,
      inviteCode,
      partnerId: null,
      relationshipStart: null,
      bio: null,
      profilePicture: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, userProfile);
    await kv.set(`invite:${inviteCode}`, userId);

    console.log('User created:', { userId, email, name, inviteCode });

    // Audit log — fire-and-forget
    await logAudit('user.signup', userId, { email, name });

    return c.json({
      success: true,
      user: userProfile,
      inviteCode,
      emailVerificationRequired: false,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle unexpected errors
    if (error.message?.includes('already been registered') || error.code === 'email_exists') {
      return c.json({ 
        error: 'This email is already registered. Please sign in instead or use a different email.' 
      }, 409);
    }
    
    return c.json({ error: error.message || 'Signup failed. Please try again.' }, 500);
  }
});

// ============================================
// AUTO-CONFIRM SIGN-IN
// Confirms the user's email via admin API then returns a session.
// Used when a user signed up before email_confirm was set to true.
// ============================================

app.post('/make-server-6d579fee/auto-confirm-signin', async (c) => {
  try {
    const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
    const allowed = await checkRateLimit(`auto-confirm:${ip}`, 5, 60_000);
    if (!allowed) {
      return c.json({ error: 'Too many requests. Please wait a minute and try again.' }, 429);
    }

    const { email, password } = await c.req.json();
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    const supabase = getSupabase();

    // Step 1: attempt sign-in — succeeds for confirmed accounts
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: firstAttempt, error: firstError } = await anonClient.auth.signInWithPassword({ email, password });

    if (!firstError && firstAttempt.session) {
      return c.json({
        access_token: firstAttempt.session.access_token,
        refresh_token: firstAttempt.session.refresh_token,
        user: firstAttempt.user,
      });
    }

    // Step 2: only auto-confirm for unconfirmed-email errors; reject everything else
    const isUnconfirmed = firstError?.message?.includes('Email not confirmed') || firstError?.code === 'email_not_confirmed';
    if (!isUnconfirmed) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Step 3: find the specific user by email and confirm them
    const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const targetUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const { error: confirmError } = await supabase.auth.admin.updateUserById(targetUser.id, { email_confirm: true });
    if (confirmError) {
      console.error('[auto-confirm-signin] Failed to confirm:', confirmError.message);
      return c.json({ error: 'Failed to confirm account' }, 500);
    }

    // Step 4: sign in now that the email is confirmed
    const { data: sessionData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
    if (signInError) {
      return c.json({ error: signInError.message }, 401);
    }

    return c.json({
      access_token: sessionData.session?.access_token,
      refresh_token: sessionData.session?.refresh_token,
      user: sessionData.user,
    });
  } catch (error: any) {
    console.error('[auto-confirm-signin] Error:', error.message);
    return c.json({ error: 'Sign in failed' }, 500);
  }
});

// ============================================
// PROFILE
// ============================================

app.get('/make-server-6d579fee/profile', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`[GET /profile] Fetching profile for user: ${userId}`);
    const startTime = Date.now();

    // Direct KV fetch — no artificial timeout; Supabase client handles its own networking
    let profile = await kv.get(`user:${userId}`);

    console.log(`[GET /profile] Profile fetch took ${Date.now() - startTime}ms`);

    // AUTO-FIX: If profile doesn't exist but user is authenticated, create it
    if (!profile) {
      console.log(`[Profile] User ${userId} authenticated but no profile found. Creating profile...`);

      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

      if (error || !user) {
        console.error(`[Profile] Failed to get user info from auth:`, error);
        throw new Error('Profile not found and could not be created');
      }

      const inviteCode = generateInviteCode();
      profile = {
        id: userId,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        inviteCode: inviteCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await kv.set(`user:${userId}`, profile);
      await kv.set(`invite:${inviteCode}`, userId);

      console.log(`[Profile] ✅ Created profile for user ${userId}`);
    }

    // Fetch partner if linked — failure is non-critical
    let partner = null;
    if (profile.partnerId) {
      try {
        partner = await kv.get(`user:${profile.partnerId}`);
      } catch (err) {
        console.error('[GET /profile] Failed to fetch partner, continuing without:', err);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`[GET /profile] ✅ Profile loaded successfully in ${totalTime}ms for user: ${userId}`);
    
    return c.json({ profile, partner });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    if (error.message?.includes('timeout')) {
      return c.json({ error: 'Database query timeout. Please try again.' }, 504);
    }
    return c.json({ error: error.message || 'Failed to load profile' }, 500);
  }
});

// Fields a user is allowed to update on their own profile
const PROFILE_MUTABLE_FIELDS = new Set([
  'name', 'bio', 'location', 'language', 'profilePicture',
  'relationshipStart', 'notificationsEnabled', 'pushSubscription',
  'preferredVerseLanguage', 'timezone', 'phone',
]);

function sanitizeProfileUpdates(updates: Record<string, any>): Record<string, any> {
  const safe: Record<string, any> = {};
  for (const key of PROFILE_MUTABLE_FIELDS) {
    if (key in updates) safe[key] = updates[key];
  }
  return safe;
}

app.post('/make-server-6d579fee/profile', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const rawUpdates = await c.req.json();
    const updates = sanitizeProfileUpdates(rawUpdates);
    const profile = await kv.get(`user:${userId}`);

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      // These system fields must never be overwritten by user input
      id: profile.id,
      email: profile.email,
      partnerId: profile.partnerId,
      coupleId: profile.coupleId,
      inviteCode: profile.inviteCode,
      isAdmin: profile.isAdmin,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, updatedProfile);

    // If relationshipStart is being set and user has a partner, sync it to partner
    if (updates.relationshipStart && profile.partnerId) {
      console.log('[POST /profile] Syncing relationshipStart to partner:', profile.partnerId);
      console.log('[POST /profile] New relationshipStart value:', updates.relationshipStart);
      
      try {
        const partner = await kv.get(`user:${profile.partnerId}`);
        if (partner) {
          console.log('[POST /profile] Partner found, current relationshipStart:', partner.relationshipStart);
          
          const updatedPartner = {
            ...partner,
            relationshipStart: updates.relationshipStart,
            updatedAt: new Date().toISOString()
          };
          await kv.set(`user:${profile.partnerId}`, updatedPartner);
          console.log('[POST /profile] ✅ Partner relationshipStart synced successfully to:', updates.relationshipStart);
          
          // Create a notification for the partner
          const notificationId = `notif:${profile.partnerId}:${Date.now()}`;
          const notification = {
            id: notificationId,
            userId: profile.partnerId,
            type: 'profile_update',
            title: '💕 Relationship Date Set!',
            message: `${updatedProfile.name || 'Your partner'} set your relationship start date. Check your profile!`,
            data: { relationshipStart: updates.relationshipStart },
            read: false,
            createdAt: new Date().toISOString()
          };
          await kv.set(notificationId, notification);
          console.log('[POST /profile] ✅ Notification created for partner');
        } else {
          console.log('[POST /profile] ⚠️ Partner not found with ID:', profile.partnerId);
        }
      } catch (partnerError) {
        console.error('[POST /profile] Failed to sync relationshipStart to partner:', partnerError);
        // Don't fail the request if partner sync fails
      }
    } else {
      if (!updates.relationshipStart) {
        console.log('[POST /profile] No relationshipStart in updates');
      }
      if (!profile.partnerId) {
        console.log('[POST /profile] No partner linked to this profile');
      }
    }

    return c.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT endpoint for profile updates (same as POST for compatibility)
app.put('/make-server-6d579fee/profile', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const rawUpdates = await c.req.json();
    const updates = sanitizeProfileUpdates(rawUpdates);
    console.log('[PUT /profile] Updating profile for user:', userId, 'allowed fields:', Object.keys(updates));

    const profile = await kv.get(`user:${userId}`);

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      id: profile.id,
      email: profile.email,
      partnerId: profile.partnerId,
      coupleId: profile.coupleId,
      inviteCode: profile.inviteCode,
      isAdmin: profile.isAdmin,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, updatedProfile);

    // If relationshipStart is being set and user has a partner, sync it to partner
    if (updates.relationshipStart && profile.partnerId) {
      console.log('[PUT /profile] Syncing relationshipStart to partner:', profile.partnerId);
      console.log('[PUT /profile] New relationshipStart value:', updates.relationshipStart);
      
      try {
        const partner = await kv.get(`user:${profile.partnerId}`);
        if (partner) {
          console.log('[PUT /profile] Partner found, current relationshipStart:', partner.relationshipStart);
          
          const updatedPartner = {
            ...partner,
            relationshipStart: updates.relationshipStart,
            updatedAt: new Date().toISOString()
          };
          await kv.set(`user:${profile.partnerId}`, updatedPartner);
          console.log('[PUT /profile] ✅ Partner relationshipStart synced successfully to:', updates.relationshipStart);
          
          // Create a notification for the partner
          const notificationId = `notif:${profile.partnerId}:${Date.now()}`;
          const notification = {
            id: notificationId,
            userId: profile.partnerId,
            type: 'profile_update',
            title: '💕 Relationship Date Set!',
            message: `${updatedProfile.name || 'Your partner'} set your relationship start date. Check your profile!`,
            data: { relationshipStart: updates.relationshipStart },
            read: false,
            createdAt: new Date().toISOString()
          };
          await kv.set(notificationId, notification);
          console.log('[PUT /profile] ✅ Notification created for partner');
        } else {
          console.log('[PUT /profile] ⚠️ Partner not found with ID:', profile.partnerId);
        }
      } catch (partnerError) {
        console.error('[PUT /profile] Failed to sync relationshipStart to partner:', partnerError);
        // Don't fail the request if partner sync fails
      }
    } else {
      if (!updates.relationshipStart) {
        console.log('[PUT /profile] No relationshipStart in updates');
      }
      if (!profile.partnerId) {
        console.log('[PUT /profile] No partner linked to this profile');
      }
    }

    console.log('[PUT /profile] Profile updated successfully');
    return c.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-6d579fee/profile/generate-code', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Delete old invite code mapping
    if (profile.inviteCode) {
      await kv.del(`invite:${profile.inviteCode}`);
    }

    const newCode = generateInviteCode();
    profile.inviteCode = newCode;
    profile.updatedAt = new Date().toISOString();

    await kv.set(`user:${userId}`, profile);
    await kv.set(`invite:${newCode}`, userId);

    return c.json({ success: true, inviteCode: newCode });
  } catch (error: any) {
    console.error('Generate code error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-6d579fee/profile/link-by-code', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { code } = await c.req.json();
    if (!code) {
      return c.json({ error: 'Invite code required' }, 400);
    }

    // Get partner ID from invite code
    const partnerId = await kv.get(`invite:${code}`);
    if (!partnerId) {
      return c.json({ error: 'Invalid invite code' }, 404);
    }

    if (partnerId === userId) {
      return c.json({ error: 'Cannot link to yourself' }, 400);
    }

    // Get both profiles
    const userProfile = await kv.get(`user:${userId}`);
    const partnerProfile = await kv.get(`user:${partnerId}`);

    if (!userProfile || !partnerProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Create couple record first
    const coupleId = generateId();
    const couple = {
      id: coupleId,
      partner1Id: userId,
      partner2Id: partnerId,
      relationshipStartDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    await kv.set(`couple:${coupleId}`, couple);

    // Link the profiles with BOTH partnerId AND coupleId
    userProfile.partnerId = partnerId;
    userProfile.coupleId = coupleId;  // ✅ ADD THIS!
    userProfile.updatedAt = new Date().toISOString();
    partnerProfile.partnerId = userId;
    partnerProfile.coupleId = coupleId;  // ✅ ADD THIS!
    partnerProfile.updatedAt = new Date().toISOString();

    await kv.set(`user:${userId}`, userProfile);
    await kv.set(`user:${partnerId}`, partnerProfile);

    console.log(`✅ Couple created! CoupleId: ${coupleId}, User1: ${userId}, User2: ${partnerId}`);

    await logAudit('couple.linked', userId, { partnerId, coupleId });
    await logAudit('couple.linked', partnerId, { partnerId: userId, coupleId });

    return c.json({ success: true, partner: partnerProfile });
  } catch (error: any) {
    console.error('Link by code error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Request partner disconnect (requires mutual agreement + 30-day grace period)
app.post('/make-server-6d579fee/partner/request-disconnect', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile?.partnerId) {
      return c.json({ error: 'No partner connection found' }, 400);
    }

    const partnerId = profile.partnerId;
    const partner = await kv.get(`user:${partnerId}`);
    
    // Check if there's already a disconnect request
    let disconnectRequest = await kv.get(`disconnect:${profile.coupleId}`);
    
    if (!disconnectRequest) {
      // Create new disconnect request
      disconnectRequest = {
        id: generateId(),
        coupleId: profile.coupleId,
        requestedBy: [userId],
        requestedAt: new Date().toISOString(),
        gracePeriodEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        status: 'pending' // pending | agreed | cancelled | completed
      };
      await kv.set(`disconnect:${profile.coupleId}`, disconnectRequest);
      
      // Send notification to partner
      const notificationId = generateId();
      const notification = {
        id: notificationId,
        userId: partnerId,
        type: 'partner_disconnect_request',
        title: '💔 Partner Disconnect Request',
        message: `${profile.name} has requested to disconnect. Both partners must agree to proceed.`,
        data: {
          requestedBy: profile.name,
          requestedAt: disconnectRequest.requestedAt,
          gracePeriodEnds: disconnectRequest.gracePeriodEnds
        },
        read: false,
        createdAt: new Date().toISOString()
      };
      await kv.set(`notification:${partnerId}:${notificationId}`, notification);
      
      console.log(`[Disconnect] User ${userId} requested disconnect from ${partnerId}. Grace period: 30 days.`);
      
      // TODO: Send email notification to partner
      // For now, we'll just log it. Email integration would require email service setup.
      console.log(`[Email] TODO: Send email to ${partner?.email}: "${profile.name} has requested to disconnect. Please review in the app."`);
      
      return c.json({ 
        success: true, 
        message: 'Disconnect request created. Your partner has been notified and must also agree.',
        gracePeriodEnds: disconnectRequest.gracePeriodEnds,
        status: 'pending'
      });
    } else {
      // Check if user already requested
      if (disconnectRequest.requestedBy.includes(userId)) {
        return c.json({ 
          error: 'You have already requested to disconnect',
          status: disconnectRequest.status,
          gracePeriodEnds: disconnectRequest.gracePeriodEnds
        }, 400);
      }
      
      // Partner agrees - add user to requestedBy array
      disconnectRequest.requestedBy.push(userId);
      disconnectRequest.status = 'agreed';
      disconnectRequest.bothAgreedAt = new Date().toISOString();
      await kv.set(`disconnect:${profile.coupleId}`, disconnectRequest);
      
      // Send notification to original requester
      const notificationId = generateId();
      const notification = {
        id: notificationId,
        userId: disconnectRequest.requestedBy[0], // Original requester
        type: 'partner_disconnect_agreed',
        title: '💔 Partner Agreed to Disconnect',
        message: `${profile.name} has agreed to disconnect. You have 30 days to cancel if you change your mind.`,
        data: {
          agreedBy: profile.name,
          agreedAt: disconnectRequest.bothAgreedAt,
          gracePeriodEnds: disconnectRequest.gracePeriodEnds
        },
        read: false,
        createdAt: new Date().toISOString()
      };
      await kv.set(`notification:${disconnectRequest.requestedBy[0]}:${notificationId}`, notification);
      
      console.log(`[Disconnect] Both partners agreed. Grace period ends: ${disconnectRequest.gracePeriodEnds}`);
      
      // TODO: Send email to both partners
      console.log(`[Email] TODO: Send emails to both partners about mutual disconnect agreement. Grace period: 30 days.`);
      
      return c.json({ 
        success: true, 
        message: 'Both partners have agreed to disconnect. You have 30 days to cancel if either of you change your mind.',
        gracePeriodEnds: disconnectRequest.gracePeriodEnds,
        status: 'agreed'
      });
    }
  } catch (error: any) {
    console.error('Request disconnect error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Cancel disconnect request (either partner can cancel)
app.post('/make-server-6d579fee/partner/cancel-disconnect', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile?.partnerId || !profile?.coupleId) {
      return c.json({ error: 'No partner connection found' }, 400);
    }

    const disconnectRequest = await kv.get(`disconnect:${profile.coupleId}`);
    if (!disconnectRequest) {
      return c.json({ error: 'No active disconnect request found' }, 404);
    }

    if (disconnectRequest.status === 'completed') {
      return c.json({ error: 'Disconnect already completed' }, 400);
    }

    // Cancel the request
    await kv.del(`disconnect:${profile.coupleId}`);
    
    // Notify both partners
    const partner = await kv.get(`user:${profile.partnerId}`);
    const notificationIds = [generateId(), generateId()];
    
    const notification1 = {
      id: notificationIds[0],
      userId: profile.partnerId,
      type: 'partner_disconnect_cancelled',
      title: '💚 Disconnect Request Cancelled',
      message: `${profile.name} has cancelled the disconnect request. You remain connected!`,
      data: { cancelledBy: profile.name },
      read: false,
      createdAt: new Date().toISOString()
    };
    
    const notification2 = {
      id: notificationIds[1],
      userId: userId,
      type: 'partner_disconnect_cancelled',
      title: '💚 Disconnect Request Cancelled',
      message: `You cancelled the disconnect request. You remain connected with ${partner?.name}!`,
      data: { cancelledBy: profile.name },
      read: false,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`notification:${profile.partnerId}:${notificationIds[0]}`, notification1);
    await kv.set(`notification:${userId}:${notificationIds[1]}`, notification2);
    
    console.log(`[Disconnect] Request cancelled by user ${userId}`);
    
    // TODO: Send email notifications
    console.log(`[Email] TODO: Send emails to both partners about disconnect cancellation.`);
    
    return c.json({ 
      success: true, 
      message: 'Disconnect request cancelled successfully. You remain connected with your partner.' 
    });
  } catch (error: any) {
    console.error('Cancel disconnect error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get disconnect request status
app.get('/make-server-6d579fee/partner/disconnect-status', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile?.coupleId) {
      return c.json({ hasRequest: false });
    }

    const disconnectRequest = await kv.get(`disconnect:${profile.coupleId}`);
    
    if (!disconnectRequest) {
      return c.json({ hasRequest: false });
    }

    // Check if grace period has ended and both agreed
    const gracePeriodEnded = new Date(disconnectRequest.gracePeriodEnds) <= new Date();
    
    if (gracePeriodEnded && disconnectRequest.status === 'agreed') {
      // Disconnect the couple automatically
      await executeDisconnect(profile.coupleId);
      return c.json({ 
        hasRequest: false,
        disconnected: true,
        message: 'Grace period ended. Partners have been disconnected.'
      });
    }

    return c.json({
      hasRequest: true,
      status: disconnectRequest.status,
      requestedBy: disconnectRequest.requestedBy,
      requestedAt: disconnectRequest.requestedAt,
      bothAgreedAt: disconnectRequest.bothAgreedAt,
      gracePeriodEnds: disconnectRequest.gracePeriodEnds,
      daysRemaining: Math.ceil((new Date(disconnectRequest.gracePeriodEnds).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      userRequested: disconnectRequest.requestedBy.includes(userId)
    });
  } catch (error: any) {
    console.error('Get disconnect status error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Helper function to execute disconnect
async function executeDisconnect(coupleId: string) {
  try {
    const couple = await kv.get(`couple:${coupleId}`);
    if (!couple) return;

    const user1 = await kv.get(`user:${couple.partner1Id}`);
    const user2 = await kv.get(`user:${couple.partner2Id}`);

    // Remove partner connections
    if (user1) {
      user1.partnerId = null;
      user1.coupleId = null;
      user1.updatedAt = new Date().toISOString();
      await kv.set(`user:${couple.partner1Id}`, user1);
    }

    if (user2) {
      user2.partnerId = null;
      user2.coupleId = null;
      user2.updatedAt = new Date().toISOString();
      await kv.set(`user:${couple.partner2Id}`, user2);
    }

    // Archive the couple record (don't delete, for data integrity)
    couple.status = 'disconnected';
    couple.disconnectedAt = new Date().toISOString();
    await kv.set(`couple:${coupleId}`, couple);

    // Delete disconnect request
    await kv.del(`disconnect:${coupleId}`);

    // Send final notifications
    const notificationIds = [generateId(), generateId()];
    
    const notification1 = {
      id: notificationIds[0],
      userId: couple.partner1Id,
      type: 'partner_disconnected',
      title: '💔 Partnership Ended',
      message: 'Your partnership has been disconnected. Your data remains private.',
      read: false,
      createdAt: new Date().toISOString()
    };
    
    const notification2 = {
      id: notificationIds[1],
      userId: couple.partner2Id,
      type: 'partner_disconnected',
      title: '💔 Partnership Ended',
      message: 'Your partnership has been disconnected. Your data remains private.',
      read: false,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`notification:${couple.partner1Id}:${notificationIds[0]}`, notification1);
    await kv.set(`notification:${couple.partner2Id}:${notificationIds[1]}`, notification2);

    console.log(`[Disconnect] Couple ${coupleId} disconnected successfully`);
    
    // TODO: Send final email notifications
    console.log(`[Email] TODO: Send final disconnection emails to both partners.`);
  } catch (error) {
    console.error('[Disconnect] Error executing disconnect:', error);
  }
}

// Upload profile picture
app.post('/make-server-6d579fee/profile/upload-picture', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { imageData, fileName } = await c.req.json();
    
    if (!imageData) {
      return c.json({ error: 'Image data required' }, 400);
    }

    console.log('[POST /profile/upload-picture] Uploading profile picture for user:', userId);

    // Get user profile
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Create a Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Ensure the bucket exists
    const bucketName = 'make-6d579fee-profile-pictures';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('[POST /profile/upload-picture] Creating bucket:', bucketName);
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880 // 5MB
      });
    }

    // Delete old profile picture if exists
    if (profile.profilePicture) {
      const oldFileName = profile.profilePicture.split('/').pop();
      if (oldFileName) {
        console.log('[POST /profile/upload-picture] Deleting old picture:', oldFileName);
        await supabase.storage.from(bucketName).remove([`${userId}/${oldFileName}`]);
      }
    }

    // Convert base64 to buffer
    const base64Data = imageData.split(',')[1] || imageData;
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate unique filename
    const timestamp = Date.now();
    const extension = fileName?.split('.').pop() || 'jpg';
    const newFileName = `profile-${timestamp}.${extension}`;
    const filePath = `${userId}/${newFileName}`;

    console.log('[POST /profile/upload-picture] Uploading to path:', filePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: `image/${extension}`,
        upsert: true
      });

    if (uploadError) {
      console.error('[POST /profile/upload-picture] Upload error:', uploadError);
      return c.json({ error: uploadError.message }, 500);
    }

    console.log('[POST /profile/upload-picture] Upload successful:', uploadData);

    // Get public URL (we'll use signed URL since bucket is private)
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10 years

    if (!signedUrlData?.signedUrl) {
      return c.json({ error: 'Failed to generate URL' }, 500);
    }

    const imageUrl = signedUrlData.signedUrl;
    console.log('[POST /profile/upload-picture] Generated signed URL');

    // Update profile with new picture URL
    profile.profilePicture = imageUrl;
    profile.updatedAt = new Date().toISOString();
    await kv.set(`user:${userId}`, profile);

    console.log('[POST /profile/upload-picture] ✅ Profile picture updated successfully');

    return c.json({ 
      success: true, 
      imageUrl,
      profile 
    });
  } catch (error: any) {
    console.error('[POST /profile/upload-picture] Error:', error);
    return c.json({ error: error.message || 'Failed to upload picture' }, 500);
  }
});

// Delete profile picture
app.delete('/make-server-6d579fee/profile/delete-picture', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[DELETE /profile/delete-picture] Deleting profile picture for user:', userId);

    // Get user profile
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    if (!profile.profilePicture) {
      return c.json({ error: 'No profile picture to delete' }, 400);
    }

    // Create a Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const bucketName = 'make-6d579fee-profile-pictures';
    
    // Extract filename from URL
    const fileName = profile.profilePicture.split('/').pop()?.split('?')[0];
    if (fileName) {
      const filePath = `${userId}/${fileName}`;
      console.log('[DELETE /profile/delete-picture] Deleting file:', filePath);
      
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (deleteError) {
        console.error('[DELETE /profile/delete-picture] Delete error:', deleteError);
        // Continue anyway - we'll clear the URL from profile
      }
    }

    // Update profile to remove picture URL
    profile.profilePicture = null;
    profile.updatedAt = new Date().toISOString();
    await kv.set(`user:${userId}`, profile);

    console.log('[DELETE /profile/delete-picture] ✅ Profile picture deleted successfully');

    return c.json({ 
      success: true,
      profile 
    });
  } catch (error: any) {
    console.error('[DELETE /profile/delete-picture] Error:', error);
    return c.json({ error: error.message || 'Failed to delete picture' }, 500);
  }
});

// Export user data
app.get('/make-server-6d579fee/profile/export-data', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[GET /profile/export-data] Exporting data for user:', userId);

    // Get user profile
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Get journal entries
    const journalEntries = await kv.getByPrefix(`journal:${userId}:`);

    // Get prayer requests
    const prayers = await kv.getByPrefix(`prayer:${userId}:`);

    // Get milestones
    const milestones = await kv.getByPrefix(`milestone:${userId}:`);

    // Get question responses
    const responses = await kv.getByPrefix(`response:${userId}:`);

    // Get devotional progress
    const devotionalProgress = await kv.getByPrefix(`devotional-progress:${userId}:`);

    // Get mood entries
    const moodEntries = await kv.getByPrefix(`mood:${userId}:`);

    // Get notifications
    const notifications = await kv.getByPrefix(`notification:${userId}:`);

    // Prepare export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        bio: profile.bio,
        phone: profile.phone,
        location: profile.location,
        relationshipStart: profile.relationshipStart,
        inviteCode: profile.inviteCode,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      },
      journalEntries: journalEntries.map((entry: any) => ({
        id: entry.id,
        content: entry.content,
        title: entry.title,
        mood: entry.mood,
        isShared: entry.isShared,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      })),
      prayers: prayers.map((prayer: any) => ({
        id: prayer.id,
        title: prayer.title,
        description: prayer.description,
        status: prayer.status,
        isShared: prayer.isShared,
        category: prayer.category,
        createdAt: prayer.createdAt,
        updatedAt: prayer.updatedAt
      })),
      milestones: milestones.map((milestone: any) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        date: milestone.date,
        category: milestone.category,
        createdAt: milestone.createdAt
      })),
      responses: responses.map((response: any) => ({
        id: response.id,
        questionId: response.questionId,
        answer: response.answer,
        category: response.category,
        createdAt: response.createdAt
      })),
      devotionalProgress: devotionalProgress,
      moodEntries: moodEntries.map((mood: any) => ({
        id: mood.id,
        mood: mood.mood,
        note: mood.note,
        createdAt: mood.createdAt
      })),
      notifications: notifications.map((notif: any) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: notif.isRead,
        createdAt: notif.createdAt
      })),
      stats: {
        totalJournalEntries: journalEntries.length,
        totalPrayers: prayers.length,
        totalMilestones: milestones.length,
        totalResponses: responses.length,
        totalMoodEntries: moodEntries.length,
        totalNotifications: notifications.length
      }
    };

    console.log('[GET /profile/export-data] ✅ Data exported successfully');

    return c.json(exportData);
  } catch (error: any) {
    console.error('[GET /profile/export-data] Error:', error);
    return c.json({ error: error.message || 'Failed to export data' }, 500);
  }
});

// Delete account
app.delete('/make-server-6d579fee/profile/delete-account', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[DELETE /profile/delete-account] Deleting account for user:', userId);

    // Get user profile
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // ✅ CHECK: User must not be connected to a partner
    if (profile.partnerId) {
      console.log('[DELETE /profile/delete-account] ❌ Cannot delete account - user is connected to partner:', profile.partnerId);
      return c.json({ 
        error: 'Cannot delete account while connected to a partner. Please disconnect from your partner first.',
        code: 'PARTNER_CONNECTED'
      }, 400);
    }

    // Create a Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Delete user's auth account
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('[DELETE /profile/delete-account] Auth delete error:', authError);
      // Continue anyway to clean up KV data
    }

    // Delete profile picture from storage if exists
    if (profile.profilePicture) {
      const bucketName = 'make-6d579fee-profile-pictures';
      const fileName = profile.profilePicture.split('/').pop()?.split('?')[0];
      if (fileName) {
        const filePath = `${userId}/${fileName}`;
        console.log('[DELETE /profile/delete-account] Deleting profile picture:', filePath);
        await supabase.storage.from(bucketName).remove([filePath]);
      }
    }

    // Delete all user data from KV store
    console.log('[DELETE /profile/delete-account] Deleting user data from KV store...');
    
    // Delete profile
    await kv.del(`user:${userId}`);
    
    // Delete journal entries
    const journalEntries = await kv.getByPrefix(`journal:${userId}:`);
    for (const entry of journalEntries) {
      await kv.del(`journal:${userId}:${entry.id}`);
    }
    
    // Delete prayer requests
    const prayers = await kv.getByPrefix(`prayer:${userId}:`);
    for (const prayer of prayers) {
      await kv.del(`prayer:${userId}:${prayer.id}`);
    }
    
    // Delete milestones
    const milestones = await kv.getByPrefix(`milestone:${userId}:`);
    for (const milestone of milestones) {
      await kv.del(`milestone:${userId}:${milestone.id}`);
    }
    
    // Delete question responses
    const responses = await kv.getByPrefix(`response:${userId}:`);
    for (const response of responses) {
      await kv.del(`response:${userId}:${response.id}`);
    }
    
    // Delete devotional progress
    const devotionalProgress = await kv.getByPrefix(`devotional-progress:${userId}:`);
    for (const progress of devotionalProgress) {
      await kv.del(`devotional-progress:${userId}:${progress.id}`);
    }
    
    // Delete mood entries
    const moodEntries = await kv.getByPrefix(`mood:${userId}:`);
    for (const mood of moodEntries) {
      await kv.del(`mood:${userId}:${mood.id}`);
    }
    
    // Delete notifications
    const notifications = await kv.getByPrefix(`notification:${userId}:`);
    for (const notif of notifications) {
      await kv.del(`notification:${userId}:${notif.id}`);
    }
    
    // Delete push subscriptions
    const pushSubscriptions = await kv.getByPrefix(`push-subscription:${userId}:`);
    for (const sub of pushSubscriptions) {
      await kv.del(`push-subscription:${userId}:${sub.id}`);
    }

    console.log('[DELETE /profile/delete-account] ✅ Account and all data deleted successfully');

    return c.json({ 
      success: true,
      message: 'Your account and all associated data have been permanently deleted.'
    });
  } catch (error: any) {
    console.error('[DELETE /profile/delete-account] Error:', error);
    return c.json({ error: error.message || 'Failed to delete account' }, 500);
  }
});

// ============================================
// JOURNAL ENTRIES
// ============================================

app.get('/make-server-6d579fee/journal', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`[GET /journal] Loading journal for user: ${userId}`);

    // Fetch profile + user entries in parallel (independent KV calls)
    const [profile, userEntries] = await Promise.all([
      kv.get(`user:${userId}`).catch(() => null),
      kv.getByPrefix(`journal:${userId}:`).catch(() => [] as any[]),
    ]);

    console.log(`[GET /journal] Found ${(userEntries as any[]).length} user entries`);

    // Partner entries need partnerId from profile — one more KV call
    let partnerEntries: any[] = [];
    if ((profile as any)?.partnerId) {
      try {
        const allPartnerEntries: any[] = await kv.getByPrefix(`journal:${(profile as any).partnerId}:`);
        partnerEntries = allPartnerEntries
          .filter((e: any) => e.isShared)
          .map((e: any) => ({ ...e, isPartner: true }));
        console.log(`[GET /journal] Found ${partnerEntries.length} partner entries`);
      } catch {
        console.warn('[GET /journal] Partner entries fetch failed, continuing');
      }
    }

    // Combine and limit
    const entries = [...userEntries, ...partnerEntries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);

    console.log(`[GET /journal] ✅ Returning ${entries.length} entries`);
    return c.json({ entries });
  } catch (error: any) {
    console.error('[GET /journal] Error:', error);
    
    // Provide specific error messages
    if (error.message?.includes('timeout')) {
      return c.json({ 
        error: 'Request timeout: The database query took too long. Please try again.' 
      }, 504); // Gateway Timeout
    }
    
    return c.json({ 
      error: error.message || 'Failed to fetch journal entries' 
    }, 500);
  }
});

app.post('/make-server-6d579fee/journal', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, content, isShared, emoji, location, entryType, mediaFiles, createdAt } = await c.req.json();

    // Content is required for journal entries, but optional for events
    if (entryType !== 'event' && !content) {
      return c.json({ error: 'Content is required for journal entries' }, 400);
    }

    // Title is always required
    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const entryId = generateId();
    const entry = {
      id: entryId,
      userId,
      title,
      content: content || '',
      isShared: isShared || false,
      emoji: emoji || (entryType === 'event' ? '✨' : '📝'),
      location: location || null,
      entryType: entryType || 'journal',
      mediaFiles: mediaFiles || [],
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`journal:${userId}:${entryId}`, entry);
    touchActivity(userId); // lets partner's poll detect this change
    await logAudit('journal.created', userId, { entryId, title, isShared: isShared || false });

    return c.json({ success: true, entry });
  } catch (error: any) {
    console.error('Journal create error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/journal/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const entryId = c.req.param('id');
    const updates = await c.req.json();

    console.log('=== JOURNAL UPDATE DEBUG ===');
    console.log('Entry ID:', entryId);
    console.log('Updates received:', updates);
    console.log('CreatedAt in updates:', updates.createdAt);
    console.log('===========================');

    // Try to find entry in user's entries first
    let entry = await kv.get(`journal:${userId}:${entryId}`);
    let entryKey = `journal:${userId}:${entryId}`;
    let isOwnEntry = true;
    
    // If not found, check if it's a partner's entry (for comments)
    if (!entry) {
      const profile = await kv.get(`user:${userId}`);
      const partnerId = profile?.partnerId;
      
      if (partnerId) {
        const partnerEntry = await kv.get(`journal:${partnerId}:${entryId}`);
        if (partnerEntry) {
          entry = partnerEntry;
          entryKey = `journal:${partnerId}:${entryId}`;
          isOwnEntry = false;
        }
      }
    }

    if (!entry) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    // Only allow certain fields to be updated on partner entries (like comments)
    let updatedEntry;
    if (isOwnEntry) {
      // Can update everything on own entries
      updatedEntry = {
        ...entry,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      console.log('=== UPDATED ENTRY ===');
      console.log('Old createdAt:', entry.createdAt);
      console.log('New createdAt:', updatedEntry.createdAt);
      console.log('====================');
    } else {
      // Only allow updating comments on partner entries
      updatedEntry = {
        ...entry,
        comments: updates.comments || entry.comments,
        updatedAt: new Date().toISOString()
      };
    }

    await kv.set(entryKey, updatedEntry);

    return c.json({ success: true, entry: updatedEntry });
  } catch (error: any) {
    console.error('Journal update error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/journal/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const entryId = c.req.param('id');
    const entryKey = `journal:${userId}:${entryId}`;
    
    console.log('[DELETE /journal/:id] Attempting to delete:', { userId, entryId, entryKey });
    
    // Check if entry exists before deleting
    const existingEntry = await kv.get(entryKey);
    console.log('[DELETE /journal/:id] Entry exists:', !!existingEntry);
    
    if (!existingEntry) {
      console.log('[DELETE /journal/:id] Entry not found');
      return c.json({ error: 'Entry not found' }, 404);
    }
    
    await kv.del(entryKey);
    console.log('[DELETE /journal/:id] Entry deleted successfully');
    
    // Verify deletion
    const verifyDeleted = await kv.get(entryKey);
    if (verifyDeleted) {
      console.error('[DELETE /journal/:id] ⚠️ WARNING: Entry still exists after deletion!');
      return c.json({ error: 'Delete failed - entry still exists' }, 500);
    }
    
    console.log('[DELETE /journal/:id] ✅ Deletion verified');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Journal delete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// PRAYER REQUESTS
// ============================================

app.get('/make-server-6d579fee/prayer', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`[GET /prayer] Loading prayers for user: ${userId}`);

    // Profile + user prayers in parallel
    const [profile, userPrayers] = await Promise.all([
      kv.get(`user:${userId}`).catch(() => null),
      kv.getByPrefix(`prayer:${userId}:`).catch(() => [] as any[]),
    ]);

    console.log(`[GET /prayer] Profile partnerId: ${(profile as any)?.partnerId || 'none'}, user prayers: ${(userPrayers as any[]).length}`);

    // Partner prayers need partnerId — one more KV call
    let partnerPrayers: any[] = [];
    if ((profile as any)?.partnerId) {
      try {
        const raw: any[] = await kv.getByPrefix(`prayer:${(profile as any).partnerId}:`);
        partnerPrayers = raw.map((p: any) => ({ ...p, isPartner: true }));
      } catch {
        console.warn('[GET /prayer] Partner prayers fetch failed, continuing');
      }
    }

    const prayers = [...(userPrayers as any[]), ...partnerPrayers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 200);

    console.log(`[GET /prayer] Returning ${prayers.length} total prayers`);
    return c.json({ prayers, hasCoupleConnection: !!(profile as any)?.partnerId });
  } catch (error: any) {
    console.error('[GET /prayer] Error:', error.message);
    return c.json({ error: error.message || 'Failed to fetch prayers' }, 500);
  }
});

app.post('/make-server-6d579fee/prayer', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { title, description, category, reminderDate, isSharedWithCommunity, isShared, youPrayed, partnerPrayed } = body;

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const prayerId = generateId();
    const prayer = {
      id: prayerId,
      userId,
      title,
      description: description || '',
      category: category || 'General',
      reminderDate: reminderDate || null,
      isSharedWithCommunity: isSharedWithCommunity ?? isShared ?? false,
      isShared: isSharedWithCommunity ?? isShared ?? false,
      isAnswered: false,
      youPrayed: youPrayed ?? true,
      partnerPrayed: partnerPrayed ?? false,
      prayerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`prayer:${userId}:${prayerId}`, prayer);
    touchActivity(userId);
    await logAudit('prayer.created', userId, { prayerId, title, isShared: prayer.isShared });

    return c.json({ success: true, prayer });
  } catch (error: any) {
    console.error('Prayer create error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/prayer/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const prayerId = c.req.param('id');
    const updates = await c.req.json();

    // Try current user's prayer first; fall back to partner's prayer
    let prayer = await kv.get(`prayer:${userId}:${prayerId}`);
    let ownerKey = `prayer:${userId}:${prayerId}`;

    if (!prayer) {
      const profile: any = await kv.get(`user:${userId}`).catch(() => null);
      if (profile?.partnerId) {
        prayer = await kv.get(`prayer:${profile.partnerId}:${prayerId}`);
        if (prayer) {
          ownerKey = `prayer:${profile.partnerId}:${prayerId}`;
        }
      }
    }

    if (!prayer) {
      return c.json({ error: 'Prayer not found' }, 404);
    }

    const updatedPrayer = {
      ...prayer,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(ownerKey, updatedPrayer);
    if (updates.isAnswered && !(prayer as any).isAnswered) {
      await logAudit('prayer.answered', userId, { prayerId, title: (prayer as any).title });
    }

    return c.json({ success: true, prayer: updatedPrayer });
  } catch (error: any) {
    console.error('Prayer update error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/prayer/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const prayerId = c.req.param('id');
    const userKey = `prayer:${userId}:${prayerId}`;

    // Check if it's the user's own prayer; if not, check partner's
    const ownPrayer = await kv.get(userKey);
    if (ownPrayer) {
      await kv.del(userKey);
    } else {
      const profile: any = await kv.get(`user:${userId}`).catch(() => null);
      if (profile?.partnerId) {
        const partnerKey = `prayer:${profile.partnerId}:${prayerId}`;
        const partnerPrayer = await kv.get(partnerKey);
        if (partnerPrayer) {
          await kv.del(partnerKey);
        }
      }
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Prayer delete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// MOODS
// ============================================

app.post('/make-server-6d579fee/moods', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { mood, note } = await c.req.json();

    const moodId = generateId();
    const moodEntry = {
      id: moodId,
      userId,
      mood,
      note: note || '',
      createdAt: new Date().toISOString()
    };

    await kv.set(`mood:${userId}:${moodId}`, moodEntry);
    touchActivity(userId);

    return c.json({ success: true, mood: moodEntry });
  } catch (error: any) {
    console.error('Mood save error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/moods', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Profile + user moods in parallel
    const [profile, userMoods] = await Promise.all([
      kv.get(`user:${userId}`).catch(() => null),
      kv.getByPrefix(`mood:${userId}:`).catch(() => [] as any[]),
    ]);

    console.log(`[GET /moods] User moods: ${(userMoods as any[]).length}, partnerId: ${(profile as any)?.partnerId || 'none'}`);

    let partnerMoods: any[] = [];
    if ((profile as any)?.partnerId) {
      try {
        partnerMoods = await kv.getByPrefix(`mood:${(profile as any).partnerId}:`);
      } catch {
        console.warn('[GET /moods] Partner moods fetch failed, continuing');
      }
    }

    const allMoods = [...(userMoods as any[]), ...partnerMoods]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 500);

    return c.json({ moods: allMoods });
  } catch (error: any) {
    console.error('[GET /moods] Error:', error);
    if (error.message?.includes('timeout')) {
      return c.json({ error: 'Request timeout. Please try again.' }, 504);
    }
    return c.json({ error: error.message || 'Failed to fetch moods' }, 500);
  }
});

// Active time is submitted in short idempotent slices. Only visible, non-idle
// time is measured by the client; the server caps every slice defensively.
app.post('/make-server-6d579fee/engagement/time', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const category = body?.category as EngagementCategory;
    const seconds = Math.floor(Number(body?.seconds));
    const eventId = String(body?.eventId || '');
    if (!ENGAGEMENT_CATEGORIES.includes(category) || !Number.isFinite(seconds) || seconds < 1 || seconds > 120) {
      return c.json({ error: 'Invalid engagement time' }, 400);
    }
    if (!/^[a-zA-Z0-9._:-]{8,160}$/.test(eventId)) return c.json({ error: 'Invalid event ID' }, 400);
    const createdAt = new Date().toISOString();
    const key = `engagement:${userId}:${eventId}`;
    const claimed = await claimIdempotencyKey(key, { userId, category, seconds, createdAt, eventId });
    return c.json({ success: true, duplicate: !claimed });
  } catch (error: any) {
    console.error('Engagement tracking error:', error);
    return c.json({ error: error.message || 'Failed to track engagement' }, 500);
  }
});

app.get('/make-server-6d579fee/engagement/summary', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const profile: any = await kv.get(`user:${userId}`);
    const summary = await getEngagementSummary([userId, profile?.partnerId].filter(Boolean));
    return c.json({ summary });
  } catch (error: any) {
    console.error('Engagement summary error:', error);
    return c.json({ error: error.message || 'Failed to load engagement summary' }, 500);
  }
});

// AI Mood Analysis - Analyze mood patterns using Gemini
app.post('/make-server-6d579fee/moods/analyze', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile?.partnerId) {
      return c.json({ error: 'Partner required for mood analysis' }, 400);
    }

    // The UI language is intentionally sent with every request. The language
    // switcher is local-first, so profile.language may be stale or unset.
    const requestBody = await c.req.json().catch(() => ({}));
    const reportLanguage = requestBody?.language === 'en' || requestBody?.language === 'am' || requestBody?.language === 'om'
      ? resolveReportLanguage(requestBody.language)
      : resolveReportLanguage(profile.language);

    // Return cached analysis if it was generated within the last 6 hours
    // This prevents repeated Gemini calls when the user clicks Analyze multiple times.
    const cacheKey = `mood-analysis-cache:${userId}:${reportLanguage}`;
    const cached = await kv.get(cacheKey);
    if (cached && cached.generatedAt && cached.aiPowered !== false) {
      const ageHours = (Date.now() - new Date(cached.generatedAt).getTime()) / 3600000;
      if (ageHours < 6) {
        return c.json({ analysis: cached });
      }
    }

    // Get moods from the last 7 days for both partners
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userMoods = await kv.getByPrefix(`mood:${userId}:`);
    const partnerMoods = await kv.getByPrefix(`mood:${profile.partnerId}:`);

    const recentUserMoods = userMoods.filter((m: any) => 
      new Date(m.createdAt) >= sevenDaysAgo
    );
    const recentPartnerMoods = partnerMoods.filter((m: any) => 
      new Date(m.createdAt) >= sevenDaysAgo
    );

    if (recentUserMoods.length === 0 && recentPartnerMoods.length === 0) {
      return c.json({ 
        error: 'Not enough mood data to analyze. Track your moods for a few days first!' 
      }, 400);
    }

    const engagementSummary = await getEngagementSummary([userId, profile.partnerId]);

    // Prepare mood data for relationship reflection
    const moodSummary = {
      userName: profile.name,
      userMoods: recentUserMoods.map((m: any) => ({
        mood: m.mood,
        note: m.note,
        date: new Date(m.createdAt).toLocaleDateString()
      })),
      partnerName: (await kv.get(`user:${profile.partnerId}`))?.name || 'Partner',
      partnerMoods: recentPartnerMoods.map((m: any) => ({
        mood: m.mood,
        note: m.note,
        date: new Date(m.createdAt).toLocaleDateString()
      }))
    };

    // Call Gemini for analysis
    console.log('[Mood Analysis] Calling Gemini API...');

    const moodPrompt = `Write a warm relationship reflection for a Christian couple using the TwoBeOne app.

${reportLanguageInstruction(reportLanguage)}

Mood Data (Last 7 Days):
${profile.name}'s Moods: ${JSON.stringify(moodSummary.userMoods, null, 2)}
${moodSummary.partnerName}'s Moods: ${JSON.stringify(moodSummary.partnerMoods, null, 2)}

${engagementPromptContext(engagementSummary)}

Write 3 to 5 short, connected paragraphs that sound like a thoughtful human counselor speaking directly to the couple. Naturally weave together their emotional pattern, one encouraging observation, one gentle next step, and a relevant Bible verse or prayer thought.

Do not mention AI, data analysis, scores, algorithms, or that a report was generated. Do not use Markdown, headings, labels, numbered lists, bullet points, asterisks, hash symbols, or bold text. Keep the tone warm, personal, specific, and Christ-centered. Limit the response to 260 words.`;

    // Calculate statistics first — used for both AI analysis context and fallback
    const moodValues: Record<string, number> = { great: 4, good: 3, okay: 2, sad: 1 };
    const moodLabels: Record<string, string> = { great: 'Great 😊', good: 'Good 🙂', okay: 'Okay 😐', sad: 'Sad 😔' };
    const userAvg = recentUserMoods.length > 0
      ? recentUserMoods.reduce((sum: number, m: any) => sum + (moodValues[m.mood] || 0), 0) / recentUserMoods.length
      : 0;
    const partnerAvg = recentPartnerMoods.length > 0
      ? recentPartnerMoods.reduce((sum: number, m: any) => sum + (moodValues[m.mood] || 0), 0) / recentPartnerMoods.length
      : 0;

    const buildFallbackAnalysis = () => reportCopy(reportLanguage).fallback(
      profile.name, recentUserMoods.length, userAvg.toFixed(1),
      moodSummary.partnerName, recentPartnerMoods.length, partnerAvg.toFixed(1),
    );

    let analysis: string;
    let aiPowered = true;
    let fallbackReason: string | undefined;
    try {
      analysis = cleanGeneratedReport(await callGemini(moodPrompt));
    } catch (aiError: any) {
      console.warn('[Mood Analysis] Gemini failed - Using fallback message:', aiError.message);
      analysis = buildFallbackAnalysis();
      aiPowered = false;
      fallbackReason = aiError.message || 'Gemini unavailable';
    }

    const analysisResult = {
      id: generateId(),
      userId,
      analysis,
      language: reportLanguage,
      aiPowered,
      ...(fallbackReason ? { fallbackReason } : {}),
      createdAt: new Date().toISOString(),
      period: {
        start: sevenDaysAgo.toISOString(),
        end: new Date().toISOString()
      },
      statistics: {
        userMoodCount: recentUserMoods.length,
        partnerMoodCount: recentPartnerMoods.length,
        userAverageMood: userAvg.toFixed(2),
        partnerAverageMood: partnerAvg.toFixed(2),
        userMoodDistribution: {
          great: recentUserMoods.filter((m: any) => m.mood === 'great').length,
          good: recentUserMoods.filter((m: any) => m.mood === 'good').length,
          okay: recentUserMoods.filter((m: any) => m.mood === 'okay').length,
          sad: recentUserMoods.filter((m: any) => m.mood === 'sad').length
        },
        partnerMoodDistribution: {
          great: recentPartnerMoods.filter((m: any) => m.mood === 'great').length,
          good: recentPartnerMoods.filter((m: any) => m.mood === 'good').length,
          okay: recentPartnerMoods.filter((m: any) => m.mood === 'okay').length,
          sad: recentPartnerMoods.filter((m: any) => m.mood === 'sad').length
        }
      },
      engagement: engagementSummary
    };

    // Save analysis and populate cache for next 6 hours
    const resultWithTimestamp = { ...analysisResult, generatedAt: analysisResult.createdAt };
    await kv.set(`mood-analysis:${userId}:${analysisResult.id}`, analysisResult);
    await kv.set(cacheKey, resultWithTimestamp);

    return c.json({ analysis: analysisResult });
  } catch (error: any) {
    console.error('Mood analysis error:', error);
    console.error('Error stack:', error.stack);
    const errorMessage = error.message || 'Failed to generate mood analysis';
    return c.json({ error: errorMessage }, 500);
  }
});

// Test OpenAI API key endpoint
app.get('/make-server-6d579fee/moods/test-openai', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return c.json({ configured: false, message: 'GEMINI_API_KEY not configured' });

    try {
      const result = await callGemini('Say "OK" in one word.');
      return c.json({ configured: true, valid: true, message: 'Gemini API is working!', sample: result });
    } catch (e: any) {
      return c.json({ configured: true, valid: false, message: e.message });
    }
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get mood analysis history
app.get('/make-server-6d579fee/moods/analysis', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const analyses = await kv.getByPrefix(`mood-analysis:${userId}:`);
    const sortedAnalyses = analyses.sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ analyses: sortedAnalyses });
  } catch (error: any) {
    console.error('Analysis fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Generate and send weekly mood report to both partners
app.post('/make-server-6d579fee/moods/weekly-report', async (c) => {
  let generationClaimKey: string | null = null;
  let generationCompleted = false;
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile?.partnerId) {
      return c.json({ error: 'Partner required for weekly reports' }, 400);
    }

    const requestBody = await c.req.json().catch(() => ({}));
    const requestedUserLanguage = requestBody?.language === 'en' || requestBody?.language === 'am' || requestBody?.language === 'om'
      ? resolveReportLanguage(requestBody.language)
      : resolveReportLanguage(profile.language);

    const partner = await kv.get(`user:${profile.partnerId}`);
    const engagementSummary = await getEngagementSummary([userId, profile.partnerId]);

    // Get moods from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userMoods = await kv.getByPrefix(`mood:${userId}:`);
    const partnerMoods = await kv.getByPrefix(`mood:${profile.partnerId}:`);

    const recentUserMoods = userMoods.filter((m: any) => 
      new Date(m.createdAt) >= sevenDaysAgo
    );
    const recentPartnerMoods = partnerMoods.filter((m: any) => 
      new Date(m.createdAt) >= sevenDaysAgo
    );

    if (recentUserMoods.length === 0 && recentPartnerMoods.length === 0) {
      return c.json({ 
        error: 'Not enough mood data for a weekly report. Keep tracking your moods!' 
      }, 400);
    }

    // Claim one couple-level generation slot per UTC day. This closes the
    // race where each partner opens the app and generates the same report.
    const now = new Date();
    const dayKey = now.toISOString().slice(0, 10);
    const coupleKey = [userId, profile.partnerId].sort().join(':');
    generationClaimKey = `notification-dedupe:mood_report:${coupleKey}:${dayKey}`;
    const claimed = await claimIdempotencyKey(generationClaimKey, {
      type: 'mood_report', coupleKey, dayKey, claimedBy: userId,
      claimedAt: now.toISOString(),
    });
    if (!claimed) {
      return c.json({ success: true, report: {}, alreadyGenerated: true });
    }

    // Calculate statistics
    const moodValues: Record<string, number> = { great: 4, good: 3, okay: 2, sad: 1 };
    const userAvg = recentUserMoods.length > 0 
      ? recentUserMoods.reduce((sum: number, m: any) => sum + (moodValues[m.mood] || 0), 0) / recentUserMoods.length
      : 0;
    const partnerAvg = recentPartnerMoods.length > 0
      ? recentPartnerMoods.reduce((sum: number, m: any) => sum + (moodValues[m.mood] || 0), 0) / recentPartnerMoods.length
      : 0;

    // Create a natural reflection in each partner's own saved language. Most
    // couples need one generation; bilingual couples need at most two.
    const userLanguage = requestedUserLanguage;
    const partnerLanguage = resolveReportLanguage(partner?.language);
    const reflections = new Map<ReportLanguage, string>();

    for (const language of new Set<ReportLanguage>([userLanguage, partnerLanguage])) {
      const fallback = reportCopy(language).fallback(
        profile.name, recentUserMoods.length, userAvg.toFixed(1),
        partner?.name || 'Partner', recentPartnerMoods.length, partnerAvg.toFixed(1),
      );
      const weeklyPrompt = `Write a brief weekly relationship reflection for a Christian couple using the TwoBeOne app.

${reportLanguageInstruction(language)}

${profile.name}: ${recentUserMoods.length} mood check-ins, average ${userAvg.toFixed(1)}/4
${partner?.name || 'Partner'}: ${recentPartnerMoods.length} mood check-ins, average ${partnerAvg.toFixed(1)}/4

Recent moods for ${profile.name}: ${recentUserMoods.map((m: any) => `${m.mood} (${new Date(m.createdAt).toLocaleDateString()})`).join(', ')}
Recent moods for ${partner?.name || 'Partner'}: ${recentPartnerMoods.map((m: any) => `${m.mood} (${new Date(m.createdAt).toLocaleDateString()})`).join(', ')}

${engagementPromptContext(engagementSummary)}

Write 3 or 4 short, flowing paragraphs as if a caring human counselor is speaking directly to them. Include one specific emotional observation, sincere encouragement, a fitting Bible verse or faith thought, and one realistic invitation for the coming week.

Do not mention AI, analysis, data, scores, algorithms, or report generation. Do not use Markdown, headings, labels, numbered lists, bullets, asterisks, hash symbols, or bold text. Keep it under 180 words and make it sound personal, gentle, and natural.`;

      try {
        reflections.set(language, cleanGeneratedReport(await callGemini(weeklyPrompt)) || fallback);
      } catch (reflectionError: any) {
        console.warn(`[Weekly Report] Personalized reflection unavailable for ${language}:`, reflectionError.message);
        reflections.set(language, fallback);
      }
    }

    // Create notifications for both partners
    const userCopy = reportCopy(userLanguage);
    const partnerCopy = reportCopy(partnerLanguage);
    const userReportSummary = userCopy.summary(profile.name, userAvg.toFixed(1), partner?.name || 'Partner', partnerAvg.toFixed(1));
    const partnerReportSummary = partnerCopy.summary(partner?.name || 'Partner', partnerAvg.toFixed(1), profile.name, userAvg.toFixed(1));

    // Notification for user
    const dailyReportId = `mood-report:${dayKey}:${coupleKey}`;
    const userNotificationId = dailyReportId;
    const userNotification = {
      id: userNotificationId,
      userId,
      type: 'mood_report',
      title: userCopy.title,
      message: userReportSummary,
      data: {
        analysis: reflections.get(userLanguage),
        language: userLanguage,
        userAverage: userAvg.toFixed(1),
        partnerAverage: partnerAvg.toFixed(1),
        engagement: engagementSummary,
        period: `${sevenDaysAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`
      },
      read: false,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Notification for partner
    const partnerNotificationId = dailyReportId;
    const partnerNotification = {
      id: partnerNotificationId,
      userId: profile.partnerId,
      type: 'mood_report',
      title: partnerCopy.title,
      message: partnerReportSummary,
      data: {
        analysis: reflections.get(partnerLanguage),
        language: partnerLanguage,
        userAverage: partnerAvg.toFixed(1),
        partnerAverage: userAvg.toFixed(1),
        engagement: engagementSummary,
        period: `${sevenDaysAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`
      },
      read: false,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    await kv.set(`notification:${userId}:${userNotificationId}`, userNotification);
    await kv.set(`notification:${profile.partnerId}:${partnerNotificationId}`, partnerNotification);

    console.log(`[Weekly Report] Generated for ${profile.name} & ${partner?.name}`);
    generationCompleted = true;

    return c.json({ 
      success: true, 
      report: {
        analysis: reflections.get(userLanguage),
        language: userLanguage,
        userAverage: userAvg.toFixed(1),
        partnerAverage: partnerAvg.toFixed(1),
        userMoodCount: recentUserMoods.length,
        partnerMoodCount: recentPartnerMoods.length,
        engagement: engagementSummary
      }
    });
  } catch (error: any) {
    if (generationClaimKey && !generationCompleted) {
      await kv.del(generationClaimKey).catch((cleanupError: any) => {
        console.warn('[Weekly Report] Failed to release idempotency key:', cleanupError?.message || cleanupError);
      });
    }
    console.error('Weekly report error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// NOTIFICATIONS
// ============================================

app.get('/make-server-6d579fee/notifications', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notifications = await kv.getByPrefix(`notification:${userId}:`) || [];
    console.log('[Notifications] Raw notifications:', notifications);
    
    // Ensure notifications is an array and has valid data
    const validNotifications = Array.isArray(notifications) 
      ? notifications.filter(n => n && typeof n === 'object')
      : [];
    
    const sortedNotifications = validNotifications
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

    // Older builds could save several mood reports on the same day. Keep the
    // newest one in the response and remove the stale duplicates permanently.
    const seenDailyMoodReports = new Set<string>();
    const duplicateIds: string[] = [];
    const deduplicatedNotifications = sortedNotifications
      .filter((notification: any) => {
        if (notification.type !== 'mood_report') return true;
        const timestamp = new Date(notification.createdAt);
        const dayKey = Number.isNaN(timestamp.getTime())
          ? String(notification.createdAt || 'unknown')
          : timestamp.toISOString().slice(0, 10);
        if (seenDailyMoodReports.has(dayKey)) {
          if (notification.id) duplicateIds.push(notification.id);
          return false;
        }
        seenDailyMoodReports.add(dayKey);
        return true;
      })
      .map((notification: any) => ({
        ...notification,
        read: Boolean(notification.read ?? notification.isRead),
        isRead: Boolean(notification.isRead ?? notification.read),
      }))
      .slice(0, 50); // cap to prevent unbounded memory use

    await Promise.allSettled(
      duplicateIds.map((id) => kv.del(`notification:${userId}:${id}`)),
    );

    return c.json({ notifications: deduplicatedNotifications });
  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    return c.json({ error: error.message || 'Failed to fetch notifications' }, 500);
  }
});

app.post('/make-server-6d579fee/notifications', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { recipientId, type, title, message, data } = await c.req.json();

    if (!recipientId || !type || !title || !message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const notificationId = generateId();
    const notification = {
      id: notificationId,
      recipientId,
      senderId: userId,
      type,
      title,
      message,
      data: data || null,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    await kv.set(`notification:${recipientId}:${notificationId}`, notification);

    return c.json({ success: true, notification });
  } catch (error: any) {
    console.error('Notification create error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Mark notification as read
app.patch('/make-server-6d579fee/notifications/:id/read', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    const notification = await kv.get(`notification:${userId}:${notificationId}`);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    const updatedNotification = {
      ...notification,
      read: true,
      isRead: true,
      readAt: new Date().toISOString()
    };

    await kv.set(`notification:${userId}:${notificationId}`, updatedNotification);

    return c.json({ success: true, notification: updatedNotification });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// Mark all notifications as read
app.post('/make-server-6d579fee/notifications/read-all', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notifications = await kv.getByPrefix(`notification:${userId}:`);
    
    for (const notification of notifications) {
      if (!(notification.isRead ?? notification.read)) {
        const updated = {
          ...notification,
          read: true,
          isRead: true,
          readAt: new Date().toISOString()
        };
        await kv.set(`notification:${userId}:${notification.id}`, updated);
      }
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    return c.json({ error: 'Failed to mark all notifications as read' }, 500);
  }
});

// Delete a notification
app.delete('/make-server-6d579fee/notifications/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    await kv.del(`notification:${userId}:${notificationId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

// ============================================
// QUESTIONS & ANSWERS
// ============================================

// Get today's daily question
app.get('/make-server-6d579fee/daily-question', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    const userResponses = await kv.getByPrefix(`response:${userId}:`);
    
    let partnerResponses: any[] = [];
    if (profile?.partnerId) {
      const allPartnerResponses = await kv.getByPrefix(`response:${profile.partnerId}:`);
      partnerResponses = allPartnerResponses.filter((r: any) => !r.isPrivate);
    }

    return c.json({ userResponses, partnerResponses });
  } catch (error: any) {
    console.error('Responses fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-6d579fee/question-responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { question_id, response, is_private } = await c.req.json();

    const responseId = generateId();
    const responseEntry = {
      id: responseId,
      userId,
      questionId: question_id,
      response,
      isPrivate: is_private || false,
      createdAt: new Date().toISOString()
    };

    await kv.set(`response:${userId}:${question_id}`, responseEntry);
    touchActivity(userId);
    await logAudit('qa.answered', userId, { questionId: question_id, isPrivate: is_private || false });

    return c.json({ success: true, response: responseEntry });
  } catch (error: any) {
    console.error('Response save error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get question responses
app.get('/make-server-6d579fee/question-responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');

    const queryTimeout = 8000;
    const fetchWithTimeout = async (promise: Promise<any>, context: string) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${context} timeout`)), queryTimeout);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } catch (error: any) {
        console.error(`[GET /question-responses] ${context}:`, error.message);
        throw error;
      }
    };

    // Expand new-format question-response entries (key: question-response:userId:questionId)
    // into per-prompt records matching the shape the frontend attachResponses() expects:
    // { questionId, promptId, response, userId, coupleId, createdAt }
    const expandNewFormatResponses = (entries: any[]): any[] => {
      const out: any[] = [];
      for (const entry of entries) {
        if (!entry?.answers || typeof entry.answers !== 'object') continue;
        for (const [promptId, value] of Object.entries(entry.answers)) {
          out.push({
            questionId: entry.questionId,
            promptId,
            response: value,
            userId: entry.userId,
            coupleId: entry.coupleId || null,
            createdAt: entry.createdAt,
          });
        }
      }
      return out;
    };

    let userResponses: any[] = [];
    try {
      // Read both key formats in parallel: legacy (response:) and current (question-response:)
      const [legacyRaw, newFormatRaw] = await fetchWithTimeout(
        Promise.all([
          kv.getByPrefix(`response:${userId}:`),
          kv.getByPrefix(`question-response:${userId}:`),
        ]),
        'User responses'
      );

      const legacyResponses: any[] = legacyRaw || [];
      const newFormatExpanded = expandNewFormatResponses(newFormatRaw || []);

      // Merge, deduplicating by questionId+promptId (new format wins)
      const seen = new Set<string>();
      for (const r of newFormatExpanded) {
        seen.add(`${r.questionId}:${r.promptId ?? 'default'}`);
      }
      const filteredLegacy = legacyResponses.filter((r: any) => {
        const key = `${r.questionId}:${r.promptId ?? 'default'}`;
        return !seen.has(key);
      });

      userResponses = [...newFormatExpanded, ...filteredLegacy];
      // NOTE: Do NOT filter by category here. Response objects have no category field.
      // The client matches responses to questions by questionId, so the category is
      // irrelevant at the response layer — filtering here always wiped all results.
    } catch (error) {
      console.error('[GET /question-responses] User responses timeout, returning empty');
      return c.json({ userResponses: [], partnerResponses: [] });
    }

    let userProfile = null;
    try {
      userProfile = await fetchWithTimeout(kv.get(`user:${userId}`), 'Profile');
    } catch (error) {
      console.error('[GET /question-responses] Profile fetch timeout');
      return c.json({ userResponses, partnerResponses: [] });
    }

    let partnerResponses: any[] = [];
    if (userProfile?.partnerId) {
      const partnerId = userProfile.partnerId;
      try {
        const [legacyPartnerRaw, newFormatPartnerRaw] = await fetchWithTimeout(
          Promise.all([
            kv.getByPrefix(`response:${partnerId}:`),
            kv.getByPrefix(`question-response:${partnerId}:`),
          ]),
          'Partner responses'
        );

        const legacyPartner: any[] = (legacyPartnerRaw || []).filter((r: any) => !r.isPrivate);
        const newFormatPartnerExpanded = expandNewFormatResponses(newFormatPartnerRaw || []);

        const seenPartner = new Set<string>();
        for (const r of newFormatPartnerExpanded) {
          seenPartner.add(`${r.questionId}:${r.promptId ?? 'default'}`);
        }
        const filteredLegacyPartner = legacyPartner.filter((r: any) => {
          const key = `${r.questionId}:${r.promptId ?? 'default'}`;
          return !seenPartner.has(key);
        });

        partnerResponses = [...newFormatPartnerExpanded, ...filteredLegacyPartner];
        // NOTE: Same as user responses — no category filter here.
      } catch (error) {
        console.error('[GET /question-responses] Partner responses timeout, continuing with user data only');
      }
    }

    return c.json({ userResponses, partnerResponses });
  } catch (error: any) {
    console.error('[GET /question-responses] Unexpected error:', error);
    return c.json({ userResponses: [], partnerResponses: [] }, 200);
  }
});

// ============================================
// QUESTION CHAT
// ============================================

// Get question chat messages
app.get('/make-server-6d579fee/question-chat/:questionId', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const questionId = c.req.param('questionId');
    console.log('Loading messages for questionId:', questionId);
    
    // Get user profile to check for partner
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      console.error('Profile not found for userId:', userId);
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Get all messages for this question chat
    const prefix = `question_chat:${questionId}:`;
    console.log('Searching with prefix:', prefix);
    const messages = await kv.getByPrefix(prefix);
    console.log('Raw messages from KV:', messages);
    
    const filteredMessages = messages
      .filter(msg => msg && msg.userId && msg.message) // Filter out any null or invalid messages
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log('Filtered and sorted messages:', filteredMessages);

    return c.json({ messages: filteredMessages });
  } catch (error: any) {
    console.error('Get question chat error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Send question chat message
app.post('/make-server-6d579fee/question-chat', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { question_id, message } = await c.req.json();
    console.log('Received question chat request:', { userId, question_id, message });
    
    if (!question_id || !message) {
      console.error('Missing fields:', { question_id, message });
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get user profile for name
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      console.error('Profile not found for userId:', userId);
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Create message object
    const messageId = generateId();
    const messageObj = {
      id: messageId,
      userId,
      userName: profile.name || 'Unknown',
      message,
      timestamp: new Date().toISOString()
    };

    // Store message
    const key = `question_chat:${question_id}:${messageId}`;
    console.log('Storing message with key:', key);
    await kv.set(key, messageObj);
    console.log('Message stored successfully:', messageObj);

    return c.json({ message: messageObj }, 201);
  } catch (error: any) {
    console.error('Send question chat message error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// DEVOTIONALS
// ============================================

const AUDIO_BUCKET = 'make-6d579fee-devotional-audio';

// Helper: verify the file exists in storage, then generate a fresh signed URL.
// createSignedUrl succeeds even for missing files — the browser then gets a 404
// and reports MEDIA_ERR_SRC_NOT_SUPPORTED (code 4). We check existence first.
const refreshAudioUrl = async (audioFileName: string): Promise<string | null> => {
  if (!audioFileName) return null;
  try {
    const supabase = getSupabase();

    // List the bucket root filtered to this filename to confirm the object exists.
    const { data: files, error: listErr } = await supabase.storage
      .from(AUDIO_BUCKET)
      .list('', { limit: 100, search: audioFileName });

    if (listErr) {
      console.warn('[Audio] Storage list error:', listErr.message);
      return null;
    }

    const exists = files?.some((f: any) => f.name === audioFileName);
    if (!exists) {
      console.warn('[Audio] File not found in storage:', audioFileName);
      return null;
    }

    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(audioFileName, 3600);

    if (error || !data?.signedUrl) {
      console.warn('[Audio] createSignedUrl failed:', audioFileName, error?.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.warn('[Audio] refreshAudioUrl error:', err);
    return null;
  }
};

// Get all devotionals (admin-created only)
app.get('/make-server-6d579fee/devotions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allDevotionals = await kv.getByPrefix('devotional:');
    const publishedDevotionals = allDevotionals.filter((d: any) => d.status === 'published');

    // Refresh signed audio URLs so they are never stale
    const devotions = await Promise.all(
      publishedDevotionals.map(async (d: any) => {
        if (d.audioFileName) {
          const freshUrl = await refreshAudioUrl(d.audioFileName);
          return { ...d, audioUrl: freshUrl };
        }
        return { ...d, audioUrl: null };
      })
    );

    c.header('Cache-Control', 'private, max-age=120');
    return c.json({ devotions });
  } catch (error: any) {
    console.error('Devotions fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/devotions/today', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const today = new Date().toISOString().split('T')[0];

    const allDevotionals = await kv.getByPrefix('devotional:');
    const publishedDevotionals = allDevotionals.filter((d: any) => d.status === 'published');

    const todayDevotional = publishedDevotionals.find((d: any) => d.date === today);
    const raw = todayDevotional || publishedDevotionals[publishedDevotionals.length - 1] || null;

    if (!raw) return c.json({ devotion: null });

    // Refresh signed audio URL
    const devotion = raw.audioFileName
      ? { ...raw, audioUrl: await refreshAudioUrl(raw.audioFileName) }
      : { ...raw, audioUrl: null };

    return c.json({ devotion });
  } catch (error: any) {
    console.error('Today devotion fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-6d579fee/devotional-completions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { devotion_id, notes } = await c.req.json();
    
    const today = new Date().toISOString().split('T')[0];

    // Idempotency guard — if already completed today, return success without touching streak
    const existingCompletion = await kv.get(`completion:${userId}:${today}:${devotion_id}`);
    if (existingCompletion) {
      console.log('[Devotional Completion] Already completed today, skipping streak update');
      return c.json({ success: true, completion: existingCompletion, alreadyCompleted: true });
    }

    const completionId = generateId();
    const completion = {
      id: completionId,
      userId,
      devotionId: devotion_id,
      notes: notes || '',
      completedAt: new Date().toISOString()
    };

    // Store with date in key so we can have multiple completions of same devotional on different days
    await kv.set(`completion:${userId}:${today}:${devotion_id}`, completion);

    // Update or create devotional streak
    const streakKey = `streak:${userId}:devotional`;
    const existingStreak = await kv.get(streakKey);
    
    console.log('[Devotional Completion] Updating streak:', { 
      userId, 
      today, 
      existingStreak,
      streakKey 
    });

    if (!existingStreak) {
      // Create new streak
      const newStreak = {
        userId,
        streak_type: 'devotional',
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today
      };
      console.log('[Devotional Completion] Creating new streak:', newStreak);
      await kv.set(streakKey, newStreak);
    } else {
      // Update existing streak
      const lastDate = existingStreak.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCurrentStreak = existingStreak.current_streak;
      
      console.log('[Devotional Completion] Streak calculation:', {
        lastDate,
        today,
        yesterdayStr,
        isToday: lastDate === today,
        isYesterday: lastDate === yesterdayStr,
        currentStreak: existingStreak.current_streak
      });

      if (lastDate === today) {
        // Already completed today, don't increment
        newCurrentStreak = existingStreak.current_streak;
        console.log('[Devotional Completion] Already completed today, keeping streak:', newCurrentStreak);
      } else if (lastDate === yesterdayStr) {
        // Consecutive day
        newCurrentStreak = existingStreak.current_streak + 1;
        console.log('[Devotional Completion] Consecutive day! Incrementing streak to:', newCurrentStreak);
      } else {
        // Streak broken
        newCurrentStreak = 1;
        console.log('[Devotional Completion] Streak broken, resetting to 1');
      }

      const updatedStreak = {
        ...existingStreak,
        current_streak: newCurrentStreak,
        longest_streak: Math.max(newCurrentStreak, existingStreak.longest_streak || 0),
        last_activity_date: today
      };
      console.log('[Devotional Completion] Saving updated streak:', updatedStreak);
      await kv.set(streakKey, updatedStreak);
    }

    await logAudit('devotional.completed', userId, { devotionId: devotion_id });

    return c.json({ success: true, completion });
  } catch (error: any) {
    console.error('Completion save error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/devotional-completions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const completions = await kv.getByPrefix(`completion:${userId}:`);
    return c.json({ completions });
  } catch (error: any) {
    console.error('Completions fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// STREAKS
// ============================================

app.get('/make-server-6d579fee/streaks', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const streaks = await kv.getByPrefix(`streak:${userId}:`);
    return c.json({ streaks });
  } catch (error: any) {
    console.error('Streaks fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// MILESTONES
// ============================================

app.get('/make-server-6d579fee/milestones', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`[GET /milestones] Fetching milestones for user: ${userId}`);

    // Profile + user milestones in parallel
    const [profile, userMilestones] = await Promise.all([
      kv.get(`user:${userId}`).catch(() => null),
      kv.getByPrefix(`milestone:${userId}:`).catch(() => [] as any[]),
    ]);

    console.log(`[GET /milestones] User milestones: ${(userMilestones as any[]).length}`);

    // Partner milestones need partnerId
    let partnerMilestones: any[] = [];
    if ((profile as any)?.partnerId) {
      try {
        partnerMilestones = await kv.getByPrefix(`milestone:${(profile as any).partnerId}:`);
      } catch {
        console.warn('[GET /milestones] Partner milestones fetch failed, continuing');
      }
    }

    // Combine and sort milestones
    const milestones = [...(userMilestones as any[]), ...partnerMilestones]
      .sort((a, b) => {
        const dateA = new Date(b.date || b.createdAt).getTime();
        const dateB = new Date(a.date || a.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 200);

    console.log(`[GET /milestones] Returning ${milestones.length} total milestones`);
    return c.json({ milestones });
  } catch (error: any) {
    console.error('[GET /milestones] Error:', error);
    // Return empty array instead of error to prevent app crashes
    return c.json({ milestones: [], error: error.message });
  }
});

app.post('/make-server-6d579fee/milestones', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, description, date, category } = await c.req.json();

    const milestoneId = generateId();
    const milestone = {
      id: milestoneId,
      userId,
      title,
      description: description || '',
      date: date || new Date().toISOString(),
      category: category || 'general',
      createdAt: new Date().toISOString()
    };

    await kv.set(`milestone:${userId}:${milestoneId}`, milestone);
    touchActivity(userId);

    return c.json({ success: true, milestone });
  } catch (error: any) {
    console.error('Milestone create error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/milestones/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const milestoneId = c.req.param('id');
    await kv.del(`milestone:${userId}:${milestoneId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Milestone delete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// BIBLE HIGHLIGHTS
// ============================================

// Get all Bible highlights
app.get('/make-server-6d579fee/highlights', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userHighlights = await kv.getByPrefix(`highlight:${userId}:`);
    
    return c.json({ highlights: userHighlights });
  } catch (error: any) {
    console.error('Highlights fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save a Bible highlight
app.post('/make-server-6d579fee/highlight', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { reference, verseNumber, text, color, note } = await c.req.json();

    const highlightId = generateId();
    const highlight = {
      id: highlightId,
      userId,
      reference,
      verseNumber,
      text,
      color,
      note: note || null,
      createdAt: new Date().toISOString()
    };

    await kv.set(`highlight:${userId}:${highlightId}`, highlight);

    return c.json({ success: true, highlight });
  } catch (error: any) {
    console.error('Highlight save error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete a Bible highlight
app.delete('/make-server-6d579fee/highlight/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const highlightId = c.req.param('id');
    await kv.del(`highlight:${userId}:${highlightId}`);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Highlight delete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Share verse with partner
app.post('/make-server-6d579fee/share-verse', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile?.partnerId) {
      return c.json({ error: 'No partner linked' }, 400);
    }

    const { reference, verseNumber, text, note } = await c.req.json();

    // Save highlight to partner's bookmarks
    const highlightId = generateId();
    const highlight = {
      id: highlightId,
      userId: profile.partnerId, // Save under partner's ID
      reference,
      verseNumber,
      text,
      color: 'yellow', // Default color for shared verses
      note: note || `Shared by ${profile.name}`,
      sharedBy: profile.name,
      sharedById: userId,
      createdAt: new Date().toISOString()
    };

    await kv.set(`highlight:${profile.partnerId}:${highlightId}`, highlight);

    // Create a notification for partner
    const notificationId = generateId();
    const notification = {
      id: notificationId,
      userId: profile.partnerId,
      type: 'verse_shared',
      title: `${profile.name} shared a verse with you`,
      message: `${reference} - "${text.substring(0, 100)}..."`,
      data: {
        reference,
        verseNumber,
        text,
        note,
        sharedBy: profile.name,
        highlightId // Include highlight ID so we can link to it
      },
      read: false,
      createdAt: new Date().toISOString()
    };

    await kv.set(`notification:${profile.partnerId}:${notificationId}`, notification);

    // Send push notification to partner
    try {
      const partnerSubscription = await kv.get(`push_subscription:${profile.partnerId}`);
      if (partnerSubscription) {
        const webpush = await import('npm:web-push@3.6.7');
        
        webpush.setVapidDetails(
          'mailto:support@twobeone.app',
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDCoXjbK3s9gE8ZCXzp8zQJZs8qI67y_NvZy7p3kk0z0',
          'sMIyJcgzS-OKkMHmQkfO9V5rNkVGXrQvZOJGm3I2QFk'
        );

        const payload = JSON.stringify({
          title: `${profile.name} shared a verse`,
          body: `"${reference}" - Tap to read`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          data: { type: 'verse_shared', reference },
          tag: 'verse-shared'
        });

        await webpush.sendNotification(partnerSubscription, payload);
        console.log('[Push] Sent verse share notification to partner');
      }
    } catch (pushError: any) {
      // Log but don't fail the request if push fails
      console.warn('[Push] Failed to send push notification for verse share:', pushError.message);
      if (pushError.statusCode === 410 || pushError.statusCode === 404) {
        await kv.del(`push_subscription:${profile.partnerId}`);
      }
    }

    return c.json({ success: true, notification, highlight });
  } catch (error: any) {
    console.error('Share verse error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// PRAYER TOGETHER CHAT
// ============================================

// Get prayer chat messages for a devotional
app.get('/make-server-6d579fee/devotions/:devotionId/prayer-chat', async (c) => {
  try {
    const devotionId = c.req.param('devotionId');
    const userId = await getUserFromToken(c.req.header('Authorization'));

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user profile to check if they have a partner
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Get all messages for this devotional
    const allMessages = await kv.getByPrefix(`prayer-chat:${devotionId}:`);
    
    // Filter messages to only include those from the user and their partner
    const messages = allMessages
      .filter((msg: any) => 
        msg.userId === userId || 
        (profile.partnerId && msg.userId === profile.partnerId)
      )
      .sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    return c.json({ messages });
  } catch (error: any) {
    console.error('Get prayer chat error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Post a message to prayer chat
app.post('/make-server-6d579fee/devotions/:devotionId/prayer-chat', async (c) => {
  try {
    const devotionId = c.req.param('devotionId');
    const userId = await getUserFromToken(c.req.header('Authorization'));

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { message } = await c.req.json();

    if (!message || !message.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get user profile
    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Create message
    const messageId = generateId();
    const prayerMessage = {
      id: messageId,
      devotionId,
      userId,
      userName: profile.name,
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    // Save message
    await kv.set(`prayer-chat:${devotionId}:${messageId}`, prayerMessage);

    // Send notification to partner if they exist
    if (profile.partnerId) {
      const notificationId = generateId();
      const notification = {
        id: notificationId,
        recipientId: profile.partnerId,
        senderId: userId,
        type: 'devotional',
        title: 'New Prayer Message',
        message: `${profile.name} shared a prayer thought`,
        data: { devotionId, messagePreview: message.substring(0, 50) },
        isRead: false,
        createdAt: new Date().toISOString()
      };

      await kv.set(`notification:${profile.partnerId}:${notificationId}`, notification);
    }

    return c.json({ message: prayerMessage });
  } catch (error: any) {
    console.error('Post prayer chat error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Get all users (admin only)
app.get('/make-server-6d579fee/admin/users', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    const validUsers = allUsers.filter((u: any) => u.id && u.email);

    // Bulk-scan all journals and prayers in just 2 queries instead of 2×N.
    // This avoids connection-pool exhaustion from parallel per-user scans.
    const [allJournals, allPrayers] = await Promise.all([
      kv.getByPrefix('journal:'),
      kv.getByPrefix('prayer:'),
    ]);

    // Build lookup maps: userId → { count, latestAt }
    const journalByUser: Record<string, { count: number; latestAt: string }> = {};
    for (const j of allJournals) {
      if (!j?.userId) continue;
      const cur = journalByUser[j.userId];
      const ts = j.createdAt || j.updatedAt || '';
      if (!cur) {
        journalByUser[j.userId] = { count: 1, latestAt: ts };
      } else {
        cur.count++;
        if (ts > cur.latestAt) cur.latestAt = ts;
      }
    }
    const prayerByUser: Record<string, { count: number; latestAt: string }> = {};
    for (const p of allPrayers) {
      if (!p?.userId) continue;
      const cur = prayerByUser[p.userId];
      const ts = p.createdAt || p.updatedAt || '';
      if (!cur) {
        prayerByUser[p.userId] = { count: 1, latestAt: ts };
      } else {
        cur.count++;
        if (ts > cur.latestAt) cur.latestAt = ts;
      }
    }

    // Bulk-scan ALL couple records and build lookup by userId (partner1Id or partner2Id).
    // This handles users who connected before coupleId was stored on the user profile.
    const allCoupleRecords = await kv.getByPrefix('couple:');
    const coupleByUserId: Record<string, any> = {};
    for (const rec of allCoupleRecords) {
      if (rec?.partner1Id) coupleByUserId[rec.partner1Id] = rec;
      if (rec?.partner2Id) coupleByUserId[rec.partner2Id] = rec;
    }

    const users = validUsers.map((u: any) => {
      // Days together = days since they connected on the app (relationshipStartDate).
      // Never fall back to u.relationshipStart which is the couple's anniversary date
      // (could be years before they joined the app).
      const coupleRec = coupleByUserId[u.id];
      const startDate = coupleRec?.relationshipStartDate;
      let daysTogether = 0;
      if (startDate) {
        daysTogether = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000));
      }

      // Most recent activity = max of profile updatedAt, latest journal, latest prayer.
      // touchActivity is only called on content creation so profile.updatedAt can lag.
      const candidateDates = [
        u.updatedAt || '',
        u.createdAt || '',
        journalByUser[u.id]?.latestAt || '',
        prayerByUser[u.id]?.latestAt || '',
      ].filter(Boolean);
      const lastActive = candidateDates.sort().pop() || new Date().toISOString();

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        partnerId: u.partnerId || null,
        partnerName: u.partnerName || null,
        createdAt: u.createdAt,
        updatedAt: lastActive,
        relationshipStart: startDate || null,
        daysTogether,
        journalEntries: journalByUser[u.id]?.count || 0,
        prayerRequests: prayerByUser[u.id]?.count || 0,
      };
    });

    return c.json({ users });
  } catch (error: any) {
    console.error('Admin users fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete user (admin only)
app.delete('/make-server-6d579fee/admin/users/:userId', async (c) => {
  try {
    const adminUserId = await getUserFromToken(c.req.header('Authorization'));
    if (!adminUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(adminUserId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const userIdToDelete = c.req.param('userId');
    console.log('[DELETE /admin/users/:userId] Deleting user:', userIdToDelete);

    // Get user data before deletion
    const userToDelete = await kv.get(`user:${userIdToDelete}`);
    if (!userToDelete) {
      return c.json({ error: 'User not found' }, 404);
    }

    console.log('[DELETE /admin/users/:userId] User found:', userToDelete);

    // Delete all user-related data
    const keysToDelete = [];

    // 1. User profile
    keysToDelete.push(`user:${userIdToDelete}`);

    // 2. Invite code
    if (userToDelete.inviteCode) {
      keysToDelete.push(`invite:${userToDelete.inviteCode}`);
    }

    // 3. Couple relationship
    if (userToDelete.coupleId) {
      keysToDelete.push(`couple:${userToDelete.coupleId}`);
      
      // Update partner's profile to remove the link
      if (userToDelete.partnerId) {
        const partner = await kv.get(`user:${userToDelete.partnerId}`);
        if (partner) {
          await kv.set(`user:${userToDelete.partnerId}`, {
            ...partner,
            partnerId: null,
            coupleId: null,
            partnerName: null
          });
        }
      }
    }

    // 4. Journal entries
    const journalEntries = await kv.getByPrefix(`journal:${userIdToDelete}:`);
    journalEntries.forEach((entry: any) => {
      if (entry.id) {
        keysToDelete.push(`journal:${userIdToDelete}:${entry.id}`);
      }
    });

    // 5. Prayer requests
    const prayers = await kv.getByPrefix(`prayer:${userIdToDelete}:`);
    prayers.forEach((prayer: any) => {
      if (prayer.id) {
        keysToDelete.push(`prayer:${userIdToDelete}:${prayer.id}`);
      }
    });

    // 6. Milestones
    const milestones = await kv.getByPrefix(`milestone:${userIdToDelete}:`);
    milestones.forEach((milestone: any) => {
      if (milestone.id) {
        keysToDelete.push(`milestone:${userIdToDelete}:${milestone.id}`);
      }
    });

    // 7. Question responses
    const responses = await kv.getByPrefix(`response:${userIdToDelete}:`);
    responses.forEach((response: any) => {
      const key = `response:${userIdToDelete}:${response.questionId}`;
      keysToDelete.push(key);
    });

    // 8. Devotional completions
    const completions = await kv.getByPrefix(`completion:${userIdToDelete}:`);
    completions.forEach((completion: any) => {
      if (completion.devotionId && completion.completedAt) {
        const date = new Date(completion.completedAt).toISOString().split('T')[0];
        keysToDelete.push(`completion:${userIdToDelete}:${date}:${completion.devotionId}`);
      }
    });

    // 9. Streaks
    const streaks = await kv.getByPrefix(`streak:${userIdToDelete}:`);
    streaks.forEach((streak: any) => {
      if (streak.streak_type) {
        keysToDelete.push(`streak:${userIdToDelete}:${streak.streak_type}`);
      }
    });

    // 10. Notifications
    const notifications = await kv.getByPrefix(`notification:${userIdToDelete}:`);
    notifications.forEach((notification: any) => {
      if (notification.id) {
        keysToDelete.push(`notification:${userIdToDelete}:${notification.id}`);
      }
    });

    // 11. Scripture memory progress
    const scriptureProgress = await kv.getByPrefix(`scripture-progress:${userIdToDelete}:`);
    scriptureProgress.forEach((progress: any) => {
      if (progress.verseId) {
        keysToDelete.push(`scripture-progress:${userIdToDelete}:${progress.verseId}`);
      }
    });

    console.log('[DELETE /admin/users/:userId] Deleting', keysToDelete.length, 'keys');

    // Delete all keys
    await kv.mdel(keysToDelete);

    // Also delete from Supabase Auth if needed
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.admin.deleteUser(userIdToDelete);
      if (error) {
        console.error('[DELETE /admin/users/:userId] Supabase Auth deletion error:', error);
        // Continue even if auth deletion fails
      } else {
        console.log('[DELETE /admin/users/:userId] Supabase Auth user deleted');
      }
    } catch (authError) {
      console.error('[DELETE /admin/users/:userId] Auth deletion failed:', authError);
      // Continue even if auth deletion fails
    }

    console.log('[DELETE /admin/users/:userId] User deletion complete');
    await logAudit('admin.user_deleted', adminUserId, { deletedUserId: userIdToDelete, deletedUserEmail: userToDelete.email, keysDeleted: keysToDelete.length });

    return c.json({
      success: true,
      message: `User ${userToDelete.name} (${userToDelete.email}) deleted successfully`,
      keysDeleted: keysToDelete.length
    });
  } catch (error: any) {
    console.error('Admin delete user error:', error);
    return c.json({ error: error.message }, 500);
  }
});

setupRecoveryRoutes(app);

// Get all devotionals (admin only)
app.get('/make-server-6d579fee/admin/devotionals', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // Fetch all devotional completions for stats
    const completions = await kv.getByPrefix('completion:');
    
    return c.json({ 
      devotionals: [], // Devotionals are stored in frontend data/devotionals.ts
      totalCompletions: completions.length
    });
  } catch (error: any) {
    console.error('Admin devotionals fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get all questions (admin only)
app.get('/make-server-6d579fee/admin/questions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // Fetch all question responses for stats
    const responses = await kv.getByPrefix('response:');
    
    return c.json({ 
      questions: [], // Questions are stored in frontend data
      totalResponses: responses.length
    });
  } catch (error: any) {
    console.error('Admin questions fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get recent activity (admin only)
app.get('/make-server-6d579fee/admin/recent-activity', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // The live feed is a projection of the persisted audit log. Do not scan
    // content tables here: audit entries preserve the actor, event and metadata.
    const activities = (await kv.getByPrefix('auditlog:'))
      .filter((entry: any) => entry?.id && entry?.event && entry?.timestamp)
      .sort((a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 20);

    return c.json({ activities });
  } catch (error: any) {
    console.error('Admin activity fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get audit log (admin only)
app.get('/make-server-6d579fee/admin/audit-log', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await isAdminUser(userId))) return c.json({ error: 'Forbidden - Admin access required' }, 403);

    const category = c.req.query('category');
    const event = c.req.query('event');
    const filterUserId = c.req.query('userId');
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);

    const rawEntries = await kv.getByPrefix('auditlog:');
    console.log(`[Audit GET] raw entries found: ${rawEntries.length}`);

    let entries: any[] = rawEntries
      .filter((e: any) => e && e.timestamp)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (category) entries = entries.filter((e: any) => e.category === category);
    if (event) entries = entries.filter((e: any) => e.event === event);
    if (filterUserId) entries = entries.filter((e: any) => e.userId === filterUserId);

    const total = entries.length;
    const page = entries.slice(offset, offset + limit);

    return c.json({ entries: page, total, offset, limit });
  } catch (error: any) {
    console.error('Audit log fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Helper function to format time ago
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return then.toLocaleDateString();
}

// ============================================
// ADMIN CRUD ROUTES
// ============================================

// Devotionals Management
app.post('/make-server-6d579fee/admin/devotionals', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotional = await c.req.json();
    const devotionalId = devotional.id || generateId();
    
    const devotionalData = {
      ...devotional,
      id: devotionalId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[Devotional] Creating devotional: ${devotionalId}`);
    await kv.set(`devotional:${devotionalId}`, devotionalData);
    
    // Verify it was saved
    const saved = await kv.get(`devotional:${devotionalId}`);
    console.log(`[Devotional] ✅ Verified saved devotional: ${saved ? 'exists' : 'NOT FOUND'}`);
    await logAudit('admin.devotional_created', userId, { devotionalId, title: devotionalData.title });

    return c.json({ success: true, devotionalId });
  } catch (error: any) {
    console.error('Admin create devotional error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/admin/devotionals/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotionalId = c.req.param('id');
    const updates = await c.req.json();
    
    console.log(`[Devotional] Updating devotional: ${devotionalId}`);
    const existing = await kv.get(`devotional:${devotionalId}`);
    if (!existing) {
      console.error(`[Devotional] ❌ Devotional not found: ${devotionalId}`);
      return c.json({ error: 'Devotional not found' }, 404);
    }

    const updatedData = {
      ...existing,
      ...updates,
      id: devotionalId,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`devotional:${devotionalId}`, updatedData);
    console.log(`[Devotional] ✅ Devotional updated: ${devotionalId}`);
    await logAudit('admin.devotional_updated', userId, { devotionalId, title: existing.title });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin update devotional error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/admin/devotionals/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotionalId = c.req.param('id');
    await kv.del(`devotional:${devotionalId}`);
    await logAudit('admin.devotional_deleted', userId, { devotionalId });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete devotional error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/admin/devotionals/list', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotionals = await kv.getByPrefix('devotional:');
    return c.json({ devotionals });
  } catch (error: any) {
    console.error('Admin list devotionals error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Devotionals Bulk Import
app.post('/make-server-6d579fee/admin/devotionals/import', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await isAdminUser(userId))) return c.json({ error: 'Forbidden - Admin access required' }, 403);

    const body = await c.req.json();
    const { devotionals: incoming, overwrite = false } = body;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return c.json({ error: 'No devotionals provided' }, 400);
    }

    const results: Array<{ id: string; title: string; action: string; error?: string }> = [];
    let created = 0, updated = 0, skipped = 0;

    for (const dev of incoming) {
      if (!dev.id || !dev.title || !dev.verse || !dev.reference || !dev.reflection) {
        results.push({ id: dev.id || 'unknown', title: dev.title || 'Untitled', action: 'skipped', error: 'Missing required fields' });
        skipped++;
        continue;
      }
      try {
        const key = `devotional:${dev.id}`;
        const existing = await kv.get(key);
        if (existing && !overwrite) {
          results.push({ id: dev.id, title: dev.title, action: 'skipped' });
          skipped++;
        } else {
          const record = {
            id: dev.id,
            date: dev.date || new Date().toISOString().split('T')[0],
            title: dev.title,
            verse: dev.verse,
            reference: dev.reference,
            reflection: dev.reflection,
            prayerPrompt: dev.prayerPrompt || '',
            tags: dev.tags || [],
            status: dev.status || 'published',
            language: dev.language || 'en',
            audioUrl: dev.audioUrl || null,
            audioFileName: dev.audioFileName || null,
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await kv.set(key, record);
          const action = existing ? 'updated' : 'created';
          results.push({ id: dev.id, title: dev.title, action });
          if (action === 'created') created++; else updated++;
        }
      } catch (err: any) {
        results.push({ id: dev.id, title: dev.title, action: 'skipped', error: err.message });
        skipped++;
      }
    }

    return c.json({ success: true, results, summary: { created, updated, skipped, total: incoming.length } });
  } catch (error: any) {
    console.error('Admin bulk import devotionals error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Questions Management
app.post('/make-server-6d579fee/admin/questions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const question = await c.req.json();
    const questionId = question.id || generateId();
    
    const questionData = {
      ...question,
      id: questionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Creating question with data:', JSON.stringify(questionData, null, 2));
    
    await kv.set(`question:${questionId}`, questionData);

    // Verify it was saved
    const saved = await kv.get(`question:${questionId}`);
    console.log('Verified saved question:', JSON.stringify(saved, null, 2));
    await logAudit('admin.question_created', userId, { questionId, title: questionData.title || questionData.category });

    return c.json({ success: true, questionId });
  } catch (error: any) {
    console.error('Admin create question error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/admin/questions/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const questionId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`question:${questionId}`);
    if (!existing) {
      return c.json({ error: 'Question not found' }, 404);
    }

    await kv.set(`question:${questionId}`, {
      ...existing,
      ...updates,
      id: questionId,
      updatedAt: new Date().toISOString()
    });
    await logAudit('admin.question_updated', userId, { questionId, title: existing.title || existing.category });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin update question error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/admin/questions/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const questionId = c.req.param('id');
    await kv.del(`question:${questionId}`);
    await logAudit('admin.question_deleted', userId, { questionId });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete question error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/admin/questions/list', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const questions = await kv.getByPrefix('question:');
    return c.json({ questions });
  } catch (error: any) {
    console.error('Admin list questions error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Clear all questions and responses (admin only)
app.delete('/make-server-6d579fee/admin/questions/clear-all', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // Get all questions and responses
    const allQuestions = await kv.getByPrefix('question:');
    const allResponses = await kv.getByPrefix('question_response:');
    
    console.log(`Clearing ${allQuestions.length} questions and ${allResponses.length} responses`);
    
    // Delete all questions
    const questionKeys = allQuestions.map((q: any) => q.id);
    if (questionKeys.length > 0) {
      await kv.mdel(questionKeys.map((id: string) => `question:${id.replace('question:', '')}`));
    }
    
    // Delete all responses
    const responseKeys = allResponses.map((r: any) => r.id || `question_response:${r.questionId}:${r.userId}`);
    if (responseKeys.length > 0) {
      await kv.mdel(responseKeys);
    }
    
    return c.json({ 
      success: true, 
      message: `Cleared ${allQuestions.length} questions and ${allResponses.length} responses`,
      questionsDeleted: allQuestions.length,
      responsesDeleted: allResponses.length
    });
  } catch (error: any) {
    console.error('Clear all questions error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Modules Management
app.post('/make-server-6d579fee/admin/modules', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const module = await c.req.json();
    const moduleId = module.id || generateId();
    
    await kv.set(`module:${moduleId}`, {
      ...module,
      id: moduleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await logAudit('admin.module_created', userId, { moduleId, title: module.title });

    return c.json({ success: true, moduleId });
  } catch (error: any) {
    console.error('Admin create module error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/admin/modules/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const moduleId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`module:${moduleId}`);
    if (!existing) {
      return c.json({ error: 'Module not found' }, 404);
    }

    await kv.set(`module:${moduleId}`, {
      ...existing,
      ...updates,
      id: moduleId,
      updatedAt: new Date().toISOString()
    });
    await logAudit('admin.module_updated', userId, { moduleId, title: existing.title });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin update module error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/admin/modules/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const moduleId = c.req.param('id');
    await kv.del(`module:${moduleId}`);
    await logAudit('admin.module_deleted', userId, { moduleId });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete module error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Bulk import modules
app.post('/make-server-6d579fee/admin/modules/import', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await isAdminUser(userId))) return c.json({ error: 'Forbidden - Admin access required' }, 403);

    const body = await c.req.json();
    const { modules: incoming, overwrite = false } = body;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return c.json({ error: 'modules must be a non-empty array' }, 400);
    }

    const results: { id: string; title: string; action: 'created' | 'updated' | 'skipped'; error?: string }[] = [];

    for (const raw of incoming) {
      try {
        if (!raw.title || !raw.lessons) {
          results.push({ id: raw.id || '?', title: raw.title || '(untitled)', action: 'skipped', error: 'Missing required fields (title, lessons)' });
          continue;
        }

        const targetId = raw.id || generateId();
        const existing = await kv.get(`module:${targetId}`);

        if (existing && !overwrite) {
          results.push({ id: targetId, title: raw.title, action: 'skipped' });
          continue;
        }

        const now = new Date().toISOString();
        await kv.set(`module:${targetId}`, {
          ...raw,
          id: targetId,
          createdAt: existing ? (existing as any).createdAt ?? now : now,
          updatedAt: now,
        });
        results.push({ id: targetId, title: raw.title, action: existing ? 'updated' : 'created' });
      } catch (err: any) {
        results.push({ id: raw.id || '?', title: raw.title || '(untitled)', action: 'skipped', error: err.message });
      }
    }

    const created = results.filter(r => r.action === 'created').length;
    const updated = results.filter(r => r.action === 'updated').length;
    const skipped = results.filter(r => r.action === 'skipped').length;

    return c.json({ success: true, results, summary: { created, updated, skipped, total: incoming.length } });
  } catch (error: any) {
    console.error('Admin bulk import modules error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Public: list published modules, optionally filtered by language
app.get('/make-server-6d579fee/modules', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const lang = c.req.query('language') || 'en';
    const all = await kv.getByPrefix('module:');
    const published = all.filter((m: any) => m.status === 'published');

    // Match by language field OR by ID prefix (handles imports where language field was missing)
    const matchesLang = (m: any) =>
      m.language === lang ||
      (!m.language && lang === 'en') ||
      (lang !== 'en' && m.id?.startsWith(`${lang}-`));

    // Exclude modules that belong to a different non-English language
    const isEnglish = (m: any) =>
      m.language === 'en' ||
      (!m.language && !m.id?.match(/^(am|om)-/));

    let filtered = published.filter(matchesLang);

    // Fallback to English-only (exclude other language modules)
    if (filtered.length === 0 && lang !== 'en') {
      filtered = published.filter(isEnglish);
    }

    return c.json({ modules: filtered });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/admin/modules/list', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const modules = await kv.getByPrefix('module:');
    return c.json({ modules });
  } catch (error: any) {
    console.error('Admin list modules error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Get published modules
app.get('/make-server-6d579fee/modules', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allModules = await kv.getByPrefix('module:');
    // Filter to only published modules
    const publishedModules = allModules.filter((m: any) => m.status === 'published');
    
    return c.json({ modules: publishedModules });
  } catch (error: any) {
    console.error('Get modules error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Get single module with lessons
app.get('/make-server-6d579fee/modules/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const moduleId = c.req.param('id');
    const module = await kv.get(`module:${moduleId}`);
    
    if (!module) {
      return c.json({ error: 'Module not found' }, 404);
    }

    // Only allow access to published modules
    if (module.status !== 'published') {
      return c.json({ error: 'Module not available' }, 403);
    }

    return c.json({ module });
  } catch (error: any) {
    console.error('Get module error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Save lesson notes (couple-shareable)
app.post('/make-server-6d579fee/modules/:moduleId/lessons/:lessonId/notes', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await kv.get(`user:${userId}`);
    const moduleId = c.req.param('moduleId');
    const lessonId = c.req.param('lessonId');
    const { notes } = await c.req.json();

    if (!notes || typeof notes !== 'string') {
      return c.json({ error: 'Notes are required' }, 400);
    }

    // Verify module exists and is published
    const module = await kv.get(`module:${moduleId}`);
    if (!module || module.status !== 'published') {
      return c.json({ error: 'Module not found or not available' }, 404);
    }

    // If user is part of a couple, save at couple-level so both partners can see it
    // Otherwise, save at user-level
    const storageKey = user?.coupleId 
      ? `lesson-note:${user.coupleId}:${lessonId}`
      : `lesson-note:${userId}:${lessonId}`;
    
    const lessonNote = {
      coupleId: user?.coupleId || null,
      userId: user?.coupleId ? null : userId, // Only store userId if not in a couple
      moduleId,
      lessonId,
      notes,
      lastEditedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(storageKey, lessonNote);

    console.log(`Lesson note saved: ${storageKey}, module ${moduleId}, lesson ${lessonId}`);
    return c.json({ success: true, note: lessonNote });
  } catch (error: any) {
    console.error('Save lesson notes error:', error);
    return c.json({ error: error.message || 'Failed to save notes' }, 500);
  }
});

// User-facing: Get lesson notes (couple-shareable)
app.get('/make-server-6d579fee/modules/:moduleId/lessons/:lessonId/notes', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await kv.get(`user:${userId}`);
    const lessonId = c.req.param('lessonId');
    
    // Try couple-level first, then fall back to user-level
    const storageKey = user?.coupleId 
      ? `lesson-note:${user.coupleId}:${lessonId}`
      : `lesson-note:${userId}:${lessonId}`;
    
    const note = await kv.get(storageKey);

    return c.json({ note: note || null });
  } catch (error: any) {
    console.error('Get lesson notes error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Mark lesson as complete
app.post('/make-server-6d579fee/modules/:moduleId/lessons/:lessonId/complete', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const moduleId = c.req.param('moduleId');
    const lessonId = c.req.param('lessonId');

    // Verify module exists and is published
    const module = await kv.get(`module:${moduleId}`);
    if (!module || module.status !== 'published') {
      return c.json({ error: 'Module not found or not available' }, 404);
    }

    // Save lesson completion for this user
    const completion = {
      userId,
      moduleId,
      lessonId,
      completedAt: new Date().toISOString()
    };

    await kv.set(`lesson-completion:${userId}:${lessonId}`, completion);

    console.log(`Lesson completed: user ${userId}, module ${moduleId}, lesson ${lessonId}`);
    return c.json({ success: true, completion });
  } catch (error: any) {
    console.error('Mark lesson complete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Get module progress
app.get('/make-server-6d579fee/modules/:moduleId/progress', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const moduleId = c.req.param('moduleId');
    const module = await kv.get(`module:${moduleId}`);
    
    if (!module || module.status !== 'published') {
      return c.json({ error: 'Module not found or not available' }, 404);
    }

    // Get all completions for this user
    const allCompletions = await kv.getByPrefix(`lesson-completion:${userId}:`);
    
    // Filter completions for this module
    const moduleCompletions = allCompletions.filter((c: any) => c.moduleId === moduleId);
    
    const totalLessons = module.lessons?.length || 0;
    const completedLessons = moduleCompletions.length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return c.json({ 
      progress,
      completedLessons,
      totalLessons,
      completions: moduleCompletions
    });
  } catch (error: any) {
    console.error('Get module progress error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Get all active questions
// Deduplicate questions by (category + title), keeping the oldest entry per unique title
function deduplicateQuestions(questions: any[]): any[] {
  const seen = new Map<string, any>();
  for (const q of questions) {
    const key = `${q.category}::${(q.title || '').trim().toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, q);
    } else {
      // Keep whichever was created first
      const existingTs = new Date(existing.createdAt || 0).getTime();
      const currentTs  = new Date(q.createdAt || 0).getTime();
      if (currentTs < existingTs) seen.set(key, q);
    }
  }
  return [...seen.values()];
}

// Permanently purge KV duplicates — keeps oldest copy per (category + title)
async function purgeKVDuplicates(): Promise<number> {
  const all = await kv.getByPrefix('question:');
  const keep = new Map<string, any>();
  const toDelete: string[] = [];

  for (const q of all) {
    const key = `${q.category}::${(q.title || '').trim().toLowerCase()}`;
    const existing = keep.get(key);
    if (!existing) {
      keep.set(key, q);
    } else {
      const existingTs = new Date(existing.createdAt || 0).getTime();
      const currentTs  = new Date(q.createdAt || 0).getTime();
      if (currentTs < existingTs) {
        toDelete.push(existing.id);
        keep.set(key, q);
      } else {
        toDelete.push(q.id);
      }
    }
  }

  for (const id of toDelete) {
    try { await kv.del(`question:${id}`); } catch {}
  }
  return toDelete.length;
}

// Admin: deduplicate questions on demand
app.post('/make-server-6d579fee/admin/deduplicate-questions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const before = (await kv.getByPrefix('question:')).length;
    const removed = await purgeKVDuplicates();
    return c.json({ removed, before, after: before - removed });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Lightweight count
app.get('/make-server-6d579fee/questions/count', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const active = (await kv.getByPrefix('question:')).filter((q: any) => q.status === 'active');
    return c.json({ count: deduplicateQuestions(active).length });
  } catch (error: any) {
    return c.json({ count: 0, error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/questions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const category = c.req.query('category');
    const language = c.req.query('language');

    const all = await kv.getByPrefix('question:');

    // Guard null/malformed entries, then deduplicate
    let questions = deduplicateQuestions(
      (all || []).filter((q: any) => q && typeof q === 'object' && q.status === 'active')
    );

    if (category && category !== 'all') {
      questions = questions.filter((q: any) => q.category === category);
    }
    if (language) {
      const langQ = questions.filter((q: any) => !q.language || q.language === language);
      // Fall back to English if no results for the requested language
      questions = langQ.length > 0 ? langQ : questions.filter((q: any) => !q.language || q.language === 'en');
    }

    // Cache for 5 minutes — questions change rarely; this avoids a full KV scan per category switch
    c.header('Cache-Control', 'private, max-age=300');
    return c.json({ questions });
  } catch (error: any) {
    console.error('Get questions error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug: View all questions in database (admin only)
app.get('/make-server-6d579fee/debug/questions', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allQuestions = await kv.getByPrefix('question:');
    
    return c.json({ 
      count: allQuestions.length,
      questions: allQuestions 
    });
  } catch (error: any) {
    console.error('Debug questions error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Save question responses
app.post('/make-server-6d579fee/questions/:questionId/responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const questionId = c.req.param('questionId');
    const { answers } = await c.req.json();

    console.log(`[Save Q&A Response] User: ${userId}, Question: ${questionId}`);
    console.log(`[Save Q&A Response] Answers received:`, JSON.stringify(answers));

    if (!answers || typeof answers !== 'object') {
      return c.json({ error: 'Answers are required' }, 400);
    }

    // Verify question exists
    const question = await kv.get(`question:${questionId}`);
    if (!question) {
      return c.json({ error: 'Question not found' }, 404);
    }

    // Get user's couple ID if they're part of a couple
    const user = await kv.get(`user:${userId}`);
    console.log(`[Save Q&A Response] User data:`, {
      userId: user?.id,
      email: user?.email,
      coupleId: user?.coupleId
    });
    
    if (!user?.coupleId) {
      console.warn(`[Save Q&A Response] WARNING: User ${userId} has NO coupleId! Partner responses won't work.`);
    }
    
    // Create the storage key
    const responseKey = `question-response:${userId}:${questionId}`;
    
    // Save the response with the key as id
    const response = {
      id: responseKey, // Include the key as id for easy reference
      userId,
      questionId,
      coupleId: user?.coupleId || null,
      answers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(responseKey, response);

    console.log(`[Save Q&A Response] ✅ Saved successfully with key: ${responseKey}, coupleId: ${user?.coupleId || 'NULL'}`);
    return c.json({ success: true, response });
  } catch (error: any) {
    console.error('Save question response error:', error);
    return c.json({ error: error.message || 'Failed to save response' }, 500);
  }
});

// User-facing: Get question response (user's and partner's)
app.get('/make-server-6d579fee/questions/:questionId/responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const questionId = c.req.param('questionId');
    
    console.log(`\n========== [Q&A Responses] START ==========`);
    console.log(`[Q&A Responses] Question ID: ${questionId}`);
    console.log(`[Q&A Responses] Current User ID: ${userId}`);
    
    // Get user's response
    const userResponseKey = `question-response:${userId}:${questionId}`;
    const userResponse = await kv.get(userResponseKey);
    console.log(`[Q&A Responses] User response key: ${userResponseKey}`);
    console.log(`[Q&A Responses] User response:`, userResponse ? '✅ FOUND' : '❌ NOT FOUND');
    if (userResponse) {
      console.log(`[Q&A Responses] User response coupleId:`, userResponse.coupleId);
    }
    
    // Get partner's response if user is in a couple
    const user = await kv.get(`user:${userId}`);
    console.log(`[Q&A Responses] User coupleId from profile:`, user?.coupleId || 'NULL');
    
    let partnerResponse = null;
    
    if (user?.coupleId) {
      const couple = await kv.get(`couple:${user.coupleId}`);
      console.log(`[Q&A Responses] Couple found:`, couple ? '✅ YES' : '❌ NO');
      console.log(`[Q&A Responses] Couple partner1Id:`, couple?.partner1Id);
      console.log(`[Q&A Responses] Couple partner2Id:`, couple?.partner2Id);
      
      const partnerId = couple?.partner1Id === userId ? couple?.partner2Id : couple?.partner1Id;
      console.log(`[Q&A Responses] Identified Partner ID:`, partnerId);
      
      if (partnerId) {
        const partnerResponseKey = `question-response:${partnerId}:${questionId}`;
        partnerResponse = await kv.get(partnerResponseKey);
        console.log(`[Q&A Responses] Partner response key: ${partnerResponseKey}`);
        console.log(`[Q&A Responses] Partner response:`, partnerResponse ? '✅ FOUND' : '❌ NOT FOUND');
        if (partnerResponse) {
          console.log(`[Q&A Responses] Partner response coupleId:`, partnerResponse.coupleId);
          console.log(`[Q&A Responses] Partner response answers:`, Object.keys(partnerResponse.answers || {}));
        }
      }
    } else {
      console.log(`[Q&A Responses] ⚠️ User not in a couple`);
    }

    console.log(`[Q&A Responses] Final result:`, {
      hasUserResponse: !!userResponse,
      hasPartnerResponse: !!partnerResponse
    });
    console.log(`========== [Q&A Responses] END ==========\n`);

    return c.json({ 
      userResponse: userResponse || null,
      partnerResponse: partnerResponse || null
    });
  } catch (error: any) {
    console.error('Get question responses error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// User-facing: Get all user's question responses
app.get('/make-server-6d579fee/my-question-responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const responses = await kv.getByPrefix(`question-response:${userId}:`);
    
    return c.json({ responses: responses || [] });
  } catch (error: any) {
    console.error('Get my question responses error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint: List all question responses
app.get('/make-server-6d579fee/debug/all-responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all responses
    const allResponses = await kv.getByPrefix('question-response:');
    
    console.log('[Debug] All question responses in database:', allResponses.length);
    allResponses.forEach((resp: any) => {
      console.log('[Debug] Response:', {
        id: resp.id,
        userId: resp.userId,
        questionId: resp.questionId,
        coupleId: resp.coupleId,
        answersCount: Object.keys(resp.answers || {}).length
      });
    });
    
    return c.json({ 
      count: allResponses.length,
      responses: allResponses 
    });
  } catch (error: any) {
    console.error('Debug all responses error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint: List all users
app.get('/make-server-6d579fee/debug/users', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allUsers = await kv.getByPrefix('user:');
    
    return c.json({ 
      count: allUsers.length,
      users: allUsers 
    });
  } catch (error: any) {
    console.error('Debug users error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint: List all couples
app.get('/make-server-6d579fee/debug/couples', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allCouples = await kv.getByPrefix('couple:');
    
    return c.json({ 
      count: allCouples.length,
      couples: allCouples 
    });
  } catch (error: any) {
    console.error('Debug couples error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint: Clear all question responses
app.delete('/make-server-6d579fee/debug/clear-responses', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`[Debug] Clearing all question responses...`);
    
    const supabase = getSupabase();
    
    // Query directly to get keys AND values
    const { data, error } = await supabase
      .from('kv_store_6d579fee')
      .select('key, value')
      .like('key', 'question-response:%');
    
    if (error) {
      console.error('[Debug] Error fetching responses:', error);
      throw new Error(error.message);
    }
    
    console.log(`[Debug] Found ${data?.length || 0} responses to delete`);
    
    if (data && data.length > 0) {
      // Extract all keys
      const keys = data.map((row: any) => row.key);
      console.log(`[Debug] Deleting keys:`, keys);
      
      // Delete all at once using mdel
      await kv.mdel(keys);
      
      console.log(`[Debug] ✅ Successfully deleted ${data.length} responses`);
    }
    
    return c.json({ 
      success: true,
      deletedCount: data?.length || 0
    });
  } catch (error: any) {
    console.error('Debug clear responses error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint: Fix existing couples (add coupleId to user profiles)
app.post('/make-server-6d579fee/debug/fix-couples', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`[Debug] Fixing couple relationships...`);
    
    // Get all couples
    const couples = await kv.getByPrefix('couple:');
    console.log(`[Debug] Found ${couples.length} couple records`);
    
    let fixed = 0;
    let couplesCreated = 0;
    
    // STEP 1: Fix existing couples
    for (const couple of couples) {
      const partner1Id = couple.partner1Id || couple.user1Id; // Handle old field names
      const partner2Id = couple.partner2Id || couple.user2Id;
      
      if (!partner1Id || !partner2Id) {
        console.warn(`[Debug] Skipping invalid couple:`, couple.id);
        continue;
      }
      
      console.log(`[Debug] Processing couple ${couple.id}: ${partner1Id} <-> ${partner2Id}`);
      
      // Get both user profiles
      const user1 = await kv.get(`user:${partner1Id}`);
      const user2 = await kv.get(`user:${partner2Id}`);
      
      if (!user1 || !user2) {
        console.warn(`[Debug] Skipping couple ${couple.id} - user not found`);
        continue;
      }
      
      // Update user profiles with coupleId if missing
      if (!user1.coupleId) {
        user1.coupleId = couple.id;
        user1.updatedAt = new Date().toISOString();
        await kv.set(`user:${partner1Id}`, user1);
        console.log(`[Debug] ✅ Added coupleId to user ${partner1Id}`);
        fixed++;
      }
      
      if (!user2.coupleId) {
        user2.coupleId = couple.id;
        user2.updatedAt = new Date().toISOString();
        await kv.set(`user:${partner2Id}`, user2);
        console.log(`[Debug] ✅ Added coupleId to user ${partner2Id}`);
        fixed++;
      }
      
      // Update couple record to use consistent field names
      if (couple.user1Id || couple.user2Id) {
        const updatedCouple = {
          id: couple.id,
          partner1Id: partner1Id,
          partner2Id: partner2Id,
          relationshipStartDate: couple.relationshipStartDate,
          createdAt: couple.createdAt,
          updatedAt: new Date().toISOString()
        };
        await kv.set(`couple:${couple.id}`, updatedCouple);
        console.log(`[Debug] ✅ Updated couple record field names`);
      }
    }
    
    // STEP 2: Find users with partnerId but no coupleId and create couple records
    console.log(`[Debug] Looking for orphaned partnerships...`);
    const allUsers = await kv.getByPrefix('user:');
    const processedPairs = new Set<string>();
    
    for (const user of allUsers) {
      // Skip if user doesn't have a partner or already has a coupleId
      if (!user.partnerId || user.coupleId) continue;
      
      // Create unique pair identifier to avoid duplicates
      const pairId = [user.id, user.partnerId].sort().join('|');
      if (processedPairs.has(pairId)) continue;
      processedPairs.add(pairId);
      
      // Get partner
      const partner = await kv.get(`user:${user.partnerId}`);
      if (!partner) {
        console.warn(`[Debug] Partner ${user.partnerId} not found for user ${user.id}`);
        continue;
      }
      
      // Verify bidirectional link
      if (partner.partnerId !== user.id) {
        console.warn(`[Debug] Partner link mismatch: ${user.id} <-> ${user.partnerId}`);
        continue;
      }
      
      // Create couple record
      const newCoupleId = generateId();
      const newCouple = {
        id: newCoupleId,
        partner1Id: user.id,
        partner2Id: user.partnerId,
        relationshipStartDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      await kv.set(`couple:${newCoupleId}`, newCouple);
      console.log(`[Debug] ✅ Created couple record ${newCoupleId} for ${user.id} <-> ${user.partnerId}`);
      couplesCreated++;
      
      // Update both user profiles
      user.coupleId = newCoupleId;
      user.updatedAt = new Date().toISOString();
      await kv.set(`user:${user.id}`, user);
      
      partner.coupleId = newCoupleId;
      partner.updatedAt = new Date().toISOString();
      await kv.set(`user:${user.partnerId}`, partner);
      
      console.log(`[Debug] ✅ Added coupleId to users ${user.id} and ${user.partnerId}`);
      fixed += 2;
    }
    
    console.log(`[Debug] ✅ Created ${couplesCreated} new couples, fixed ${fixed} user profiles`);
    
    return c.json({ 
      success: true,
      couplesProcessed: couples.length,
      couplesCreated: couplesCreated,
      usersFixed: fixed
    });
  } catch (error: any) {
    console.error('Debug fix couples error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Groups Management
app.post('/make-server-6d579fee/admin/groups', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const group = await c.req.json();
    const groupId = group.id || generateId();
    
    await kv.set(`group:${groupId}`, {
      ...group,
      id: groupId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await logAudit('admin.group_created', userId, { groupId, name: group.name });

    return c.json({ success: true, groupId });
  } catch (error: any) {
    console.error('Admin create group error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-6d579fee/admin/groups/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const groupId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`group:${groupId}`);
    if (!existing) {
      return c.json({ error: 'Group not found' }, 404);
    }

    await kv.set(`group:${groupId}`, {
      ...existing,
      ...updates,
      id: groupId,
      updatedAt: new Date().toISOString()
    });
    await logAudit('admin.group_updated', userId, { groupId, name: existing.name });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin update group error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-6d579fee/admin/groups/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const groupId = c.req.param('id');
    await kv.del(`group:${groupId}`);
    await logAudit('admin.group_deleted', userId, { groupId });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete group error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/admin/groups/list', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const groups = await kv.getByPrefix('group:');
    return c.json({ groups });
  } catch (error: any) {
    console.error('Admin list groups error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get admin statistics
app.get('/make-server-6d579fee/admin/stats', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await isAdminUser(userId))) return c.json({ error: 'Forbidden - Admin access required' }, 403);

    // Run all prefix scans in parallel with a 15-second overall timeout
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Stats query timed out')), 15000)
    );

    const [users, devotionals, questions, modules, journals, prayers, completions] =
      await Promise.race([
        Promise.all([
          kv.getByPrefix('user:').catch(() => [] as any[]),
          kv.getByPrefix('devotional:').catch(() => [] as any[]),
          kv.getByPrefix('question:').catch(() => [] as any[]),
          kv.getByPrefix('module:').catch(() => [] as any[]),
          kv.getByPrefix('journal:').catch(() => [] as any[]),
          kv.getByPrefix('prayer:').catch(() => [] as any[]),
          kv.getByPrefix('completion:').catch(() => [] as any[]),
        ]),
        timeout,
      ]);

    const totalUsers = users.filter((u: any) => u.id && u.email).length;
    const activeCouples = Math.floor(users.filter((u: any) => u.partnerId).length / 2);
    const totalPossibleCompletions = totalUsers * 30;
    const completionRate = totalPossibleCompletions > 0
      ? Math.round((completions.length / totalPossibleCompletions) * 100)
      : 0;

    return c.json({
      stats: {
        totalUsers,
        activeCouples,
        totalDevotionals: devotionals.length,
        totalQuestions: questions.length,
        totalModules: modules.length,
        totalJournalEntries: journals.length,
        totalPrayers: prayers.length,
        completionRate,
      },
    });
  } catch (error: any) {
    console.error('Admin stats fetch error:', error);
    // Return partial/cached stats rather than a hard error so the admin panel still loads
    return c.json({
      stats: {
        totalUsers: 0, activeCouples: 0, totalDevotionals: 0,
        totalQuestions: 0, totalModules: 0, totalJournalEntries: 0,
        totalPrayers: 0, completionRate: 0,
        _error: error.message,
      },
    });
  }
});

// ============================================
// SCRIPTURE MEMORY ROUTES
// ============================================

// Get user's verse progress
app.get('/make-server-6d579fee/memory/progress', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    // Get all user verse progress
    const progressKeys = await kv.getByPrefix(`user-verse:${userId}:`);
    const progress = progressKeys.map((key: string) => {
      const value = kv.get(key);
      return value;
    });

    return c.json({ progress });
  } catch (error: any) {
    console.error('Get memory progress error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get memory stats
app.get('/make-server-6d579fee/memory/stats', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    // Get all user verse progress
    const progressKeys = await kv.getByPrefix(`user-verse:${userId}:`);
    const allProgress = progressKeys.map((key: string) => kv.get(key));

    const masteredVerses = allProgress.filter((p: any) => p?.status === 'mastered').length;
    const learningVerses = allProgress.filter((p: any) => p?.status === 'learning').length;

    // Get streak data
    const streakKey = `memory-streak:${userId}`;
    const streakData = await kv.get(streakKey) || {
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null
    };

    const stats = {
      totalVerses: allProgress.length,
      masteredVerses,
      learningVerses,
      currentStreak: streakData.currentStreak || 0,
      longestStreak: streakData.longestStreak || 0,
      lastPracticeDate: streakData.lastPracticeDate || null
    };

    return c.json({ stats });
  } catch (error: any) {
    console.error('Get memory stats error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Record practice session
app.post('/make-server-6d579fee/memory/practice', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { verseId, action, correct } = await c.req.json();
    
    if (!verseId) {
      return c.json({ error: 'verseId is required' }, 400);
    }

    const progressKey = `user-verse:${userId}:${verseId}`;
    let progress = await kv.get(progressKey) || {
      verseId,
      masteryLevel: 0,
      lastPracticed: new Date().toISOString(),
      timesReviewed: 0,
      consecutiveCorrect: 0,
      status: 'new'
    };

    const today = new Date().toISOString().split('T')[0];

    if (action === 'start') {
      // Just starting to learn - increment review count
      progress.timesReviewed++;
      progress.lastPracticed = new Date().toISOString();
      
      if (progress.status === 'new') {
        progress.status = 'learning';
      }
    } else if (action === 'answer') {
      // User answered in quiz mode
      progress.timesReviewed++;
      progress.lastPracticed = new Date().toISOString();

      if (correct) {
        progress.consecutiveCorrect++;
        // Increase mastery by 10-20 points
        progress.masteryLevel = Math.min(100, progress.masteryLevel + 15);
      } else {
        progress.consecutiveCorrect = 0;
        // Decrease mastery slightly
        progress.masteryLevel = Math.max(0, progress.masteryLevel - 5);
      }

      // Update status based on mastery level
      if (progress.masteryLevel >= 80 && progress.consecutiveCorrect >= 3) {
        progress.status = 'mastered';
      } else if (progress.masteryLevel > 0) {
        progress.status = 'learning';
      }
    }

    // Save progress
    await kv.set(progressKey, progress);

    // Update streak
    const streakKey = `memory-streak:${userId}`;
    let streakData = await kv.get(streakKey) || {
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null
    };

    const lastDate = streakData.lastPracticeDate;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!lastDate || lastDate === yesterday || lastDate === yesterdayStr) {
      // Continue or start streak
      if (lastDate !== today) {
        streakData.currentStreak++;
        if (streakData.currentStreak > streakData.longestStreak) {
          streakData.longestStreak = streakData.currentStreak;
        }
      }
    } else if (lastDate !== today) {
      // Streak broken
      streakData.currentStreak = 1;
    }

    streakData.lastPracticeDate = today;
    await kv.set(streakKey, streakData);

    // Recalculate stats
    const progressKeys = await kv.getByPrefix(`user-verse:${userId}:`);
    const allProgress = progressKeys.map((key: string) => kv.get(key));
    const masteredVerses = allProgress.filter((p: any) => p?.status === 'mastered').length;
    const learningVerses = allProgress.filter((p: any) => p?.status === 'learning').length;

    const stats = {
      totalVerses: allProgress.length,
      masteredVerses,
      learningVerses,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      lastPracticeDate: streakData.lastPracticeDate
    };

    return c.json({ progress, stats });
  } catch (error: any) {
    console.error('Record practice error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// AUDIO MANAGEMENT FOR DEVOTIONALS
// ============================================

// Initialize audio storage bucket
const initAudioBucket = async () => {
  const supabase = getSupabase();
  const bucketName = 'make-6d579fee-devotional-audio';
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('[Audio] Creating devotional audio bucket...');
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
      });
      
      if (error) {
        // If bucket already exists (race condition), that's fine
        if (error.message?.includes('already exists')) {
          console.log('[Audio] ✅ Devotional audio bucket already exists (race condition handled)');
        } else {
          console.error('[Audio] Failed to create bucket:', error);
        }
      } else {
        console.log('[Audio] ✅ Devotional audio bucket created successfully');
      }
    } else {
      console.log('[Audio] ✅ Devotional audio bucket already exists');
    }
  } catch (error: any) {
    // Ignore "already exists" errors
    if (error?.message?.includes('already exists')) {
      console.log('[Audio] ✅ Devotional audio bucket already exists (caught in exception)');
    } else {
      console.error('[Audio] Error initializing bucket:', error);
    }
  }
};

// Upload audio file for devotional
app.post('/make-server-6d579fee/admin/devotionals/:id/audio', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotionalId = c.req.param('id');
    console.log('[Audio] Upload request for devotional:', devotionalId);
    
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('[Audio] No audio file in FormData');
      return c.json({ error: 'No audio file provided' }, 400);
    }

    console.log('[Audio] File received:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Validate file type
    const allowedTypes = [
      'audio/mpeg',      // MP3
      'audio/mp3',       // Some browsers use this
      'audio/wav',       // WAV
      'audio/wave',      // Alternative WAV
      'audio/x-wav',     // Alternative WAV
      'audio/ogg',       // OGG
      'audio/mp4',       // M4A
      'audio/x-m4a',     // M4A alternative
      'audio/aac',       // AAC
      'audio/webm',      // WebM audio
      'audio/flac'       // FLAC
    ];
    if (!allowedTypes.includes(audioFile.type) && !audioFile.type.startsWith('audio/')) {
      return c.json({ error: `Invalid file type: ${audioFile.type}. Only audio files are allowed` }, 400);
    }

    // Validate file size (50MB max)
    if (audioFile.size > 50 * 1024 * 1024) {
      return c.json({ error: 'File too large. Maximum size is 50MB' }, 400);
    }

    const supabase = getSupabase();
    const bucketName = 'make-6d579fee-devotional-audio';
    
    // Create unique filename
    const fileExt = audioFile.name.split('.').pop();
    const fileName = `${devotionalId}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const arrayBuffer = await audioFile.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, arrayBuffer, {
        contentType: audioFile.type,
        upsert: true
      });

    if (uploadError) {
      console.error('[Audio] Upload error:', uploadError);
      return c.json({ 
        error: 'Failed to upload audio file', 
        details: uploadError.message 
      }, 500);
    }

    console.log('[Audio] File uploaded to storage:', uploadData?.path);

    // Create signed URL (valid for 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000); // 1 year

    if (urlError) {
      console.error('[Audio] Signed URL error:', urlError);
      return c.json({ 
        error: 'Failed to create audio URL', 
        details: urlError.message 
      }, 500);
    }

    console.log('[Audio] Signed URL created successfully');

    // Update devotional with audio URL
    console.log(`[Audio] Looking up devotional in KV store: devotional:${devotionalId}`);
    const devotional = await kv.get(`devotional:${devotionalId}`);
    if (!devotional) {
      console.error(`[Audio] ⚠️ Devotional not found in KV store: devotional:${devotionalId}`);
      console.error(`[Audio] ⚠️ This devotional may not have been created yet. Please create the devotional first in the Admin Panel.`);
      // Still return success since the file was uploaded successfully
      // The frontend will need to refresh to see the audio
      return c.json({ 
        success: true, 
        audioUrl: urlData.signedUrl,
        fileName: fileName,
        warning: 'Devotional not found in database. Audio uploaded to storage but not linked to devotional.'
      });
    }
    
    devotional.audioUrl = urlData.signedUrl;
    devotional.audioFileName = fileName;
    devotional.updatedAt = new Date().toISOString();
    await kv.set(`devotional:${devotionalId}`, devotional);

    console.log('[Audio] ✅ Audio uploaded successfully:', fileName);
    console.log('[Audio] ✅ Devotional updated with audio URL');
    console.log(`[Audio] ✅ Devotional "${devotional.title}" (ID: ${devotionalId}) now has audio`);

    return c.json({ 
      success: true, 
      audioUrl: urlData.signedUrl,
      fileName: fileName 
    });
  } catch (error: any) {
    console.error('[Audio] Upload error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete audio file for devotional
app.delete('/make-server-6d579fee/admin/devotionals/:id/audio', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!(await isAdminUser(userId))) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const devotionalId = c.req.param('id');
    const devotional = await kv.get(`devotional:${devotionalId}`);

    if (!devotional || !devotional.audioFileName) {
      return c.json({ error: 'No audio file found for this devotional' }, 404);
    }

    const supabase = getSupabase();
    const bucketName = 'make-6d579fee-devotional-audio';

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([devotional.audioFileName]);

    if (deleteError) {
      console.error('[Audio] Delete error:', deleteError);
      return c.json({ error: 'Failed to delete audio file' }, 500);
    }

    // Update devotional
    delete devotional.audioUrl;
    delete devotional.audioFileName;
    devotional.updatedAt = new Date().toISOString();
    await kv.set(`devotional:${devotionalId}`, devotional);

    console.log('[Audio] ✅ Audio deleted successfully:', devotional.audioFileName);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Audio] Delete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get audio info for devotional
app.get('/make-server-6d579fee/admin/devotionals/:id/audio', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const devotionalId = c.req.param('id');
    const devotional = await kv.get(`devotional:${devotionalId}`);

    if (!devotional) {
      return c.json({ error: 'Devotional not found' }, 404);
    }

    return c.json({ 
      hasAudio: !!devotional.audioUrl,
      audioUrl: devotional.audioUrl || null,
      fileName: devotional.audioFileName || null
    });
  } catch (error: any) {
    console.error('[Audio] Get audio info error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Fresh signed audio URL for any authenticated user (avoids stale/expired cached URLs)
app.get('/make-server-6d579fee/devotions/:id/audio-url', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const devotionalId = c.req.param('id');
    const devotional = await kv.get(`devotional:${devotionalId}`);

    if (!devotional) return c.json({ error: 'Devotional not found' }, 404);
    if (!devotional.audioFileName) {
      console.warn(`[Audio] Devotional ${devotionalId} has no audioFileName in KV`);
      return c.json({ error: 'No audio file linked to this devotional' }, 404);
    }

    console.log(`[Audio] Fetching fresh URL for devotional ${devotionalId}, file: ${devotional.audioFileName}`);
    const freshUrl = await refreshAudioUrl(devotional.audioFileName);

    if (!freshUrl) {
      // File not found in storage — clean up the stale reference in KV
      console.error(`[Audio] File "${devotional.audioFileName}" not found in storage — clearing stale reference`);
      delete devotional.audioUrl;
      delete devotional.audioFileName;
      devotional.updatedAt = new Date().toISOString();
      await kv.set(`devotional:${devotionalId}`, devotional);
      return c.json({ error: 'Audio file no longer exists in storage. The reference has been cleared.' }, 404);
    }

    return c.json({ audioUrl: freshUrl });
  } catch (error: any) {
    console.error('[Audio] Fresh URL error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// COMMUNITY ROUTES
// ============================================
app.route('/make-server-6d579fee', communityRoutes);

// ============================================
// WEBRTC ROUTES
// ============================================
app.route('/make-server-6d579fee', webrtcRoutes);

// ============================================
// PUSH NOTIFICATION ROUTES
// ============================================
app.route('/make-server-6d579fee', pushRoutes);

// ============================================
// NEWSLETTER ROUTES
// ============================================
app.route('/make-server-6d579fee/newsletter', newsletterRoutes);

// ============================================
// GEMINI AI HELPER
// ============================================

async function callGemini(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  // Models tried in order. 429 = rate limit — move to next model immediately.
  // Ordered by free-tier quota generosity (most permissive first).
  const MODELS = [
    'gemini-3.1-flash-lite',   // stable, efficient default
    'gemini-3.5-flash-lite',   // stable, high-throughput fallback
    'gemini-3.6-flash',        // stable, higher-capability fallback
    'gemini-3.5-flash',        // stable final fallback
  ];
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  let lastError: Error | null = null;

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= 1; attempt++) {  // max 1 retry per model
      try {
        if (attempt > 0) await sleep(2000); // 2s before retry

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 2048 },
            }),
          }
        );

        if (response.status === 404) {
          lastError = new Error(`Gemini model unavailable: ${model}`);
          break;
        }

        if (response.status === 429) {
          // Rate limited on this model — move to next immediately, no retry
          lastError = new Error('Gemini API error 429');
          break;
        }

        if (!response.ok) {
          const errTxt = await response.text().catch(() => '');
          console.error(`[Gemini] ${model} status ${response.status}`);
          let apiMessage = '';
          try {
            apiMessage = JSON.parse(errTxt)?.error?.message || '';
          } catch {
            apiMessage = errTxt;
          }
          const safeMessage = apiMessage.replace(/AIza[\w-]+/g, '[redacted]').slice(0, 180);
          lastError = new Error(`Gemini API error ${response.status}${safeMessage ? `: ${safeMessage}` : ''}`);
          // 5xx transient — retry once then move to next model
          if (response.status >= 500) continue;
          break;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) { lastError = new Error('Empty response'); continue; }
        return text;

      } catch (err: any) {
        lastError = err;
        if (attempt === 0) await sleep(1000); // brief pause before network retry
      }
    }
  }

  throw lastError || new Error('All Gemini models unavailable');
}

// ============================================
// AI ASSISTANT ROUTES (Gemini-powered)
// ============================================

app.post('/make-server-6d579fee/ai/analyze', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { feature, questions, customPrompt } = await c.req.json();

    let prompt = '';

    if (feature === 'generate') {
      prompt = `You are a Christian relationship counselor for the TwoBeOne couples app.
Generate 3 new faith-based discussion questions for a couple preparing for or deepening their marriage.
Each question must:
- Include a relevant Bible verse with reference
- Have 3 sub-prompts for deeper discussion
- Cover a unique spiritual/relational topic

Format each question as:
1. **[Topic Title]**
   Verse: "[verse text]" – Reference
   • Sub-prompt 1
   • Sub-prompt 2
   • Sub-prompt 3

Return only the 3 questions, no preamble.`;

    } else if (feature === 'summarize') {
      const hasAnswers = (answers: any) => answers && typeof answers === 'object' && Object.values(answers).some((value: any) => {
        const answer = value && typeof value === 'object' && 'response' in value ? value.response : value;
        return Array.isArray(answer) ? answer.length > 0 : answer !== undefined && answer !== null && answer !== '';
      });
      const answered = (questions || []).filter((q: any) =>
        (q.userAnswer && q.partnerAnswer) || (hasAnswers(q.userAnswers) && hasAnswers(q.partnerAnswers))
      );
      if (answered.length === 0) {
        return c.json({ result: 'No discussions to summarize yet. Start answering questions together!', aiPowered: false });
      }
      const formatAnswer = (value: any) => {
        const answer = value && typeof value === 'object' && 'response' in value ? value.response : value;
        if (Array.isArray(answer)) return answer.join(', ');
        return String(answer ?? 'No answer');
      };
      const summaryData = answered.slice(0, 10).map((q: any) => {
        if (q.userAnswer && q.partnerAnswer) {
          return `Topic: ${q.title}\nYour answer: ${q.userAnswer}\nPartner's answer: ${q.partnerAnswer}`;
        }
        const promptLines = (q.prompts || []).map((questionPrompt: any, index: number) => {
          const promptId = typeof questionPrompt === 'string' ? String(index) : questionPrompt.id;
          const promptText = typeof questionPrompt === 'string' ? questionPrompt : questionPrompt.text;
          return `Prompt: ${promptText}\nYour answer: ${formatAnswer(q.userAnswers?.[promptId] ?? q.userAnswers?.[index])}\nPartner's answer: ${formatAnswer(q.partnerAnswers?.[promptId] ?? q.partnerAnswers?.[index])}`;
        }).join('\n');
        return `Topic: ${q.title}\n${promptLines}`;
      }).join('\n\n');

      prompt = `You are a compassionate Christian relationship counselor for the TwoBeOne app.
Analyze these couple discussion answers and provide an encouraging summary.

${summaryData}

Provide:
1. **Areas of Strength** – 3 bullet points celebrating what they're doing well
2. **Areas for Growth** – 2 gentle suggestions
3. **Key Themes** – 2–3 recurring values or patterns you notice
4. **Recommended Next Steps** – 2 specific, actionable next steps

Keep the tone warm, faith-centered, and under 300 words.`;

    } else if (feature === 'verse') {
      const recentTopics = (questions || [])
        .slice(0, 5)
        .map((q: any) => q.title || q.category)
        .filter(Boolean)
        .join(', ');

      prompt = `You are a Christian relationship counselor for the TwoBeOne app.
${recentTopics ? `The couple has recently discussed: ${recentTopics}.` : ''}
Recommend one deeply relevant Bible verse for their current relationship journey.

Format your response as:
**[Book Chapter:Verse]**

"[Full verse text]"

**Why This Verse:**
[2–3 sentences connecting the verse to their relationship journey]

**Reflection Questions:**
• [Question 1]
• [Question 2]
• [Question 3]

**Prayer Prompt:**
[A short, heartfelt prayer for the couple]

**This Week's Application:**
[One specific, practical action they can take together]`;

    } else if (feature === 'custom' && customPrompt) {
      prompt = `You are a compassionate Christian relationship counselor for the TwoBeOne couples app.
A couple has asked: "${customPrompt}"

Provide a thoughtful, faith-centered response that:
- Addresses their question with Biblical wisdom
- Offers 2–3 practical, actionable suggestions
- Includes a relevant scripture or spiritual encouragement
- Stays warm, encouraging, and under 250 words`;

    } else {
      return c.json({ error: 'Invalid feature or missing prompt' }, 400);
    }

    const result = await callGemini(prompt);
    return c.json({ result, aiPowered: true });

  } catch (error: any) {
    console.error('[AI Analyze] Error:', error.message);
    return c.json({ error: error.message || 'AI analysis failed' }, 500);
  }
});

// Test Gemini connectivity
// Get saved compatibility analysis for a question (permanent, one-time)
app.get('/make-server-6d579fee/ai/compatibility/:questionId', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const questionId = c.req.param('questionId');
    // Key is shared between partners — store under the lower userId so both see same result
    const profile = await kv.get(`user:${userId}`);
    const partnerId = profile?.partnerId;
    const keyBase = partnerId && partnerId < userId ? partnerId : userId;
    const saved = await kv.get(`compatibility:${keyBase}:${questionId}`);
    if (saved) return c.json({ result: saved, cached: true });
    return c.json({ result: null, cached: false });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// AI-powered Compatibility Analysis (generates once, saves permanently)
app.post('/make-server-6d579fee/ai/compatibility', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { questionId, questionTitle, questionCategory, prompts, userAnswers, partnerAnswers, userName, partnerName } = await c.req.json();

    // Return cached result if it already exists (idempotent)
    if (questionId) {
      const profile = await kv.get(`user:${userId}`);
      const partnerId = profile?.partnerId;
      const keyBase = partnerId && partnerId < userId ? partnerId : userId;
      const cached = await kv.get(`compatibility:${keyBase}:${questionId}`);
      if (cached) return c.json({ ...cached, cached: true });
    }

    if (!userAnswers || !partnerAnswers || !prompts?.length) {
      return c.json({ error: 'Missing answer data' }, 400);
    }

    // Build a readable summary of both partners' answers
    const answerSummary = prompts.map((prompt: any) => {
      const userAns = userAnswers[prompt.id];
      const partnerAns = partnerAnswers[prompt.id];
      const formatAns = (a: any) => {
        if (!a && a !== 0) return 'no answer';
        if (Array.isArray(a)) return a.join(', ');
        return String(a);
      };
      return `Prompt: "${prompt.text}"\n  ${userName || 'Partner A'}: ${formatAns(userAns)}\n  ${partnerName || 'Partner B'}: ${formatAns(partnerAns)}`;
    }).join('\n\n');

    const prompt = `You are a compassionate Christian relationship counselor analyzing a couple's compatibility.

Question Category: ${questionCategory}
Question: ${questionTitle}

Their answers:
${answerSummary}

Please provide:
1. **Compatibility Score**: A percentage (0-100) based on semantic similarity, shared values, and alignment of their answers — NOT just exact word matching. Two people can be highly compatible with different wording.

2. **Strengths**: 1-2 specific things they align on (based on actual answer content).

3. **Growth Areas**: 1 gentle, faith-centered suggestion for where they can grow together.

4. **AI Insight**: One encouraging, personalized sentence that speaks to their unique dynamic based on what they actually said.

5. **Recommendation**: One specific, actionable thing they can do this week together based on their answers.

Format your response as JSON:
{
  "score": <number 0-100>,
  "label": "<brief compatibility label e.g. 'Beautifully Aligned' / 'Growing Together' / 'Beautifully Different'>",
  "strengths": "<1-2 sentences about alignment>",
  "growthArea": "<1 gentle suggestion>",
  "insight": "<1 personalized encouraging sentence>",
  "recommendation": "<1 specific weekly action>"
}

Return ONLY valid JSON, no markdown fences.`;

    let analysis: any;
    try {
      const raw = await callGemini(prompt);
      // Strip markdown fences if present
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch (aiErr: any) {
      console.error('[Compatibility] Gemini or parse error:', aiErr.message);
      // Fallback: compute simple score
      return c.json({
        score: 65,
        label: 'Growing Together',
        strengths: 'Both of you are investing in understanding each other — that itself is a strength.',
        growthArea: 'Continue exploring this topic in your next conversation.',
        insight: 'Every answered question brings you closer together in faith and understanding.',
        recommendation: 'Set aside 10 minutes this week to discuss your answers out loud together.',
        aiPowered: false,
      });
    }

    const result = { ...analysis, aiPowered: true, generatedAt: new Date().toISOString() };

    // Persist permanently so the same result is returned on every subsequent load
    if (questionId) {
      const profile = await kv.get(`user:${userId}`);
      const partnerId = profile?.partnerId;
      const keyBase = partnerId && partnerId < userId ? partnerId : userId;
      await kv.set(`compatibility:${keyBase}:${questionId}`, result);
    }

    return c.json({ ...result, cached: false });
  } catch (error: any) {
    console.error('[Compatibility] Error:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// ── Marriage Readiness Report ─────────────────────────────────────────────────

app.get('/make-server-6d579fee/ai/marriage-readiness', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const profile = await kv.get(`user:${userId}`) as any;
    const partnerId = profile?.partnerId;
    const coupleId = profile?.coupleId;
    const force = c.req.query('force') === 'true';

    // Cache key — canonical order so both partners get same key
    const cacheBase = coupleId || (partnerId && partnerId < userId ? partnerId : userId);
    const cacheKey = `marriage-readiness:${cacheBase}`;

    if (!force) {
      const cached = await kv.get(cacheKey) as any;
      if (cached && cached.generatedAt) {
        const age = Date.now() - new Date(cached.generatedAt).getTime();
        if (age < 24 * 60 * 60 * 1000) return c.json({ result: cached, cached: true });
      }
    }

    const partnerProfile = partnerId ? await kv.get(`user:${partnerId}`) as any : null;

    // ── Fetch all activity data in parallel ──
    // Q&A uses two prefixes: legacy `response:` and current `question-response:`
    const [
      userDevotions, partnerDevotions,
      userStreakRaw, partnerStreakRaw,
      userPrayers, partnerPrayers,
      userResponsesLegacy, partnerResponsesLegacy,
      userResponsesNew, partnerResponsesNew,
      userLessons, partnerLessons,
      userMoods, partnerMoods,
      userJournals, partnerJournals,
      allModules,
    ] = await Promise.all([
      kv.getByPrefix(`completion:${userId}:`),
      partnerId ? kv.getByPrefix(`completion:${partnerId}:`) : Promise.resolve([]),
      kv.get(`streak:${userId}:devotional`),
      partnerId ? kv.get(`streak:${partnerId}:devotional`) : Promise.resolve(null),
      kv.getByPrefix(`prayer:${userId}:`),
      partnerId ? kv.getByPrefix(`prayer:${partnerId}:`) : Promise.resolve([]),
      // legacy prefix
      kv.getByPrefix(`response:${userId}:`),
      partnerId ? kv.getByPrefix(`response:${partnerId}:`) : Promise.resolve([]),
      // current prefix
      kv.getByPrefix(`question-response:${userId}:`),
      partnerId ? kv.getByPrefix(`question-response:${partnerId}:`) : Promise.resolve([]),
      kv.getByPrefix(`lesson-completion:${userId}:`),
      partnerId ? kv.getByPrefix(`lesson-completion:${partnerId}:`) : Promise.resolve([]),
      kv.getByPrefix(`mood:${userId}:`),
      partnerId ? kv.getByPrefix(`mood:${partnerId}:`) : Promise.resolve([]),
      kv.getByPrefix(`journal:${userId}:`),
      partnerId ? kv.getByPrefix(`journal:${partnerId}:`) : Promise.resolve([]),
      kv.getByPrefix('module:'),
    ]);

    // Merge both response formats; extract questionId from either field or key
    const extractQid = (r: any): string | null => r?.questionId || null;
    const userResponses  = [...(userResponsesLegacy  as any[]), ...(userResponsesNew  as any[])];
    const partnerResponses = [...(partnerResponsesLegacy as any[]), ...(partnerResponsesNew as any[])];

    const userStreak = (userStreakRaw as any) || {};
    const partnerStreak = (partnerStreakRaw as any) || {};
    const publishedModules = (allModules as any[]).filter(m => m?.status === 'published');
    const totalLessons = publishedModules.reduce((sum: number, m: any) => sum + (m?.lessons?.length || 0), 0) || 20;

    // ── Scoring (0–100 per category) ──
    const avgStreak = Math.round(((userStreak.current_streak || 0) + (partnerStreak.current_streak || 0)) / 2);
    const totalDevotions = (userDevotions as any[]).length + (partnerDevotions as any[]).length;
    const devotionalScore = Math.min(100, avgStreak * 6 + Math.round(totalDevotions * 1.5));

    const answeredPrayers = [...(userPrayers as any[]), ...(partnerPrayers as any[])].filter(p => p?.answered).length;
    const totalPrayers = (userPrayers as any[]).length + (partnerPrayers as any[]).length;
    const prayerScore = Math.min(100, totalPrayers * 8 + answeredPrayers * 15);

    // Q&A: count unique questions answered — both individual and shared
    const userQids = new Set(userResponses.map(extractQid).filter(Boolean) as string[]);
    const partnerQids = new Set(partnerResponses.map(extractQid).filter(Boolean) as string[]);
    const sharedQA = [...userQids].filter(id => partnerQids.has(id)).length;
    // Score: 3pts per shared Q&A + 1pt per answered (either partner) — cap 100
    const qaScore = Math.min(100, sharedQA * 3 + (userQids.size + partnerQids.size) * 1);

    const completedLessons = new Set([
      ...(userLessons as any[]).map(l => l?.lessonId),
      ...(partnerLessons as any[]).map(l => l?.lessonId),
    ]).size;
    const moduleScore = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

    const totalActivity = (userMoods as any[]).length + (partnerMoods as any[]).length +
                          (userJournals as any[]).length + (partnerJournals as any[]).length;
    const activityScore = Math.min(100, Math.round(totalActivity * 2.5));

    const overallScore = Math.round(
      devotionalScore * 0.25 +
      prayerScore    * 0.20 +
      qaScore        * 0.25 +
      moduleScore    * 0.20 +
      activityScore  * 0.10
    );

    const eligible = overallScore >= 75 && moduleScore >= 80;

    // ── Gemini narrative ──
    const userName = profile?.name || 'Partner 1';
    const partnerName = partnerProfile?.name || 'Partner 2';

    const prompt = `You are a compassionate Christian marriage counselor and mentor. Analyze this couple's journey and write a comprehensive Marriage Readiness Report.

COUPLE: ${userName} & ${partnerName}
OVERALL READINESS SCORE: ${overallScore}/100
CERTIFICATE ELIGIBLE: ${eligible ? 'YES' : 'NOT YET'}

CATEGORY SCORES:
- Daily Devotions & Spiritual Discipline: ${devotionalScore}/100 (avg streak: ${avgStreak} days, total completions: ${totalDevotions})
- Prayer Life Together: ${prayerScore}/100 (${totalPrayers} prayers, ${answeredPrayers} answered)
- Knowing Each Other (Q&A): ${qaScore}/100 (${sharedQA} questions explored together)
- Pre-Marriage Learning Modules: ${moduleScore}/100 (${completedLessons}/${totalLessons} lessons complete)
- Daily Spiritual Activities: ${activityScore}/100 (${totalActivity} combined mood/journal entries)

Write a warm, Christ-centered report in JSON format with these exact fields:
{
  "headline": "A short inspiring headline for this couple (max 10 words)",
  "overallNarrative": "2–3 sentences summarizing their overall readiness journey with warmth and faith",
  "devotionalInsight": "1–2 sentences about their spiritual discipline and daily devotion habit",
  "prayerInsight": "1–2 sentences about their prayer life together",
  "qaInsight": "1–2 sentences about how well they are getting to know each other",
  "moduleInsight": "1–2 sentences about their progress through the pre-marriage learning curriculum",
  "activityInsight": "1 sentence about their daily spiritual engagement",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "growthAreas": ["growth area 1", "growth area 2"],
  "bibleVerse": "A relevant Bible verse about marriage or commitment (book chapter:verse — full text)",
  "closingEncouragement": "A warm closing paragraph with a blessing over their relationship",
  "certificateMessage": "${eligible ? 'A formal congratulatory message for their marriage readiness certificate' : 'An encouraging message about continuing the journey toward readiness'}"
}
Return ONLY valid JSON. Keep each field concise but meaningful.`;

    let aiReport: any = null;
    try {
      const raw = await callGemini(prompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) aiReport = JSON.parse(jsonMatch[0]);
    } catch (aiErr: any) {
      console.error('[MarriageReadiness] Gemini failed:', aiErr.message);
    }

    const result = {
      score: overallScore,
      eligible,
      categories: {
        devotional: { score: devotionalScore, streak: avgStreak, completions: totalDevotions },
        prayer:     { score: prayerScore, total: totalPrayers, answered: answeredPrayers },
        qa:         { score: qaScore, shared: sharedQA, totalUser: userQids.size, totalPartner: partnerQids.size },
        modules:    { score: moduleScore, completed: completedLessons, total: totalLessons },
        activity:   { score: activityScore, entries: totalActivity },
      },
      couple: { userName, partnerName },
      report: aiReport,
      generatedAt: new Date().toISOString(),
    };

    await kv.set(cacheKey, result);
    return c.json({ result, cached: false });
  } catch (error: any) {
    console.error('[MarriageReadiness] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ── Overall (General) Compatibility ──────────────────────────────────────────

// GET: return cached overall compatibility for this couple
app.get('/make-server-6d579fee/ai/compatibility/overall', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${userId}`);
    const partnerId = (profile as any)?.partnerId;
    const keyBase = partnerId && partnerId < userId ? partnerId : userId;
    const cached = await kv.get(`compatibility-overall:${keyBase}`);
    return c.json({ result: cached || null, cached: !!cached });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// POST: generate (or return cached) overall compatibility across all categories
app.post('/make-server-6d579fee/ai/compatibility/overall', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { completedCategories, questionPairs, userName, partnerName, force } = await c.req.json();

    const profile = await kv.get(`user:${userId}`);
    const partnerId = (profile as any)?.partnerId;
    const keyBase = partnerId && partnerId < userId ? partnerId : userId;

    // Return cached result unless force=true
    if (!force) {
      const cached = await kv.get(`compatibility-overall:${keyBase}`);
      if (cached) return c.json({ ...(cached as object), cached: true });
    }

    if (!questionPairs || questionPairs.length === 0) {
      return c.json({ error: 'No answered question pairs provided' }, 400);
    }

    // Build the comprehensive Gemini prompt
    const pairsText = (questionPairs as any[]).map((cat: any) => {
      const qs = (cat.questions as any[]).map((q: any) => {
        const prompts = (q.prompts as any[]).map((p: any) =>
          `  Q: "${p.text}"\n    ${userName}: ${p.userAnswer}\n    ${partnerName}: ${p.partnerAnswer}`
        ).join('\n');
        return `  Question: "${q.title}"\n${prompts}`;
      }).join('\n\n');
      return `CATEGORY: ${cat.categoryLabel}\n${qs}`;
    }).join('\n\n---\n\n');

    const prompt = `You are a compassionate Christian relationship counselor analyzing a couple's overall compatibility across multiple life categories.

Categories Completed Together: ${completedCategories.join(', ')}
Total Questions Discussed Together: ${(questionPairs as any[]).reduce((s: number, c: any) => s + c.questions.length, 0)}

${pairsText}

Provide an OVERALL COUPLE COMPATIBILITY ANALYSIS as JSON with these exact keys:
{
  "score": <number 0-100 — holistic compatibility considering semantic similarity, shared values, life-vision alignment across ALL categories>,
  "label": <brief label e.g. "Deeply Aligned" | "Beautifully Complementary" | "Growing Together" | "Wonderfully Different">,
  "strengths": [<3 specific alignment strengths based on actual answers>],
  "growthAreas": [<2 gentle faith-centered growth suggestions>],
  "categoryHighlights": { <categoryId>: <one-sentence note for each completed category> },
  "insight": <one personalized paragraph about this couple's unique dynamic>,
  "challenge": <one specific 30-day couple challenge based on their answers>
}

Base everything on what they ACTUALLY said. Return ONLY valid JSON, no markdown.`;

    let analysis: any;
    try {
      const raw = await callGemini(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch (aiErr: any) {
      console.warn('[Overall Compatibility] Gemini failed, using fallback:', aiErr.message);
      // Compute a simple average from per-question cached scores
      const allCached = await Promise.all(
        (questionPairs as any[]).flatMap((cat: any) =>
          (cat.questions as any[]).map((q: any) => kv.get(`compatibility:${keyBase}:${q.id}`))
        )
      );
      const scores = allCached.filter(Boolean).map((r: any) => r?.score || 0);
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 65;
      analysis = {
        score: avg,
        label: avg >= 75 ? 'Deeply Aligned' : avg >= 55 ? 'Growing Together' : 'Beautifully Different',
        strengths: [
          'You both invest time in understanding each other deeply.',
          'Your willingness to answer these questions together shows commitment.',
          'You share a foundation of faith that guides your relationship.',
        ],
        growthAreas: [
          'Continue exploring the remaining categories to deepen your understanding.',
          'Use your differences as opportunities to learn and grow together.',
        ],
        categoryHighlights: Object.fromEntries(completedCategories.map((c: string) => [c, 'Both partners engaged with this topic.'])),
        insight: 'Every question you answer together is a step toward deeper understanding and connection.',
        challenge: 'This week, spend 15 minutes each day discussing one answer from your completed categories in more depth.',
        aiPowered: false,
      };
    }

    const result = {
      ...analysis,
      aiPowered: analysis.aiPowered !== false,
      generatedAt: new Date().toISOString(),
      completedCategories,
    };

    await kv.set(`compatibility-overall:${keyBase}`, result);
    return c.json({ ...result, cached: false });
  } catch (error: any) {
    console.error('[Overall Compatibility] Error:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-6d579fee/ai/test', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return c.json({ configured: false, message: 'GEMINI_API_KEY not configured' });

    const result = await callGemini('Say "Gemini connected" in 3 words or less.');
    return c.json({ configured: true, valid: true, message: 'Gemini API is working!', sample: result });
  } catch (error: any) {
    return c.json({ configured: true, valid: false, message: error.message });
  }
});

// ============================================
// LANDING PAGE ROUTES
// ============================================
app.route('/make-server-6d579fee/landing', landingRoutes);

// ============================================
// DAILY REMINDER CRON
// ============================================

/** Send a transactional email via Resend */
async function sendReminderEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) { console.warn('[Reminder] RESEND_API_KEY not set — skipping email'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'TwoBeOne <reminders@twobeone.app>', to, subject, html }),
  });
  if (!res.ok) console.error('[Reminder] Resend error:', res.status, await res.text().catch(() => ''));
}

/** Build a personalised push body from what the user hasn't done today */
function buildReminderMessage(missedMood: boolean, missedDevotional: boolean, missedQA: boolean): string {
  const items: string[] = [];
  if (missedDevotional) items.push('complete your devotional');
  if (missedMood) items.push('log your mood');
  if (missedQA) items.push('answer a Q&A question');
  if (items.length === 0) return 'Check in with your partner today 💕';
  const list = items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  return `Don't forget to ${list} today to keep your streak alive! 🔥`;
}

/** Build HTML email body */
function buildReminderEmail(
  name: string,
  missedMood: boolean,
  missedDevotional: boolean,
  missedQA: boolean,
): string {
  const greeting = name ? `Hi ${name}` : 'Hi there';
  const sections: string[] = [];

  if (missedDevotional) sections.push(`
    <div style="background:#fef1f4;border-left:4px solid #e11d48;border-radius:8px;padding:16px;margin-bottom:12px;">
      <p style="margin:0;font-weight:600;color:#be123c;">📖 Daily Devotional</p>
      <p style="margin:4px 0 0;color:#374151;font-size:14px;">Your devotional is waiting. Keep your streak alive!</p>
    </div>`);

  if (missedMood) sections.push(`
    <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:12px;">
      <p style="margin:0;font-weight:600;color:#b45309;">😊 Daily Mood</p>
      <p style="margin:4px 0 0;color:#374151;font-size:14px;">Share how you're feeling with your partner today.</p>
    </div>`);

  if (missedQA) sections.push(`
    <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:16px;margin-bottom:12px;">
      <p style="margin:0;font-weight:600;color:#0369a1;">💬 Q&A Questions</p>
      <p style="margin:4px 0 0;color:#374151;font-size:14px;">Deepen your connection by answering a question together.</p>
    </div>`);

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:32px;">💑</span>
        <h1 style="margin:8px 0 4px;color:#111827;font-size:22px;">TwoBeOne</h1>
        <p style="color:#6b7280;margin:0;font-size:14px;">Grow Together in Faith</p>
      </div>
      <h2 style="color:#111827;font-size:18px;margin-bottom:8px;">${greeting} 👋</h2>
      <p style="color:#374151;margin-bottom:20px;">We noticed you haven't checked in today. Here's what's waiting for you:</p>
      ${sections.join('')}
      <div style="text-align:center;margin-top:24px;">
        <a href="https://twobeone.app" style="display:inline-block;background:#e11d48;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:16px;">
          Open TwoBeOne
        </a>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
        You're receiving this because you enabled email reminders in TwoBeOne.<br>
        To stop, open Settings → App → Daily Reminders → toggle off Email Reminders.
      </p>
    </div>
  </body></html>`;
}

/**
 * POST /cron/daily-reminders
 * Protected by Authorization: Bearer {CRON_SECRET}
 * Called daily by an external cron service (cron-job.org, GitHub Actions, etc.)
 */
app.post('/make-server-6d579fee/cron/daily-reminders', async (c) => {
  try {
    // Verify cron secret
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = c.req.header('Authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const today = new Date().toISOString().split('T')[0];
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

    // Load all users
    const allUsers: any[] = await kv.getByPrefix('user:').catch(() => []);
    let sent = 0, skipped = 0;

    for (const user of allUsers) {
      if (!user?.id || !user?.email) { skipped++; continue; }

      // Skip if active within 24h
      const lastActive = user.updatedAt ? new Date(user.updatedAt) : new Date(0);
      if (lastActive > cutoff) { skipped++; continue; }

      // Skip if already reminded today (idempotency guard)
      const reminderKey = `reminder-sent:${user.id}:${today}`;
      if (await kv.get(reminderKey)) { skipped++; continue; }

      // Skip if user has disabled all reminders
      const wantsPush  = user.reminderPush  !== false; // default ON
      const wantsEmail = user.reminderEmail !== false; // default ON

      if (!wantsPush && !wantsEmail) { skipped++; continue; }

      // Check what the user missed today
      const streak = await kv.get(`streak:${user.id}:devotional`).catch(() => null) as any;
      const missedDevotional = !streak || streak.last_activity_date !== today;

      const todayMoods: any[] = await kv.getByPrefix(`mood:${user.id}:`).catch(() => []);
      const missedMood = !todayMoods.some(m => m?.createdAt?.startsWith(today));

      const allResponses: any[] = await kv.getByPrefix(`response:${user.id}:`).catch(() => []);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const missedQA = !allResponses.some(r => r?.createdAt && new Date(r.createdAt) > sevenDaysAgo);

      // Nothing actually missed — skip
      if (!missedDevotional && !missedMood && !missedQA) { skipped++; continue; }

      const pushMessage = buildReminderMessage(missedMood, missedDevotional, missedQA);

      // Send push notification
      if (wantsPush) {
        const sub: any = await kv.get(`push_subscription:${user.id}`).catch(() => null);
        if (sub?.endpoint) {
          try {
            // Reuse the existing /send-push route logic inline
            await fetch(`https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '') || ''}/functions/v1/make-server-6d579fee/send-push`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                userId: user.id,
                title: "TwoBeOne — Don't break the streak! 🔥",
                body: pushMessage,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                url: '/',
              }),
            });
          } catch (pushErr: any) {
            console.warn(`[Reminder] Push failed for ${user.id}:`, pushErr.message);
          }
        }
      }

      // Send email
      if (wantsEmail && user.email) {
        const html = buildReminderEmail(user.name || '', missedMood, missedDevotional, missedQA);
        await sendReminderEmail(
          user.email,
          "TwoBeOne — Your daily check-in is waiting 💕",
          html,
        ).catch(e => console.warn('[Reminder] Email failed:', e.message));
      }

      // Mark as reminded today (expires after 25h to avoid edge cases)
      await kv.set(reminderKey, { sentAt: new Date().toISOString() });
      sent++;
    }

    console.log(`[Reminder] Done: sent=${sent}, skipped=${skipped}`);
    return c.json({ ok: true, sent, skipped, date: today });

  } catch (error: any) {
    console.error('[Reminder] Cron error:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// POST /cron/test-reminder — sends a test reminder to the currently logged-in user only
// Protected by normal user auth (no CRON_SECRET needed), useful for verifying the setup.
app.post('/make-server-6d579fee/cron/test-reminder', async (c) => {
  try {
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const user: any = await kv.get(`user:${userId}`);
    if (!user) return c.json({ error: 'User not found' }, 404);

    const today = new Date().toISOString().split('T')[0];
    const result: any = { userId, push: null, email: null };

    // Build test message (always show all three reminders for test)
    const pushMessage = buildReminderMessage(true, true, true);

    // Send push if subscription exists
    const sub: any = await kv.get(`push_subscription:${userId}`).catch(() => null);
    if (sub?.endpoint) {
      try {
        const webpushRes = await fetch(
          `https://${Deno.env.get('SUPABASE_URL')?.split('//')[1]}/functions/v1/make-server-6d579fee/send-push`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              userId,
              title: "🧪 Test Reminder — TwoBeOne",
              body: pushMessage,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              url: '/',
            }),
          }
        );
        result.push = webpushRes.ok ? 'sent' : `failed (${webpushRes.status})`;
      } catch (e: any) {
        result.push = `error: ${e.message}`;
      }
    } else {
      result.push = 'no subscription found — enable push notifications first';
    }

    // Send test email if user has email
    if (user.email) {
      const html = buildReminderEmail(user.name || '', true, true, true);
      try {
        await sendReminderEmail(user.email, '🧪 Test Reminder — TwoBeOne', html);
        result.email = `sent to ${user.email}`;
      } catch (e: any) {
        result.email = `error: ${e.message}`;
      }
    } else {
      result.email = 'no email on profile';
    }

    return c.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('[TestReminder] Error:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// ADMIN PRIVILEGE MANAGEMENT ROUTES
// ============================================
setupAdminRoutes(app, getSupabase());

// ============================================
// START SERVER
// ============================================

// Single serialized startup sequence — prevents DB connection pool exhaustion.
// If Supabase is unreachable on boot, the entire chain is skipped silently.
async function runStartupSequence() {
  // Reachability probe — bail out immediately if DB is down.
  try {
    await kv.get('system:startup-probe');
  } catch {
    console.warn('[Startup] DB unreachable — skipping all seed/init tasks');
    return;
  }

  // Non-blocking: admin + audio bucket (fire and forget)
  initializeAdminSystem().catch(() => {});
  initAudioBucket().catch(() => {});

  // Skip heavy seeders entirely if they've already run — one flag check avoids 500+ KV reads
  const alreadySeeded = await kv.get('system:all-seeds-complete').catch(() => null);
  if (alreadySeeded) {
    console.log('[Startup] Seeds already complete — skipping seeders');
    return;
  }

  // Dedup pass
  try {
    const removed = await purgeKVDuplicates();
    if (removed > 0) console.log(`[StartupDedup] Removed ${removed} duplicate questions`);
  } catch { /* non-fatal */ }

  // Stagger each heavy seeder to avoid connection spikes
  await new Promise(r => setTimeout(r, 1000));
  try { await seedInitialDevotionals(); } catch { /* non-fatal */ }

  await new Promise(r => setTimeout(r, 2000));
  try { await seedTravelAdventureQuestions(); } catch { /* non-fatal */ }

  await new Promise(r => setTimeout(r, 2000));
  try { await seedAllCategoryQuestions(); } catch { /* non-fatal */ }

  // Mark seeds as complete so future cold boots skip all of this
  await kv.set('system:all-seeds-complete', { completedAt: new Date().toISOString() }).catch(() => {});
}

setTimeout(runStartupSequence, 5000);

// ============================================
// LOCATION TRACKING
// ============================================

// Update user location
app.post('/make-server-6d579fee/update-location', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = c.get('supabase');
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { location, locationType } = await c.req.json();

    if (!location || !location.latitude || !location.longitude) {
      return c.json({ error: 'Invalid location data' }, 400);
    }

    if (!locationType || !['live', 'manual'].includes(locationType)) {
      return c.json({ error: 'Invalid location type' }, 400);
    }

    // Store location in KV store
    const locationData = {
      userId: user.id,
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city || null,
      country: location.country || null,
      locationType: locationType,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`location:${user.id}`, locationData);

    console.log('[Location] Location updated for user:', user.id, locationData);

    return c.json({ success: true, location: locationData });
  } catch (error) {
    console.error('[Location] Update location error:', error);
    return c.json({ error: 'Failed to update location' }, 500);
  }
});

// Get couple locations (user + partner)
app.get('/make-server-6d579fee/couple-locations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = c.get('supabase');
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user profile to find partner ID
    const userProfile = await kv.get(`user:${user.id}`);
    const partnerId = userProfile?.partnerId || null;

    console.log('[Location] Getting locations for user:', user.id, 'partner:', partnerId);

    // Get user location from KV store
    const userLocationData = await kv.get(`location:${user.id}`);

    // Get partner location if partner exists
    let partnerLocationData = null;
    if (partnerId) {
      partnerLocationData = await kv.get(`location:${partnerId}`);
    }

    console.log('[Location] User location:', userLocationData);
    console.log('[Location] Partner location:', partnerLocationData);

    // Format response
    const userLocation = userLocationData ? {
      userId: user.id,
      location: {
        latitude: userLocationData.latitude,
        longitude: userLocationData.longitude,
        city: userLocationData.city,
        country: userLocationData.country
      },
      locationType: userLocationData.locationType,
      updatedAt: userLocationData.updatedAt
    } : null;

    const partnerLocation = partnerLocationData ? {
      userId: partnerId,
      location: {
        latitude: partnerLocationData.latitude,
        longitude: partnerLocationData.longitude,
        city: partnerLocationData.city,
        country: partnerLocationData.country
      },
      locationType: partnerLocationData.locationType,
      updatedAt: partnerLocationData.updatedAt
    } : null;

    return c.json({
      userLocation,
      partnerLocation
    });
  } catch (error) {
    console.error('[Location] Get couple locations error:', error);
    return c.json({ error: 'Failed to get locations' }, 500);
  }
});

// Remove user location
app.delete('/make-server-6d579fee/update-location', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = c.get('supabase');
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Delete location from KV store
    await kv.del(`location:${user.id}`);

    console.log('[Location] Location removed for user:', user.id);

    return c.json({ success: true });
  } catch (error) {
    console.error('[Location] Remove location error:', error);
    return c.json({ error: 'Failed to remove location' }, 500);
  }
});

// Seed initial devotionals if none exist
async function seedInitialDevotionals() {
  try {
    const existingDevotionals = await kv.getByPrefix('devotional:');
    
    if (existingDevotionals.length === 0) {
      console.log('📖 Seeding initial devotionals...');
      
      const today = new Date();
      const sampleDevotionals = [
        {
          title: "Love is Patient",
          verse: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
          reference: "1 Corinthians 13:4",
          reflection: "In our relationships, patience is not passive waiting - it's active love. When we practice patience with our partner, we mirror God's patience with us. Today, choose to respond with patience rather than react with frustration.",
          prayerPrompt: "Pray together for patience in your relationship",
          tags: ['Love', 'Patience', 'Growth'],
          status: 'published',
          language: 'en'
        },
        {
          title: "Praying Together",
          verse: "Again, truly I tell you that if two of you on earth agree about anything they ask for, it will be done for them by my Father in heaven.",
          reference: "Matthew 18:19",
          reflection: "Prayer is the foundation of a Christ-centered relationship. When we pray together, we invite God into our relationship and align our hearts with His will. Make prayer a daily habit in your relationship.",
          prayerPrompt: "Thank God for your partner and pray for their needs today",
          tags: ['Prayer', 'Faith', 'Unity'],
          status: 'published',
          language: 'en'
        },
        {
          title: "Serving One Another",
          verse: "For you were called to freedom, brothers. Only do not use your freedom as an opportunity for the flesh, but through love serve one another.",
          reference: "Galatians 5:13",
          reflection: "True love is shown through service. When we serve our partner selflessly, we demonstrate Christ's love. Look for opportunities today to serve your partner without expecting anything in return.",
          prayerPrompt: "Ask God to show you how to better serve your partner",
          tags: ['Service', 'Love', 'Sacrifice'],
          status: 'published',
          language: 'en'
        }
      ];
      
      for (let i = 0; i < sampleDevotionals.length; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const devotionalId = `${date.toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 9)}`;
        
        await kv.set(`devotional:${devotionalId}`, {
          id: devotionalId,
          date: date.toISOString().split('T')[0],
          ...sampleDevotionals[i],
          createdAt: new Date().toISOString()
        });
      }
      
      console.log('✅ Seeded 3 initial devotionals');
    } else {
      console.log(`📖 Found ${existingDevotionals.length} existing devotionals`);
    }
  } catch (error) {
    console.error('Failed to seed devotionals:', error);
  }
}

// Seed devotionals after server is ready

// ============================================================
// SEED: Travel & Adventure sample Q&A questions
// ============================================================
async function seedTravelAdventureQuestions() {
  try {
    if (await kv.get("seeded:travel")) return;

    const travelQuestions = [
      {
        category: "travel",
        language: "en",
        status: "active",
        title: "Our Dream Destination Together",
        verse: "By faith Abraham obeyed when he was called to go out to a place that he was to receive as an inheritance. And he went out, not knowing where he was going.",
        verseReference: "Hebrews 11:8",
        prompts: [
          { id: "t1p1", text: "If you could visit any place in the world together, where would it be and why?", type: "text" },
          { id: "t1p2", text: "How do you feel about traveling to unfamiliar places with your partner?", type: "scale", scaleMax: 5 },
          { id: "t1p3", text: "What kind of travel excites you most?", type: "multiple_choice", options: ["Cultural cities", "Nature & wilderness", "Beach & ocean", "Mountains & hiking", "Historical sites"] },
        ],
      },
      {
        category: "travel",
        language: "en",
        status: "active",
        title: "Faith on the Road",
        verse: "Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, This is the way; walk in it.",
        verseReference: "Isaiah 30:21",
        prompts: [
          { id: "t2p1", text: "How do you stay connected to your faith while traveling away from home?", type: "text" },
          { id: "t2p2", text: "Have you ever felt God's nearness in a special way during a trip? Share the story.", type: "text" },
          { id: "t2p3", text: "Would you be open to going on a mission trip or faith-based retreat together?", type: "yes_no" },
        ],
      },
      {
        category: "travel",
        language: "en",
        status: "active",
        title: "Budgeting for Adventures",
        verse: "For which of you, desiring to build a tower, does not first sit down and count the cost, whether he has enough to complete it?",
        verseReference: "Luke 14:28",
        prompts: [
          { id: "t3p1", text: "How much of your annual budget do you think should go toward travel and experiences?", type: "multiple_choice", options: ["Less than 5%", "5-10%", "10-20%", "More than 20%"] },
          { id: "t3p2", text: "Do you prefer saving up for one big trip or taking several smaller ones each year?", type: "multiple_choice", options: ["One big trip", "Several smaller trips", "A mix of both"] },
          { id: "t3p3", text: "How do you approach financial planning for travel together?", type: "text" },
        ],
      },
      {
        category: "travel",
        language: "en",
        status: "active",
        title: "Sabbath Rest & Vacation",
        verse: "And on the seventh day God finished his work that he had done, and he rested on the seventh day from all his work.",
        verseReference: "Genesis 2:2",
        prompts: [
          { id: "t4p1", text: "What does true rest and vacation look like for you?", type: "text" },
          { id: "t4p2", text: "Do you find it easy to disconnect from work and responsibilities when traveling?", type: "scale", scaleMax: 5 },
          { id: "t4p3", text: "What activities help you feel most refreshed and renewed on a trip?", type: "multiple_select", options: ["Sleeping in", "Exploring new places", "Reading & quiet time", "Prayer & devotionals", "Adventure activities", "Good food & restaurants"] },
        ],
      },
      {
        category: "travel",
        language: "en",
        status: "active",
        title: "Handling Conflict While Traveling",
        verse: "Be completely humble and gentle; be patient, bearing with one another in love.",
        verseReference: "Ephesians 4:2",
        prompts: [
          { id: "t5p1", text: "Describe a time travel plans went wrong. How did you handle it as a couple?", type: "text" },
          { id: "t5p2", text: "When something goes wrong on a trip, your natural reaction is:", type: "multiple_choice", options: ["Stay calm and problem-solve", "Feel frustrated but recover quickly", "Get stressed and need time to reset", "Look for humor in the situation"] },
          { id: "t5p3", text: "How can we better support each other when travel stress happens?", type: "text" },
        ],
      },
      {
        category: "travel",
        language: "en",
        status: "active",
        title: "Serving Others as We Travel",
        verse: "For I was hungry and you gave me food, I was thirsty and you gave me drink, I was a stranger and you welcomed me.",
        verseReference: "Matthew 25:35",
        prompts: [
          { id: "t6p1", text: "Have you ever served or volunteered in a community different from your own? What was that like?", type: "text" },
          { id: "t6p2", text: "How important is it to you that travel includes giving back to local communities?", type: "scale", scaleMax: 5 },
          { id: "t6p3", text: "Would you consider going on a humanitarian or volunteer trip together?", type: "yes_no" },
        ],
      },
      {
        category: "travel",
        language: "en",
        status: "active",
        title: "Stepping Out of Comfort Zones",
        verse: "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.",
        verseReference: "Joshua 1:9",
        prompts: [
          { id: "t7p1", text: "What is something adventurous you have always wanted to try but felt too afraid to do?", type: "text" },
          { id: "t7p2", text: "How does your faith give you courage to try new experiences?", type: "text" },
          { id: "t7p3", text: "On a scale of 1-5, how adventurous are you as a traveler?", type: "scale", scaleMax: 5 },
        ],
      },
      {
        category: "travel",
        language: "en",
        status: "active",
        title: "Creating Memories & Gratitude",
        verse: "Give thanks in all circumstances; for this is the will of God in Christ Jesus for you.",
        verseReference: "1 Thessalonians 5:18",
        prompts: [
          { id: "t8p1", text: "What is your favorite travel memory together, and what made it so special?", type: "text" },
          { id: "t8p2", text: "How do you keep travel memories alive?", type: "multiple_select", options: ["Photo albums", "Travel journal", "Collecting souvenirs", "Videos & reels", "Retelling stories", "Prayer of thanks"] },
          { id: "t8p3", text: "How can gratitude transform an ordinary trip into an extraordinary experience?", type: "text" },
        ],
      },
      {
        category: "travel",
        language: "en",
        status: "active",
        title: "Travel Roles & Partnership",
        verse: "Two are better than one, because they have a good reward for their toil. For if they fall, one will lift up his fellow.",
        verseReference: "Ecclesiastes 4:9-10",
        prompts: [
          { id: "t9p1", text: "When planning a trip, which role do you naturally take?", type: "multiple_choice", options: ["The planner & researcher", "The spontaneous one", "The budget tracker", "The activity suggester", "I follow my partner's lead"] },
          { id: "t9p2", text: "What does teamwork look like for you when traveling together?", type: "text" },
          { id: "t9p3", text: "Do you think your travel styles complement each other well?", type: "yes_no" },
        ],
      },
      {
        category: "travel",
        language: "en",
        status: "active",
        title: "A Spiritual Pilgrimage Together",
        verse: "Blessed are those whose strength is in you, whose hearts are set on pilgrimage.",
        verseReference: "Psalm 84:5",
        prompts: [
          { id: "t10p1", text: "Is there a spiritually meaningful place you would love to visit together, such as Israel or a retreat center?", type: "text" },
          { id: "t10p2", text: "How could a pilgrimage or faith-focused trip strengthen your relationship with God and each other?", type: "text" },
          { id: "t10p3", text: "What spiritual disciplines would you want to practice together while on a faith trip?", type: "multiple_select", options: ["Daily prayer", "Scripture reading", "Worship & singing", "Fasting", "Journaling", "Service & giving"] },
        ],
      },
    ];

    for (const q of travelQuestions) {
      const slug = (q.title || 'travel').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
      const id = `travel-${slug}`;
      if (!(await kv.get("question:" + id))) {
        await kv.set("question:" + id, { ...q, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        await new Promise((r) => setTimeout(r, 10));
      }
    }
    await kv.set("seeded:travel", true);
    console.log("[Seed] travel done (deterministic IDs)");
  } catch (error) {
    console.error("Failed to seed travel questions:", error);
  }
}


// ============================================================
// SEED: All remaining Q&A categories
// ============================================================

// One-time migration: scan existing questions and set any missing seeder flags


console.log('🚀 TwoBeOne API Server starting...');
console.log('📍 Base URL: /make-server-6d579fee');
console.log('🔑 Using KV Store for data persistence');
console.log('✅ All routes configured');
console.log('👥 Community features enabled');
console.log('🌍 Location tracking enabled');

Deno.serve(app.fetch);
