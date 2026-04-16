import { useState } from 'react';
import { AlertTriangle, ChevronRight, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { usePortfolioStats } from '@/hooks/api/use-portfolio';
import { useResolveRecommendation } from '@/hooks/api/use-ai';
import type { ClientAtRisk } from '@/lib/api/ai-client';

export interface ClientsAtRiskProps {
  className?: string;
}

const severityConfig: Record<string, { badge: string; label: string }> = {
  critical: { badge: 'bg-destructive/10 text-destructive', label: 'Critical' },
  warning: { badge: 'bg-warning/10 text-warning', label: 'Warning' },
  info: { badge: 'bg-primary/10 text-primary', label: 'Info' },
};

function ClientRiskRow({
  client,
  onResolve,
  isResolving,
}: {
  client: ClientAtRisk;
  onResolve: (recId: string) => void;
  isResolving: boolean;
}) {
  const config = severityConfig[client.severity] || severityConfig.info;
  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors group">
      <Link
        to="/users/$userId"
        params={{ userId: client.user_id }}
        className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
      >
        <span className="text-xs font-semibold text-primary">{initials}</span>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            to="/users/$userId"
            params={{ userId: client.user_id }}
            className="text-sm font-medium text-foreground truncate hover:underline"
          >
            {client.name}
          </Link>
          <span
            className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0',
              config.badge
            )}
          >
            {config.label}
          </span>
        </div>
        <p className="text-xs text-foreground-muted truncate">
          {client.risk_reason}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {client.recommendation_id && (
          <button
            type="button"
            onClick={() => onResolve(client.recommendation_id!)}
            disabled={isResolving}
            className="p-1 rounded hover:bg-success/10 text-foreground-muted hover:text-success transition-colors disabled:opacity-50 cursor-pointer opacity-0 group-hover:opacity-100"
            title="Resolve"
          >
            {isResolving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        <Link
          to="/users/$userId"
          params={{ userId: client.user_id }}
          className="p-1 rounded text-foreground-muted hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          title="View Details"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function ClientsAtRisk({ className }: ClientsAtRiskProps) {
  const { data } = usePortfolioStats();
  const resolveRec = useResolveRecommendation();
  const [resolving, setResolving] = useState<Set<string>>(new Set());
  const clients = data?.clients_at_risk ?? [];

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
        'bg-card border border-border rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Clients Needing Attention
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Flagged by health score trends
          </p>
        </div>
        {clients.length > 0 && (
          <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-warning/10 text-warning text-xs font-semibold">
            {clients.length}
          </span>
        )}
      </div>
      <div className="divide-y divide-border">
        {clients.length > 0 ? (
          clients.slice(0, 5).map((client) => (
            <ClientRiskRow
              key={client.user_id}
              client={client}
              onResolve={handleResolve}
              isResolving={resolving.has(client.recommendation_id ?? '')}
            />
          ))
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-foreground-muted">
              No clients need attention right now.
            </p>
          </div>
        )}
      </div>
      {clients.length > 0 && (
        <div className="px-5 py-3 border-t border-border">
          <Link
            to="/recommendations"
            search={{ category: 'alert,check_in' }}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
