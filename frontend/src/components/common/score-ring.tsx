import { cn } from '@/lib/utils';

interface ScoreRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

function getScoreColor(value: number): string {
  if (value > 75) return '#22C55E';
  if (value >= 50) return '#F59E0B';
  return '#EF4444';
}

/**
 * SVG circular progress ring with color-coded score display.
 * Green (>75), Amber (50-75), Red (<50).
 */
export function ScoreRing({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  showValue = true,
  className,
}: ScoreRingProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  const color = getScoreColor(clamped);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-border, #E5E7EB)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-semibold leading-none"
            style={{ color, fontSize: size * 0.25 }}
          >
            {Math.round(clamped)}
          </span>
          {label && (
            <span
              className="text-foreground-muted mt-0.5 leading-none"
              style={{ fontSize: Math.max(size * 0.12, 9) }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
