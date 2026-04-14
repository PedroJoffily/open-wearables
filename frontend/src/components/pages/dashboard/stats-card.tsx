import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  description: string;
  icon: LucideIcon;
  growth?: number;
  decimalPlaces?: number;
  className?: string;
}

export function StatsCard({
  title,
  value,
  suffix,
  description,
  icon: Icon,
  growth,
  decimalPlaces = 0,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-6',
        'hover:border-border-hover hover:shadow-md transition-all group',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-foreground-secondary">{title}</span>
        <Icon className="h-4 w-4 text-foreground-muted group-hover:text-foreground-secondary transition-colors" />
      </div>
      <div className="text-2xl font-bold text-foreground">
        <NumberTicker
          value={value}
          decimalPlaces={decimalPlaces}
          className="text-foreground"
        />
        {suffix && <span className="text-foreground-muted ml-0.5">{suffix}</span>}
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-foreground-muted">{description}</p>
        {growth !== undefined && (
          <div
            className={cn(
              'flex items-center text-xs font-medium',
              growth >= 0 ? 'text-trend-positive' : 'text-trend-negative'
            )}
          >
            {growth >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            <span>{Math.abs(growth).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
