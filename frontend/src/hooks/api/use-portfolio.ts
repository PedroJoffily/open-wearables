import { useQuery } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai-client';

const PORTFOLIO_KEYS = {
  stats: ['ai', 'portfolio', 'stats'] as const,
  trends: (days?: number) => ['ai', 'portfolio', 'trends', days] as const,
  riskMatrix: ['ai', 'portfolio', 'risk-matrix'] as const,
  retention: ['ai', 'portfolio', 'retention'] as const,
  activityFeed: (limit?: number) =>
    ['ai', 'activity-feed', limit] as const,
};

export function usePortfolioStats() {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.stats,
    queryFn: () => aiApi.getPortfolioStats(),
    retry: 1,
    staleTime: 2 * 60_000,
  });
}

export function usePortfolioTrends(days = 30) {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.trends(days),
    queryFn: () => aiApi.getPortfolioTrends(days),
    retry: 1,
    staleTime: 5 * 60_000,
  });
}

export function useRiskMatrix() {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.riskMatrix,
    queryFn: () => aiApi.getRiskMatrix(),
    retry: 1,
    staleTime: 5 * 60_000,
  });
}

export function useRetentionData() {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.retention,
    queryFn: () => aiApi.getRetentionData(),
    retry: 1,
    staleTime: 2 * 60_000,
  });
}

export function useActivityFeed(limit = 20) {
  return useQuery({
    queryKey: PORTFOLIO_KEYS.activityFeed(limit),
    queryFn: () => aiApi.getActivityFeed(limit),
    retry: 1,
    staleTime: 60_000,
  });
}
