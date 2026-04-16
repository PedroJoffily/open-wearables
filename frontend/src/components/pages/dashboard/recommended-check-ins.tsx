import { Calendar, Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { useCheckIns } from '@/hooks/api/use-ai';

export interface RecommendedCheckInsProps {
  className?: string;
}

function formatAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function RecommendedCheckIns({ className }: RecommendedCheckInsProps) {
  const { data, isLoading } = useCheckIns();
  const items = data?.items ?? [];

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Recommended Check-ins
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Clients who may need outreach
          </p>
        </div>
        {items.length > 0 && (
          <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {items.length}
          </span>
        )}
      </div>
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {isLoading && (
          <div className="px-5 py-8 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-foreground-muted mb-2" />
            <p className="text-sm text-foreground-muted">Loading...</p>
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-foreground-muted">
              No check-ins needed right now.
            </p>
          </div>
        )}
        {items.map((item) => {
          const initials = item.member_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <Link
              key={item.recommendation_id}
              to="/users/$userId"
              params={{ userId: item.user_id }}
              className={cn(
                'flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors',
                item.overdue && 'border-l-2 border-l-destructive'
              )}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {initials}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {item.member_name}
                  </span>
                  {item.overdue && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive shrink-0">
                      Overdue
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground-muted truncate">
                  {item.reason}
                </p>
              </div>
              <span className="text-[10px] text-foreground-muted shrink-0">
                {formatAge(item.created_at)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
