import { UserAvatar } from '@/components/ui/AvatarUpload';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { useCoachTeam } from '@/hooks/useCoachQueries';
import type { CoachTeamMember } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  coach: 'Coach',
  admin: 'Admin',
  nutrition_coach: 'Coach',
};

export function TeamPage() {
  const { data, isLoading } = useCoachTeam();

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

      <DashboardPanel
        title={data?.organization ? data.organization : 'Organization coaches'}
        action={
          data?.coaches?.length ? (
            <span className="text-xs font-semibold text-ash-grey-500">
              {data.coaches.length} members
            </span>
          ) : null
        }>
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading team…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.coaches ?? []}
            rowKey={(m) => m.coachUserId}
            emptyTitle="No team members yet"
            emptyDescription="Set your organization in profile to see coaches on your team."
          />
        )}
      </DashboardPanel>
    </div>
  );
}
