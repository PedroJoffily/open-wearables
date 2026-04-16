import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai-client';
import type { RecommendationCategory } from '@/lib/api/ai-client';

const AI_QUERY_KEYS = {
  recommendations: ['ai', 'recommendations'] as const,
  checkIns: ['ai', 'check-ins'] as const,
  summary: (userId: string) => ['ai', 'summary', userId] as const,
  notes: (userId: string) => ['ai', 'notes', userId] as const,
};

// Recommendations
export function useAIRecommendations(
  resolved = false,
  category?: RecommendationCategory | RecommendationCategory[],
  limit = 20,
  offset = 0,
  sortBy: 'created_at' | 'severity' | 'member_name' = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
) {
  return useQuery({
    queryKey: [...AI_QUERY_KEYS.recommendations, resolved, category, limit, offset, sortBy, sortOrder],
    queryFn: () => aiApi.getRecommendations(resolved, category, limit, offset, sortBy, sortOrder),
    retry: 1,
    staleTime: 60_000,
  });
}

// Check-ins
export function useCheckIns() {
  return useQuery({
    queryKey: AI_QUERY_KEYS.checkIns,
    queryFn: () => aiApi.getCheckIns(),
    retry: 1,
    staleTime: 60_000,
  });
}

export function useResolveRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recId: string) => aiApi.resolveRecommendation(recId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.recommendations });
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.checkIns });
    },
  });
}

// Health Summary
export function useHealthSummary(userId: string, period = 30) {
  return useQuery({
    queryKey: [...AI_QUERY_KEYS.summary(userId), period],
    queryFn: () => aiApi.getHealthSummary(userId, period),
    retry: 1,
    staleTime: 5 * 60_000,
    enabled: !!userId,
  });
}

// Coaching Notes
export function useCoachingNotes(userId: string) {
  return useQuery({
    queryKey: AI_QUERY_KEYS.notes(userId),
    queryFn: () => aiApi.getNotes(userId),
    retry: 1,
    staleTime: 30_000,
    enabled: !!userId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id: string; content: string; author?: string }) =>
      aiApi.createNote(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: AI_QUERY_KEYS.notes(variables.user_id),
      });
    },
  });
}

export function useUpdateNote(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      aiApi.updateNote(noteId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AI_QUERY_KEYS.notes(userId),
      });
    },
  });
}

export function useDeleteNote(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => aiApi.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AI_QUERY_KEYS.notes(userId),
      });
    },
  });
}
