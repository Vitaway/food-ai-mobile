import { Link, NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useCoachStats } from '@/hooks/useCoachQueries';
import { useCoachProfile } from '@/hooks/useCoachProfile';
import { useAuth } from '@/features/auth';
import { NavbarAvatar } from '@/components/ui/AvatarUpload';

const nav = [
  { to: '/coach', label: 'Overview', end: true },
  { to: '/coach/queue', label: 'Review queue', end: false },
];

function NavIcon({ name }: { name: string }) {
  if (name === 'Overview') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm8 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path
        fillRule="evenodd"
        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function HeaderNav({ className }: { className?: string }) {
  const { data: stats } = useCoachStats();

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
                ? 'bg-white text-blue-spruce-700 shadow-sm'
                : 'text-white/85 hover:bg-white/10 hover:text-white',
            )
          }>
          <NavIcon name={item.label} />
          <span>{item.label}</span>
          {item.to === '/coach/queue' && stats?.inReview ? (
            <span className="rounded-full bg-cinnamon-wood-400 px-2 py-0.5 text-xs font-normal text-white">
              {stats.inReview}
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}

function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-ash-grey-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <div className="text-center sm:text-left">
          <p className="font-normal text-ash-grey-900">MiraFood · Vitaway</p>
          <p className="mt-0.5 text-sm text-ash-grey-500">Coach dashboard for meal review & client care</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-ash-grey-500">
          <span>© {year} Vitaway</span>
          <span className="hidden h-4 w-px bg-ash-grey-200 sm:block" />
          <a href="mailto:support@vitaway.org" className="hover:text-blue-spruce-600">
            Support
          </a>
          <Link to="/privacy" className="hover:text-blue-spruce-600">
            Privacy
          </Link>
          <Link to="/" className="hover:text-blue-spruce-600">
            MiraFood home
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function AppShell() {
  const { data: stats } = useCoachStats();
  const { data: profile } = useCoachProfile();
  const { user, logout } = useAuth();
  const displayName = profile?.displayName ?? user?.displayName ?? 'Coach';

  return (
    <div className="flex min-h-screen flex-col bg-ash-grey-50">
      <header className="sticky top-0 z-40 border-b border-blue-spruce-800/30 bg-blue-spruce-700 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4 py-2 sm:h-[4.5rem] sm:gap-8 sm:py-3">
            <div className="min-w-0 shrink-0 pr-2 sm:pr-4">
              <Link to="/" className="block hover:opacity-90">
                <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">MiraFood</p>
                <p className="truncate text-sm font-normal sm:text-base">Coach Dashboard</p>
              </Link>
            </div>

            <div className="hidden flex-1 justify-center px-4 md:flex lg:px-8">
              <div className="rounded-2xl bg-white/10 p-1.5">
                <HeaderNav />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {stats ? (
                <div className="hidden rounded-xl bg-white/10 px-4 py-2 text-xs font-medium sm:block">
                  <span className="font-normal">{stats.inReview}</span> in review
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-xl px-3 py-2 text-xs text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                Sign out
              </button>
              <NavLink
                to="/coach/profile"
                title="Profile & settings"
                className={({ isActive }) =>
                  cn(
                    'rounded-full transition ring-2 ring-offset-2 ring-offset-blue-spruce-700',
                    isActive ? 'ring-white/70' : 'ring-transparent hover:ring-white/25',
                  )
                }>
                <NavbarAvatar name={displayName} imageUrl={profile?.avatarUrl} />
              </NavLink>
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

      <AppFooter />
    </div>
  );
}
