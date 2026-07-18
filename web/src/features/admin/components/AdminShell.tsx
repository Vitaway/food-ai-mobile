import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ADMIN_ROUTES, AUTH_ROUTES } from '@/features/auth/constants';
import { useAdminMetrics } from '@/features/admin/hooks/useAdminQueries';
import { useChatUnreadCount } from '@/hooks/useChatQueries';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { DashboardSidebarLayout, type SidebarNavItem } from '@/components/layout/DashboardSidebarLayout';

const navRoutes = [
  { to: ADMIN_ROUTES.dashboard, label: 'Overview', end: true },
  { to: ADMIN_ROUTES.users, label: 'Users & roles', end: false },
  { to: ADMIN_ROUTES.coaches, label: 'Coaches', end: false },
  { to: ADMIN_ROUTES.assessments, label: 'Clinical assessments', end: false },
  { to: ADMIN_ROUTES.messages, label: 'Messages', end: false },
  { to: ADMIN_ROUTES.foodDb, label: 'Food database', end: false },
  { to: ADMIN_ROUTES.modules, label: 'Module entitlements', end: false },
  { to: ADMIN_ROUTES.payments, label: 'Payments', end: false },
  { to: ADMIN_ROUTES.reports, label: 'Reports', end: false },
  { to: ADMIN_ROUTES.referrals, label: 'Referrals', end: false },
  { to: ADMIN_ROUTES.system, label: 'Audit & system', end: false },
];

function NavIcon({ label }: { label: string }) {
  if (label === 'Overview') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
        <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm8 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
      </svg>
    );
  }
  if (label === 'Messages') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
        <path
          fillRule="evenodd"
          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (label === 'Coaches' || label === 'Users & roles') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
      <path
        fillRule="evenodd"
        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function NavCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-shamrock-500 px-1.5 text-[11px] leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function AdminShell() {
  useChatRealtime();
  const { data: metrics } = useAdminMetrics();
  const { data: chatUnread } = useChatUnreadCount();
  const { user, logout } = useAuth();
  const unreadCount = chatUnread?.count ?? 0;

  const nav: SidebarNavItem[] = navRoutes.map((item) => ({
    ...item,
    icon: <NavIcon label={item.label} />,
    badge:
      item.to === ADMIN_ROUTES.coaches && metrics?.coaches ? (
        <NavCountBadge count={metrics.coaches} />
      ) : item.to === ADMIN_ROUTES.messages && unreadCount ? (
        <NavCountBadge count={unreadCount} />
      ) : undefined,
  }));

  return (
    <DashboardSidebarLayout
      brandSubtitle="Platform admin"
      nav={nav}
      immersivePrefixes={[ADMIN_ROUTES.messages]}
      userDisplayName={user?.displayName ?? 'Admin'}
      userRole="Platform administrator"
      userAvatarUrl={user?.avatarUrl}
      profileTo={ADMIN_ROUTES.profile}
      onLogout={() => void logout()}
      sidebarStat={
        metrics ? (
          <div className="rounded-xl bg-blue-spruce-700/60 px-3 py-2.5 text-xs text-white/70">
            <span className="font-semibold text-white">{metrics.meals.inReview}</span> meals in review
          </div>
        ) : null
      }
      footer={
        <footer className="mt-8 border-t border-ash-grey-200/80 py-6 text-center text-sm text-ash-grey-500">
          <p>MiraFood · Vitaway platform</p>
          <p className="mt-1">
            <Link to="/" className="hover:text-blue-spruce-600">
              MiraFood home
            </Link>
            {' · '}
            <Link to={AUTH_ROUTES.login} className="hover:text-blue-spruce-600">
              Sign in
            </Link>
          </p>
        </footer>
      }
    />
  );
}
