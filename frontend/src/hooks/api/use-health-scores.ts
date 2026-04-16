import { useQuery } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai-client';

const HEALTH_SCORES_KEYS = {
  scores: (userId: string, days?: number) =>
    ['ai', 'health-scores', userId, days] as const,
  latest: (userId: string) => ['ai', 'health-scores', userId, 'latest'] as const,
};

export function useCalculatedHealthScores(userId: string, days = 30) {
  return useQuery({
    queryKey: HEALTH_SCORES_KEYS.scores(userId, days),
    queryFn: () => aiApi.getCalculatedHealthScores(userId, days),
    retry: 1,
    staleTime: 5 * 60_000,
    enabled: !!userId,
  });
}

export function useLatestHealthScores(userId: string) {
  return useQuery({
    queryKey: HEALTH_SCORES_KEYS.latest(userId),
    queryFn: () => aiApi.getLatestHealthScores(userId),
    retry: 1,
    staleTime: 2 * 60_000,
    enabled: !!userId,
  });
}
