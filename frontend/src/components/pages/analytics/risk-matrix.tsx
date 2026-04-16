import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { useRiskMatrix } from '@/hooks/api/use-portfolio';
import type { RiskMatrixEntry } from '@/lib/api/ai-client';

export interface RiskMatrixProps {
  className?: string;
}

const QUADRANT_LABELS: Record<string, { label: string; color: string }> = {
  'high-high': { label: 'Optimal', color: 'bg-green-500' },
  'high-low': { label: 'Overreaching', color: 'bg-amber-500' },
  'low-high': { label: 'Undertrained', color: 'bg-blue-500' },
  'low-low': { label: 'At Risk', color: 'bg-red-500' },
};

function Dot({ entry }: { entry: RiskMatrixEntry }) {
  const quadrant = QUADRANT_LABELS[entry.quadrant] || QUADRANT_LABELS['high-high'];
  const initials = entry.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Map scores (0-100) to percentage positions
  const x = entry.activity_score;
  const y = entry.recovery_score;

  return (
    <Link
      to="/users/$userId"
      params={{ userId: entry.user_id }}
      className="absolute group"
      style={{
        left: `${x}%`,
        bottom: `${y}%`,
        transform: 'translate(-50%, 50%)',
      }}
    >
      <div
        className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm transition-transform hover:scale-125',
          quadrant.color
        )}
        title={`${entry.name}: Activity ${entry.activity_score}, Recovery ${entry.recovery_score}`}
      >
        {initials}
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-card border border-border rounded text-[10px] text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-10">
        {entry.name}
      </div>
    </Link>
  );
}

export function RiskMatrix({ className }: RiskMatrixProps) {
  const { data, isLoading, isError, error } = useRiskMatrix();
  const entries = data ?? [];

  const quadrantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      counts[e.quadrant] = (counts[e.quadrant] || 0) + 1;
    });
    return counts;
  }, [entries]);

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          Activity vs Recovery Matrix
        </h2>
        <p className="text-xs text-foreground-muted mt-0.5">
          Client positioning by score quadrant
        </p>
      </div>
      <div className="p-5">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-foreground-muted">Loading risk matrix...</p>
          </div>
        ) : isError ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-red-500">Error: {(error as Error)?.message ?? 'Unknown error'}</p>
          </div>
        ) : entries.length > 0 ? (
          <>
            {/* Matrix grid */}
            <div className="relative aspect-square max-w-[400px] mx-auto border border-border rounded-lg overflow-hidden">
              {/* Quadrant backgrounds */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className="bg-blue-50/50 border-b border-r border-border/50" />
                <div className="bg-green-50/50 border-b border-border/50" />
                <div className="bg-red-50/50 border-r border-border/50" />
                <div className="bg-amber-50/50" />
              </div>
              {/* Quadrant labels */}
              <div className="absolute top-2 left-2 text-[9px] text-blue-500 font-medium">
                Undertrained
              </div>
              <div className="absolute top-2 right-2 text-[9px] text-green-600 font-medium">
                Optimal
              </div>
              <div className="absolute bottom-2 left-2 text-[9px] text-red-500 font-medium">
                At Risk
              </div>
              <div className="absolute bottom-2 right-2 text-[9px] text-amber-600 font-medium">
                Overreaching
              </div>
              {/* Axis labels */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-1 text-[10px] text-foreground-muted">
                Activity Score
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-1 text-[10px] text-foreground-muted [writing-mode:vertical-lr] rotate-180">
                Recovery Score
              </div>
              {/* Dots */}
              <div className="absolute inset-0">
                {entries.map((entry) => (
                  <Dot key={entry.user_id} entry={entry} />
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center">
              {Object.entries(QUADRANT_LABELS).map(([key, { label, color }]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
                  <span className="text-xs text-foreground-muted">
                    {label} ({quadrantCounts[key] || 0})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-foreground-muted">
              No matrix data available yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
