import {
  AlertTriangle,
  MessageCircle,
  Trophy,
  TrendingDown,
  Radio,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIRecommendations } from '@/hooks/api/use-ai';
import type { AIRecommendation, RecommendationCategory } from '@/lib/api/ai-client';

export interface AIRecommendationsPanelProps {
  className?: string;
}

const categoryConfig: Record<
  RecommendationCategory,
  {
    icon: typeof AlertTriangle;
    borderClass: string;
    bgClass: string;
    badgeClass: string;
    label: string;
  }
> = {
  alert: {
    icon: AlertTriangle,
    borderClass: 'border-l-destructive',
    bgClass: 'bg-destructive/5',
    badgeClass: 'bg-destructive/10 text-destructive',
    label: 'Alert',
  },
  praise: {
    icon: Trophy,
    borderClass: 'border-l-success',
    bgClass: 'bg-success/5',
    badgeClass: 'bg-success/10 text-success',
    label: 'Praise',
  },
  nudge: {
    icon: TrendingDown,
    borderClass: 'border-l-warning',
    bgClass: 'bg-warning/5',
    badgeClass: 'bg-warning/10 text-warning',
    label: 'Nudge',
  },
  check_in: {
    icon: MessageCircle,
    borderClass: 'border-l-primary',
    bgClass: 'bg-primary/5',
    badgeClass: 'bg-primary/10 text-primary',
    label: 'Check-in',
  },
  sync: {
    icon: Radio,
    borderClass: 'border-l-foreground-muted',
    bgClass: 'bg-muted/30',
    badgeClass: 'bg-muted text-foreground-muted',
    label: 'Sync',
  },
};

// Fallback mock data
const MOCK_RECOMMENDATIONS: Partial<AIRecommendation>[] = [
  {
    id: '1',
    category: 'alert',
    severity: 'critical',
    member_name: 'Alex Rivera',
    message: 'Sleep below 5h for 3 consecutive nights',
    action_text: 'Check recovery protocol',
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: '2',
    category: 'praise',
    severity: 'info',
    member_name: 'Jordan Kim',
    message: 'Hit a 7-day workout streak — best this quarter!',
    action_text: 'Send encouragement',
    created_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
  },
  {
    id: '3',
    category: 'nudge',
    severity: 'warning',
    member_name: 'Sam Patel',
    message: 'Daily steps dropped 35% this week',
    action_text: 'Worth a message',
    created_at: new Date(Date.now() - 6 * 3600_000).toISOString(),
  },
  {
    id: '4',
    category: 'check_in',
    severity: 'info',
    member_name: 'Casey Brooks',
    message: 'No workouts logged in 10 days — unusual pattern',
    action_text: 'Schedule check-in',
    created_at: new Date(Date.now() - 12 * 3600_000).toISOString(),
  },
  {
    id: '5',
    category: 'sync',
    severity: 'info',
    member_name: 'Morgan Lee',
    message: 'No device sync in 48+ hours',
    action_text: 'Remind to sync device',
    created_at: new Date(Date.now() - 24 * 3600_000).toISOString(),
  },
];

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AIRecommendationsPanel({ className }: AIRecommendationsPanelProps) {
  const { data, isError } = useAIRecommendations();

  const recs = data?.items?.length
    ? data.items
    : (MOCK_RECOMMENDATIONS as AIRecommendation[]);

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
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              AI Recommendations
            </h2>
          </div>
          <p className="text-xs text-foreground-muted mt-1">
            Proactive coaching insights for your members
          </p>
        </div>
        {recs.length > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {recs.length}
          </span>
        )}
      </div>
      <div className="divide-y divide-border">
        {recs.length > 0 ? (
          recs.map((rec) => {
            const config =
              categoryConfig[rec.category as RecommendationCategory] ||
              categoryConfig.check_in;
            const Icon = config.icon;
            return (
              <div
                key={rec.id}
                className={cn(
                  'px-6 py-3 border-l-2 transition-colors hover:bg-secondary/30',
                  config.borderClass,
                  config.bgClass
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-4 w-4 text-foreground-muted mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {rec.member_name}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                          config.badgeClass
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-secondary">
                      {rec.message}
                    </p>
                    {rec.action_text && (
                      <p className="text-[10px] text-primary font-medium mt-1">
                        {rec.action_text}
                      </p>
                    )}
                    <p className="text-[10px] text-foreground-muted mt-0.5">
                      {formatTimeAgo(rec.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-foreground-muted">
              No recommendations right now. All members look healthy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
