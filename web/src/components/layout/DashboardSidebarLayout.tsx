import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { NavbarAvatar } from '@/components/ui/AvatarUpload';
import { cn } from '@/lib/utils';

export type SidebarNavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: React.ReactNode;
  badge?: React.ReactNode;
};

type DashboardSidebarLayoutProps = {
  brandName?: string;
  brandSubtitle: string;
  nav: SidebarNavItem[];
  userDisplayName?: string;
  userRole?: string;
  userAvatarUrl?: string;
  profileTo?: string;
  onLogout?: () => void;
  sidebarStat?: React.ReactNode;
  footer?: React.ReactNode;
  immersivePrefixes?: string[];
};

function SidebarNav({ nav, onNavigate }: { nav: SidebarNavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all',
              isActive
                ? 'bg-ash-grey-100 text-ash-grey-900 shadow-sm'
                : 'text-ash-grey-600 hover:bg-ash-grey-50 hover:text-ash-grey-900',
            )
          }>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-ash-grey-600 shadow-sm ring-1 ring-ash-grey-100 group-[&.active]:text-blue-spruce-700">
            {item.icon}
          </span>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? <span className="ml-auto shrink-0">{item.badge}</span> : null}
        </NavLink>
      ))}
    </nav>
  );
}

function SearchField() {
  return (
    <label className="relative hidden min-w-[220px] flex-1 max-w-md lg:block">
      <span className="sr-only">Search</span>
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ash-grey-400"
        aria-hidden>
        <path
          fillRule="evenodd"
          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
          clipRule="evenodd"
        />
      </svg>
      <input
        type="search"
        placeholder="Search tasks, clients, meals…"
        className="h-11 w-full rounded-2xl border border-ash-grey-200 bg-white pl-11 pr-4 text-sm text-ash-grey-900 shadow-sm outline-none transition placeholder:text-ash-grey-400 focus:border-blue-spruce-300 focus:ring-2 focus:ring-blue-spruce-100"
      />
    </label>
  );
}

export function DashboardSidebarLayout({
  brandName = 'MiraFood',
  brandSubtitle,
  nav,
  userDisplayName,
  userRole,
  userAvatarUrl,
  profileTo,
  onLogout,
  sidebarStat,
  footer,
  immersivePrefixes = [],
}: DashboardSidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const immersive = immersivePrefixes.some((prefix) => location.pathname.startsWith(prefix));

  const profileBlock = (
    <div className="flex items-center gap-3">
      {profileTo ? (
        <Link to={profileTo} className="shrink-0 rounded-full ring-2 ring-white">
          <NavbarAvatar name={userDisplayName ?? 'User'} imageUrl={userAvatarUrl} />
        </Link>
      ) : (
        <NavbarAvatar name={userDisplayName ?? 'User'} imageUrl={userAvatarUrl} />
      )}
      <div className="min-w-0 hidden sm:block">
        <p className="truncate text-sm font-medium text-ash-grey-900">{userDisplayName ?? 'User'}</p>
        {userRole ? <p className="truncate text-xs text-ash-grey-500">{userRole}</p> : null}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'dashboard-shell min-h-screen bg-[#f4f5f7]',
        immersive ? 'h-screen overflow-hidden' : '',
      )}>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] flex-col border-r border-ash-grey-200 bg-white shadow-[4px_0_24px_rgba(26,28,23,0.04)] transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}>
        <div className="shrink-0 px-5 pb-4 pt-6">
          <Link to="/" className="block" onClick={() => setMobileOpen(false)}>
            <p className="text-lg tracking-tight text-ash-grey-900">{brandName}</p>
            <p className="mt-0.5 text-sm text-ash-grey-500">{brandSubtitle}</p>
          </Link>
        </div>

        <SidebarNav nav={nav} onNavigate={() => setMobileOpen(false)} />

        <div className="mt-auto shrink-0 space-y-3 border-t border-ash-grey-100 px-4 py-4">
          {sidebarStat}
          <div className="rounded-2xl bg-ash-grey-50 p-3">
            {profileBlock}
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 text-xs text-ash-grey-500 transition-colors hover:text-ash-grey-800">
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <div
        className={cn(
          'flex min-w-0 flex-col lg:pl-[260px]',
          immersive ? 'h-screen overflow-hidden' : 'min-h-screen',
        )}>
        <header className="sticky top-0 z-30 border-b border-ash-grey-200/80 bg-[#f4f5f7]/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                className="rounded-xl p-2 text-ash-grey-700 hover:bg-white lg:hidden"
                onClick={() => setMobileOpen(true)}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <SearchField />
            </div>
            <div className="flex shrink-0 items-center gap-3 lg:hidden">{profileBlock}</div>
            <div className="hidden shrink-0 items-center gap-3 lg:flex">{profileBlock}</div>
          </div>
        </header>

        <main
          className={cn(
            'flex-1 min-h-0',
            immersive ? 'overflow-hidden p-0' : 'px-4 py-6 sm:px-6 lg:px-8',
          )}>
          <div className={cn(immersive ? 'h-full w-full' : 'mx-auto w-full max-w-[1400px]')}>
            <Outlet />
          </div>
        </main>

        {immersive ? null : footer}
      </div>
    </div>
  );
}
