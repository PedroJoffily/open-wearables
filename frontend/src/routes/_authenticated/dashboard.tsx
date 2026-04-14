import { createFileRoute } from '@tanstack/react-router';
import { useDashboardStats } from '@/hooks/api/use-dashboard';
import { useUsers } from '@/hooks/api/use-users';
import {
  StatsGrid,
  RecentUsersSection,
  AIRecommendationsPanel,
  CoachTodoPanel,
  DashboardLoadingState,
  DashboardErrorState,
} from '@/components/pages/dashboard';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { data: users, isLoading: isLoadingUsers } = useUsers({
    sort_by: 'created_at',
    sort_order: 'desc',
    limit: 5,
  });

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
          Your studio overview and member health metrics
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* AI Recommendations + Coach To-Do */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AIRecommendationsPanel />
        <CoachTodoPanel />
      </div>

      {/* Recent Members */}
      <RecentUsersSection
        users={users?.items ?? []}
        totalUsersCount={stats.total_users.count}
        isLoading={isLoadingUsers}
      />
    </div>
  );
}
