import { createFileRoute } from '@tanstack/react-router';
import { useDashboardStats } from '@/hooks/api/use-dashboard';
import {
  EnhancedStatsGrid,
  ClientsAtRisk,
  AIRecommendationsPanel,
  ActivityFeedPanel,
  RetentionEngagement,
  RecommendedCheckIns,
  DashboardLoadingState,
  DashboardErrorState,
} from '@/components/pages/dashboard';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error || !stats) {
    return <DashboardErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-foreground-secondary mt-1">
          Your studio overview and client health metrics
        </p>
      </div>

      {/* Enhanced Stats Grid — 6 cards */}
      <EnhancedStatsGrid stats={stats} />

      {/* Clients Needing Attention — full width */}
      <ClientsAtRisk />

      {/* AI Recommendations + Retention & Engagement */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AIRecommendationsPanel />
        <RetentionEngagement />
      </div>

      {/* Activity Feed + Recommended Check-ins */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeedPanel />
        <RecommendedCheckIns />
      </div>
    </div>
  );
}
