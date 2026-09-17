// Dependency injection keeps authorization and transport behavior testable
// without starting the Edge Function or contacting a live Supabase project.
interface ChallengeDependencies {
  getUserFromToken: (authorization: string | null) => Promise<string | null>;
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: any; error: any }>;
  sendPush: (notification: any) => Promise<unknown>;
}

const errors: Record<string, { status: number; message: string }> = {
  partner_required: { status: 409, message: 'Connect with your partner to play the daily challenge.' },
  day_changed: { status: 409, message: 'A new daily challenge is ready. Please refresh.' },
  mission_changed: { status: 409, message: 'Please open today’s challenge and try again.' },
  waiting_for_partner: { status: 409, message: 'Both partners need to submit before completing this challenge.' },
  invalid_submission: { status: 400, message: 'Please finish your choices and try again.' },
};

export function registerFaithChallengeRoutes(app: any, dependencies: ChallengeDependencies) {
  for (const action of ['today', 'submit', 'complete'] as const) {
    app[action === 'today' ? 'get' : 'post'](`/make-server-6d579fee/faith-challenge/${action}`, async (c: any) => {
      c.header('Cache-Control', 'no-store');
      try {
        const userId = await dependencies.getUserFromToken(c.req.header('Authorization') ?? null);
        if (!userId) return c.json({ error: 'Unauthorized', code: 'unauthorized' }, 401);

        let payload: Record<string, unknown> = {};
        if (action !== 'today') {
          try { payload = await c.req.json(); } catch {
            return c.json({ error: errors.invalid_submission.message, code: 'invalid_submission' }, 400);
          }
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)
            || typeof payload.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.day)
            || typeof payload.missionId !== 'string' || !/^quest-(0[1-9]|[12][0-9]|30)$/.test(payload.missionId)
            || (action === 'submit' && (!Number.isInteger(payload.choice) || Number(payload.choice) < 0 || Number(payload.choice) > 2
              || (payload.guess !== undefined && (!Number.isInteger(payload.guess) || Number(payload.guess) < 0 || Number(payload.guess) > 2))))) {
            return c.json({ error: errors.invalid_submission.message, code: 'invalid_submission' }, 400);
          }
          // Never pass caller-controlled identity or notification contents to storage.
          payload = {
            day: payload.day, missionId: payload.missionId,
            ...(action === 'submit' ? { choice: payload.choice, guess: payload.guess, kindnessDone: payload.kindnessDone === true } : {}),
          };
        }

        const { data, error } = await dependencies.rpc('daily_faith_challenge', {
          p_user_id: userId, p_action: action, p_payload: payload,
        });
        if (error || !data) throw error || new Error('Empty daily challenge response');
        if (data.code) {
          const issue = errors[data.code];
          if (!issue) throw new Error('Unknown daily challenge response');
          return c.json({ error: issue.message, code: data.code }, issue.status);
        }
        if (!data.challenge) throw new Error('Missing daily challenge');
        // The transaction returns a notice only for the first saved submission.
        // Push failure must not undo the answer or its durable in-app notification.
        if (data.notification) {
          await dependencies.sendPush(data.notification).catch(() => {
            console.warn('[Daily Faith Challenge] Push unavailable; in-app notification saved.');
          });
        }
        return c.json({ challenge: data.challenge });
      } catch {
        console.warn('[Daily Faith Challenge] Request unavailable.');
        return c.json({ error: 'Today’s challenge is temporarily unavailable. Please try again.', code: 'unavailable' }, 503);
      }
    });
  }
}
