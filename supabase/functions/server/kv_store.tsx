// Compatibility API over relational domain tables. Callers retain the small
// key-based interface while all persistence is routed to designated tables.
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const client = () => createClient(
  Deno.env.get("SUPABASE_URL") ?? '',
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '',
);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalIso(value: unknown): string | null {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function coreDomain(key: string): 'profile' | 'couple' | 'journal' | 'prayer' | 'mood' | 'web_push' | null {
  if (/^user:[0-9a-f-]{36}$/i.test(key)) return 'profile';
  if (key.startsWith('couple:') && !key.startsWith('couple-chat:')) return 'couple';
  if (key.startsWith('journal:')) return 'journal';
  if (key.startsWith('prayer:') && !key.startsWith('prayer-chat:')) return 'prayer';
  if (key.startsWith('mood:') && !key.startsWith('mood-analysis')) return 'mood';
  if (/^push_subscription:[0-9a-f-]{36}$/i.test(key)) return 'web_push';
  return null;
}

type CoreDomain = NonNullable<ReturnType<typeof coreDomain>>;

const CORE_TABLES: Record<CoreDomain, string> = {
  profile: 'user_profiles',
  couple: 'couples',
  journal: 'journal_entries',
  prayer: 'prayer_requests',
  mood: 'mood_entries',
  web_push: 'web_push_subscriptions',
};

function corePrefixDomain(prefix: string): CoreDomain | null {
  if (prefix === 'user:') return 'profile';
  if (prefix === 'couple:') return 'couple';
  if (prefix === 'journal:' || /^journal:[0-9a-f-]{36}:$/i.test(prefix)) return 'journal';
  if (prefix === 'prayer:' || /^prayer:[0-9a-f-]{36}:$/i.test(prefix)) return 'prayer';
  if (prefix === 'mood:' || /^mood:[0-9a-f-]{36}:$/i.test(prefix)) return 'mood';
  if (prefix === 'push_subscription:') return 'web_push';
  return null;
}

async function getCorePayload(key: string): Promise<{ handled: boolean; value?: any }> {
  const domain = coreDomain(key);
  if (!domain) return { handled: false };

  const { data, error } = await client()
    .from(CORE_TABLES[domain])
    .select('kv_payload')
    .eq('source_key', key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.kv_payload) return { handled: true, value: undefined };
  return { handled: true, value: data.kv_payload };
}

async function getCorePayloadsByPrefix(
  prefix: string,
  limit: number,
): Promise<{ handled: boolean; values?: any[] }> {
  const domain = corePrefixDomain(prefix);
  if (!domain) return { handled: false };

  const { data, error } = await client()
    .from(CORE_TABLES[domain])
    .select('kv_payload')
    .like('source_key', `${prefix}%`)
    .limit(limit);
  if (error) throw new Error(error.message);
  return { handled: true, values: data?.map((row) => row.kv_payload) ?? [] };
}

async function getDesignatedPayload(key: string): Promise<{ handled: boolean; value?: any }> {
  if (coreDomain(key)) return { handled: false };
  const { data, error } = await client()
    .from('app_records')
    .select('payload')
    .eq('source_key', key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { handled: true, value: undefined };
  return { handled: true, value: data.payload };
}

async function getDesignatedPayloadsByPrefix(
  prefix: string,
  limit: number,
): Promise<{ handled: boolean; values?: any[] }> {
  if (corePrefixDomain(prefix)) return { handled: false };
  const { data, error } = await client()
    .from('app_records')
    .select('payload')
    .like('source_key', `${prefix}%`)
    .limit(limit);
  if (error) throw new Error(error.message);
  return { handled: true, values: data?.map((row) => row.payload) ?? [] };
}

async function mirrorCoreSet(key: string, value: any, required = false): Promise<void> {
  if (!value || typeof value !== 'object') {
    if (required) throw new Error(`Core payload must be an object for ${key}`);
    return;
  }
  if (!required && Deno.env.get('RELATIONAL_SHADOW_WRITES') === 'false') return;
  const domain = coreDomain(key);
  if (!domain) return;
  const supabase = client();

  try {
    if (domain === 'profile') {
      const id = String(value.id || key.slice('user:'.length));
      if (!UUID_PATTERN.test(id)) {
        if (required) throw new Error(`Invalid profile identifier for ${key}`);
        return;
      }
      const base = {
        id,
        full_name: String(value.name || value.full_name || value.email?.split('@')?.[0] || 'User'),
        email: value.email || null,
        phone_number: value.phone || null,
        phone: value.phone || null,
        preferred_language: value.language || 'en',
        location_uae: value.location || null,
        location: value.location || null,
        avatar_url: value.profilePicture || null,
        cover_url: value.coverPicture || null,
        bio: value.bio || null,
        relationship_started_at: optionalIso(value.relationshipStart),
        invite_code: value.inviteCode || null,
        source_key: key,
        kv_payload: value,
        created_at: optionalIso(value.createdAt) || new Date().toISOString(),
        updated_at: optionalIso(value.updatedAt) || new Date().toISOString(),
      };
      const { error } = await supabase.from('user_profiles').upsert(base, { onConflict: 'id' });
      if (error) throw error;
      const relationships: Record<string, string | null> = {};
      if (value.partnerId === null || UUID_PATTERN.test(String(value.partnerId || ''))) relationships.partner_id = value.partnerId || null;
      if (value.coupleId === null || typeof value.coupleId === 'string') relationships.couple_id = value.coupleId || null;
      if (Object.keys(relationships).length) {
        const { error: relationError } = await supabase.from('user_profiles').update(relationships).eq('id', id);
        if (relationError) console.warn('[Relational Write] Profile relationship update deferred:', relationError.message);
      }
      return;
    }

    if (domain === 'couple') {
      const id = String(value.id || key.slice('couple:'.length));
      const partner1Id = String(value.partner1Id || '');
      const partner2Id = value.partner2Id ? String(value.partner2Id) : null;
      if (!id || !UUID_PATTERN.test(partner1Id) || (partner2Id && !UUID_PATTERN.test(partner2Id))) {
        if (required) throw new Error(`Invalid couple payload for ${key}`);
        return;
      }
      const { data: existing } = await supabase.from('couples').select('couple_code').eq('id', id).maybeSingle();
      const row = {
        id,
        couple_code: existing?.couple_code || value.coupleCode || value.inviteCode || `KV-${id}`,
        partner1_id: partner1Id,
        partner2_id: partner2Id,
        relationship_status: partner2Id ? 'connected' : 'single',
        anniversary_date: optionalIso(value.relationshipStartDate)?.slice(0, 10) || null,
        relationship_started_at: optionalIso(value.relationshipStartDate),
        source_key: key,
        kv_payload: value,
        created_at: optionalIso(value.createdAt) || new Date().toISOString(),
        updated_at: optionalIso(value.updatedAt) || new Date().toISOString(),
      };
      const { error } = await supabase.from('couples').upsert(row, { onConflict: 'id' });
      if (error) throw error;
      await supabase.from('couple_members').delete().eq('couple_id', id);
      const members = [
        { couple_id: id, user_id: partner1Id, member_role: 'partner1', joined_at: row.created_at },
        ...(partner2Id ? [{ couple_id: id, user_id: partner2Id, member_role: 'partner2', joined_at: row.created_at }] : []),
      ];
      const { error: memberError } = await supabase.from('couple_members').upsert(members, { onConflict: 'user_id' });
      if (memberError) throw memberError;
      return;
    }

    if (domain === 'journal') {
      const id = String(value.id || key.split(':').at(-1) || '');
      const authorId = String(value.userId || key.split(':')[1] || '');
      if (!id || !UUID_PATTERN.test(authorId)) {
        if (required) throw new Error(`Invalid journal payload for ${key}`);
        return;
      }
      const createdAt = optionalIso(value.createdAt) || new Date().toISOString();
      const { error } = await supabase.from('journal_entries').upsert({
        id, source_key: key, author_id: authorId,
        title: value.title || 'Journal entry', content: value.content || '',
        entry_date: createdAt.slice(0, 10), is_shared: Boolean(value.isShared),
        mood: value.mood || null, entry_type: value.entryType || 'journal',
        location: value.location || null, emoji: value.emoji || null,
        media_files: value.mediaFiles || null, comments: value.comments || null,
        kv_payload: value, created_at: createdAt,
        updated_at: optionalIso(value.updatedAt) || createdAt,
      }, { onConflict: 'id' });
      if (error) throw error;
      return;
    }

    if (domain === 'prayer') {
      const id = String(value.id || key.split(':').at(-1) || '');
      const ownerId = String(value.userId || key.split(':')[1] || '');
      if (!id || !UUID_PATTERN.test(ownerId)) {
        if (required) throw new Error(`Invalid prayer payload for ${key}`);
        return;
      }
      const createdAt = optionalIso(value.createdAt) || new Date().toISOString();
      const sharedWithPartner = value.isSharedWithPartner ?? value.isShared ?? true;
      const { error } = await supabase.from('prayer_requests').upsert({
        id, source_key: key, requested_by: ownerId,
        title: value.title || 'Prayer', description: value.description || '',
        is_answered: Boolean(value.isAnswered), answered_at: optionalIso(value.answeredAt),
        prayer_category: value.category || 'General', is_private: !sharedWithPartner,
        is_shared: value.isShared ?? true, is_shared_with_partner: sharedWithPartner,
        is_surprise: Boolean(value.isSurprise), unlock_at: optionalIso(value.unlockAt),
        reminder_at: optionalIso(value.reminderDate), you_prayed: Boolean(value.youPrayed),
        partner_prayed: Boolean(value.partnerPrayed), prayer_count: Number(value.prayerCount) || 0,
        scripture: value.scripture || null, language: value.language || null,
        generation_source: value.generationSource || null, source_type: value.source || null,
        source_plan_id: value.sourcePlanId || null, kv_payload: value,
        created_at: createdAt, updated_at: optionalIso(value.updatedAt) || createdAt,
      }, { onConflict: 'id' });
      if (error) throw error;
      return;
    }

    if (domain === 'mood') {
      const id = String(value.id || key.split(':').at(-1) || '');
      const userId = String(value.userId || key.split(':')[1] || '');
      if (!id || !UUID_PATTERN.test(userId) || !['great', 'good', 'okay', 'sad'].includes(value.mood)) {
        if (required) throw new Error(`Invalid mood payload for ${key}`);
        return;
      }
      const { error } = await supabase.from('mood_entries').upsert({
        id, source_key: key, user_id: userId, mood: value.mood,
        note: value.note || '', created_at: optionalIso(value.createdAt) || new Date().toISOString(),
        kv_payload: value,
      }, { onConflict: 'id' });
      if (error) throw error;
      return;
    }

    const userId = key.slice('push_subscription:'.length);
    if (!UUID_PATTERN.test(userId) || !value.endpoint) {
      if (required) throw new Error(`Invalid web push payload for ${key}`);
      return;
    }
    const { error } = await supabase.from('web_push_subscriptions').upsert({
      source_key: key, user_id: userId, endpoint: value.endpoint,
      expiration_time: optionalIso(value.expirationTime),
      p256dh: value.keys?.p256dh || null, auth: value.keys?.auth || null,
      kv_payload: value, updated_at: new Date().toISOString(),
    }, { onConflict: 'source_key' });
    if (error) throw error;
  } catch (error: any) {
    if (required) throw error;
    console.warn(`[Relational Write] ${domain} write failed for ${key}:`, error?.message || error);
  }
}

async function mirrorCoreDelete(key: string, required = false): Promise<void> {
  if (!required && Deno.env.get('RELATIONAL_SHADOW_WRITES') === 'false') return;
  const domain = coreDomain(key);
  if (!domain) return;
  const { error } = await client().from(CORE_TABLES[domain]).delete().eq('source_key', key);
  if (error) {
    if (required) throw error;
    console.warn(`[Relational Write] ${domain} delete failed for ${key}:`, error.message);
  }
}

// Store a payload in its core table or designated domain partition.
export const set = async (key: string, value: any): Promise<void> => {
  if (coreDomain(key)) {
    await mirrorCoreSet(key, value, true);
  } else {
    const { error } = await client().rpc('upsert_designated_record', { p_key: key, p_payload: value });
    if (error) throw new Error(error.message);
  }
};

// Retrieve a payload from its designated relational table.
export const get = async (key: string): Promise<any> => {
  const relational = await getCorePayload(key);
  if (relational.handled) return relational.value;
  const designated = await getDesignatedPayload(key);
  if (designated.handled) return designated.value;
  return undefined;
};

// Delete a payload from its designated relational table.
export const del = async (key: string): Promise<void> => {
  if (coreDomain(key)) {
    await mirrorCoreDelete(key, true);
  } else {
    const { error } = await client().rpc('delete_designated_record', { p_key: key });
    if (error) throw new Error(error.message);
  }
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  await Promise.all(keys.map((key, index) => set(key, values[index])));
};

export const mget = async (keys: string[]): Promise<any[]> => Promise.all(keys.map(get));

export const mdel = async (keys: string[]): Promise<void> => {
  await Promise.all(keys.map(del));
};

const MAX_PREFIX_RESULTS = 1000;

// Prefix scans are explicitly bounded to PostgREST's maximum page size.
export const getByPrefix = async (prefix: string, limit = MAX_PREFIX_RESULTS): Promise<any[]> => {
  const boundedLimit = Math.max(1, Math.min(MAX_PREFIX_RESULTS, Math.floor(limit)));
  const relational = await getCorePayloadsByPrefix(prefix, boundedLimit);
  if (relational.handled) return relational.values ?? [];
  const designated = await getDesignatedPayloadsByPrefix(prefix, boundedLimit);
  if (designated.handled) return designated.values ?? [];
  return [];
};

type TimestampField = "createdAt" | "timestamp" | "startsAt" | "completedAt";

export type PrefixPageOptions = {
  limit?: number;
  before?: string;
  after?: string;
  timestampField?: TimestampField;
  ascending?: boolean;
};

// Database-level cursor pagination for timestamped records. Fetch one extra
// row so routes can expose whether another page exists without a count query.
export const getByPrefixPage = async (
  prefix: string,
  options: PrefixPageOptions = {},
): Promise<{ items: any[]; hasMore: boolean }> => {
  const limit = Math.max(1, Math.min(200, Math.floor(options.limit ?? 50)));
  const field = options.timestampField ?? "createdAt";
  const domain = corePrefixDomain(prefix);
  if (domain && field === 'createdAt') {
    let relationalQuery = client()
      .from(CORE_TABLES[domain])
      .select('kv_payload, created_at')
      .like('source_key', `${prefix}%`)
      .order('created_at', { ascending: options.ascending ?? false })
      .limit(limit + 1);
    if (options.before) relationalQuery = relationalQuery.lt('created_at', options.before);
    if (options.after) relationalQuery = relationalQuery.gt('created_at', options.after);
    const { data, error } = await relationalQuery;
    if (error) throw new Error(error.message);
    const values = data?.map((row) => row.kv_payload) ?? [];
    return { items: values.slice(0, limit), hasMore: values.length > limit };
  }
  if (!domain) {
    let designatedQuery = client()
      .from('app_records')
      .select('payload, created_at')
      .like('source_key', `${prefix}%`)
      .order('created_at', { ascending: options.ascending ?? false })
      .limit(limit + 1);
    if (options.before) designatedQuery = designatedQuery.lt('created_at', options.before);
    if (options.after) designatedQuery = designatedQuery.gt('created_at', options.after);
    const { data, error } = await designatedQuery;
    if (error) throw new Error(error.message);
    const values = data?.map((row) => row.payload) ?? [];
    return { items: values.slice(0, limit), hasMore: values.length > limit };
  }
  return { items: [], hasMore: false };
};

// Administrative and scheduled operations that must traverse every matching
// key do so in bounded pages. maxRecords is a final guard against runaway work.
export const getAllByPrefix = async (
  prefix: string,
  maxRecords = 10_000,
  pageSize = 500,
): Promise<any[]> => {
  const boundedPageSize = Math.max(1, Math.min(MAX_PREFIX_RESULTS, Math.floor(pageSize)));
  const boundedMax = Math.max(1, Math.min(50_000, Math.floor(maxRecords)));
  const domain = corePrefixDomain(prefix);
  const table = domain ? CORE_TABLES[domain] : 'app_records';
  const payloadColumn = domain ? 'kv_payload' : 'payload';
  const values: any[] = [];
  let offset = 0;

  while (values.length < boundedMax) {
    const requested = Math.min(boundedPageSize, boundedMax - values.length);
    const { data, error } = await client()
      .from(table)
      .select(`${payloadColumn}, source_key`)
      .like('source_key', `${prefix}%`)
      .order('source_key', { ascending: true })
      .range(offset, offset + requested - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    values.push(...data.map((row: any) => row[payloadColumn]));
    if (data.length < requested) break;
    offset += data.length;
  }

  return values;
};

// Fetch time-stamped designated records without reading the full history.
export const getByPrefixSince = async (
  prefix: string,
  createdAt: string,
  limit = 5000,
): Promise<any[]> => {
  const boundedLimit = Math.max(1, Math.min(10_000, Math.floor(limit)));
  const domain = corePrefixDomain(prefix);
  const table = domain ? CORE_TABLES[domain] : 'app_records';
  const payloadColumn = domain ? 'kv_payload' : 'payload';
  const { data, error } = await client()
    .from(table)
    .select(payloadColumn)
    .like('source_key', `${prefix}%`)
    .gte('created_at', createdAt)
    .order('created_at', { ascending: false })
    .limit(boundedLimit);
  if (error) throw new Error(error.message);
  return data?.map((row: any) => row[payloadColumn]) ?? [];
};
