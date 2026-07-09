import { Link } from 'react-router-dom';
import { useCoachQueueRealtime } from '@/hooks/useCoachQueueRealtime';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { useCoachStats } from '@/hooks/useCoachQueries';
import { useChatUnreadCount } from '@/hooks/useChatQueries';
import { useCoachProfile } from '@/hooks/useCoachProfile';
import { useAuth } from '@/features/auth';
import { DashboardSidebarLayout, type SidebarNavItem } from '@/components/layout/DashboardSidebarLayout';

const navRoutes = [
  { to: '/coach', label: 'Overview', end: true },
  { to: '/coach/queue', label: 'Review queue', end: false },
  { to: '/coach/history', label: 'Review history', end: false },
  { to: '/coach/clients', label: 'Clients', end: false },
  { to: '/coach/nutrition-db', label: 'Nutrition DB', end: false },
  { to: '/coach/reports', label: 'Reports', end: false },
  { to: '/coach/messages', label: 'Messages', end: false },
  { to: '/coach/team', label: 'Team', end: false },
];

function NavIcon({ name }: { name: string }) {
  if (name === 'Overview') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
        <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm8 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
      </svg>
    );
  }
  if (name === 'Messages') {
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
  if (name === 'Clients') {
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
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cinnamon-wood-400 px-1.5 text-[11px] leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function AppShell() {
  useCoachQueueRealtime();
  useChatRealtime();
  const { data: stats } = useCoachStats();
  const { data: chatUnread } = useChatUnreadCount();
  const { data: profile } = useCoachProfile();
  const { user, logout } = useAuth();
  const displayName = profile?.displayName ?? user?.displayName ?? 'Coach';
  const unreadCount = chatUnread?.count ?? stats?.unreadMessages;

  const nav: SidebarNavItem[] = navRoutes.map((item) => ({
    ...item,
    icon: <NavIcon name={item.label} />,
    badge:
      item.to === '/coach/queue' && stats?.inReview ? (
        <NavCountBadge count={stats.inReview} />
      ) : item.to === '/coach/messages' && unreadCount ? (
        <NavCountBadge count={unreadCount} />
      ) : undefined,
  }));

  return (
    <DashboardSidebarLayout
      brandSubtitle="Coach dashboard"
      nav={nav}
      immersivePrefixes={['/coach/messages']}
      userDisplayName={displayName}
      userRole={profile?.jobTitle ?? 'Nutrition coach'}
      userAvatarUrl={profile?.avatarUrl}
      profileTo="/coach/profile"
      onLogout={() => void logout()}
      sidebarStat={
        stats ? (
          <div className="rounded-2xl border border-ash-grey-100 bg-white px-3 py-2.5 text-xs text-ash-grey-600 shadow-sm">
            <span className="font-medium text-ash-grey-900">{stats.inReview}</span> meals in review
          </div>
        ) : null
      }
      footer={
        <footer className="mt-8 border-t border-ash-grey-200/80 py-6 text-center text-sm text-ash-grey-500">
          <p>MiraFood · Vitaway</p>
          <p className="mt-1">
            <a href="mailto:support@vitaway.org" className="hover:text-blue-spruce-600">
              Support
            </a>
            {' · '}
            <Link to="/privacy" className="hover:text-blue-spruce-600">
              Privacy
            </Link>
          </p>
        </footer>
      }
    />
  );
}
