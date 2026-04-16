/**
 * Client for the CoachBoard AI Backend.
 * Separate from the OW API client.
 */

const AI_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8081';

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
  limit: number;
  offset: number;
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

// Health Scores types
export interface ScoreDetail {
  value: number | null;
  qualifier: string | null;
  components?: Record<string, number> | null;
}

export interface HealthScoresResponse {
  user_id: string;
  period_days: number;
  sleep_score: ScoreDetail | null;
  recovery_score: ScoreDetail | null;
  activity_score: ScoreDetail | null;
  body_score: ScoreDetail | null;
  generated_at: string;
}

export interface HealthScoresLatest {
  user_id: string;
  scores: Record<string, ScoreDetail>;
  generated_at: string;
}

// Portfolio types
export interface ClientAtRisk {
  user_id: string;
  name: string;
  risk_reason: string;
  severity: string;
  sleep_score: number | null;
  recovery_score: number | null;
  recommendation_id: string | null;
}

export interface CheckInItem {
  user_id: string;
  member_name: string;
  reason: string;
  overdue: boolean;
  recommendation_id: string;
  created_at: string;
}

export interface CheckInList {
  items: CheckInItem[];
  total: number;
}

export interface ClientEngagement {
  user_id: string;
  name: string;
  status: 'active' | 'slowing' | 'at_risk';
  last_sync_hours_ago: number | null;
  current_streak_days: number;
}

export interface RetentionData {
  active_count: number;
  slowing_count: number;
  at_risk_count: number;
  engagement_streaks: ClientEngagement[];
  churn_risk_count: number;
  churn_trend: 'up' | 'down' | 'stable';
  compliance_rate: number | null;
  compliance_trend: 'up' | 'down' | 'stable';
  recommended_outreach: number;
}

export interface ClientScore {
  user_id: string;
  name: string;
  sleep_score: number | null;
  recovery_score: number | null;
}

export interface PortfolioStats {
  active_clients: number;
  avg_sleep_score: number | null;
  avg_recovery_score: number | null;
  clients_needing_attention: number;
  avg_hrv: number | null;
  compliance_rate: number | null;
  clients_at_risk: ClientAtRisk[];
  client_scores: ClientScore[];
}

export interface PortfolioTrendPoint {
  date: string;
  avg_sleep_score: number | null;
  avg_recovery_score: number | null;
  avg_activity_score: number | null;
  active_clients: number;
}

export interface PortfolioTrends {
  period_days: number;
  data: PortfolioTrendPoint[];
}

export interface RiskMatrixEntry {
  user_id: string;
  name: string;
  activity_score: number;
  recovery_score: number;
  quadrant: string;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  user_name: string;
  event_type: string;
  title: string;
  description: string | null;
  timestamp: string;
  severity: string;
}

export interface ActivityFeed {
  items: ActivityFeedItem[];
  total: number;
}

// API functions
export const aiApi = {
  // Recommendations
  getRecommendations: (
    resolved = false,
    category?: RecommendationCategory | RecommendationCategory[],
    limit = 20,
    offset = 0,
    sortBy: 'created_at' | 'severity' | 'member_name' = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) => {
    const params = new URLSearchParams({ resolved: String(resolved) });
    if (category) {
      const cats = Array.isArray(category) ? category.join(',') : category;
      params.set('category', cats);
    }
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    params.set('sort_by', sortBy);
    params.set('sort_order', sortOrder);
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

  // Health Scores (calculated)
  getCalculatedHealthScores: (userId: string, days = 30) =>
    aiFetch<HealthScoresResponse>(`/api/health-scores/${userId}?days=${days}`),

  getLatestHealthScores: (userId: string) =>
    aiFetch<HealthScoresLatest>(`/api/health-scores/${userId}/latest`),

  // Portfolio
  getPortfolioStats: () => aiFetch<PortfolioStats>('/api/portfolio/stats'),

  getPortfolioTrends: (days = 30) =>
    aiFetch<PortfolioTrends>(`/api/portfolio/trends?days=${days}`),

  getRiskMatrix: () => aiFetch<RiskMatrixEntry[]>('/api/portfolio/risk-matrix'),

  // Retention & Engagement
  getRetentionData: () => aiFetch<RetentionData>('/api/portfolio/retention'),

  // Check-ins
  getCheckIns: () => aiFetch<CheckInList>('/api/recommendations/check-ins'),

  // Activity Feed
  getActivityFeed: (limit = 20) =>
    aiFetch<ActivityFeed>(`/api/activity-feed?limit=${limit}`),

  // Health check
  health: () => aiFetch<{ status: string }>('/health'),
};
