import { cn } from '@/lib/utils';

export interface DashboardLoadingStateProps {
  className?: string;
}

export function DashboardLoadingState({
  className,
}: DashboardLoadingStateProps) {
  return (
    <div className={cn('p-8 space-y-6', className)}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-foreground-secondary mt-1">Your studio overview and client health metrics</p>
      </div>

      {/* Stats grid skeleton — 6 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="animate-pulse space-y-3">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-7 w-14 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted/50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Clients at risk skeleton */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="animate-pulse h-4 w-48 bg-muted rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
              <div className="h-3 w-2/3 bg-muted/50 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Two-column skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <div className="animate-pulse h-4 w-36 bg-muted rounded" />
            </div>
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="animate-pulse h-10 bg-muted/50 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
