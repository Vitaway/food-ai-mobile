import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { useAdminCoaches, useCreateCoach, useSetUserActive } from '@/features/admin/hooks/useAdminQueries';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { cn } from '@/lib/utils';

export function AdminCoachesPage() {
  const { data: coaches, isLoading } = useAdminCoaches();
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl tracking-tight text-ash-grey-900">Coaches</h2>
          <p className="mt-1 text-ash-grey-600">
            Add nutrition coaches and manage their access to the review dashboard.
          </p>
        </div>
        <Button
          type="button"
          variant={showForm ? 'outline' : 'primary'}
          size="md"
          onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add coach'}
        </Button>
      </div>

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
