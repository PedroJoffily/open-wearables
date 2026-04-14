import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserRead } from '@/lib/api/types';

export interface RecentUsersSectionProps {
  users: UserRead[];
  totalUsersCount: number;
  isLoading?: boolean;
  className?: string;
}

export function RecentUsersSection({
  users,
  totalUsersCount,
  isLoading,
  className,
}: RecentUsersSectionProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden',
        className
      )}
    >
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Recent Members</h2>
        <p className="text-xs text-foreground-muted mt-1">
          Total members: {totalUsersCount}
        </p>
      </div>
      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 w-32 bg-muted rounded mb-1" />
                <div className="h-3 w-48 bg-muted/50 rounded" />
              </div>
            ))}
          </div>
        ) : users.length > 0 ? (
          users.map((user) => {
            const userName =
              user.first_name || user.last_name
                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                : user.email || 'Unknown Member';
            const date = new Date(user.created_at);
            const formattedDate = isNaN(date.getTime())
              ? 'Invalid date'
              : format(date, 'MMM d, yyyy');
            return (
              <div key={user.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {userName}
                  </p>
                  <p className="text-xs text-foreground-secondary">
                    {user.email || user.external_user_id || 'No email'}
                  </p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Created on {formattedDate}
                  </p>
                </div>
                <span className="text-xs font-medium text-status-online">Active</span>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-[200px] text-foreground-muted">
            <p className="text-sm">No members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
