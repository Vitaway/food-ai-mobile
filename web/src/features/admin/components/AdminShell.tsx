import { Link, NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth';
import { ADMIN_ROUTES, AUTH_ROUTES } from '@/features/auth/constants';
import { useAdminMetrics } from '@/features/admin/hooks/useAdminQueries';

const nav = [
  { to: ADMIN_ROUTES.dashboard, label: 'Overview', end: true },
  { to: ADMIN_ROUTES.coaches, label: 'Coaches', end: false },
  { to: ADMIN_ROUTES.users, label: 'Consumers', end: false },
  { to: ADMIN_ROUTES.system, label: 'System', end: false },
];

function NavIcon({ label }: { label: string }) {
  if (label === 'Overview') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm8 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
      </svg>
    );
  }
  if (label === 'Coaches') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    );
  }
  if (label === 'Consumers') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

function HeaderNav({ className }: { className?: string }) {
  const { data: metrics } = useAdminMetrics();

  return (
    <nav className={cn('flex items-center gap-2', className)}>
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-normal transition-colors sm:px-5 sm:py-3',
              isActive
                ? 'bg-white text-blue-spruce-800 shadow-sm'
                : 'text-white/85 hover:bg-white/10 hover:text-white',
            )
          }>
          <NavIcon label={item.label} />
          <span>{item.label}</span>
          {item.to === ADMIN_ROUTES.coaches && metrics?.coaches ? (
            <span className="rounded-full bg-shamrock-500 px-2 py-0.5 text-xs font-normal text-white">
              {metrics.coaches}
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminShell() {
  const { data: metrics } = useAdminMetrics();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-ash-grey-50">
      <header className="sticky top-0 z-40 border-b border-blue-spruce-900/40 bg-gradient-to-r from-blue-spruce-900 via-blue-spruce-800 to-blue-spruce-900 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4 py-2 sm:h-[4.5rem] sm:gap-8 sm:py-3">
            <div className="min-w-0 shrink-0 pr-2 sm:pr-4">
              <Link to="/" className="block hover:opacity-90">
                <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">MiraFood</p>
                <p className="truncate text-sm font-normal sm:text-base">Platform Admin</p>
              </Link>
            </div>

            <div className="hidden flex-1 justify-center px-4 md:flex lg:px-8">
              <div className="rounded-2xl bg-white/10 p-1.5 backdrop-blur-sm">
                <HeaderNav />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {metrics ? (
                <div className="hidden rounded-xl bg-white/10 px-4 py-2 text-xs font-medium sm:block">
                  <span className="font-normal">{metrics.meals.inReview}</span> meals in review
                </div>
              ) : null}
              <div className="hidden text-right sm:block">
                <p className="text-xs text-white/60">Signed in as</p>
                <p className="text-sm font-normal">{user?.displayName ?? 'Admin'}</p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-xl px-3 py-2 text-xs text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                Sign out
              </button>
            </div>
          </div>

          <div className="border-t border-white/10 px-1 pb-4 pt-3 md:hidden">
            <div className="overflow-x-auto">
              <div className="inline-flex min-w-full rounded-2xl bg-white/10 p-1.5">
                <HeaderNav />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-ash-grey-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <div className="text-center sm:text-left">
            <p className="font-normal text-ash-grey-900">MiraFood · Vitaway</p>
            <p className="mt-0.5 text-sm text-ash-grey-500">Platform administration</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-ash-grey-500">
            <Link to="/" className="hover:text-blue-spruce-600">
              MiraFood home
            </Link>
            <Link to={AUTH_ROUTES.login} className="hover:text-blue-spruce-600">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
