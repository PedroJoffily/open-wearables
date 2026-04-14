import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai-client';
import type { RecommendationCategory } from '@/lib/api/ai-client';

const AI_QUERY_KEYS = {
  recommendations: ['ai', 'recommendations'] as const,
  summary: (userId: string) => ['ai', 'summary', userId] as const,
  notes: (userId: string) => ['ai', 'notes', userId] as const,
};

// Recommendations
export function useAIRecommendations(resolved = false, category?: RecommendationCategory) {
  return useQuery({
    queryKey: [...AI_QUERY_KEYS.recommendations, resolved, category],
    queryFn: () => aiApi.getRecommendations(resolved, category),
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
