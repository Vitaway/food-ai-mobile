import { Card, CardBody } from '@/components/ui/Card';
import { useAdminSystem, useAuditLogs } from '@/features/admin/hooks/useAdminQueries';
import { cn } from '@/lib/utils';

export function AdminSystemPage() {
  const { data: system, isLoading } = useAdminSystem();
  const { data: audit } = useAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl tracking-tight text-ash-grey-900">System</h2>
        <p className="mt-1 text-ash-grey-600">Infrastructure health, API status, and admin audit trail.</p>
      </div>

      {isLoading ? (
        <p className="text-ash-grey-500">Loading system status…</p>
      ) : system ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatusCard
            label="Database"
            ok={(system as { readiness: { checks: { database: boolean } } }).readiness.checks.database}
          />
          <StatusCard
            label="Redis"
            ok={(system as { readiness: { checks: { redis: boolean } } }).readiness.checks.redis}
          />
          <StatusCard
            label="OpenRouter"
            ok={(system as { openRouter: { apiKeyStatus: string } }).openRouter.apiKeyStatus === 'configured'}
            hint={(system as { openRouter: { apiKeyStatus: string } }).openRouter.apiKeyStatus}
          />
        </div>
      ) : null}

      <Card>
        <CardBody>
          <h3 className="text-xl font-bold text-ash-grey-900">Audit log</h3>
          {audit?.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-ash-grey-200 text-ash-grey-500">
                    <th className="pb-3 pr-4 font-medium">Action</th>
                    <th className="pb-3 pr-4 font-medium">Target</th>
                    <th className="pb-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((entry) => (
                    <tr key={entry.id} className="border-b border-ash-grey-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-ash-grey-900">{entry.action}</td>
                      <td className="py-3 pr-4 text-ash-grey-600">
                        {entry.targetType ?? '—'}
                        {entry.targetId ? ` · ${entry.targetId}` : ''}
                      </td>
                      <td className="py-3 text-ash-grey-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ash-grey-500">No audit entries yet.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatusCard({ label, ok, hint }: { label: string; ok: boolean; hint?: string }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <p className="text-sm text-ash-grey-500">{label}</p>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              ok ? 'bg-shamrock-50 text-shamrock-700' : 'bg-cinnamon-wood-50 text-cinnamon-wood-600',
            )}>
            {ok ? 'Healthy' : 'Check'}
          </span>
        </div>
        {hint ? <p className="mt-2 text-xs text-ash-grey-400">{hint}</p> : null}
      </CardBody>
    </Card>
  );
}
