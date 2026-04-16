import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePortfolioTrends } from '@/hooks/api/use-portfolio';

export interface PortfolioTrendsProps {
  className?: string;
}

export function PortfolioTrends({ className }: PortfolioTrendsProps) {
  const { data, isLoading, isError, error } = usePortfolioTrends(30);
  const points = data?.data ?? [];

  const chartData = points.map((p) => ({
    date: p.date,
    sleep: p.avg_sleep_score,
    recovery: p.avg_recovery_score,
    activity: p.avg_activity_score,
  }));

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          Score Trends (30 days)
        </h2>
        <p className="text-xs text-foreground-muted mt-0.5">
          Average scores across all clients
        </p>
      </div>
      <div className="px-2 py-4">
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-sm text-foreground-muted">Loading trends...</p>
          </div>
        ) : isError ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-sm text-red-500">Error: {(error as Error)?.message ?? 'Unknown error'}</p>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-foreground-muted)' }}
                tickFormatter={(v) => format(parseISO(v), 'MMM d')}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'var(--color-foreground-muted)' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(v) => format(parseISO(v as string), 'MMM d, yyyy')}
              />
              <Area
                type="monotone"
                dataKey="sleep"
                name="Sleep"
                stroke="#8B5CF6"
                fill="url(#sleepGrad)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="recovery"
                name="Recovery"
                stroke="#EF4444"
                fill="url(#recoveryGrad)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="activity"
                name="Activity"
                stroke="#22C55E"
                fill="url(#activityGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-sm text-foreground-muted">
              No trend data available yet
            </p>
          </div>
        )}
      </div>
      {/* Legend */}
      <div className="px-5 pb-4 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-xs text-foreground-muted">Sleep</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-xs text-foreground-muted">Recovery</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-foreground-muted">Activity</span>
        </div>
      </div>
    </div>
  );
}
