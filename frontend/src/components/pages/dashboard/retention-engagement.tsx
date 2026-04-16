import { Link } from '@tanstack/react-router';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRetentionData } from '@/hooks/api/use-portfolio';

export interface RetentionEngagementProps {
  className?: string;
}

const statusColors: Record<string, string> = {
  active: '#22c55e',
  slowing: '#eab308',
  at_risk: '#ef4444',
};

function TrendArrow({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-trend-positive" />;
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-trend-negative" />;
  return <Minus className="h-3 w-3 text-foreground-muted" />;
}

function DonutChart({
  active,
  slowing,
  atRisk,
}: {
  active: number;
  slowing: number;
  atRisk: number;
}) {
  const total = active + slowing + atRisk || 1;
  const size = 100;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const activeAngle = (active / total) * circumference;
  const slowingAngle = (slowing / total) * circumference;
  const atRiskAngle = (atRisk / total) * circumference;

  let offset = 0;
  const segments = [
    { length: activeAngle, color: statusColors.active },
    { length: slowingAngle, color: statusColors.slowing },
    { length: atRiskAngle, color: statusColors.at_risk },
  ];

  return (
    <div className="relative">
      <svg width={size} height={size} className="rotate-[-90deg]">
        {segments.map((seg, i) => {
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.length} ${circumference - seg.length}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += seg.length;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground">{total}</span>
      </div>
    </div>
  );
}

export function RetentionEngagement({ className }: RetentionEngagementProps) {
  const { data, isLoading } = useRetentionData();

  if (isLoading) {
    return (
      <div className={cn('bg-card border border-border rounded-xl p-8 flex items-center justify-center', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
      </div>
    );
  }

  const active = data?.active_count ?? 0;
  const slowing = data?.slowing_count ?? 0;
  const atRisk = data?.at_risk_count ?? 0;

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Retention & Engagement
          </h2>
        </div>
        <p className="text-xs text-foreground-muted mt-0.5">
          Client activity and engagement overview
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Donut + legend */}
        <div className="flex items-center gap-6">
          <DonutChart active={active} slowing={slowing} atRisk={atRisk} />
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs text-foreground-secondary flex-1">Active</span>
              <span className="text-xs font-semibold text-foreground">{active}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 shrink-0" />
              <span className="text-xs text-foreground-secondary flex-1">Slowing</span>
              <span className="text-xs font-semibold text-foreground">{slowing}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-xs text-foreground-secondary flex-1">At Risk</span>
              <span className="text-xs font-semibold text-foreground">{atRisk}</span>
            </div>
          </div>
        </div>

        {/* Engagement streaks */}
        {data?.engagement_streaks && data.engagement_streaks.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted mb-2">
              Top Streaks
            </p>
            <div className="space-y-1.5">
              {data.engagement_streaks.map((client) => (
                <Link
                  key={client.user_id}
                  to="/users/$userId"
                  params={{ userId: client.user_id }}
                  className="flex items-center gap-2 py-1 hover:bg-secondary/30 rounded px-1 -mx-1 transition-colors"
                >
                  <Flame className="h-3 w-3 text-warning shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">
                    {client.name}
                  </span>
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {client.current_streak_days}d
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span className="text-[10px] text-foreground-muted">Churn Risk</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm font-semibold text-foreground">
                {data?.churn_risk_count ?? 0}
              </span>
              <TrendArrow trend={data?.churn_trend ?? 'stable'} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-foreground-muted">Compliance</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm font-semibold text-foreground">
                {data?.compliance_rate != null ? `${Math.round(data.compliance_rate)}%` : '--'}
              </span>
              <TrendArrow trend={data?.compliance_trend ?? 'stable'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
