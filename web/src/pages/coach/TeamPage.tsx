import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { UserAvatar } from '@/components/ui/AvatarUpload';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { useCoachTeam } from '@/hooks/useCoachQueries';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  coach: 'Coach',
  admin: 'Admin',
};

function RoleBadge({ role }: { role?: string }) {
  const isAdmin = role === 'admin';
  return (
    <span
      className={cn(
        'ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium',
        isAdmin ? 'bg-cinnamon-wood-100 text-cinnamon-wood-700' : 'bg-blue-spruce-50 text-blue-spruce-700',
      )}>
      {ROLE_LABELS[role ?? 'coach'] ?? role ?? 'Coach'}
    </span>
  );
}

export function TeamPage() {
  const { data, isLoading } = useCoachTeam();

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Team" />

      {isLoading ? (
        <p className="text-ash-grey-500">Loading team…</p>
      ) : !data?.coaches?.length ? (
        <Card>
          <CardBody className="py-12 text-center text-ash-grey-500">
            Set your organization in profile to see team members.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="font-bold">{data.organization}</h3>
            <p className="mt-1 text-sm text-ash-grey-500">{data.coaches.length} members</p>
          </CardHeader>
          <CardBody className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-ash-grey-100 text-ash-grey-500">
                  <th className="py-2 pr-4 font-medium">Member</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Approved today</th>
                  <th className="py-2 pr-4 font-medium">Total reviews</th>
                  <th className="py-2 pr-4 font-medium">Avg review</th>
                  <th className="py-2 font-medium">Caseload</th>
                </tr>
              </thead>
              <tbody>
                {data.coaches.map((member) => (
                  <tr key={member.coachUserId} className="border-b border-ash-grey-50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={member.displayName}
                          imageUrl={member.avatarUrl}
                          size="md"
                        />
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
                    </td>
                    <td className="py-3 pr-4">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="py-3 pr-4 text-ash-grey-700">
                      {member.role === 'admin' ? '—' : member.approvedToday}
                    </td>
                    <td className="py-3 pr-4 text-ash-grey-700">
                      {member.role === 'admin' ? '—' : member.totalReviews}
                    </td>
                    <td className="py-3 pr-4 text-ash-grey-700">
                      {member.role === 'admin' ? '—' : `${member.avgReviewMinutes}m`}
                    </td>
                    <td className="py-3 text-ash-grey-700">
                      {member.role === 'admin' ? '—' : member.caseload}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
