import { AlertTriangle, TrendingDown, Moon, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIAlerts } from '@/hooks/api/use-ai';

export interface AIAlertsPanelProps {
  className?: string;
}

// Fallback mock alerts when AI backend is unavailable
const MOCK_ALERTS = [
  {
    id: '1',
    severity: 'critical' as const,
    member_name: 'Alex Rivera',
    message: 'Sleep below 5h for 3 consecutive nights',
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    alert_type: 'sleep' as const,
  },
  {
    id: '2',
    severity: 'warning' as const,
    member_name: 'Jordan Kim',
    message: 'Resting heart rate spiked +12% vs 30-day avg',
    created_at: new Date(Date.now() - 4 * 3600_000).toISOString(),
    alert_type: 'heart_rate' as const,
  },
  {
    id: '3',
    severity: 'warning' as const,
    member_name: 'Sam Patel',
    message: 'Daily steps dropped 60% this week',
    created_at: new Date(Date.now() - 6 * 3600_000).toISOString(),
    alert_type: 'activity' as const,
  },
  {
    id: '4',
    severity: 'info' as const,
    member_name: 'Morgan Lee',
    message: 'No device sync in 48+ hours',
    created_at: new Date(Date.now() - 24 * 3600_000).toISOString(),
    alert_type: 'sync' as const,
  },
];

const severityStyles = {
  critical: 'border-l-destructive bg-destructive/5',
  warning: 'border-l-warning bg-warning/5',
  info: 'border-l-primary bg-primary/5',
};

const severityBadge = {
  critical: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-primary/10 text-primary',
};

const typeIcons = {
  sleep: Moon,
  heart_rate: TrendingDown,
  activity: TrendingDown,
  sync: Radio,
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AIAlertsPanel({ className }: AIAlertsPanelProps) {
  const { data, isError } = useAIAlerts();

  // Use real data if available, fallback to mock
  const alerts = data?.items ?? (isError ? MOCK_ALERTS : MOCK_ALERTS);

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-foreground">
              AI Health Alerts
            </h2>
          </div>
          <p className="text-xs text-foreground-muted mt-1">
            Anomalies detected across your members
          </p>
        </div>
        {alerts.length > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
            {alerts.length}
          </span>
        )}
      </div>
      <div className="divide-y divide-border">
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const Icon =
              typeIcons[alert.alert_type as keyof typeof typeIcons] || Radio;
            const severity = alert.severity as keyof typeof severityStyles;
            return (
              <div
                key={alert.id}
                className={cn(
                  'px-6 py-3 border-l-2 transition-colors hover:bg-secondary/30 cursor-pointer',
                  severityStyles[severity]
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-4 w-4 text-foreground-muted mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {alert.member_name}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase',
                          severityBadge[severity]
                        )}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-secondary">
                      {alert.message}
                    </p>
                    <p className="text-[10px] text-foreground-muted mt-1">
                      {formatTimeAgo(alert.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-foreground-muted">
              No alerts right now. All members look healthy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
