import { getAccessToken } from './api';
import { projectId } from './supabase/info';

export type CharacterHouseType = 'house' | 'villa' | 'townhouse' | 'apartment' | 'duplex' | 'penthouse';
export interface CharacterHouseProgress {
  completedDays: number;
  totalDays: 365;
  todayContributed: boolean;
  lastBlockDate: string | null;
}
export interface CharacterHouseBlueprint {
  homeType: CharacterHouseType;
  bedrooms: number;
  homeName: string;
  blueprintStatus: 'draft' | 'pending' | 'active';
  locked: boolean;
  challengeStartedAt?: string;
  completedDays: number;
  [key: string]: unknown;
}
export interface CharacterHouseState {
  blueprint: CharacterHouseBlueprint | null;
  progress: CharacterHouseProgress;
  day: string;
}
export interface DailyCharacterHouse extends CharacterHouseProgress {
  configured: true;
  homeType: CharacterHouseType;
  bedrooms: number;
}
export class CharacterHouseError extends Error {
  constructor(public code: string) { super(code); }
}
const homeTypes: string[] = ['house', 'villa', 'townhouse', 'apartment', 'duplex', 'penthouse'];
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const countIsValid = (value: unknown) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 365;
const dateIsValid = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const designIsValid = (value: Record<string, unknown>) => typeof value.homeType === 'string' && homeTypes.includes(value.homeType)
  && Number.isInteger(value.bedrooms) && Number(value.bedrooms) >= 1 && Number(value.bedrooms) <= 7;
export const houseProgressIsValid = (value: unknown): value is CharacterHouseProgress => isRecord(value)
  && countIsValid(value.completedDays) && value.totalDays === 365 && typeof value.todayContributed === 'boolean'
  && (value.lastBlockDate === null || dateIsValid(value.lastBlockDate))
  && (!value.todayContributed || Number(value.completedDays) > 0);
export const dailyCharacterHouseIsValid = (value: unknown): value is DailyCharacterHouse => isRecord(value)
  && value.configured === true && designIsValid(value) && houseProgressIsValid(value);

export function parseCharacterHouse(value: unknown): CharacterHouseState {
  if (!isRecord(value) || !dateIsValid(value.day) || !houseProgressIsValid(value.progress)) throw new CharacterHouseError('invalid_response');
  const blueprint = value.blueprint;
  if (blueprint !== null && (!isRecord(blueprint) || !designIsValid(blueprint)
    || typeof blueprint.homeName !== 'string' || !['draft', 'pending', 'active'].includes(String(blueprint.blueprintStatus))
    || typeof blueprint.locked !== 'boolean' || !countIsValid(blueprint.completedDays)
    || blueprint.completedDays !== value.progress.completedDays
    || (blueprint.locked && (blueprint.blueprintStatus !== 'active' || typeof blueprint.challengeStartedAt !== 'string'
      || !Number.isFinite(Date.parse(blueprint.challengeStartedAt)))))) throw new CharacterHouseError('invalid_response');
  if (blueprint === null && value.progress.completedDays !== 0) throw new CharacterHouseError('invalid_response');
  if (value.progress.todayContributed && value.progress.lastBlockDate !== value.day) throw new CharacterHouseError('invalid_response');
  return value as unknown as CharacterHouseState;
}

async function request(body?: { homeType: CharacterHouseType; bedrooms: number }, signal?: AbortSignal): Promise<CharacterHouseState> {
  const token = await getAccessToken();
  if (!token) throw new CharacterHouseError('unauthorized');
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 20_000);
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/character-house${body ? '/start' : ''}`, {
      method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify({ homeType: body.homeType, bedrooms: body.bedrooms }) } : {}), signal: controller.signal,
    });
    let result: unknown;
    try { result = await response.json(); } catch (reason) {
      if (controller.signal.aborted) throw reason;
      throw new CharacterHouseError(response.ok ? 'invalid_response' : 'unavailable');
    }
    if (!response.ok) throw new CharacterHouseError(isRecord(result) && typeof result.code === 'string' ? result.code : 'unavailable');
    return parseCharacterHouse(result);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export const characterHouseApi = {
  get: (signal?: AbortSignal) => request(undefined, signal),
  start: (value: { homeType: CharacterHouseType; bedrooms: number }) => request(value),
};
