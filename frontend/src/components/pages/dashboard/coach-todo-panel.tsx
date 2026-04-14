import { useState } from 'react';
import { Circle, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIRecommendations, useResolveRecommendation } from '@/hooks/api/use-ai';
import type { AIRecommendation, RecommendationCategory } from '@/lib/api/ai-client';

export interface CoachTodoPanelProps {
  className?: string;
}

const categoryDot: Record<RecommendationCategory, string> = {
  alert: 'bg-destructive',
  nudge: 'bg-warning',
  check_in: 'bg-primary',
  praise: 'bg-success',
  sync: 'bg-foreground-muted',
};

export function CoachTodoPanel({ className }: CoachTodoPanelProps) {
  const { data, isLoading, isError } = useAIRecommendations(false);
  const resolveRec = useResolveRecommendation();
  const [resolving, setResolving] = useState<Set<string>>(new Set());

  const recs = data?.items ?? [];
  const pendingCount = recs.length;

  const handleToggle = async (recId: string) => {
    if (resolving.has(recId)) return;
    setResolving((prev) => new Set(prev).add(recId));
    try {
      await resolveRec.mutateAsync(recId);
    } finally {
      setResolving((prev) => {
        const next = new Set(prev);
        next.delete(recId);
        return next;
      });
    }
  };

  const hasRecs = recs.length > 0;
  const showEmpty = !isLoading && !hasRecs;

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
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Coach To-Do
            </h2>
          </div>
          <p className="text-xs text-foreground-muted mt-1">
            {hasRecs
              ? 'AI-powered coaching actions — click to resolve'
              : 'AI-suggested actions for your members'}
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {pendingCount}
          </span>
        )}
      </div>
      <div className="divide-y divide-border">
        {isLoading && (
          <div className="px-6 py-8 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-foreground-muted mb-2" />
            <p className="text-sm text-foreground-muted">Loading...</p>
          </div>
        )}
        {isError && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-foreground-muted">
              AI backend unavailable. Recommendations will appear after the next scan.
            </p>
          </div>
        )}
        {showEmpty && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-foreground-muted">
              All caught up! No pending actions.
            </p>
          </div>
        )}
        {recs.map((rec) => {
          const isResolving = resolving.has(rec.id);
          const dot = categoryDot[rec.category as RecommendationCategory] || 'bg-foreground-muted';

          return (
            <button
              key={rec.id}
              type="button"
              onClick={() => handleToggle(rec.id)}
              disabled={isResolving}
              className="w-full px-6 py-3 flex items-start gap-3 hover:bg-secondary/30 transition-colors cursor-pointer text-left disabled:opacity-60"
            >
              {isResolving ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-foreground-muted mt-0.5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {rec.member_name}
                  </span>
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />
                </div>
                <p className="text-xs text-foreground-secondary">
                  {rec.action_text ? `${rec.action_text} — ${rec.message}` : rec.message}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
