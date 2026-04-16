import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowUpDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortfolioStats } from '@/hooks/api/use-portfolio';
import type { ClientScore } from '@/lib/api/ai-client';

export interface ClientComparisonTableProps {
  className?: string;
}

type SortField = 'name' | 'sleep' | 'recovery' | 'severity';
type SortDir = 'asc' | 'desc';

function scoreColor(value: number | null) {
  if (value === null) return 'text-foreground-muted';
  if (value >= 75) return 'text-green-600';
  if (value >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBg(value: number | null) {
  if (value === null) return 'bg-muted';
  if (value >= 75) return 'bg-green-50';
  if (value >= 50) return 'bg-amber-50';
  return 'bg-red-50';
}

export function ClientComparisonTable({ className }: ClientComparisonTableProps) {
  const { data: portfolio, isLoading, isError, error } = usePortfolioStats();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Build rows from client_scores + risk data
  const rows = useMemo(() => {
    const scores = portfolio?.client_scores ?? [];
    const riskMap = new Map<string, { severity: string; risk_reason: string }>();
    (portfolio?.clients_at_risk ?? []).forEach((c) =>
      riskMap.set(c.user_id, { severity: c.severity, risk_reason: c.risk_reason })
    );

    return scores.map((cs: ClientScore) => {
      const risk = riskMap.get(cs.user_id);
      return {
        id: cs.user_id,
        name: cs.name,
        sleep_score: cs.sleep_score,
        recovery_score: cs.recovery_score,
        severity: risk?.severity ?? 'ok',
        risk_reason: risk?.risk_reason ?? null,
      };
    });
  }, [portfolio]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'sleep')
        cmp = (a.sleep_score ?? -1) - (b.sleep_score ?? -1);
      else if (sortField === 'recovery')
        cmp = (a.recovery_score ?? -1) - (b.recovery_score ?? -1);
      else if (sortField === 'severity')
        cmp = a.severity.localeCompare(b.severity);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return copy;
  }, [rows, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortHeader = ({
    field,
    label,
    align,
  }: {
    field: SortField;
    label: string;
    align?: string;
  }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors',
        align
      )}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          Client Comparison
        </h2>
        <p className="text-xs text-foreground-muted mt-0.5">
          {sorted.length} clients
        </p>
      </div>
      {isLoading && (
        <div className="px-5 py-8 text-center text-sm text-foreground-muted">Loading client scores...</div>
      )}
      {isError && (
        <div className="px-5 py-8 text-center text-sm text-red-500">Error: {(error as Error)?.message ?? 'Unknown error'}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left">
                <SortHeader field="name" label="Client" />
              </th>
              <th className="px-5 py-3 text-center">
                <SortHeader field="sleep" label="Sleep" align="justify-center" />
              </th>
              <th className="px-5 py-3 text-center">
                <SortHeader field="recovery" label="Recovery" align="justify-center" />
              </th>
              <th className="px-5 py-3 text-left">
                <SortHeader field="severity" label="Status" />
              </th>
              <th className="px-5 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-secondary/30 transition-colors"
              >
                <td className="px-5 py-3">
                  <Link
                    to="/users/$userId"
                    params={{ userId: row.id }}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[40px] px-2 py-0.5 rounded text-sm font-mono font-semibold',
                      scoreBg(row.sleep_score),
                      scoreColor(row.sleep_score)
                    )}
                  >
                    {row.sleep_score ?? '--'}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[40px] px-2 py-0.5 rounded text-sm font-mono font-semibold',
                      scoreBg(row.recovery_score),
                      scoreColor(row.recovery_score)
                    )}
                  >
                    {row.recovery_score ?? '--'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      row.severity === 'critical'
                        ? 'bg-destructive/10 text-destructive'
                        : row.severity === 'warning'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-green-50 text-green-600'
                    )}
                  >
                    {row.severity === 'ok' ? 'Healthy' : row.severity}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <Link
                    to="/users/$userId"
                    params={{ userId: row.id }}
                    className="text-foreground-muted hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
