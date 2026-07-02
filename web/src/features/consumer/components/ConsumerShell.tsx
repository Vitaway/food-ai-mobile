import { Link, NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth';
import { AUTH_ROUTES, CONSUMER_ROUTES } from '@/features/auth/constants';
import { useConsumerDashboard } from '@/features/consumer/hooks/useConsumerQueries';

const nav = [
  { to: CONSUMER_ROUTES.dashboard, label: 'Today', end: true },
  { to: CONSUMER_ROUTES.meals, label: 'Meals', end: false },
  { to: CONSUMER_ROUTES.profile, label: 'Profile', end: false },
];

export function ConsumerShell() {
  const { user, logout } = useAuth();
  const { data: dashboard } = useConsumerDashboard();

  return (
    <div className="flex min-h-screen flex-col bg-ash-grey-50">
      <header className="sticky top-0 z-40 border-b border-blue-spruce-900/40 bg-gradient-to-r from-blue-spruce-900 via-blue-spruce-800 to-blue-spruce-900 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Link to={CONSUMER_ROUTES.dashboard} className="text-lg font-bold tracking-tight">
              MiraFood
            </Link>
            {user?.patientId ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                {user.patientId}
              </span>
            ) : null}
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-white text-blue-spruce-800 shadow-sm'
                      : 'text-white/85 hover:bg-white/10',
                  )
                }>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {dashboard ? (
              <span className="text-white/80">
                {dashboard.caloriesConsumed}/{dashboard.calorieTarget} kcal
              </span>
            ) : null}
            <span className="text-white/90">{user?.displayName}</span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-white/90 hover:bg-white/20">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-ash-grey-200 bg-white py-4 text-center text-xs text-ash-grey-500">
        Need help?{' '}
        <Link to="/support" className="text-blue-spruce-600 hover:underline">
          Support
        </Link>{' '}
        ·{' '}
        <Link to={AUTH_ROUTES.login} className="text-blue-spruce-600 hover:underline">
          Switch account
        </Link>
      </footer>
    </div>
  );
}
