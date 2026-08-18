import { Hono } from 'npm:hono@4.6.14';
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import * as kv from './kv_store.tsx';

const app = new Hono();

type Language = 'en' | 'am' | 'om';
type CalendarCategory = 'faith' | 'relationship' | 'family' | 'health' | 'finance' | 'service' | 'other';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

async function userIdFromRequest(c: any): Promise<string | null> {
  const token = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error || !user?.id ? null : user.id;
}

const scriptureByCategory: Record<CalendarCategory, string> = {
  faith: 'Proverbs 3:5–6', relationship: 'Ecclesiastes 4:9–10', family: 'Joshua 24:15',
  health: '3 John 1:2', finance: 'Philippians 4:19', service: 'Galatians 5:13', other: 'Philippians 4:6',
};

function fallbackPrayer(title: string, category: CalendarCategory, language: Language) {
  if (language === 'am') return {
    title: `ስለ ${title} ጸሎት`,
    text: `ጌታ ሆይ፣ “${title}” የሚለውን እቅዳችንን በእጅህ እናስቀምጣለን። ጥበብ፣ አንድነት እና ሰላም ስጠን፤ እርምጃችንም ፈቃድህን ያክብር። አሜን።`,
    scripture: scriptureByCategory[category],
  };
  if (language === 'om') return {
    title: `Kadhannaa ${title}`,
    text: `Yaa Gooftaa, karoora keenya “${title}” harka keetti kennina. Ogummaa, tokkummaa fi nagaa nuuf kenni; tarkaanfiin keenyas fedha kee haa kabaju. Ameen.`,
    scripture: scriptureByCategory[category],
  };
  return {
    title: `Prayer for ${title}`,
    text: `Lord, we place our plan, “${title},” in Your hands. Give us wisdom, unity, and peace, and let every step honor Your will. Amen.`,
    scripture: scriptureByCategory[category],
  };
}

function reminderOccurrence(item: any, now: Date): Date | null {
  const first = new Date(item.startsAt);
  if (!Number.isFinite(first.getTime()) || item.reminderMinutes == null) return null;
  const reminderTarget = new Date(now.getTime() + Number(item.reminderMinutes) * 60_000);
  if (item.recurrence === 'daily' || item.recurrence === 'weekly') {
    const period = item.recurrence === 'daily' ? 86_400_000 : 7 * 86_400_000;
    const index = Math.max(0, Math.floor((reminderTarget.getTime() - first.getTime()) / period));
    return new Date(first.getTime() + index * period);
  }
  if (item.recurrence === 'monthly' && reminderTarget >= first) {
    const occurrence = new Date(Date.UTC(reminderTarget.getUTCFullYear(), reminderTarget.getUTCMonth(), first.getUTCDate(), first.getUTCHours(), first.getUTCMinutes()));
    if (occurrence > reminderTarget) occurrence.setUTCMonth(occurrence.getUTCMonth() - 1);
    return occurrence;
  }
  return first;
}

async function sendCalendarPush(userId: string, title: string, body: string, itemId: string) {
  const subscription: any = await kv.get(`push_subscription:${userId}`).catch(() => null);
  if (!subscription?.endpoint) return false;
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!publicKey || !privateKey) return false;
  try {
    const webpush = await import('npm:web-push@3.6.7');
    webpush.setVapidDetails('mailto:support@twobeone.app', publicKey, privateKey);
    await webpush.sendNotification(subscription, JSON.stringify({
      title, body, icon: '/icons/icon-192x192.png', badge: '/icons/icon-72x72.png',
      tag: `calendar-${itemId}`, data: { url: '/?tab=home&screen=couple-calendar', itemId }, url: '/?tab=home&screen=couple-calendar',
    }));
    return true;
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.statusCode === 410) await kv.del(`push_subscription:${userId}`);
    console.warn('[Couple Calendar] Reminder push failed:', error);
    return false;
  }
}

async function generatePrayer(input: { title: string; description: string; type: string; category: CalendarCategory; language: Language }) {
  const fallback = fallbackPrayer(input.title, input.category, input.language);
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return fallback;

  const languageInstruction = input.language === 'am'
    ? 'Write in natural modern Amharic.'
    : input.language === 'om'
      ? 'Write in natural Afaan Oromo.'
      : 'Write in clear natural English.';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 220,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You write brief, warm, biblically grounded prayers for Christian couples. ${languageInstruction} Return JSON only with title, text, and scripture. Never promise outcomes or claim to speak for God.`,
          },
          {
            role: 'user',
            content: `Create a 45-70 word couple prayer for this ${input.type}. Topic: ${input.title}. Life area: ${input.category}. Notes: ${input.description || 'None'}. Include one relevant Bible reference in scripture.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content || '{}');
    if (!parsed.title || !parsed.text) return fallback;
    return {
      title: String(parsed.title).slice(0, 180),
      text: String(parsed.text).slice(0, 1200),
      scripture: String(parsed.scripture || fallback.scripture).slice(0, 120),
    };
  } catch (error) {
    console.warn('[Couple Calendar] AI prayer fallback used:', error);
    return fallback;
  }
}

async function resolveOwnedItem(userId: string, itemId: string) {
  const ownKey = `calendar:${userId}:${itemId}`;
  const own = await kv.get(ownKey);
  if (own) return { item: own as any, key: ownKey, ownerId: userId };
  const profile: any = await kv.get(`user:${userId}`).catch(() => null);
  if (!profile?.partnerId) return null;
  const partnerKey = `calendar:${profile.partnerId}:${itemId}`;
  const partner = await kv.get(partnerKey);
  return partner ? { item: partner as any, key: partnerKey, ownerId: profile.partnerId } : null;
}

app.get('/calendar', async (c) => {
  try {
    const userId = await userIdFromRequest(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const profile: any = await kv.get(`user:${userId}`).catch(() => null);
    const ownItems: any[] = await kv.getByPrefix(`calendar:${userId}:`).catch(() => []);
    let partnerItems: any[] = [];
    if (profile?.partnerId) {
      const raw: any[] = await kv.getByPrefix(`calendar:${profile.partnerId}:`).catch(() => []);
      partnerItems = raw.map(item => ({ ...item, isPartner: true }));
    }
    const items = [...ownItems, ...partnerItems]
      .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
      .slice(0, 500);
    return c.json({ items });
  } catch (error) {
    console.error('[Couple Calendar] Load error:', error);
    return c.json({ error: 'Failed to load calendar' }, 500);
  }
});

app.post('/calendar', async (c) => {
  try {
    const userId = await userIdFromRequest(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const title = String(body.title || '').trim();
    if (!title) return c.json({ error: 'Title is required' }, 400);
    const startsAt = new Date(body.startsAt);
    if (!Number.isFinite(startsAt.getTime())) return c.json({ error: 'A valid start date is required' }, 400);

    const allowedTypes = ['plan', 'event', 'reminder', 'routine'];
    const allowedCategories = ['faith', 'relationship', 'family', 'health', 'finance', 'service', 'other'];
    const allowedRecurrence = ['none', 'daily', 'weekly', 'monthly'];
    const type = allowedTypes.includes(body.type) ? body.type : 'plan';
    const category = (allowedCategories.includes(body.category) ? body.category : 'other') as CalendarCategory;
    const recurrence = allowedRecurrence.includes(body.recurrence) ? body.recurrence : 'none';
    const language: Language = body.language === 'am' || body.language === 'om' ? body.language : 'en';
    const now = new Date().toISOString();
    const itemId = generateId('cal');
    const createPrayer = body.createPrayer !== false;
    const generated = createPrayer
      ? await generatePrayer({ title, description: String(body.description || ''), type, category, language })
      : null;
    const prayerId = generated ? generateId('prayer') : null;

    const item = {
      id: itemId, userId, title, description: String(body.description || '').slice(0, 2000),
      type, category, startsAt: startsAt.toISOString(),
      endsAt: body.endsAt && Number.isFinite(new Date(body.endsAt).getTime()) ? new Date(body.endsAt).toISOString() : null,
      allDay: Boolean(body.allDay), recurrence,
      reminderMinutes: body.reminderMinutes == null
        ? null
        : Number.isFinite(Number(body.reminderMinutes))
          ? Math.max(0, Math.min(43_200, Number(body.reminderMinutes)))
          : null,
      location: String(body.location || '').slice(0, 240), status: 'upcoming', createPrayer,
      prayerId, prayerTitle: generated?.title, prayerText: generated?.text, scripture: generated?.scripture,
      createdAt: now, updatedAt: now,
    };

    let prayer = null;
    if (generated && prayerId) {
      prayer = {
        id: prayerId, userId, title: generated.title,
        description: `${generated.text}\n\n${generated.scripture}`,
        category: category === 'faith' ? 'Spiritual Growth' : category === 'relationship' ? 'Relationship' : 'Guidance',
        reminderDate: startsAt.toISOString(), isSharedWithCommunity: false, isShared: false,
        isAnswered: false, youPrayed: false, partnerPrayed: false, prayerCount: 0,
        source: 'couple-calendar', sourcePlanId: itemId, scripture: generated.scripture,
        createdAt: now, updatedAt: now,
      };
    }

    await Promise.all([
      kv.set(`calendar:${userId}:${itemId}`, item),
      prayer ? kv.set(`prayer:${userId}:${prayerId}`, prayer) : Promise.resolve(),
    ]);
    return c.json({ success: true, item, prayer }, 201);
  } catch (error) {
    console.error('[Couple Calendar] Create error:', error);
    return c.json({ error: 'Failed to create calendar item' }, 500);
  }
});

app.put('/calendar/:id', async (c) => {
  try {
    const userId = await userIdFromRequest(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const resolved = await resolveOwnedItem(userId, c.req.param('id'));
    if (!resolved) return c.json({ error: 'Calendar item not found' }, 404);
    if (resolved.ownerId !== userId) return c.json({ error: 'Only the creator can update this item' }, 403);
    const body = await c.req.json();
    const allowedUpdates = ['title', 'description', 'startsAt', 'endsAt', 'allDay', 'recurrence', 'reminderMinutes', 'location', 'status'];
    const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowedUpdates.includes(key)));
    const item = { ...resolved.item, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(resolved.key, item);
    return c.json({ success: true, item });
  } catch (error) {
    console.error('[Couple Calendar] Update error:', error);
    return c.json({ error: 'Failed to update calendar item' }, 500);
  }
});

app.delete('/calendar/:id', async (c) => {
  try {
    const userId = await userIdFromRequest(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const resolved = await resolveOwnedItem(userId, c.req.param('id'));
    if (!resolved) return c.json({ success: true });
    if (resolved.ownerId !== userId) return c.json({ error: 'Only the creator can delete this item' }, 403);
    await kv.del(resolved.key);
    if (resolved.item.prayerId) await kv.del(`prayer:${userId}:${resolved.item.prayerId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('[Couple Calendar] Delete error:', error);
    return c.json({ error: 'Failed to delete calendar item' }, 500);
  }
});

// Call every five minutes from the existing scheduler. Idempotency keys prevent duplicates.
app.post('/cron/calendar-reminders', async (c) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || c.req.header('Authorization') !== `Bearer ${secret}`) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const now = new Date();
    const windowStart = now.getTime() - 10 * 60_000;
    const items: any[] = await kv.getByPrefix('calendar:').catch(() => []);
    let sent = 0;
    for (const item of items) {
      if (!item?.id || item.status === 'completed' || item.reminderMinutes == null) continue;
      const occurrence = reminderOccurrence(item, now);
      if (!occurrence) continue;
      const dueAt = occurrence.getTime() - Number(item.reminderMinutes) * 60_000;
      if (dueAt > now.getTime() || dueAt < windowStart) continue;
      const occurrenceKey = occurrence.toISOString();
      const sentKey = `calendar-reminder-sent:${item.id}:${occurrenceKey}`;
      if (await kv.get(sentKey)) continue;
      const profile: any = await kv.get(`user:${item.userId}`).catch(() => null);
      const recipients = [item.userId, profile?.partnerId].filter(Boolean);
      const results = await Promise.all(recipients.map((id: string) =>
        sendCalendarPush(id, `💕 ${item.title}`, item.description || 'A shared couple plan is coming up.', item.id)
      ));
      sent += results.filter(Boolean).length;
      await kv.set(sentKey, { sentAt: now.toISOString(), recipients });
    }
    return c.json({ success: true, sent, checked: items.length });
  } catch (error) {
    console.error('[Couple Calendar] Reminder cron error:', error);
    return c.json({ error: 'Failed to send calendar reminders' }, 500);
  }
});

export default app;
