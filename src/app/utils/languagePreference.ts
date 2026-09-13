import type { Language } from './i18n';
import { projectId } from './supabase/info';

interface LanguagePreferenceRequest {
  language: Language;
  accessToken: string;
  userId: string;
}

const SAVE_TIMEOUT_MS = 15_000;
const userSaveQueues = new Map<string, Promise<void>>();

async function postLanguagePreference({ language, accessToken }: LanguagePreferenceRequest): Promise<void> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const deadline = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('Language preference sync timed out'));
        controller.abort();
      }, SAVE_TIMEOUT_MS);
    });
    // Racing the deadline also releases the queue in clients whose fetch does
    // not settle when aborted. Clear the timer for both HTTP and network errors.
    const response = await Promise.race([
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language }),
        signal: controller.signal,
      }),
      deadline,
    ]);
    if (!response.ok) throw new Error('Language preference sync failed');
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

/**
 * Keep header and settings saves ordered for each account without blocking
 * another account. Each caller receives its own save result.
 *
 * A timeout aborts the client request, but a server may still commit that write.
 * Preventing late server writes requires a versioned backend preference API.
 */
export function saveLanguagePreference(request: LanguagePreferenceRequest): Promise<void> {
  const previous = userSaveQueues.get(request.userId) ?? Promise.resolve();
  const operation = previous.catch(() => undefined).then(() => postLanguagePreference(request));
  const pending = operation.finally(() => {
    if (userSaveQueues.get(request.userId) === pending) userSaveQueues.delete(request.userId);
  });
  userSaveQueues.set(request.userId, pending);
  return pending;
}
