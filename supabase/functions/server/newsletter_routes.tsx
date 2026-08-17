import { Hono } from 'npm:hono@4';
import * as kv from './kv_store.tsx';
import { getSupabase, getUserFromToken, isAdminUser, logAudit } from './auth_helpers.tsx';
import { generateWeeklyNewsletter, renderWeeklyNewsletter } from './newsletter_content.ts';
import {
  buildNewsletterAudience,
  type NewsletterSubscriber,
  type RegisteredEmail,
} from './newsletter_audience.ts';

const newsletter = new Hono();
const SUBSCRIBER_PREFIX = 'newsletter:';
const TOKEN_PREFIX = 'newsletter_token:';
const CAMPAIGN_PREFIX = 'newsletter_campaign:';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;
const SITE_ORIGIN = 'https://www.twobeone.app';

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 320 && EMAIL_PATTERN.test(email) ? email : null;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function tokenDigest(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function subscriberKey(email: string): string {
  return `${SUBSCRIBER_PREFIX}${email}`;
}

function newsletterApiBase(): string {
  return `${Deno.env.get('SUPABASE_URL') || ''}/functions/v1/make-server-6d579fee/newsletter`;
}

async function storeToken(token: string, value: Record<string, unknown>): Promise<void> {
  await kv.set(`${TOKEN_PREFIX}${await tokenDigest(token)}`, value);
}

async function resolveToken(token: string, purpose: 'confirm' | 'unsubscribe'): Promise<any | null> {
  if (!token || token.length > 256) return null;
  const record = await kv.get(`${TOKEN_PREFIX}${await tokenDigest(token)}`);
  if (!record || record.purpose !== purpose) return null;
  if (record.expiresAt && Date.parse(record.expiresAt) < Date.now()) return null;
  return record;
}

async function ensureUnsubscribeToken(subscriber: NewsletterSubscriber): Promise<string> {
  if (subscriber.unsubscribeToken) return subscriber.unsubscribeToken;
  const token = randomToken();
  subscriber.unsubscribeToken = token;
  await Promise.all([
    kv.set(subscriberKey(subscriber.email), subscriber),
    storeToken(token, { email: subscriber.email, purpose: 'unsubscribe' }),
  ]);
  return token;
}

function resendApiKey(): string {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) throw new Error('RESEND_API_KEY is not configured');
  return key;
}

function fromAddress(): string {
  return Deno.env.get('NEWSLETTER_FROM_EMAIL') || 'TwoBeOne <newsletter@twobeone.app>';
}

async function resendRequest(path: string, body: unknown, idempotencyKey?: string): Promise<any> {
  const response = await fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey()}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || data?.error || `Resend request failed (${response.status})`);
  return data;
}

async function sendConfirmationEmail(email: string, token: string): Promise<void> {
  const confirmationUrl = `${SITE_ORIGIN}/newsletter/confirm?token=${encodeURIComponent(token)}`;
  const digest = await tokenDigest(token);
  await resendRequest('/emails', {
    from: fromAddress(),
    to: [email],
    subject: 'Confirm your TwoBeOne Saturday email',
    text: `Confirm your subscription to weekly TwoBeOne encouragement, relationship guidance, and app updates:\n\n${confirmationUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<!doctype html><html><body style="background:#fff7f8;font-family:Arial,sans-serif;color:#292524;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #ffe4e6;border-radius:18px;padding:30px"><div style="color:#be123c;font-weight:bold">TwoBeOne</div><h1 style="font-size:25px">One more step</h1><p style="line-height:1.7">Confirm that you want a short Saturday email with encouragement, practical relationship guidance, appreciation, and TwoBeOne updates.</p><a href="${confirmationUrl}" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold">Confirm subscription</a><p style="margin-top:24px;color:#78716c;font-size:12px">If you did not request this, you can ignore this email.</p></div></body></html>`,
    headers: { 'X-Entity-Ref-ID': `newsletter-confirm-${digest}` },
  }, `newsletter-confirm-${digest}`);
}

async function requireAdmin(c: any): Promise<string | Response> {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  if (!(await isAdminUser(userId))) return c.json({ error: 'Forbidden - Admin access required' }, 403);
  return userId;
}

async function timingSafeEqual(first: string, second: string): Promise<boolean> {
  const firstDigest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(first)));
  const secondDigest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(second)));
  let difference = 0;
  for (let index = 0; index < firstDigest.length; index++) difference |= firstDigest[index] ^ secondDigest[index];
  return difference === 0;
}

async function isAuthorizedCronRequest(c: any): Promise<boolean> {
  const expected = Deno.env.get('NEWSLETTER_CRON_SECRET');
  if (!expected) return false;
  const bearer = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '') || '';
  const supplied = c.req.header('X-Newsletter-Cron-Secret') || bearer;
  return Boolean(supplied) && timingSafeEqual(supplied, expected);
}

async function getRegisteredEmails(): Promise<RegisteredEmail[]> {
  const registered: RegisteredEmail[] = [];
  const perPage = 1000;

  for (let page = 1; page <= 100; page++) {
    const { data, error } = await getSupabase().auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Unable to load registered users: ${error.message}`);
    const users = data?.users || [];
    for (const user of users) {
      const email = normalizeEmail(user.email);
      if (!email) continue;
      registered.push({
        id: user.id,
        email,
        createdAt: user.created_at,
        confirmedAt: user.email_confirmed_at,
      });
    }
    if (users.length < perPage) break;
    if (page === 100) throw new Error('Registered user pagination exceeded the safety limit');
  }

  return registered;
}

async function getWeeklyAudience(): Promise<NewsletterSubscriber[]> {
  const storedValues = await kv.getByPrefix(SUBSCRIBER_PREFIX);
  const subscribers = storedValues
    .filter((value: any) => normalizeEmail(value?.email))
    .map((value: any) => ({ ...value, email: normalizeEmail(value.email) })) as NewsletterSubscriber[];
  const registeredUsers = await getRegisteredEmails();
  const audience = buildNewsletterAudience(subscribers, registeredUsers);

  if (audience.recordsToPersist.length) {
    await kv.mset(
      audience.recordsToPersist.map(subscriber => subscriberKey(subscriber.email)),
      audience.recordsToPersist,
    );
  }

  return audience.recipients;
}

async function getRegisteredUser(c: any): Promise<RegisteredEmail | Response> {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { data, error } = await getSupabase().auth.admin.getUserById(userId);
  const email = normalizeEmail(data?.user?.email);
  if (error || !data?.user || !email) return c.json({ error: 'Registered account email not found' }, 404);
  return {
    id: data.user.id,
    email,
    createdAt: data.user.created_at,
    confirmedAt: data.user.email_confirmed_at || undefined,
  };
}

newsletter.get('/preference', async c => {
  try {
    const user = await getRegisteredUser(c);
    if (user instanceof Response) return user;
    const subscriber = await kv.get(subscriberKey(user.email)) as NewsletterSubscriber | null;
    return c.json({
      enabled: subscriber?.status !== 'unsubscribed',
      email: user.email,
      schedule: 'Saturday at 09:00 Africa/Addis_Ababa',
    });
  } catch (error: any) {
    console.error('[Newsletter] Preference load error:', error?.message || error);
    return c.json({ error: 'Unable to load your email preference.' }, 500);
  }
});

newsletter.post('/preference', async c => {
  try {
    const user = await getRegisteredUser(c);
    if (user instanceof Response) return user;
    const payload = await c.req.json();
    if (typeof payload?.enabled !== 'boolean') return c.json({ error: 'enabled must be a boolean' }, 400);
    const key = subscriberKey(user.email);
    const existing = await kv.get(key) as NewsletterSubscriber | null;
    const now = new Date().toISOString();
    const subscriber: NewsletterSubscriber = payload.enabled
      ? {
          ...existing,
          email: user.email,
          status: 'active',
          source: 'registered_user',
          subscribedAt: existing?.subscribedAt || user.createdAt || now,
          confirmedAt: existing?.confirmedAt || user.confirmedAt,
          registeredUserId: user.id,
          unsubscribedAt: undefined,
        }
      : {
          ...existing,
          email: user.email,
          status: 'unsubscribed',
          source: existing?.source || 'registered_user',
          subscribedAt: existing?.subscribedAt || user.createdAt || now,
          registeredUserId: user.id,
          unsubscribedAt: now,
        };
    await kv.set(key, subscriber);
    await logAudit('user.newsletter_preference_changed', user.id, { enabled: payload.enabled });
    return c.json({
      enabled: payload.enabled,
      email: user.email,
      message: payload.enabled
        ? 'Saturday emails are enabled.'
        : 'Saturday emails are paused. Essential account emails are unaffected.',
    });
  } catch (error: any) {
    console.error('[Newsletter] Preference update error:', error?.message || error);
    return c.json({ error: 'Unable to update your email preference.' }, 500);
  }
});

newsletter.post('/subscribe', async c => {
  try {
    const payload = await c.req.json();
    const email = normalizeEmail(payload?.email);
    if (!email) return c.json({ error: 'Valid email address required' }, 400);

    const key = subscriberKey(email);
    const existing = await kv.get(key) as NewsletterSubscriber | null;
    if (existing?.status === 'active') return c.json({ message: 'This address is already subscribed.' }, 200);
    if (existing?.status === 'pending' && existing.confirmationSentAt && Date.now() - Date.parse(existing.confirmationSentAt) < 10 * 60 * 1000) {
      return c.json({ message: 'Please check your inbox to confirm your subscription.' }, 200);
    }

    const token = randomToken();
    const now = new Date().toISOString();
    const subscriber: NewsletterSubscriber = {
      email,
      status: 'pending',
      source: typeof payload?.source === 'string' ? payload.source.slice(0, 60) : 'landing_page',
      subscribedAt: existing?.subscribedAt || now,
      confirmationSentAt: now,
    };
    await Promise.all([
      kv.set(key, subscriber),
      storeToken(token, { email, purpose: 'confirm', expiresAt: new Date(Date.now() + CONFIRMATION_TTL_MS).toISOString() }),
    ]);
    try {
      await sendConfirmationEmail(email, token);
    } catch (error) {
      await kv.set(key, { ...subscriber, status: existing?.status || 'pending', deliveryErrorAt: now });
      throw error;
    }
    console.log('[Newsletter] Confirmation requested');
    return c.json({ message: 'Please check your inbox to confirm your subscription.' }, 202);
  } catch (error: any) {
    console.error('[Newsletter] Subscription error:', error?.message || error);
    return c.json({ error: 'We could not send the confirmation email. Please try again shortly.' }, 503);
  }
});

newsletter.post('/confirm', async c => {
  try {
    const { token } = await c.req.json();
    const record = await resolveToken(String(token || ''), 'confirm');
    if (!record?.email) return c.json({ error: 'This confirmation link is invalid or expired.' }, 400);
    const subscriber = await kv.get(subscriberKey(record.email)) as NewsletterSubscriber | null;
    if (!subscriber) return c.json({ error: 'Subscription not found.' }, 404);
    subscriber.status = 'active';
    subscriber.confirmedAt = new Date().toISOString();
    delete subscriber.unsubscribedAt;
    await ensureUnsubscribeToken(subscriber);
    await kv.del(`${TOKEN_PREFIX}${await tokenDigest(String(token))}`);
    console.log('[Newsletter] Subscription confirmed');
    return c.json({ message: 'Your Saturday TwoBeOne email is confirmed.' });
  } catch (error: any) {
    console.error('[Newsletter] Confirmation error:', error?.message || error);
    return c.json({ error: 'Unable to confirm this subscription.' }, 500);
  }
});

async function unsubscribe(token: string): Promise<boolean> {
  const record = await resolveToken(token, 'unsubscribe');
  if (!record?.email) return false;
  const subscriber = await kv.get(subscriberKey(record.email)) as NewsletterSubscriber | null;
  if (!subscriber) return false;
  subscriber.status = 'unsubscribed';
  subscriber.unsubscribedAt = new Date().toISOString();
  await kv.set(subscriberKey(record.email), subscriber);
  console.log('[Newsletter] Subscription disabled');
  return true;
}

newsletter.post('/unsubscribe', async c => {
  try {
    const { token } = await c.req.json();
    const removed = await unsubscribe(String(token || ''));
    if (!removed) return c.json({ error: 'This unsubscribe link is invalid.' }, 400);
    return c.json({ message: 'You have been unsubscribed.' });
  } catch (error: any) {
    console.error('[Newsletter] Unsubscribe error:', error?.message || error);
    return c.json({ error: 'Unable to update your email preference.' }, 500);
  }
});

// RFC 8058 one-click unsubscribe endpoint used by supporting email clients.
newsletter.post('/unsubscribe-one-click', async c => {
  const token = c.req.query('token') || '';
  await unsubscribe(token).catch(error => console.error('[Newsletter] One-click unsubscribe error:', error));
  return c.body(null, 200);
});

newsletter.get('/subscribers', async c => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const values = await kv.getByPrefix(SUBSCRIBER_PREFIX);
    const subscribers = values
      .filter((value: any) => normalizeEmail(value?.email))
      .map((value: any) => ({
        email: value.email,
        subscribedAt: value.subscribedAt,
        confirmedAt: value.confirmedAt || null,
        status: value.status || 'active',
        source: value.source || 'legacy',
      }))
      .sort((first: any, second: any) => String(second.subscribedAt || '').localeCompare(String(first.subscribedAt || '')));
    return c.json({ count: subscribers.length, subscribers });
  } catch (error: any) {
    console.error('[Newsletter] Get subscribers error:', error?.message || error);
    return c.json({ error: 'Failed to get subscribers' }, 500);
  }
});

newsletter.get('/preview', async c => {
  const admin = await requireAdmin(c);
  if (admin instanceof Response) return admin;
  const edition = generateWeeklyNewsletter();
  const rendered = renderWeeklyNewsletter(edition, `${SITE_ORIGIN}/newsletter/unsubscribe?token=preview`);
  return c.json({ edition, ...rendered });
});

newsletter.post('/test', async c => {
  try {
    const admin = await requireAdmin(c);
    if (admin instanceof Response) return admin;
    const { email: inputEmail } = await c.req.json();
    const email = normalizeEmail(inputEmail);
    if (!email) return c.json({ error: 'Valid test email required' }, 400);
    const edition = generateWeeklyNewsletter();
    const rendered = renderWeeklyNewsletter(edition, `${SITE_ORIGIN}/newsletter/unsubscribe?token=test`);
    const result = await resendRequest('/emails', {
      from: fromAddress(), to: [email], subject: `[TEST] ${edition.subject}`,
      html: rendered.html, text: rendered.text,
      headers: { 'X-Entity-Ref-ID': `newsletter-test-${edition.weekKey}` },
      tags: [{ name: 'campaign', value: edition.weekKey }, { name: 'type', value: 'newsletter-test' }],
    }, `newsletter-test-${edition.weekKey}-${await tokenDigest(email)}`);
    await logAudit('admin.newsletter_test_sent', admin, { weekKey: edition.weekKey });
    return c.json({ success: true, id: result?.id || null, weekKey: edition.weekKey });
  } catch (error: any) {
    console.error('[Newsletter] Test send error:', error?.message || error);
    return c.json({ error: error?.message || 'Unable to send test email' }, 500);
  }
});

newsletter.post('/send-weekly', async c => {
  try {
    if (!(await isAuthorizedCronRequest(c))) return c.json({ error: 'Unauthorized' }, 401);
    const edition = generateWeeklyNewsletter();
    const campaignKey = `${CAMPAIGN_PREFIX}${edition.weekKey}`;
    const existing = await kv.get(campaignKey) || {};
    if (existing.status === 'completed') return c.json({ message: 'Campaign already sent', ...existing }, 200);
    if (existing.status === 'processing' && Date.now() - Date.parse(existing.startedAt || 0) < 15 * 60 * 1000) {
      return c.json({ error: 'Campaign is already processing' }, 409);
    }

    const subscribers = await getWeeklyAudience();
    const campaign = {
      weekKey: edition.weekKey,
      status: 'processing',
      startedAt: new Date().toISOString(),
      audience: subscribers.length,
      completedBatches: Array.isArray(existing.completedBatches) ? existing.completedBatches : [],
      sent: Number(existing.sent) || 0,
    };
    await kv.set(campaignKey, campaign);

    for (let offset = 0; offset < subscribers.length; offset += 100) {
      const batchIndex = Math.floor(offset / 100);
      if (campaign.completedBatches.includes(batchIndex)) continue;
      const batch = subscribers.slice(offset, offset + 100);
      const messages = [];
      for (const subscriber of batch) {
        const token = await ensureUnsubscribeToken(subscriber);
        const unsubscribePageUrl = `${SITE_ORIGIN}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
        const oneClickUrl = `${newsletterApiBase()}/unsubscribe-one-click?token=${encodeURIComponent(token)}`;
        const rendered = renderWeeklyNewsletter(edition, unsubscribePageUrl);
        messages.push({
          from: fromAddress(), to: [subscriber.email], subject: edition.subject,
          html: rendered.html, text: rendered.text,
          headers: {
            'List-Unsubscribe': `<${oneClickUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'X-Entity-Ref-ID': `twobeone-${edition.weekKey}-${token.slice(0, 10)}`,
          },
          tags: [{ name: 'campaign', value: edition.weekKey }, { name: 'type', value: 'weekly-newsletter' }],
        });
      }
      await resendRequest('/emails/batch', messages, `twobeone-weekly-${edition.weekKey}-${batchIndex}`);
      campaign.completedBatches.push(batchIndex);
      campaign.sent += batch.length;
      await kv.set(campaignKey, campaign);
    }

    const completed = { ...campaign, status: 'completed', completedAt: new Date().toISOString() };
    await kv.set(campaignKey, completed);
    await logAudit('system.newsletter_weekly_sent', 'system', { weekKey: edition.weekKey, audience: subscribers.length, sent: campaign.sent });
    return c.json({ success: true, ...completed });
  } catch (error: any) {
    console.error('[Newsletter] Weekly campaign failed:', error?.message || error);
    const edition = generateWeeklyNewsletter();
    const campaignKey = `${CAMPAIGN_PREFIX}${edition.weekKey}`;
    const current = await kv.get(campaignKey).catch(() => ({}));
    await kv.set(campaignKey, { ...current, status: 'failed', failedAt: new Date().toISOString(), error: String(error?.message || error).slice(0, 300) }).catch(() => {});
    return c.json({ error: error?.message || 'Weekly campaign failed' }, 500);
  }
});

export default newsletter;
