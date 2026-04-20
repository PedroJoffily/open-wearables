import { Dumbbell, Moon, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { useActivityFeed } from '@/hooks/api/use-portfolio';
import type { ActivityFeedItem } from '@/lib/api/ai-client';

export interface ActivityFeedPanelProps {
  className?: string;
}

const eventTypeConfig: Record<
  string,
  { icon: typeof Dumbbell; iconClass: string; tab: string }
> = {
  workout: { icon: Dumbbell, iconClass: 'text-primary', tab: 'activity' },
  sleep: { icon: Moon, iconClass: 'text-purple-500', tab: 'sleep' },
  score_up: { icon: TrendingUp, iconClass: 'text-trend-positive', tab: 'overview' },
  score_down: { icon: TrendingDown, iconClass: 'text-trend-negative', tab: 'overview' },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function FeedItem({ item }: { item: ActivityFeedItem }) {
  const config = eventTypeConfig[item.event_type] || eventTypeConfig.workout;
  const Icon = config.icon;

  return (
    <Link
      to="/users/$userId"
      params={{ userId: item.user_id }}
      search={{ tab: config.tab }}
      className="flex items-start gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors"
    >
      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{item.user_name}</span>{' '}
          <span className="text-foreground-secondary">{item.title}</span>
        </p>
        {item.description && (
          <p className="text-xs text-foreground-muted mt-0.5">
            {item.description}
          </p>
        )}
      </div>
      <span className="text-[10px] text-foreground-muted shrink-0 mt-1">
        {formatTimeAgo(item.timestamp)}
      </span>
    </Link>
  );
}

export function ActivityFeedPanel({ className }: ActivityFeedPanelProps) {
  const { data, isLoading } = useActivityFeed(15);
  const items = data?.items ?? [];

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Clock className="h-4 w-4 text-foreground-muted" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Activity Feed
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Recent client events
          </p>
        </div>
      </div>
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3">
              <div className="h-7 w-7 rounded-lg bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted/50 animate-pulse rounded" />
              </div>
            </div>
          ))
        ) : items.length > 0 ? (
          items.map((item) => <FeedItem key={item.id} item={item} />)
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-foreground-muted">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
