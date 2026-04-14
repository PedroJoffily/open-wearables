import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface DashboardErrorStateProps {
  onRetry: () => void;
  className?: string;
}

export function DashboardErrorState({
  onRetry,
  className,
}: DashboardErrorStateProps) {
  return (
    <div className={cn('p-8', className)}>
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-foreground-secondary mb-4">
          Failed to load dashboard data. Please try again.
        </p>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}
