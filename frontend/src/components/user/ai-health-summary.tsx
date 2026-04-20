import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHealthSummary } from '@/hooks/api/use-ai';

interface AIHealthSummaryProps {
  userId: string;
  memberName: string;
}

export function AIHealthSummary({ userId, memberName }: AIHealthSummaryProps) {
  const period = 30;
  const { data, isLoading, isError, refetch, isFetching } =
    useHealthSummary(userId, period);

  const summary = data?.summary ?? null;
  const actualPeriod = data?.period_days ?? period;

  // Show error state instead of hiding
  if (isError && !summary) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-foreground-muted" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground mb-1.5">
                  AI Health Summary
                </h3>
                <p className="text-sm text-foreground-muted">
                  Summary temporarily unavailable. Click refresh to retry.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="shrink-0 text-foreground-muted hover:text-foreground"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-sm font-semibold text-foreground">
                  AI Health Summary
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                  Last {actualPeriod} days
                </span>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating summary...
                </div>
              ) : summary ? (
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  {summary}
                </p>
              ) : (
                <p className="text-sm text-foreground-muted">
                  No health data available yet for this member.
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0 text-foreground-muted hover:text-foreground"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
