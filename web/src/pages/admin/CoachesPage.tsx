import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { TextAreaField, TextField } from '@/components/ui/Field';
import {
  useAdminCoaches,
  useAdminCoachRoster,
  useCreateCoach,
  useSetUserActive,
} from '@/features/admin/hooks/useAdminQueries';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { cn } from '@/lib/utils';

export function AdminCoachesPage() {
  const { data: coaches, isLoading } = useAdminCoaches();
  const { data: roster } = useAdminCoachRoster();
  const createCoach = useCreateCoach();
  const setActive = useSetUserActive();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('Nutrition Coach');
  const [organization, setOrganization] = useState('Vitaway');
  const [bio, setBio] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCoach.mutateAsync({
        email,
        password,
        displayName,
        title,
        organization,
        bio: bio || undefined,
      });
      toast.success('Coach account created successfully.', 'Coach added');
      setEmail('');
      setPassword('');
      setDisplayName('');
      setBio('');
      setShowForm(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create coach'), 'Could not create coach');
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Coaches"
        actions={
          <Button
            type="button"
            variant={showForm ? 'outline' : 'primary'}
            size="md"
            onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Add coach'}
          </Button>
        }
      />

      {showForm ? (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ash-grey-900">New coach account</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Full name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Coach"
              />
              <TextField
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@example.com"
              />
              <TextField
                label="Temporary password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
              <TextField
                label="Job title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextField
                label="Organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
              <div className="sm:col-span-2">
                <TextAreaField
                  label="Bio (optional)"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" variant="primary" disabled={createCoach.isPending}>
                  {createCoach.isPending ? 'Creating…' : 'Create coach account'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {roster?.length ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <h3 className="text-lg font-bold text-ash-grey-900">Coach performance</h3>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-ash-grey-100 bg-ash-grey-50 text-xs text-ash-grey-500">
                  <th className="px-4 py-3 font-semibold">Coach</th>
                  <th className="px-4 py-3 font-semibold">Clients</th>
                  <th className="px-4 py-3 font-semibold">Correction rate</th>
                  <th className="px-4 py-3 font-semibold">Avg turnaround</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((row) => (
                  <tr key={row.id} className="border-b border-ash-grey-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ash-grey-900">{row.displayName}</p>
                      <p className="text-xs text-ash-grey-500">{row.email}</p>
                    </td>
                    <td className="px-4 py-3">{row.assignedClients}</td>
                    <td className="px-4 py-3">{row.correctionRate}%</td>
                    <td className="px-4 py-3">{row.avgTurnaroundHours}h</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          row.isActive ? 'bg-shamrock-50 text-shamrock-700' : 'bg-red-50 text-red-700',
                        )}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <p className="text-ash-grey-500">Loading coaches…</p>
      ) : coaches?.length ? (
        <div className="grid gap-4">
          {coaches.map((coach) => (
            <Card key={coach.id}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-spruce-100 text-lg font-bold text-blue-spruce-700">
                    {coach.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-ash-grey-900">{coach.displayName}</h3>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          coach.isActive
                            ? 'bg-shamrock-50 text-shamrock-700'
                            : 'bg-red-50 text-red-700',
                        )}>
                        {coach.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-ash-grey-500">{coach.email}</p>
                    <p className="text-sm text-ash-grey-400">
                      {coach.profile?.title ?? 'Coach'}
                      {coach.profile?.organization ? ` · ${coach.profile.organization}` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={coach.isActive ? 'outline' : 'primary'}
                  size="sm"
                  disabled={setActive.isPending}
                  onClick={() =>
                    setActive.mutate({ userId: coach.id, isActive: !coach.isActive })
                  }>
                  {coach.isActive ? 'Deactivate' : 'Reactivate'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="py-12 text-center text-ash-grey-500">
            No coaches yet. Add your first coach above.
          </CardBody>
        </Card>
      )}
    </div>
  );
}
