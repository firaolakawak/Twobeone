interface HouseDependencies {
  getUserFromToken: (authorization: string | null) => Promise<string | null>;
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: any; error: any }>;
}

const HOME_TYPES = ['house', 'villa', 'townhouse', 'apartment', 'duplex', 'penthouse'];
const BEDROOM_RANGES: Record<string, [number, number]> = { house: [1,5], villa: [3,7], townhouse: [2,5], apartment: [1,4], duplex: [3,6], penthouse: [2,5] };

export function registerCharacterHouseRoutes(app: any, dependencies: HouseDependencies) {
  for (const action of ['get', 'start'] as const) {
    app[action === 'get' ? 'get' : 'post'](`/make-server-6d579fee/character-house${action === 'get' ? '' : '/start'}`, async (c: any) => {
      c.header('Cache-Control', 'no-store');
      try {
        const userId = await dependencies.getUserFromToken(c.req.header('Authorization') ?? null);
        if (!userId) return c.json({ error: 'Unauthorized', code: 'unauthorized' }, 401);
        let payload: Record<string, unknown> = {};
        if (action === 'start') {
          try { payload = await c.req.json(); } catch { payload = {}; }
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)
            || !HOME_TYPES.includes(String(payload.homeType)) || !Number.isInteger(payload.bedrooms)
            || Number(payload.bedrooms) < (BEDROOM_RANGES[String(payload.homeType)]?.[0] ?? 1)
            || Number(payload.bedrooms) > (BEDROOM_RANGES[String(payload.homeType)]?.[1] ?? 7)) {
            return c.json({ error: 'Choose your house type and bedroom count.', code: 'invalid_house' }, 400);
          }
          // Identity, construction progress and timestamps are server-owned.
          payload = { homeType: payload.homeType, bedrooms: payload.bedrooms };
        }
        const { data, error } = await dependencies.rpc('character_house', { p_user_id: userId, p_action: action, p_payload: payload });
        if (error || !data) throw error || new Error('Missing house response');
        if (data.code === 'partner_required') return c.json({ error: 'Connect with your partner to start your shared house.', code: data.code }, 409);
        if (data.code === 'invalid_house') return c.json({ error: 'Choose your house type and bedroom count.', code: data.code }, 400);
        if (data.code || !data.progress || !Object.hasOwn(data, 'blueprint')) throw new Error('Invalid house response');
        return c.json(data);
      } catch {
        console.warn('[Character House] Request unavailable.');
        return c.json({ error: 'Your shared house is temporarily unavailable. Please try again.', code: 'unavailable' }, 503);
      }
    });
  }
}
