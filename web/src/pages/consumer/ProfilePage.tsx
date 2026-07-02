import { Card, CardBody } from '@/components/ui/Card';
import { useAuth } from '@/features/auth';
import { useConsumerProfile } from '@/features/consumer/hooks/useConsumerQueries';
import { formatGoal } from '@/lib/utils';

export function ConsumerProfilePage() {
  const { user } = useAuth();
  const { data, isLoading } = useConsumerProfile();
  const profile = data?.profile;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl tracking-tight text-ash-grey-900">Profile</h2>
        <p className="mt-1 text-ash-grey-600">Your account and health profile synced from the app.</p>
      </div>

      {isLoading ? (
        <p className="text-ash-grey-500">Loading profile…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardBody className="space-y-3">
              <p className="text-sm font-semibold text-ash-grey-900">Account</p>
              <p className="text-sm text-ash-grey-600">
                <span className="text-ash-grey-500">Name:</span> {user?.displayName}
              </p>
              <p className="text-sm text-ash-grey-600">
                <span className="text-ash-grey-500">Email:</span> {user?.email}
              </p>
              <p className="text-sm text-ash-grey-600">
                <span className="text-ash-grey-500">Patient ID:</span>{' '}
                <span className="font-mono">{data?.patientId ?? user?.patientId}</span>
              </p>
              {data?.memberSince ? (
                <p className="text-sm text-ash-grey-600">
                  <span className="text-ash-grey-500">Member since:</span>{' '}
                  {new Date(data.memberSince).toLocaleDateString()}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <p className="text-sm font-semibold text-ash-grey-900">Health profile</p>
              {profile?.goal ? (
                <p className="text-sm text-ash-grey-600">
                  <span className="text-ash-grey-500">Goal:</span> {formatGoal(profile.goal)}
                </p>
              ) : (
                <p className="text-sm text-ash-grey-500">Complete onboarding in the mobile app.</p>
              )}
              {profile?.weightKg ? (
                <p className="text-sm text-ash-grey-600">
                  <span className="text-ash-grey-500">Weight:</span> {profile.weightKg} kg
                </p>
              ) : null}
              {profile?.macroTargets ? (
                <p className="text-sm text-ash-grey-600">
                  <span className="text-ash-grey-500">Daily target:</span>{' '}
                  {profile.macroTargets.calories} kcal
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
