import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIRecommendations, useResolveRecommendation } from '@/hooks/api/use-ai';
import { categoryConfig } from '@/lib/constants/recommendation-categories';
import type { AIRecommendation, RecommendationCategory } from '@/lib/api/ai-client';

const searchSchema = z.object({
  resolved: z.boolean().optional().default(false),
  category: z.string().optional(),
  sort: z.enum(['created_at', 'severity', 'member_name']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute('/_authenticated/recommendations')({
  component: RecommendationsPage,
  validateSearch: searchSchema,
});

const PAGE_SIZE = 20;

const ALL_CATEGORIES: RecommendationCategory[] = ['alert', 'check_in', 'nudge', 'praise', 'sync'];

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function RecommendationsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resolving, setResolving] = useState<Set<string>>(new Set());

  const resolved = search.resolved ?? false;
  const activeCategories = search.category
    ? (search.category.split(',').filter(Boolean) as RecommendationCategory[])
    : undefined;
  const sortBy = (search.sort ?? 'created_at') as 'created_at' | 'severity' | 'member_name';
  const sortOrder = (search.order ?? 'desc') as 'asc' | 'desc';
  const page = search.page ?? 1;
  const offset = (page - 1) * PAGE_SIZE;

  const { data, isLoading } = useAIRecommendations(
    resolved,
    activeCategories,
    PAGE_SIZE,
    offset,
    sortBy,
    sortOrder,
  );
  const resolveRec = useResolveRecommendation();

  const recs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const updateSearch = (updates: Record<string, unknown>) => {
    navigate({
      search: (prev: Record<string, unknown>) => ({ ...prev, ...updates }),
    });
  };

  const toggleCategory = (cat: RecommendationCategory) => {
    const current = new Set(activeCategories ?? []);
    if (current.has(cat)) {
      current.delete(cat);
    } else {
      current.add(cat);
    }
    updateSearch({
      category: current.size > 0 ? [...current].join(',') : undefined,
      page: 1,
    });
  };

  const handleResolve = async (recId: string) => {
    if (resolving.has(recId)) return;
    setResolving((prev) => new Set(prev).add(recId));
    try {
      await resolveRec.mutateAsync(recId);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(recId);
        return next;
      });
    } finally {
      setResolving((prev) => {
        const next = new Set(prev);
        next.delete(recId);
        return next;
      });
    }
  };

  const handleBulkResolve = async () => {
    const ids = [...selectedIds];
    await Promise.allSettled(ids.map((id) => handleResolve(id)));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === recs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recs.map((r) => r.id)));
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AI Recommendations
            </h1>
          </div>
          <p className="text-sm text-foreground-secondary mt-1">
            {total} {resolved ? 'resolved' : 'pending'} recommendation{total !== 1 ? 's' : ''}
          </p>
        </div>
        {selectedIds.size > 0 && !resolved && (
          <button
            type="button"
            onClick={handleBulkResolve}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            Resolve Selected ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Resolved toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => updateSearch({ resolved: false, page: 1 })}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
              !resolved
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            Unresolved
          </button>
          <button
            type="button"
            onClick={() => updateSearch({ resolved: true, page: 1 })}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
              resolved
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            Resolved
          </button>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5">
          {ALL_CATEGORIES.map((cat) => {
            const config = categoryConfig[cat];
            const isActive = activeCategories?.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer',
                  isActive
                    ? `${config.badgeClass} border-transparent`
                    : 'text-foreground-muted border-border hover:border-foreground-muted'
                )}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [newSort, newOrder] = e.target.value.split(':');
            updateSearch({ sort: newSort, order: newOrder, page: 1 });
          }}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-muted border-0 text-foreground cursor-pointer"
        >
          <option value="created_at:desc">Newest First</option>
          <option value="created_at:asc">Oldest First</option>
          <option value="severity:desc">Severity (High to Low)</option>
          <option value="severity:asc">Severity (Low to High)</option>
          <option value="member_name:asc">Name (A-Z)</option>
          <option value="member_name:desc">Name (Z-A)</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Select all header */}
        {!resolved && recs.length > 0 && (
          <div className="px-6 py-2 border-b border-border bg-muted/30 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.size === recs.length && recs.length > 0}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 rounded border-border cursor-pointer"
            />
            <span className="text-[10px] text-foreground-muted">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : 'Select all'}
            </span>
          </div>
        )}

        {isLoading && (
          <div className="px-6 py-12 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-foreground-muted mb-2" />
            <p className="text-sm text-foreground-muted">Loading recommendations...</p>
          </div>
        )}

        {!isLoading && recs.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-foreground-muted">
              {resolved
                ? 'No resolved recommendations found.'
                : 'No pending recommendations. All clients look healthy!'}
            </p>
          </div>
        )}

        <div className="divide-y divide-border">
          {recs.map((rec: AIRecommendation) => {
            const config =
              categoryConfig[rec.category as RecommendationCategory] ||
              categoryConfig.check_in;
            const Icon = config.icon;
            const isResolving = resolving.has(rec.id);
            const isSelected = selectedIds.has(rec.id);

            const initials = rec.member_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={rec.id}
                className={cn(
                  'px-6 py-4 flex items-start gap-4 transition-colors hover:bg-secondary/30',
                  isSelected && 'bg-primary/5'
                )}
              >
                {!resolved && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(rec.id)}
                    className="h-3.5 w-3.5 rounded border-border mt-1 shrink-0 cursor-pointer"
                  />
                )}
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">{initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {rec.member_name}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                        config.badgeClass
                      )}
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {config.label}
                    </span>
                    {rec.severity === 'critical' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-secondary">{rec.message}</p>
                  {rec.action_text && (
                    <p className="text-[10px] text-primary font-medium mt-1">
                      {rec.action_text}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-foreground-muted">
                    {formatTimeAgo(rec.created_at)}
                  </span>
                  {!resolved && (
                    <button
                      type="button"
                      onClick={() => handleResolve(rec.id)}
                      disabled={isResolving}
                      className="p-1.5 rounded-lg hover:bg-success/10 text-foreground-muted hover:text-success transition-colors disabled:opacity-50 cursor-pointer"
                      title="Resolve"
                    >
                      {isResolving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground-muted">
            Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => updateSearch({ page: page - 1 })}
              disabled={page <= 1}
              className="p-2 rounded-lg hover:bg-muted text-foreground-muted disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => updateSearch({ page: pageNum })}
                  className={cn(
                    'h-8 w-8 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                    page === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground-muted hover:bg-muted'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => updateSearch({ page: page + 1 })}
              disabled={page >= totalPages}
              className="p-2 rounded-lg hover:bg-muted text-foreground-muted disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
