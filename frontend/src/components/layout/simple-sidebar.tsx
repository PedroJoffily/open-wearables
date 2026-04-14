import { Link, useLocation } from '@tanstack/react-router';
import {
  Users,
  BarChart3,
  Heart,
  LogOut,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/lib/constants/routes';

const menuItems = [
  {
    title: 'Members',
    url: ROUTES.users,
    icon: Users,
  },
  {
    title: 'Overview',
    url: ROUTES.dashboard,
    icon: BarChart3,
  },
  {
    title: 'Settings',
    url: ROUTES.settings,
    icon: Settings,
  },
];

export function SimpleSidebar() {
  const location = useLocation();
  const { logout, isLoggingOut } = useAuth();

  return (
    <aside className="relative w-64 bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Header — Org + Role */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary-muted flex items-center justify-center">
            <Heart className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">Longevity Lab</p>
            <span className="inline-flex items-center text-[10px] font-medium text-primary px-1.5 py-0.5 rounded bg-primary-muted">
              Coach
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
          Navigation
        </p>
        {menuItems.map((item) => {
          const isActive =
            item.url === ROUTES.dashboard
              ? location.pathname === ROUTES.dashboard
              : location.pathname.startsWith(item.url);

          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary-muted text-primary font-medium'
                  : 'text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive ? 'text-primary' : 'text-sidebar-muted'
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — Coach info + logout */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="h-8 w-8 rounded-full bg-primary-muted flex items-center justify-center text-xs font-semibold text-primary">
            SC
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Sarah Chen</p>
            <p className="text-xs text-sidebar-muted">Coach</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-sidebar-muted hover:text-destructive hover:bg-destructive-muted transition-colors cursor-pointer disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? 'Logging out\u2026' : 'Logout'}
        </button>
      </div>
    </aside>
  );
}
