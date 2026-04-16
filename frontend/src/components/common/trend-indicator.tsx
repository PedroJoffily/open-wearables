import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  value: number;
  suffix?: string;
  label?: string;
  className?: string;
}

/**
 * Displays a percentage change with a directional arrow icon.
 * Green + TrendingUp for positive, Red + TrendingDown for negative,
 * Gray + Minus for zero.
 */
export function TrendIndicator({
  value,
  suffix = '%',
  label,
  className,
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const colorClass = isPositive
    ? 'text-green-500'
    : isNegative
      ? 'text-red-500'
      : 'text-foreground-muted';

  const formattedValue = `${isPositive ? '+' : ''}${value}${suffix}`;

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', colorClass, className)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{formattedValue}</span>
      {label && <span className="text-foreground-muted font-normal">{label}</span>}
    </span>
  );
}
