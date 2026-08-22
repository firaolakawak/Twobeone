import { createClient } from './supabase/client';
import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee`;

// Helper to get access token
export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Helper for authenticated API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Add a client-side timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      
      // Handle 504 Gateway Timeout
      if (response.status === 504) {
        throw new Error('Request timeout. Please try again.');
      }
      
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    // Provide more helpful error messages
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
    return apiCall<{ profile: any; partner: any | null }>('/profile');
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
    return apiCall<{ entries: any[] }>('/journal');
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
    return apiCall<{ prayers: any[] }>('/prayer');
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
    return apiCall<{ moods: any[] }>(`/moods?days=${days}`);
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
    return apiCall<{ notifications: any[] }>(`/notifications?${query}`);
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
  list: async (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return apiCall<{ questions: any[] }>(`/questions${query}`);
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
    const query = category ? `?category=${category}` : '';
    return apiCall<{ userResponses: any[]; partnerResponses: any[] }>(
      `/question-responses${query}`
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
    return apiCall<{ milestones: any[] }>('/milestones');
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
};

export default api;