import { useMemo, useState } from 'react';
import { UserAvatar } from '@/components/ui/AvatarUpload';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { StatusPill } from '@/components/ui/StatusPill';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { useCoachTeam } from '@/hooks/useCoachQueries';
import type { CoachTeamMember } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  coach: 'Coach',
  admin: 'Admin',
  nutrition_coach: 'Coach',
};

type RoleFilter = 'all' | 'coach' | 'admin';

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'coach', label: 'Coaches' },
  { value: 'admin', label: 'Admins' },
];

function isCoachRole(role?: string | null) {
  return role === 'coach' || role === 'nutrition_coach' || !role;
}

export function TeamPage() {
  const { data, isLoading } = useCoachTeam();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.coaches ?? []).filter((member) => {
      if (roleFilter === 'admin' && member.role !== 'admin') return false;
      if (roleFilter === 'coach' && !isCoachRole(member.role)) return false;
      if (!q) return true;
      const name = member.displayName?.toLowerCase() ?? '';
      const title = member.title?.toLowerCase() ?? '';
      const role = (ROLE_LABELS[member.role ?? 'coach'] ?? member.role ?? '').toLowerCase();
      return name.includes(q) || title.includes(q) || role.includes(q);
    });
  }, [data?.coaches, roleFilter, search]);

  const summary = useMemo(() => {
    const list = data?.coaches ?? [];
    const coaches = list.filter((m) => isCoachRole(m.role));
    const admins = list.filter((m) => m.role === 'admin');
    const approvedToday = coaches.reduce((sum, m) => sum + (m.approvedToday ?? 0), 0);
    const caseload = coaches.reduce((sum, m) => sum + (m.caseload ?? 0), 0);
    return {
      members: list.length,
      coaches: coaches.length,
      admins: admins.length,
      approvedToday,
      caseload,
    };
  }, [data?.coaches]);

  const columns: DataTableColumn<CoachTeamMember>[] = [
    {
      key: 'member',
      header: 'Member',
      cell: (member) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={member.displayName} imageUrl={member.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-ash-grey-900">
              {member.displayName}
              {member.isSelf ? (
                <span className="ml-2 text-xs font-normal text-blue-spruce-600">(you)</span>
              ) : null}
            </p>
            {member.title ? (
              <p className="truncate text-xs text-ash-grey-500">{member.title}</p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (member) => (
        <StatusPill tone={member.role === 'admin' ? 'warn' : 'info'}>
          {ROLE_LABELS[member.role ?? 'coach'] ?? member.role ?? 'Coach'}
        </StatusPill>
      ),
    },
    {
      key: 'approved',
      header: 'Approved today',
      cell: (member) => (
        <span className="text-ash-grey-700">
          {member.role === 'admin' ? '—' : member.approvedToday}
        </span>
      ),
    },
    {
      key: 'reviews',
      header: 'Total reviews',
      cell: (member) => (
        <span className="text-ash-grey-700">
          {member.role === 'admin' ? '—' : member.totalReviews}
        </span>
      ),
    },
    {
      key: 'avg',
      header: 'Avg review',
      cell: (member) => (
        <span className="text-ash-grey-700">
          {member.role === 'admin' ? '—' : `${member.avgReviewMinutes}m`}
        </span>
      ),
    },
    {
      key: 'caseload',
      header: 'Active clients',
      cell: (member) => (
        <span className="text-ash-grey-700">
          {member.role === 'admin' ? '—' : member.caseload}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Team" />

      <KpiStrip
        columns={5}
        items={[
          { label: 'Members', value: summary.members, tone: 'info', caption: 'In organization' },
          { label: 'Coaches', value: summary.coaches, tone: 'success', caption: 'Reviewing meals' },
          { label: 'Admins', value: summary.admins, tone: 'accent', caption: 'Platform access' },
          {
            label: 'Approved today',
            value: summary.approvedToday,
            tone: 'default',
            caption: 'Team decisions',
          },
          {
            label: 'Active clients',
            value: summary.caseload,
            tone: 'info',
            caption: 'Across coaches',
          },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="min-w-0 flex-1"
          placeholder="Search name, title, or role…"
          value={search}
          onValueChange={setSearch}
        />
        <Select
          aria-label="Filter by role"
          variant="filter"
          size="sm"
          className="w-full sm:w-48"
          value={roleFilter}
          onChange={(value) => setRoleFilter(value as RoleFilter)}
          options={ROLE_FILTERS}
        />
      </div>

      <DashboardPanel
        title={data?.organization ? data.organization : 'Organization coaches'}
        action={
          filtered.length ? (
            <span className="text-xs font-semibold text-ash-grey-500">
              {filtered.length} member{filtered.length === 1 ? '' : 's'}
            </span>
          ) : null
        }>
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading team…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(m) => m.coachUserId}
            emptyTitle="No team members match"
            emptyDescription="Try another search or role filter."
          />
        )}
      </DashboardPanel>
    </div>
  );
}
