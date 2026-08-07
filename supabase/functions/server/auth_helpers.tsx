import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import * as jose from 'npm:jose@5';
import * as kv from './kv_store.tsx';

export const getSupabase = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function isAdminUser(userId: string): Promise<boolean> {
  const adminList = await kv.get('system:admins') || [];
  return Array.isArray(adminList) && adminList.includes(userId);
}

export async function getUserFromToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const secret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (secret) {
      const key = await jose.importJWK(
        { kty: 'oct', k: btoa(String.fromCharCode(...new TextEncoder().encode(secret))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') },
        'HS256'
      ).catch(() => new TextEncoder().encode(secret));
      const { payload } = await jose.jwtVerify(token, key as Parameters<typeof jose.jwtVerify>[1]);
      if (payload.sub) return payload.sub;
    }
  } catch { /* fall through */ }
  try {
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch { return null; }
}

export async function logAudit(event: string, userId: string, metadata: any) {
  try {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await kv.set(`auditlog:${Date.now()}:${id}`, {
      id, event, userId, metadata, timestamp: new Date().toISOString(),
    });
  } catch { /* non-fatal */ }
}
