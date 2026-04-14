/**
 * Client for the CoachBoard AI Backend.
 * Separate from the OW API client.
 */

const AI_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8080';

async function aiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${AI_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Types
export type RecommendationCategory = 'alert' | 'check_in' | 'praise' | 'nudge' | 'sync';

export interface AIRecommendation {
  id: string;
  user_id: string;
  member_name: string;
  category: RecommendationCategory;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action_text: string;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface AIRecommendationList {
  items: AIRecommendation[];
  total: number;
}

export interface HealthSummary {
  user_id: string;
  period_days: number;
  summary: string;
  generated_at: string;
}

export interface CoachingNoteAPI {
  id: string;
  user_id: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface CoachingNoteList {
  items: CoachingNoteAPI[];
  total: number;
}

// API functions
export const aiApi = {
  // Recommendations
  getRecommendations: (resolved = false, category?: RecommendationCategory) => {
    const params = new URLSearchParams({ resolved: String(resolved) });
    if (category) params.set('category', category);
    return aiFetch<AIRecommendationList>(`/api/recommendations?${params}`);
  },

  resolveRecommendation: (recId: string) =>
    aiFetch<AIRecommendation>(`/api/recommendations/${recId}/resolve`, { method: 'PATCH' }),

  // Health Summary
  getHealthSummary: (userId: string, period = 30) =>
    aiFetch<HealthSummary>(`/api/summary/${userId}?period=${period}`),

  // Coaching Notes
  getNotes: (userId: string) =>
    aiFetch<CoachingNoteList>(`/api/notes?user_id=${userId}`),

  createNote: (data: { user_id: string; content: string; author?: string }) =>
    aiFetch<CoachingNoteAPI>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNote: (noteId: string, data: { content: string }) =>
    aiFetch<CoachingNoteAPI>(`/api/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteNote: (noteId: string) =>
    aiFetch<void>(`/api/notes/${noteId}`, { method: 'DELETE' }),

  // Health check
  health: () => aiFetch<{ status: string }>('/health'),
};
