import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { NavbarAvatar } from '@/components/ui/AvatarUpload';
import { MiraFoodLogo } from '@/components/marketing/MiraFoodLogo';
import { MARKETING_HERO_IMAGE } from '@/constants/marketingImages';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
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
  brandSubtitle?: string;
  nav: SidebarNavItem[];
  userDisplayName?: string;
  userRole?: string;
  userAvatarUrl?: string;
  profileTo?: string;
  settingsTo?: string;
  onLogout?: () => void;
  sidebarStat?: React.ReactNode;
  footer?: React.ReactNode;
  immersivePrefixes?: string[];
};

const SIDEBAR_COLLAPSED_KEY = 'mirafood.sidebar.collapsed';

function readCollapsedPreference() {
  if (typeof window === 'undefined') return true;
  try {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === null) return true;
    return stored === '1';
  } catch {
    return true;
  }
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronSideIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h6a1 1 0 100-2H4V5h5a1 1 0 000-2H3zm12.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 12H9a1 1 0 110-2h7.586l-1.293-1.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SidebarNav({
  nav,
  collapsed,
  onNavigate,
}: {
  nav: SidebarNavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className={cn(
        'flex flex-1 flex-col gap-1 overflow-y-auto py-2',
        collapsed ? 'px-2' : 'px-3',
      )}>
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          title={collapsed ? item.label : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center rounded-xl text-sm transition-colors',
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
              isActive
                ? 'bg-blue-spruce-700 font-semibold text-white'
                : 'text-white/75 hover:bg-white/10 hover:text-white',
            )
          }>
          <span
            className={cn(
              'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              'bg-white/10 text-white/80 group-[&.active]:bg-white/15 group-[&.active]:text-white',
            )}>
            {item.icon}
            {collapsed && item.badge ? (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cinnamon-wood-400 ring-2 ring-blue-spruce-600" />
            ) : null}
          </span>
          {collapsed ? null : (
            <>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge ? <span className="ml-auto shrink-0">{item.badge}</span> : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function AccountMenu({
  userDisplayName,
  userRole,
  userAvatarUrl,
  profileTo,
  settingsTo,
  onLogout,
  onNavigate,
  collapsed,
}: {
  userDisplayName?: string;
  userRole?: string;
  userAvatarUrl?: string;
  profileTo?: string;
  settingsTo?: string;
  onLogout?: () => void;
  onNavigate?: () => void;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { confirm, dialog } = useConfirmDialog();
  const resolvedSettings = settingsTo ?? (profileTo ? `${profileTo}?tab=security` : undefined);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    if (!onLogout) return;
    const ok = await confirm({
      title: 'Sign out?',
      description: 'You will need to sign in again to access the dashboard.',
      confirmLabel: 'Sign out',
      cancelLabel: 'Stay signed in',
      tone: 'danger',
    });
    if (ok) onLogout();
  }

  const menuItemClass =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white';

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative rounded-xl bg-blue-spruce-700/80',
        collapsed ? 'p-2' : 'p-3',
      )}>
      {open ? (
        <div
          className={cn(
            'absolute bottom-full z-20 mb-2 overflow-hidden rounded-xl border border-white/10 bg-blue-spruce-800 shadow-[0_12px_32px_rgba(0,0,0,0.35)]',
            collapsed ? 'left-0 w-52' : 'left-0 right-0',
          )}>
          <div className="p-1.5">
            {profileTo ? (
              <Link
                to={profileTo}
                className={menuItemClass}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}>
                <UserIcon className="h-4 w-4 shrink-0 text-white/70" />
                Profile
              </Link>
            ) : null}
            {resolvedSettings ? (
              <Link
                to={resolvedSettings}
                className={menuItemClass}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}>
                <CogIcon className="h-4 w-4 shrink-0 text-white/70" />
                Settings
              </Link>
            ) : null}
            {onLogout ? (
              <button type="button" className={menuItemClass} onClick={() => void handleSignOut()}>
                <SignOutIcon className="h-4 w-4 shrink-0 text-white/70" />
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? 'Close account menu' : 'Open account menu'}
        title={collapsed ? userDisplayName ?? 'Account' : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center rounded-lg text-left outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/40',
          collapsed ? 'justify-center gap-0' : 'gap-3',
        )}>
        <NavbarAvatar name={userDisplayName ?? 'User'} imageUrl={userAvatarUrl} />
        {collapsed ? null : (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userDisplayName ?? 'User'}</p>
              {userRole ? <p className="truncate text-xs text-white/55">{userRole}</p> : null}
            </div>
            <ChevronUpIcon
              className={cn(
                'h-4 w-4 shrink-0 text-white/70 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </>
        )}
      </button>

      {dialog}
    </div>
  );
}

export function DashboardSidebarLayout({
  brandSubtitle,
  nav,
  userDisplayName,
  userRole,
  userAvatarUrl,
  profileTo,
  settingsTo,
  onLogout,
  sidebarStat,
  footer,
  immersivePrefixes = [],
}: DashboardSidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();
  const immersive = immersivePrefixes.some((prefix) => location.pathname.startsWith(prefix));
  const compactRail = collapsed && isDesktop;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore quota / private mode */
    }
  }, [collapsed]);

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
          'fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] flex-col bg-blue-spruce-600 transition-[width,transform] duration-200 ease-out',
          collapsed ? 'lg:w-[80px]' : 'lg:w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}>
        <div
          className={cn(
            'relative shrink-0 pb-4 pt-6',
            compactRail ? 'px-2' : 'px-5',
          )}>
          <MiraFoodLogo
            variant="light"
            className="min-w-0"
            to="/"
            compact={compactRail}
          />
          {!compactRail && brandSubtitle ? (
            <p className="mt-2 text-xs font-medium text-white/50">{brandSubtitle}</p>
          ) : null}

          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((prev) => !prev)}
            className="absolute -right-3 top-8 hidden h-6 w-6 items-center justify-center rounded-full border border-ash-grey-200 bg-white text-blue-spruce-700 shadow-sm transition hover:bg-ash-grey-50 lg:flex">
            <ChevronSideIcon
              className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')}
            />
          </button>
        </div>

        <SidebarNav
          nav={nav}
          collapsed={compactRail}
          onNavigate={() => setMobileOpen(false)}
        />

        <div
          className={cn(
            'mt-auto shrink-0 space-y-3 border-t border-white/10 py-4',
            compactRail ? 'px-2' : 'px-4',
          )}>
          {!compactRail ? sidebarStat : null}
          <AccountMenu
            userDisplayName={userDisplayName}
            userRole={userRole}
            userAvatarUrl={userAvatarUrl}
            profileTo={profileTo}
            settingsTo={settingsTo}
            onLogout={onLogout}
            onNavigate={() => setMobileOpen(false)}
            collapsed={compactRail}
          />
        </div>
      </aside>

      <div
        className={cn(
          'relative flex min-w-0 flex-col transition-[padding] duration-200 ease-out',
          collapsed ? 'lg:pl-[80px]' : 'lg:pl-[260px]',
          immersive ? 'h-screen overflow-hidden' : 'min-h-screen',
        )}>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center"
            style={{
              backgroundImage: `url('${MARKETING_HERO_IMAGE}')`,
              filter: 'blur(4px)',
            }}
          />
          <div className="absolute inset-0 bg-[#f4f5f7]/70" />
        </div>

        <button
          type="button"
          aria-label="Open navigation"
          className="fixed left-4 top-4 z-30 rounded-xl border border-ash-grey-200/80 bg-white/90 p-2.5 text-ash-grey-700 shadow-sm backdrop-blur-md hover:bg-white lg:hidden"
          onClick={() => setMobileOpen(true)}>
          <MenuIcon className="h-5 w-5" />
        </button>

        <main
          className={cn(
            'relative z-10 flex-1 min-h-0',
            immersive ? 'overflow-hidden p-0' : 'px-4 py-6 pt-16 sm:px-6 lg:px-8 lg:pt-6',
          )}>
          <div className={cn(immersive ? 'h-full w-full' : 'mx-auto w-full max-w-[1400px]')}>
            <Outlet />
          </div>
        </main>

        {immersive ? null : <div className="relative z-10">{footer}</div>}
      </div>
    </div>
  );
}
