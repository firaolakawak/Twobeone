import { createClient } from './supabase/client';
import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee`;

// Request deduplication - prevents duplicate simultaneous requests
const pendingRequests = new Map<string, Promise<any>>();

function deduplicateRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    console.log(`[API] Deduplicating request: ${key}`);
    return pendingRequests.get(key)!;
  }
  
  const promise = fn().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}

// Helper to get access token, refreshing session if needed
export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;
  // Session missing or expired — try refreshing
  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed?.session?.access_token || null;
}

// Helper for authenticated API calls with retry logic
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 0,
  timeout = 20000  // 20s default — accommodates Edge Function cold starts
): Promise<T> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Unauthorized');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    // Add a client-side timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle 401 Unauthorized — try refreshing the session and retry once
      if (response.status === 401 && retries === 0) {
        const supabase = createClient();
        const { data: refreshed } = await supabase.auth.refreshSession();
        const newToken = refreshed?.session?.access_token;
        if (newToken) {
          const retryHeaders = { ...options.headers, 'Authorization': `Bearer ${newToken}`, 'Content-Type': 'application/json' };
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers: retryHeaders });
          if (retryResponse.ok) return retryResponse.json();
        }
        throw new Error('Unauthorized');
      }
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      
      // Handle 504 Gateway Timeout - retry if we have attempts left
      if (response.status === 504 && retries > 0) {
        const waitTime = (3 - retries) * 1000; // Exponential backoff
        console.log(`[API] Server timeout (504) on ${endpoint}, retrying in ${waitTime}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, waitTime)); // Wait before retry
        return apiCall<T>(endpoint, options, retries - 1, timeout);
      }
      
      if (response.status === 504) {
        throw new Error('The server is taking too long to respond. Please try again in a moment.');
      }
      
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
    const isNetworkDown = error.message === 'Failed to fetch' || error.name === 'TypeError';

    // Retry on timeout or transient network errors if attempts remain
    if ((isTimeout || isNetworkDown) && retries > 0) {
      const waitTime = isNetworkDown ? 2000 : (3 - retries) * 1000;
      console.log(`[API] ${isNetworkDown ? 'Network error' : 'Timeout'} on ${endpoint}, retrying in ${waitTime}ms (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return apiCall<T>(endpoint, options, retries - 1, timeout);
    }

    if (error.name === 'AbortError') {
      throw new Error('Request timeout. The server is taking too long to respond. Please try again.');
    }
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    throw error;
  }
}

// ============================================
// WARM-UP — hits /health to wake the Edge Function before critical calls
// ============================================

export async function warmUpServer(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
  } catch {
    // Ignore — warm-up is best-effort
  }
}

// ============================================
// ADMIN
// ============================================

export const admin = {
  checkPrivileges: async () => {
    return apiCall<{ isAdmin: boolean }>('/admin/privileges/check', {}, 1, 15000);
  },
};

// ============================================
// AUTHENTICATION
// ============================================

export const auth = {
  signup: async (email: string, password: string, name: string) => {
    const supabase = createClient();
    
    // Create user via backend
    const { user, inviteCode } = await apiCall<any>('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    // Sign in to get session
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, inviteCode };
  },

  login: async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { user: data.user, session: data.session };
  },

  logout: async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  getCurrentUser: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};

// ============================================
// PROFILE
// ============================================

export const profile = {
  get: async () => {
    return deduplicateRequest('profile-get', () =>
      apiCall<{ profile: any; partner: any | null }>('/profile', {}, 3, 25000)
    );
  },

  update: async (updates: any) => {
    return apiCall<{ success: boolean; profile: any }>('/profile', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  },

  generateInviteCode: async () => {
    return apiCall<{ success: boolean; inviteCode: string }>('/profile/generate-code', {
      method: 'POST',
    });
  },

  linkByCode: async (code: string) => {
    return apiCall<{ success: boolean; partner: any }>('/profile/link-by-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
};

// ============================================
// JOURNAL
// ============================================

export const journal = {
  list: async () => {
    return deduplicateRequest('journal-list', () =>
      apiCall<{ entries: any[] }>('/journal', {}, 2, 25000)
    );
  },

  create: async (entry: {
    title?: string;
    content: string;
    isShared?: boolean;
    emoji?: string;
    location?: string;
  }) => {
    return apiCall<{ success: boolean; entry: any }>('/journal', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  update: async (id: string, updates: any) => {
    return apiCall<{ success: boolean; entry: any }>(`/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return apiCall<{ success: boolean }>(`/journal/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// PRAYER REQUESTS
// ============================================

export const prayer = {
  list: async () => {
    // Prayer list gets 2 retries with 15 second timeout (increased for reliability)
    // Deduplicate to prevent multiple simultaneous prayer requests
    return deduplicateRequest('prayer-list', () =>
      apiCall<{ prayers: any[] }>('/prayer', {}, 2, 15000)
    );
  },

  create: async (prayer: {
    title: string;
    description?: string;
    isShared?: boolean;
  }) => {
    return apiCall<{ success: boolean; prayer: any }>('/prayer', {
      method: 'POST',
      body: JSON.stringify(prayer),
    });
  },

  update: async (id: string, updates: any) => {
    return apiCall<{ success: boolean; prayer: any }>(`/prayer/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  markAnswered: async (id: string) => {
    return apiCall<{ success: boolean; prayer: any }>(`/prayer/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isAnswered: true }),
    });
  },

  delete: async (id: string) => {
    return apiCall<{ success: boolean }>(`/prayer/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// MOODS
// ============================================

export const moods = {
  save: async (mood: 'great' | 'good' | 'okay' | 'sad', note?: string) => {
    return apiCall<{ success: boolean; mood: any }>('/moods', {
      method: 'POST',
      body: JSON.stringify({ mood, note }),
    });
  },

  list: async (days: number = 30) => {
    // Moods list gets 1 retry with 10 second timeout
    return apiCall<{ moods: any[] }>(`/moods?days=${days}`, {}, 1, 10000);
  },

  analyze: async () => {
    return apiCall<{ analysis: any }>('/moods/analyze', {
      method: 'POST',
    });
  },

  getAnalysis: async () => {
    return apiCall<{ analyses: any[] }>('/moods/analysis');
  },

  generateWeeklyReport: async () => {
    return apiCall<{ success: boolean; report: any }>('/moods/weekly-report', {
      method: 'POST',
    });
  },

  testOpenAI: async () => {
    return apiCall<{ configured: boolean; valid?: boolean; message: string; details?: string }>('/moods/test-openai');
  },
};

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = {
  list: async (limit: number = 50, unreadOnly: boolean = false) => {
    const query = new URLSearchParams({
      limit: limit.toString(),
      unread: unreadOnly.toString(),
    });
    // Deduplicate notification requests with longer timeout (20 seconds)
    return deduplicateRequest(`notifications-list-${limit}-${unreadOnly}`, () =>
      apiCall<{ notifications: any[] }>(`/notifications?${query}`, {}, 2, 20000) // 2 retries, 20 second timeout
    );
  },

  markAsRead: async (id: string) => {
    return apiCall<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return apiCall<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    });
  },

  delete: async (id: string) => {
    return apiCall<{ success: boolean }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// QUESTIONS & ANSWERS
// ============================================

export const questions = {
  count: async () => {
    return apiCall<{ count: number }>('/questions/count', {}, 0, 8000);
  },

  list: async (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return apiCall<{ questions: any[] }>(`/questions${query}`, {}, 2, 15000);
  },

  submitResponse: async (questionId: string, response: string, isPrivate: boolean = false) => {
    return apiCall<{ success: boolean; response: any }>('/question-responses', {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        response,
        is_private: isPrivate,
      }),
    });
  },

  getResponses: async (category?: string) => {
    const query = category ? `?category=${category}` : ''
    // Increase timeout to 20s and add 2 retries for slower connections
    return apiCall<{ userResponses: any[]; partnerResponses: any[] }>(
      `/question-responses${query}`,
      {},
      2, // 2 retries
      20000 // 20 second timeout (increased from 5s)
    );
  },
};

// ============================================
// DEVOTIONALS
// ============================================

export const devotionals = {
  list: async (limit: number = 7) => {
    return apiCall<{ devotions: any[] }>(`/devotions?limit=${limit}`);
  },

  getToday: async () => {
    return apiCall<{ devotion: any | null }>('/devotions/today');
  },

  markComplete: async (devotionId: string, notes?: string) => {
    return apiCall<{ success: boolean; completion: any }>('/devotional-completions', {
      method: 'POST',
      body: JSON.stringify({ devotion_id: devotionId, notes }),
    });
  },

  getCompletions: async () => {
    return apiCall<{ completions: any[] }>('/devotional-completions');
  },
};

// ============================================
// STREAKS
// ============================================

export const streaks = {
  get: async () => {
    return apiCall<{ streaks: any[] }>('/streaks');
  },
};

// ============================================
// MILESTONES
// ============================================

export const milestones = {
  list: async () => {
    // Deduplicate to prevent multiple simultaneous milestone requests
    // Increase timeout and add retries for milestones
    // Milestones fetch both user and partner data which can be slow
    return deduplicateRequest('milestones-list', () =>
      apiCall<{ milestones: any[]; error?: string }>(
        '/milestones',
        {},
        2, // Add 2 retries for reliability
        15000 // 15 second timeout (shorter per try, but with retries)
      )
    );
  },

  create: async (milestone: {
    title: string;
    description?: string;
    date?: string;
    category?: string;
  }) => {
    return apiCall<{ success: boolean; milestone: any }>('/milestones', {
      method: 'POST',
      body: JSON.stringify(milestone),
    });
  },

  delete: async (id: string) => {
    return apiCall<{ success: boolean }>(`/milestones/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// HEALTH CHECK
// ============================================

export const health = {
  check: async () => {
    return fetch(`${API_BASE_URL}/health`).then(r => r.json());
  },
};

// Partner Disconnect API
export const partnerApi = {
  requestDisconnect: async () => {
    return apiCall<{ 
      success: boolean; 
      message: string;
      gracePeriodEnds: string;
      status: string;
    }>('/partner/request-disconnect', {
      method: 'POST',
    });
  },

  cancelDisconnect: async () => {
    return apiCall<{ 
      success: boolean; 
      message: string;
    }>('/partner/cancel-disconnect', {
      method: 'POST',
    });
  },

  getDisconnectStatus: async () => {
    return apiCall<{
      hasRequest: boolean;
      status?: string;
      requestedBy?: string[];
      requestedAt?: string;
      bothAgreedAt?: string;
      gracePeriodEnds?: string;
      daysRemaining?: number;
      userRequested?: boolean;
      disconnected?: boolean;
      message?: string;
    }>('/partner/disconnect-status', {
      method: 'GET',
    });
  },
};

// ── Overall (General) Compatibility ─────────────────────────────────────────

export const marriageReadiness = {
  get: (force = false) =>
    apiCall<{ result: any; cached: boolean }>(
      `/ai/marriage-readiness${force ? '?force=true' : ''}`,
      {},
      1,   // 1 retry
      90000 // 90s — Gemini cold start + 5 model attempts
    ),
};

export const compatibility = {
  getOverall: async () =>
    apiCall<{ result: any | null; cached: boolean }>('/ai/compatibility/overall', {}, 0, 10000),

  generateOverall: async (payload: {
    completedCategories: string[];
    questionPairs: any[];
    userName: string;
    partnerName: string;
    force?: boolean;
  }) =>
    apiCall<any>('/ai/compatibility/overall', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 0, 60000), // 60s — Gemini may need time for large prompts
};

// Export all as default object
export const api = {
  auth,
  profile,
  journal,
  prayer,
  moods,
  notifications,
  questions,
  devotionals,
  streaks,
  milestones,
  health,
  partner: partnerApi,
};

export default api;