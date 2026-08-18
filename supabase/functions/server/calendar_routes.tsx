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

function resolveLanguage(value: unknown): Language {
  return value === 'am' || value === 'om' ? value : 'en';
}

function prayerDescription(text: string, scripture: string, language: Language) {
  const label = language === 'am' ? 'ቅዱስ ቃል' : language === 'om' ? 'Caaffata Qulqulluu' : 'Scripture';
  return `${text}\n\n${label}: ${scripture}`;
}

function parsePrayerJson(raw: string, fallback: ReturnType<typeof fallbackPrayer>) {
  const match = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!String(parsed?.title || '').trim() || !String(parsed?.text || '').trim()) return null;
    return {
      title: String(parsed.title).trim().slice(0, 180),
      text: String(parsed.text).trim().slice(0, 700),
      scripture: String(parsed.scripture || fallback.scripture).trim().slice(0, 120),
      generationSource: 'ai' as const,
    };
  } catch {
    return null;
  }
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
  const fallbackResult = { ...fallback, generationSource: 'fallback' as const };
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return fallbackResult;

  const languageInstruction = input.language === 'am'
    ? 'Write in natural modern Amharic.'
    : input.language === 'om'
      ? 'Write in natural Afaan Oromo.'
      : 'Write in clear natural English.';

  try {
    const prompt = `You write short, warm, biblically grounded prayers for Christian couples.
${languageInstruction}
Use both the plan title and description as the prayer topic.
Write 25-45 words, ending naturally with Amen. Do not promise an outcome or claim to speak for God.
Return JSON only: {"title":"...","text":"...","scripture":"Bible reference only"}.

Calendar type: ${input.type}
Plan title: ${input.title}
Plan description: ${input.description || 'No description provided'}
Life area: ${input.category}`;
    const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.55,
                maxOutputTokens: 240,
                responseMimeType: 'application/json',
              },
            }),
            signal: AbortSignal.timeout(8_000),
          },
        );
        if (!response.ok) continue;
        const data = await response.json();
        const raw = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || '';
        const generated = parsePrayerJson(raw, fallback);
        if (generated) return generated;
      } catch (modelError) {
        console.warn(`[Couple Calendar] Gemini prayer model ${model} failed:`, modelError);
      }
    }
    return fallbackResult;
  } catch (error) {
    console.warn('[Couple Calendar] AI prayer fallback used:', error);
    return fallbackResult;
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

app.get('/calendar/activity', async (c) => {
  try {
    const userId = await userIdFromRequest(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const profile: any = await kv.get(`user:${userId}`).catch(() => null);
    const partnerId = profile?.partnerId ? String(profile.partnerId) : null;
    const owners = [{ id: userId, isPartner: false }, ...(partnerId ? [{ id: partnerId, isPartner: true }] : [])];

    const ownerData = await Promise.all(owners.map(async owner => {
      const [prayers, completions, legacyResponses, currentResponses, journals, moods, highlights] = await Promise.all([
        kv.getByPrefix(`prayer:${owner.id}:`).catch(() => []),
        kv.getByPrefix(`completion:${owner.id}:`).catch(() => []),
        kv.getByPrefix(`response:${owner.id}:`).catch(() => []),
        kv.getByPrefix(`question-response:${owner.id}:`).catch(() => []),
        kv.getByPrefix(`journal:${owner.id}:`).catch(() => []),
        kv.getByPrefix(`mood:${owner.id}:`).catch(() => []),
        kv.getByPrefix(`highlight:${owner.id}:`).catch(() => []),
      ]);
      return { owner, prayers, completions, legacyResponses, currentResponses, journals, moods, highlights } as any;
    }));

    const activities: any[] = [];
    const add = (activity: any) => {
      const date = new Date(activity.date);
      if (!activity.id || !Number.isFinite(date.getTime())) return;
      activities.push({ ...activity, date: date.toISOString() });
    };

    for (const data of ownerData) {
      const common = { userId: data.owner.id, isPartner: data.owner.isPartner };
      for (const prayer of data.prayers) add({
        ...common, id: `prayer-${prayer.id}`, sourceId: prayer.id, type: 'prayer', emoji: '🙏',
        title: prayer.title || 'Prayer', description: prayer.description || '', date: prayer.createdAt || prayer.created_at,
      });
      for (const prayer of data.prayers) {
        if (!prayer.youPrayed && !prayer.partnerPrayed && !prayer.you_prayed && !prayer.partner_prayed) continue;
        add({
          ...common, id: `prayer-prayed-${prayer.id}`, sourceId: prayer.id, type: 'prayer', emoji: '🙌',
          title: prayer.title || 'Prayer', description: prayer.description || '',
          date: prayer.updatedAt || prayer.updated_at || prayer.createdAt || prayer.created_at,
        });
      }
      for (const completion of data.completions) add({
        ...common, id: `devotional-${completion.id || `${completion.devotionId}-${completion.completedAt}`}`,
        sourceId: completion.devotionId, type: 'devotional', emoji: '📖', title: 'Devotional completed',
        description: completion.notes || '', date: completion.completedAt || completion.completed_at,
      });
      const responseKeys = new Set<string>();
      for (const response of [...data.currentResponses, ...data.legacyResponses]) {
        if (data.owner.isPartner && (response.isPrivate || response.is_private)) continue;
        const responseKey = `${data.owner.id}:${response.questionId || response.question_id}:${response.createdAt || response.created_at}`;
        if (responseKeys.has(responseKey)) continue;
        responseKeys.add(responseKey);
        add({
          ...common, id: `qa-${response.id || responseKey}`, sourceId: response.questionId || response.question_id,
          type: 'qa', emoji: '💬', title: 'Question answered', description: '', date: response.createdAt || response.created_at,
        });
      }
      for (const journal of data.journals) {
        if (data.owner.isPartner && !journal.isShared && !journal.is_shared) continue;
        add({
          ...common, id: `journal-${journal.id}`, sourceId: journal.id, type: 'journal', emoji: journal.emoji || '✍️',
          title: journal.title || 'Journal reflection', description: journal.content || '', date: journal.createdAt || journal.created_at,
        });
      }
      for (const mood of data.moods) add({
        ...common, id: `mood-${mood.id}`, sourceId: mood.id, type: 'mood',
        emoji: mood.mood === 'great' ? '🤩' : mood.mood === 'good' ? '😊' : mood.mood === 'sad' ? '😔' : '🙂',
        title: mood.mood || 'Mood check-in', description: mood.note || '', date: mood.createdAt || mood.created_at,
      });
      for (const highlight of data.highlights) {
        if (!highlight.sharedById && !highlight.shared_by_id) continue;
        const sharedById = String(highlight.sharedById || highlight.shared_by_id);
        add({
          ...common, isPartner: sharedById !== userId, id: `verse-${highlight.id}`, sourceId: highlight.id, type: 'verse', emoji: '📜',
          title: highlight.reference || 'Shared verse', description: highlight.text || highlight.note || '', date: highlight.createdAt || highlight.created_at,
        });
      }
    }

    const relationshipStart = profile?.relationshipStart || profile?.relationship_start || profile?.createdAt;
    if (relationshipStart && Number.isFinite(new Date(relationshipStart).getTime())) {
      const stageStarts = [0, 90, 180, 250, 360];
      const stageEmojis = ['🌱', '🌿', '💞', '🤝', '👑'];
      const start = new Date(relationshipStart);
      stageStarts.forEach((days, stageIndex) => {
        const date = new Date(start.getTime() + days * 86_400_000);
        if (date.getTime() <= Date.now()) add({
          id: `stage-${stageIndex}`, userId, isPartner: false, type: 'stage', stageIndex,
          emoji: stageEmojis[stageIndex], title: `Couple stage ${stageIndex + 1}`, description: '', date: date.toISOString(),
        });
      });
    }

    const unique = Array.from(new Map(activities.map(activity => [activity.id, activity])).values())
      .sort((left: any, right: any) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 1000);
    return c.json({ activities: unique });
  } catch (error) {
    console.error('[Couple Calendar] Activity load error:', error);
    return c.json({ error: 'Failed to load couple activity' }, 500);
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
    const profile: any = await kv.get(`user:${userId}`).catch(() => null);
    // The saved app preference is authoritative. The request language supports
    // newly created/legacy profiles whose preference has not synced yet.
    const language = resolveLanguage(profile?.language || body.language);
    const now = new Date().toISOString();
    const itemId = generateId('cal');
    const createPrayer = body.createPrayer !== false;
    const generated = createPrayer
      ? await generatePrayer({ title, description: String(body.description || ''), type, category, language })
      : null;
    const prayerId = generated ? generateId('prayer') : null;

    const item = {
      id: itemId, userId, title, description: String(body.description || '').slice(0, 2000),
      type, category, emoji: String(body.emoji || '💕').slice(0, 16), startsAt: startsAt.toISOString(),
      endsAt: body.endsAt && Number.isFinite(new Date(body.endsAt).getTime()) ? new Date(body.endsAt).toISOString() : null,
      allDay: Boolean(body.allDay), recurrence,
      reminderMinutes: body.reminderMinutes == null
        ? null
        : Number.isFinite(Number(body.reminderMinutes))
          ? Math.max(0, Math.min(43_200, Number(body.reminderMinutes)))
          : null,
      location: String(body.location || '').slice(0, 240), status: 'upcoming', createPrayer,
      prayerId, prayerTitle: generated?.title, prayerText: generated?.text, scripture: generated?.scripture,
      prayerLanguage: generated ? language : undefined, prayerGenerationSource: generated?.generationSource,
      createdAt: now, updatedAt: now,
    };

    let prayer = null;
    if (generated && prayerId) {
      prayer = {
        id: prayerId, userId, title: generated.title,
        description: prayerDescription(generated.text, generated.scripture, language),
        category: category === 'faith' ? 'Spiritual Growth' : category === 'relationship' ? 'Relationship' : 'Guidance',
        reminderDate: startsAt.toISOString(), isSharedWithCommunity: false, isShared: false,
        isAnswered: false, youPrayed: false, partnerPrayed: false, prayerCount: 0,
        source: 'couple-calendar', sourcePlanId: itemId, scripture: generated.scripture,
        language, generationSource: generated.generationSource,
        createdAt: now, updatedAt: now,
      };
    }

    const cacheBase = profile?.coupleId || (profile?.partnerId && profile.partnerId < userId ? profile.partnerId : userId);
    await Promise.all([
      kv.set(`calendar:${userId}:${itemId}`, item),
      prayer ? kv.set(`prayer:${userId}:${prayerId}`, prayer) : Promise.resolve(),
      prayer ? kv.del(`marriage-readiness:v2:${cacheBase}`).catch(() => undefined) : Promise.resolve(),
      profile ? kv.set(`user:${userId}`, { ...profile, updatedAt: now }) : Promise.resolve(),
    ]);
    return c.json({ success: true, item, prayer }, 201);
  } catch (error) {
    console.error('[Couple Calendar] Create error:', error);
    return c.json({ error: 'Failed to create calendar item' }, 500);
  }
});

// Owner-only backfill for calendar prayers created before Gemini generation
// was wired to the app's configured AI provider.
app.post('/calendar/:id/regenerate-prayer', async (c) => {
  try {
    const userId = await userIdFromRequest(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const resolved = await resolveOwnedItem(userId, c.req.param('id'));
    if (!resolved) return c.json({ error: 'Calendar item not found' }, 404);
    if (resolved.ownerId !== userId) return c.json({ error: 'Only the creator can regenerate this prayer' }, 403);
    if (!resolved.item.prayerId) return c.json({ error: 'This calendar item has no linked prayer' }, 400);

    const profile: any = await kv.get(`user:${userId}`).catch(() => null);
    const language = resolveLanguage(profile?.language || resolved.item.prayerLanguage);
    const category = (['faith', 'relationship', 'family', 'health', 'finance', 'service', 'other'].includes(resolved.item.category)
      ? resolved.item.category
      : 'other') as CalendarCategory;
    const generated = await generatePrayer({
      title: String(resolved.item.title || '').trim(),
      description: String(resolved.item.description || ''),
      type: String(resolved.item.type || 'plan'),
      category,
      language,
    });

    // Preserve the existing linked records when AI is unavailable; the client
    // can safely retry on the next calendar visit.
    if (generated.generationSource !== 'ai') {
      return c.json({ error: 'AI prayer generation is temporarily unavailable', retryable: true }, 503);
    }

    const now = new Date().toISOString();
    const prayerKey = `prayer:${userId}:${resolved.item.prayerId}`;
    const currentPrayer: any = await kv.get(prayerKey).catch(() => null);
    const updatedItem = {
      ...resolved.item,
      prayerTitle: generated.title,
      prayerText: generated.text,
      scripture: generated.scripture,
      prayerLanguage: language,
      prayerGenerationSource: 'ai',
      updatedAt: now,
    };
    const updatedPrayer = {
      ...(currentPrayer || {}),
      id: resolved.item.prayerId,
      userId,
      title: generated.title,
      description: prayerDescription(generated.text, generated.scripture, language),
      scripture: generated.scripture,
      language,
      generationSource: 'ai',
      source: 'couple-calendar',
      sourcePlanId: resolved.item.id,
      updatedAt: now,
    };
    const cacheBase = profile?.coupleId || (profile?.partnerId && profile.partnerId < userId ? profile.partnerId : userId);
    await Promise.all([
      kv.set(resolved.key, updatedItem),
      kv.set(prayerKey, updatedPrayer),
      kv.del(`marriage-readiness:v2:${cacheBase}`).catch(() => undefined),
      profile ? kv.set(`user:${userId}`, { ...profile, updatedAt: now }) : Promise.resolve(),
    ]);

    return c.json({ success: true, item: updatedItem, prayer: updatedPrayer });
  } catch (error) {
    console.error('[Couple Calendar] Prayer regeneration error:', error);
    return c.json({ error: 'Failed to regenerate calendar prayer' }, 500);
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
    const allowedUpdates = ['title', 'description', 'emoji', 'startsAt', 'endsAt', 'allDay', 'recurrence', 'reminderMinutes', 'location', 'status'];
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
