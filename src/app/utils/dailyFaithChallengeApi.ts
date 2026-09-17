import { getAccessToken } from './api';
import { projectId } from './supabase/info';
import { getFaithQuestMission } from '../data/faithQuest';

export interface DailyFaithChallengeState {
  day: string;
  missionId: string;
  resetsAt: string;
  own: { choice: number; guess?: number | null; submittedAt: string; completedAt?: string | null } | null;
  partner: { submitted: boolean; choice?: number; guess?: number | null; submittedAt?: string; completed: boolean };
  bothSubmitted: boolean;
}
export interface DailyFaithSubmission {
  day: string;
  missionId: string;
  choice: number;
  guess?: number;
  kindnessDone?: boolean;
}
export class DailyFaithChallengeError extends Error {
  constructor(public code: string) { super(code); }
}
const choiceIsValid = (value: unknown) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 2;
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const timestampIsValid = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const optionalGuessIsValid = (value: unknown) => value === undefined || value === null || choiceIsValid(value);

function parseChallenge(value: unknown): DailyFaithChallengeState {
  if (!isRecord(value)) throw new DailyFaithChallengeError('invalid_response');
  const mission = typeof value.missionId === 'string' ? getFaithQuestMission(value.missionId) : undefined;
  const { own, partner, bothSubmitted } = value;
  if (typeof value.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.day)
    || !timestampIsValid(`${value.day}T00:00:00.000Z`)
    || new Date(`${value.day}T00:00:00.000Z`).toISOString().slice(0, 10) !== value.day
    || !mission || !timestampIsValid(value.resetsAt) || !isRecord(partner)
    || typeof bothSubmitted !== 'boolean' || typeof partner.submitted !== 'boolean' || typeof partner.completed !== 'boolean'
    || (own !== null && (!isRecord(own) || !choiceIsValid(own.choice) || !timestampIsValid(own.submittedAt)
      || (own.completedAt !== undefined && own.completedAt !== null && !timestampIsValid(own.completedAt))
      || (mission.mode === 'heart' ? !choiceIsValid(own.guess) : !optionalGuessIsValid(own.guess))))
    || bothSubmitted !== (own !== null && partner.submitted)
    || (partner.submittedAt !== undefined && !timestampIsValid(partner.submittedAt))
    || (bothSubmitted && (!choiceIsValid(partner.choice)
      || (mission.mode === 'heart' ? !choiceIsValid(partner.guess) : !optionalGuessIsValid(partner.guess))))) {
    throw new DailyFaithChallengeError('invalid_response');
  }
  return value as unknown as DailyFaithChallengeState;
}

async function request(path: string, body?: object, signal?: AbortSignal): Promise<DailyFaithChallengeState> {
  const token = await getAccessToken();
  if (!token) throw new DailyFaithChallengeError('unauthorized');
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 20_000);
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/faith-challenge/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal,
    });
    let result: unknown;
    try { result = await response.json(); }
    catch (reason) {
      if (controller.signal.aborted) throw reason;
      throw new DailyFaithChallengeError(response.ok ? 'invalid_response' : 'unavailable');
    }
    if (!response.ok) throw new DailyFaithChallengeError(isRecord(result) && typeof result.code === 'string' && result.code ? result.code : 'unavailable');
    return parseChallenge(isRecord(result) ? result.challenge : undefined);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export const dailyFaithChallengeApi = {
  today: (signal?: AbortSignal) => request('today', undefined, signal),
  submit: (value: DailyFaithSubmission) => request('submit', value),
  complete: (value: Pick<DailyFaithSubmission, 'day' | 'missionId'>) => request('complete', value),
};
