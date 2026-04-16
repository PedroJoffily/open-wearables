import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  className?: string;
}

/**
 * Compact Recharts AreaChart wrapper — no axes, no grid, no labels.
 * Accepts a flat array of numbers and renders a filled sparkline.
 */
export function Sparkline({
  data,
  color = '#4F46E5',
  height = 32,
  width = 100,
  className,
}: SparklineProps) {
  const chartData = useMemo(
    () => data.map((value) => ({ value })),
    [data]
  );

  if (chartData.length < 2) return null;

  const gradientId = `sparkline-gradient-${color.replace('#', '')}`;

  return (
    <div className={cn('inline-block', className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
