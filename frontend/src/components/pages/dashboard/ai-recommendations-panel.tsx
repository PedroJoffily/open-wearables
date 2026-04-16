import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  X,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIRecommendations, useResolveRecommendation } from '@/hooks/api/use-ai';
import { categoryConfig } from '@/lib/constants/recommendation-categories';
import type { AIRecommendation, RecommendationCategory } from '@/lib/api/ai-client';

export interface AIRecommendationsPanelProps {
  className?: string;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AIRecommendationsPanel({ className }: AIRecommendationsPanelProps) {
  const { data, isLoading } = useAIRecommendations(false, undefined, 10);
  const resolveRec = useResolveRecommendation();
  const [resolving, setResolving] = useState<Set<string>>(new Set());

  const recs = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleResolve = async (recId: string) => {
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

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden flex flex-col',
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
            Proactive coaching insights — check to resolve
          </p>
        </div>
        {total > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {total}
          </span>
        )}
      </div>
      <div className="divide-y divide-border flex-1 max-h-[400px] overflow-y-auto">
        {isLoading && (
          <div className="px-6 py-8 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-foreground-muted mb-2" />
            <p className="text-sm text-foreground-muted">Loading...</p>
          </div>
        )}
        {!isLoading && recs.length === 0 && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-foreground-muted">
              No recommendations right now. All clients look healthy.
            </p>
          </div>
        )}
        {recs.map((rec: AIRecommendation) => {
          const config =
            categoryConfig[rec.category as RecommendationCategory] ||
            categoryConfig.check_in;
          const Icon = config.icon;
          const isResolving = resolving.has(rec.id);

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
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <button
                    type="button"
                    onClick={() => handleResolve(rec.id)}
                    disabled={isResolving}
                    className="p-1 rounded hover:bg-success/10 text-foreground-muted hover:text-success transition-colors disabled:opacity-50 cursor-pointer"
                    title="Resolve"
                  >
                    {isResolving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(rec.id)}
                    disabled={isResolving}
                    className="p-1 rounded hover:bg-muted text-foreground-muted hover:text-foreground-secondary transition-colors disabled:opacity-50 cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {total > recs.length && (
        <div className="px-6 py-3 border-t border-border">
          <Link
            to="/recommendations"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All Recommendations ({total})
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
