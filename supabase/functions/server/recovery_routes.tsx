import type { Hono } from 'npm:hono@4.6.14';
import * as kv from './kv_store.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import { getSupabase, isAdminUser, getUserFromToken, logAudit } from './auth_helpers.tsx';

// Returns both key and value — kv.getByPrefix drops the key, which breaks migration
async function getByPrefixWithKeys(prefix: string): Promise<{ key: string; value: any }[]> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data, error } = await supabase
    .from('kv_store_6d579fee')
    .select('key, value')
    .like('key', prefix + '%');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function setupRecoveryRoutes(app: Hono<any>) {

  // ── Scan couple history ──────────────────────────────────────────────────────
  app.post('/make-server-6d579fee/admin/scan-couple-history', async (c) => {
    try {
      const adminUserId = await getUserFromToken(c.req.header('Authorization'));
      if (!adminUserId) return c.json({ error: 'Unauthorized' }, 401);
      if (!(await isAdminUser(adminUserId))) return c.json({ error: 'Forbidden' }, 403);

      const body = await c.req.json().catch(() => ({}));
      const targetUserId = body.targetUserId ?? null;
      const supabase = getSupabase();

      const allCouples: any[] = await kv.getByPrefix('couple:');
      const allProfiles: any[] = await kv.getByPrefix('user:');
      const profileMap: Record<string, any> = {};
      for (const p of allProfiles) { if (p?.id) profileMap[p.id] = p; }

      const authCache: Record<string, boolean> = {};
      const checkAuth = async (uid: string): Promise<boolean> => {
        if (uid in authCache) return authCache[uid];
        try {
          const { data } = await supabase.auth.admin.getUserById(uid);
          authCache[uid] = !!data?.user;
        } catch { authCache[uid] = false; }
        return authCache[uid];
      };

      const orphanedPartnerRefs: any[] = [];
      for (const profile of allProfiles) {
        if (!profile?.partnerId) continue;
        const partnerAuthExists = await checkAuth(profile.partnerId);
        if (!partnerAuthExists) {
          if (targetUserId && profile.id !== targetUserId && profile.partnerId !== targetUserId) continue;
          orphanedPartnerRefs.push({
            liveUser: { userId: profile.id, name: profile.name, email: profile.email },
            orphanedUserId: profile.partnerId,
            coupleId: profile.coupleId || null,
            orphanedProfile: profileMap[profile.partnerId] || null,
          });
        }
      }

      const results: any[] = [];
      for (const couple of allCouples) {
        const p1 = couple.partner1Id;
        const p2 = couple.partner2Id;
        if (!p1 || !p2) continue;
        if (targetUserId && p1 !== targetUserId && p2 !== targetUserId) continue;

        const [p1Auth, p2Auth] = await Promise.all([checkAuth(p1), checkAuth(p2)]);
        if (p1Auth && p2Auth) continue;

        const orphanedId = !p1Auth ? p1 : p2;
        const liveId = !p1Auth ? p2 : p1;

        const [prayers, journals, moods, milestones, responses, completions] = await Promise.all([
          kv.getByPrefix(`prayer:${orphanedId}:`),
          kv.getByPrefix(`journal:${orphanedId}:`),
          kv.getByPrefix(`mood:${orphanedId}:`),
          kv.getByPrefix(`milestone:${orphanedId}:`),
          kv.getByPrefix(`response:${orphanedId}:`),
          kv.getByPrefix(`completion:${orphanedId}:`),
        ]);

        results.push({
          coupleId: couple.id,
          coupleCreatedAt: couple.createdAt || couple.linkedAt || null,
          orphanedUserId: orphanedId,
          orphanedProfile: profileMap[orphanedId]
            ? { name: profileMap[orphanedId].name, email: profileMap[orphanedId].email, createdAt: profileMap[orphanedId].createdAt }
            : null,
          liveUserId: liveId,
          liveProfile: profileMap[liveId]
            ? { name: profileMap[liveId].name, email: profileMap[liveId].email }
            : null,
          dataCounts: {
            prayers: prayers.length, journals: journals.length, moods: moods.length,
            milestones: milestones.length, questionResponses: responses.length, devotionalCompletions: completions.length,
          },
        });
      }

      return c.json({
        coupleRecordsScanned: allCouples.length,
        orphanedCouplesFound: results.length,
        orphanedPartnerRefsFound: orphanedPartnerRefs.length,
        couples: results,
        orphanedPartnerRefs,
      });
    } catch (error: any) {
      console.error('[scan-couple-history]', error.message);
      return c.json({ error: error.message }, 500);
    }
  });

  // ── Find user ID from audit log ──────────────────────────────────────────────
  app.post('/make-server-6d579fee/admin/find-user-id-from-audit', async (c) => {
    try {
      const adminUserId = await getUserFromToken(c.req.header('Authorization'));
      if (!adminUserId) return c.json({ error: 'Unauthorized' }, 401);
      if (!(await isAdminUser(adminUserId))) return c.json({ error: 'Forbidden' }, 403);

      const { email, prayerId, journalId } = await c.req.json();
      if (!email && !prayerId && !journalId) {
        return c.json({ error: 'Provide at least one of: email, prayerId, journalId' }, 400);
      }

      const allEntries: any[] = await kv.getByPrefix('auditlog:');
      const matches = allEntries.filter((e: any) => {
        if (!e?.userId) return false;
        if (email && e.userEmail?.toLowerCase() === email.toLowerCase()) return true;
        if (prayerId && e.metadata?.prayerId === prayerId) return true;
        if (journalId && e.metadata?.journalId === journalId) return true;
        return false;
      }).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (matches.length === 0) {
        return c.json({ found: false, message: 'No audit log entries matched.' });
      }

      const byUserId: Record<string, any> = {};
      for (const entry of matches) {
        if (!byUserId[entry.userId]) {
          byUserId[entry.userId] = { userId: entry.userId, userEmail: entry.userEmail, userName: entry.userName, events: [] };
        }
        byUserId[entry.userId].events.push({ event: entry.event, timestamp: entry.timestamp, metadata: entry.metadata });
      }

      const supabase = getSupabase();
      const results = await Promise.all(Object.values(byUserId).map(async (group: any) => {
        const uid = group.userId;
        const profile: any = await kv.get(`user:${uid}`);
        const [prayers, journals, moods, milestones] = await Promise.all([
          kv.getByPrefix(`prayer:${uid}:`),
          kv.getByPrefix(`journal:${uid}:`),
          kv.getByPrefix(`mood:${uid}:`),
          kv.getByPrefix(`milestone:${uid}:`),
        ]);
        let authExists = false;
        try { const { data } = await supabase.auth.admin.getUserById(uid); authExists = !!data?.user; } catch { /**/ }
        return {
          userId: uid,
          userName: group.userName,
          userEmail: group.userEmail,
          auditEventCount: group.events.length,
          recentEvents: group.events.slice(0, 5),
          authExists,
          hasKVProfile: !!profile,
          dataCounts: { prayers: prayers.length, journals: journals.length, moods: moods.length, milestones: milestones.length },
        };
      }));

      return c.json({ found: true, results });
    } catch (error: any) {
      console.error('[find-user-id-from-audit]', error.message);
      return c.json({ error: error.message }, 500);
    }
  });

  // ── Find old user by partner link ────────────────────────────────────────────
  app.post('/make-server-6d579fee/admin/find-old-user-by-partner-link', async (c) => {
    try {
      const adminUserId = await getUserFromToken(c.req.header('Authorization'));
      if (!adminUserId) return c.json({ error: 'Unauthorized' }, 401);
      if (!(await isAdminUser(adminUserId))) return c.json({ error: 'Forbidden' }, 403);

      const { newUserId } = await c.req.json();
      if (!newUserId) return c.json({ error: 'newUserId is required' }, 400);

      const supabase = getSupabase();
      const results: any[] = [];
      const allProfiles: any[] = await kv.getByPrefix('user:');

      for (const profile of allProfiles) {
        if (!profile?.partnerId) continue;
        const partnerId = profile.partnerId;
        let partnerAuthExists = false;
        try { const { data } = await supabase.auth.admin.getUserById(partnerId); partnerAuthExists = !!data?.user; } catch { /**/ }
        if (!partnerAuthExists) {
          const oldProfile: any = await kv.get(`user:${partnerId}`);
          const [prayers, journals, moods, milestones] = await Promise.all([
            kv.getByPrefix(`prayer:${partnerId}:`),
            kv.getByPrefix(`journal:${partnerId}:`),
            kv.getByPrefix(`mood:${partnerId}:`),
            kv.getByPrefix(`milestone:${partnerId}:`),
          ]);
          results.push({
            oldUserId: partnerId,
            label: oldProfile ? `${oldProfile.name} — ${oldProfile.email}` : `Partner of ${profile.name}`,
            source: 'partner_reverse_lookup',
            authExists: false,
            dataCounts: { prayers: prayers.length, journals: journals.length, moods: moods.length, milestones: milestones.length },
          });
        }
      }

      const allCouples: any[] = await kv.getByPrefix('couple:');
      for (const couple of allCouples) {
        const ids = [couple.partner1Id, couple.partner2Id].filter(Boolean);
        if (ids.includes(newUserId)) {
          const otherId = ids.find((id: string) => id !== newUserId);
          if (otherId && !results.find(r => r.oldUserId === otherId)) {
            let authExists = false;
            try { const { data } = await supabase.auth.admin.getUserById(otherId); authExists = !!data?.user; } catch { /**/ }
            const otherProfile: any = await kv.get(`user:${otherId}`);
            results.push({
              oldUserId: otherId,
              label: otherProfile ? `${otherProfile.name} — ${otherProfile.email}` : `Couple partner`,
              source: 'couple_record',
              authExists,
              dataCounts: {},
            });
          }
        }
      }

      return c.json({ results });
    } catch (error: any) {
      console.error('[find-old-user-by-partner-link]', error.message);
      return c.json({ error: error.message }, 500);
    }
  });

  // ── Find user by content ID ──────────────────────────────────────────────────
  app.post('/make-server-6d579fee/admin/find-user-by-content-id', async (c) => {
    try {
      const adminUserId = await getUserFromToken(c.req.header('Authorization'));
      if (!adminUserId) return c.json({ error: 'Unauthorized' }, 401);
      if (!(await isAdminUser(adminUserId))) return c.json({ error: 'Forbidden' }, 403);

      const { contentId, contentType } = await c.req.json();
      if (!contentId) return c.json({ error: 'contentId is required' }, 400);

      const prefixes = contentType === 'journal' ? ['journal:']
        : contentType === 'milestone' ? ['milestone:']
        : ['prayer:', 'journal:', 'milestone:', 'mood:'];

      let foundUserId: string | null = null;
      let foundItem: any = null;
      let foundPrefix: string | null = null;

      for (const prefix of prefixes) {
        const items: any[] = await kv.getByPrefix(prefix);
        const match = items.find((item: any) => item?.id === contentId);
        if (match) { foundUserId = match.userId; foundItem = match; foundPrefix = prefix.replace(':', ''); break; }
      }

      if (!foundUserId) return c.json({ found: false, message: `No item found with id "${contentId}"` });

      const profile: any = await kv.get(`user:${foundUserId}`);
      const [prayers, journals, moods, milestones] = await Promise.all([
        kv.getByPrefix(`prayer:${foundUserId}:`),
        kv.getByPrefix(`journal:${foundUserId}:`),
        kv.getByPrefix(`mood:${foundUserId}:`),
        kv.getByPrefix(`milestone:${foundUserId}:`),
      ]);
      let authExists = false;
      try { const supabase = getSupabase(); const { data } = await supabase.auth.admin.getUserById(foundUserId); authExists = !!data?.user; } catch { /**/ }

      return c.json({
        found: true,
        contentType: foundPrefix,
        matchedItem: foundItem,
        account: {
          userId: foundUserId,
          name: profile?.name || '(no profile)',
          email: profile?.email || '(no profile)',
          authExists,
          dataCounts: { prayers: prayers.length, journals: journals.length, moods: moods.length, milestones: milestones.length },
        },
      });
    } catch (error: any) {
      console.error('[find-user-by-content-id]', error.message);
      return c.json({ error: error.message }, 500);
    }
  });

  // ── Find orphaned data by email ──────────────────────────────────────────────
  app.post('/make-server-6d579fee/admin/find-orphaned-data', async (c) => {
    try {
      const adminUserId = await getUserFromToken(c.req.header('Authorization'));
      if (!adminUserId) return c.json({ error: 'Unauthorized' }, 401);
      if (!(await isAdminUser(adminUserId))) return c.json({ error: 'Forbidden' }, 403);

      const { email } = await c.req.json();
      if (!email) return c.json({ error: 'email is required' }, 400);

      const allProfiles: any[] = await kv.getByPrefix('user:');
      const matches = allProfiles.filter((p: any) => p?.email?.toLowerCase() === email.toLowerCase().trim());

      if (matches.length === 0) return c.json({ accounts: [], message: 'No KV profiles found for this email.' });

      const accounts = await Promise.all(matches.map(async (profile: any) => {
        const uid = profile.id;
        const [prayers, journals, moods, milestones, completions, responses, streaks, memory] = await Promise.all([
          kv.getByPrefix(`prayer:${uid}:`),
          kv.getByPrefix(`journal:${uid}:`),
          kv.getByPrefix(`mood:${uid}:`),
          kv.getByPrefix(`milestone:${uid}:`),
          kv.getByPrefix(`completion:${uid}:`),
          kv.getByPrefix(`response:${uid}:`),
          kv.getByPrefix(`streak:${uid}:`),
          kv.getByPrefix(`scripture-progress:${uid}:`),
        ]);
        let authExists = false;
        try { const supabase = getSupabase(); const { data } = await supabase.auth.admin.getUserById(uid); authExists = !!data?.user; } catch { /**/ }
        let partnerName = null;
        if (profile.partnerId) {
          const pp: any = await kv.get(`user:${profile.partnerId}`);
          partnerName = pp?.name || null;
        }
        return {
          userId: uid, name: profile.name, email: profile.email,
          createdAt: profile.createdAt, updatedAt: profile.updatedAt,
          partnerId: profile.partnerId || null, partnerName,
          inviteCode: profile.inviteCode || null, authExists,
          dataCounts: {
            prayers: prayers.length, journals: journals.length, moods: moods.length,
            milestones: milestones.length, devotionalCompletions: completions.length,
            questionResponses: responses.length, streaks: streaks.length, scriptureMemory: memory.length,
          },
        };
      }));

      accounts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return c.json({ accounts });
    } catch (error: any) {
      console.error('[find-orphaned-data]', error.message);
      return c.json({ error: error.message }, 500);
    }
  });

  // ── Migrate user data ────────────────────────────────────────────────────────
  app.post('/make-server-6d579fee/admin/migrate-user-data', async (c) => {
    try {
      const adminUserId = await getUserFromToken(c.req.header('Authorization'));
      if (!adminUserId) return c.json({ error: 'Unauthorized' }, 401);
      if (!(await isAdminUser(adminUserId))) return c.json({ error: 'Forbidden' }, 403);

      const { fromUserId, toUserId } = await c.req.json();
      if (!fromUserId || !toUserId) return c.json({ error: 'fromUserId and toUserId are required' }, 400);
      if (fromUserId === toUserId) return c.json({ error: 'fromUserId and toUserId must be different' }, 400);

      // oldProfile may be missing (deleted) — treat as empty, still migrate KV data keys
      const oldProfile: any = (await kv.get(`user:${fromUserId}`)) ?? {};
      const newProfile: any = await kv.get(`user:${toUserId}`);
      if (!newProfile) return c.json({
        error: 'Destination user profile not found in KV. Ask the user to log in once with their new account first.',
      }, 404);

      const migrated: Record<string, number> = {};
      const keysToDelete: string[] = [];

      // Uses actual DB keys — no reconstruction from item fields needed.
      // Replaces fromUserId in the key string directly, then writes under new key.
      const migratePrefix = async (prefix: string, label: string) => {
        const rows = await getByPrefixWithKeys(`${prefix}${fromUserId}:`);
        let count = 0;
        for (const { key: oldKey, value: item } of rows) {
          const newKey = oldKey.replace(fromUserId, toUserId);
          await kv.set(newKey, { ...item, userId: toUserId });
          keysToDelete.push(oldKey);
          count++;
        }
        migrated[label] = count;
      };

      await migratePrefix('prayer:', 'prayers');
      await migratePrefix('journal:', 'journals');
      await migratePrefix('mood:', 'moods');
      await migratePrefix('milestone:', 'milestones');
      await migratePrefix('completion:', 'devotionalCompletions');
      await migratePrefix('response:', 'questionResponses');
      await migratePrefix('streak:', 'streaks');
      await migratePrefix('scripture-progress:', 'scriptureMemory');
      await migratePrefix('notification:', 'notifications');

      const mergedProfile = {
        ...newProfile,
        partnerId: oldProfile?.partnerId || newProfile.partnerId || null,
        coupleId: oldProfile?.coupleId || newProfile.coupleId || null,
        partnerName: oldProfile?.partnerName || newProfile.partnerName || null,
        relationshipStart: oldProfile?.relationshipStart || newProfile.relationshipStart || null,
        bio: newProfile.bio || oldProfile?.bio || null,
        profilePicture: newProfile.profilePicture || oldProfile?.profilePicture || null,
        inviteCode: newProfile.inviteCode || oldProfile?.inviteCode || null,
        updatedAt: new Date().toISOString(),
      };
      await kv.set(`user:${toUserId}`, mergedProfile);

      // Update partner's profile to point to new userId
      if (oldProfile?.partnerId) {
        const partnerProfile: any = await kv.get(`user:${oldProfile.partnerId}`);
        if (partnerProfile?.partnerId === fromUserId) {
          await kv.set(`user:${oldProfile.partnerId}`, { ...partnerProfile, partnerId: toUserId, updatedAt: new Date().toISOString() });
          migrated['partnerLinkUpdated'] = 1;
        }
      }

      // Update couple record
      if (oldProfile?.coupleId) {
        const coupleRecord: any = await kv.get(`couple:${oldProfile.coupleId}`);
        if (coupleRecord) {
          const updatedCouple = { ...coupleRecord };
          if (updatedCouple.partner1Id === fromUserId) updatedCouple.partner1Id = toUserId;
          if (updatedCouple.partner2Id === fromUserId) updatedCouple.partner2Id = toUserId;
          await kv.set(`couple:${oldProfile.coupleId}`, updatedCouple);
          migrated['coupleRecordUpdated'] = 1;
        }
      }

      if (oldProfile?.id) keysToDelete.push(`user:${fromUserId}`);
      if (oldProfile?.inviteCode) keysToDelete.push(`invite:${oldProfile.inviteCode}`);
      if (keysToDelete.length > 0) await kv.mdel(keysToDelete);

      await logAudit('admin.account_recovery_migration', adminUserId, { fromUserId, toUserId, migrated });

      return c.json({ success: true, migrated, newProfile: mergedProfile });
    } catch (error: any) {
      console.error('[migrate-user-data]', error.message);
      return c.json({ error: error.message }, 500);
    }
  });
}
