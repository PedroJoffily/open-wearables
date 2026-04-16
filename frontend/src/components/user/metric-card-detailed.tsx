import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/common/sparkline';
import { TrendIndicator } from '@/components/common/trend-indicator';

interface MetricCardDetailedProps {
  title: string;
  value: string | number;
  unit?: string;
  sparklineData?: number[];
  trend?: number;
  icon?: LucideIcon;
  className?: string;
}

export function MetricCardDetailed({
  title,
  value,
  unit,
  sparklineData,
  trend,
  icon: Icon,
  className,
}: MetricCardDetailedProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl shadow-sm border border-border p-4',
        className
      )}
    >
      {/* Icon + Title */}
      <div className="flex items-start gap-3 mb-3">
        {Icon && (
          <div className="flex-shrink-0 p-2 bg-primary-muted rounded-lg">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
        <span className="text-xs font-medium text-foreground-muted mt-1.5">{title}</span>
      </div>

      {/* Value */}
      <div className="mb-3">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {unit && (
          <span className="text-sm text-foreground-muted ml-1">{unit}</span>
        )}
      </div>

      {/* Bottom row: trend left, sparkline right */}
      <div className="flex items-end justify-between">
        <div>
          {trend !== undefined && <TrendIndicator value={trend} />}
        </div>
        <div>
          {sparklineData && sparklineData.length >= 2 && (
            <Sparkline data={sparklineData} height={28} width={80} />
          )}
        </div>
      </div>
    </div>
  );
}
