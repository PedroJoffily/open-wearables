import { Users, Moon, Heart, AlertTriangle, Activity, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortfolioStats } from '@/hooks/api/use-portfolio';
import type { DashboardStats } from '@/lib/api/types';

export interface EnhancedStatsGridProps {
  stats: DashboardStats;
  className?: string;
}

interface StatItem {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
  accent?: string;
}

export function EnhancedStatsGrid({ stats, className }: EnhancedStatsGridProps) {
  const { data: portfolio } = usePortfolioStats();

  const fmt = (v: number | null | undefined) =>
    v != null ? Math.round(v).toString() : '--';

  const statCards: StatItem[] = [
    {
      title: 'Active Clients',
      value: String(portfolio?.active_clients ?? stats.total_users.count),
      description: 'Connected and syncing',
      icon: Users,
    },
    {
      title: 'Avg Sleep Score',
      value: fmt(portfolio?.avg_sleep_score),
      description: 'Across all clients',
      icon: Moon,
      accent: 'text-purple-500',
    },
    {
      title: 'Avg Recovery',
      value: fmt(portfolio?.avg_recovery_score),
      description: 'Across all clients',
      icon: Heart,
      accent: 'text-red-500',
    },
    {
      title: 'Need Attention',
      value: String(portfolio?.clients_needing_attention ?? 0),
      description: 'Below threshold scores',
      icon: AlertTriangle,
      accent: 'text-warning',
    },
    {
      title: 'Avg HRV',
      value: portfolio?.avg_hrv != null
        ? `${Math.round(portfolio.avg_hrv)} ms`
        : '--',
      description: 'Heart rate variability',
      icon: Activity,
      accent: 'text-blue-500',
    },
    {
      title: 'Compliance',
      value: portfolio?.compliance_rate != null
        ? `${Math.round(portfolio.compliance_rate)}%`
        : '--',
      description: 'Device sync rate',
      icon: CheckCircle,
      accent: 'text-green-500',
    },
  ];

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="bg-card border border-border rounded-xl p-5 hover:border-border-hover hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground-secondary">
                {stat.title}
              </span>
              <Icon
                className={cn(
                  'h-4 w-4 text-foreground-muted group-hover:text-foreground-secondary transition-colors',
                  stat.accent
                )}
              />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono tabular-nums">
              {stat.value}
            </div>
            <p className="text-xs text-foreground-muted mt-1">
              {stat.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
