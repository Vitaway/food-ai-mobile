import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { AvatarUpload, type AvatarUploadHandle } from '@/components/ui/AvatarUpload';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { Tabs } from '@/components/ui/Tabs';
import { DashboardCharts } from '@/components/coach/DashboardCharts';
import { useCoachAnalytics } from '@/hooks/useCoachAnalytics';
import { useCoachProfile, useUpdateCoachPassword, useUpdateCoachProfile } from '@/hooks/useCoachProfile';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { cn } from '@/lib/utils';
import type { UpdateCoachProfilePayload } from '@/types';

const TIMEZONES = [
  'Africa/Kigali',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
];

const PROFILE_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'activity', label: 'Activity' },
];

export function ProfilePage() {
  const { data: profile, isLoading } = useCoachProfile();
  const { data: analytics } = useCoachAnalytics();
  const updateProfile = useUpdateCoachProfile();
  const updatePassword = useUpdateCoachPassword();
  const toast = useToast();
  const avatarRef = useRef<AvatarUploadHandle>(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState<UpdateCoachProfilePayload | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (profile && !profileForm) {
      setProfileForm({
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phone ?? '',
        jobTitle: profile.jobTitle,
        bio: profile.bio ?? '',
        timezone: profile.timezone,
        avatarUrl: profile.avatarUrl,
      });
      setAvatarUrl(profile.avatarUrl);
    }
  }, [profile, profileForm]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profileForm) return;
    try {
      await updateProfile.mutateAsync({ ...profileForm, avatarUrl });
      toast.success('Your profile changes were saved.', 'Profile updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save profile'), 'Save failed');
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    try {
      await updatePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Your password was updated.', 'Password updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update password'), 'Update failed');
    }
  }

  function handleAvatarChange(url: string) {
    setAvatarUrl(url);
    if (profileForm) setProfileForm({ ...profileForm, avatarUrl: url });
  }

  function handleAvatarRemove() {
    setAvatarUrl(undefined);
    if (profileForm) setProfileForm({ ...profileForm, avatarUrl: undefined });
  }

  if (isLoading || !profile || !profileForm) {
    return <p className="text-ash-grey-500">Loading profile…</p>;
  }

  const memberSince = new Date(profile.memberSince).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const statItems = analytics
    ? [
        { label: 'Total reviews', value: analytics.coachStats.totalReviews, color: 'text-blue-spruce-600' },
        { label: 'Active clients', value: analytics.coachStats.activeClients, color: 'text-shamrock-600' },
        {
          label: 'Approval rate',
          value: `${analytics.coachStats.approvalRate}%`,
          color: 'text-cinnamon-wood-600',
        },
        {
          label: 'Avg review',
          value: `${analytics.coachStats.avgReviewMinutes}m`,
          color: 'text-ash-grey-700',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-ash-grey-200 bg-white shadow-sm">
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-2.5 sm:items-start">
                <AvatarUpload
                  ref={avatarRef}
                  name={profileForm.displayName}
                  imageUrl={avatarUrl}
                  onChange={handleAvatarChange}
                  clickable={false}
                />
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarRef.current?.openPicker()}>
                    Change photo
                  </Button>
                  {avatarUrl ? (
                    <Button type="button" variant="ghost" size="sm" onClick={handleAvatarRemove}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="text-center sm:pt-2 sm:text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl tracking-tight text-ash-grey-900 sm:text-3xl">
                    {profileForm.displayName}
                  </h2>
                  <span className="rounded-full bg-blue-spruce-600 px-2.5 py-0.5 text-xs font-bold text-white">
                    COACH
                  </span>
                </div>
                <p className="mt-1 font-medium text-ash-grey-600">{profileForm.jobTitle}</p>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-ash-grey-500">
                  {profileForm.bio || 'Add a short bio so clients know who you are.'}
                </p>
                <p className="mt-2 text-xs text-ash-grey-400">Member since {memberSince}</p>
              </div>
            </div>

            {statItems.length > 0 ? (
              <div className="grid shrink-0 grid-cols-2 gap-3 sm:gap-4">
                {statItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3 text-center sm:min-w-[7rem] sm:text-left">
                    <p className={cn('text-xl font-normal sm:text-2xl', item.color)}>{item.value}</p>
                    <p className="mt-0.5 text-xs text-ash-grey-500">{item.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <Tabs tabs={PROFILE_TABS} active={activeTab} onChange={setActiveTab} className="px-5 sm:px-8" />
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={(e) => void handleProfileSave(e)}>
          <Card>
            <CardBody className="space-y-5 pt-6">
              <div>
                <h3 className="font-bold text-ash-grey-900">Profile details</h3>
                <p className="mt-1 text-sm text-ash-grey-500">
                  Update how you appear to clients and in the dashboard.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Display name"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  required
                />
                <TextField
                  label="Job title"
                  value={profileForm.jobTitle}
                  onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
                <TextField
                  label="Phone"
                  type="tel"
                  value={profileForm.phone ?? ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <SelectField
                label="Timezone"
                value={profileForm.timezone}
                onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </option>
                ))}
              </SelectField>
              <TextAreaField
                label="Bio"
                value={profileForm.bio ?? ''}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="Tell clients about your coaching approach…"
              />
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      ) : null}

      {activeTab === 'security' ? (
        <form onSubmit={(e) => void handlePasswordSave(e)}>
          <Card>
            <CardBody className="space-y-5 pt-6">
              <div>
                <h3 className="font-bold text-ash-grey-900">Password & security</h3>
                <p className="mt-1 text-sm text-ash-grey-500">Keep your account secure.</p>
              </div>
              <TextField
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  hint="At least 8 characters"
                  required
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" variant="secondary" disabled={updatePassword.isPending}>
                  {updatePassword.isPending ? 'Updating…' : 'Update password'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      ) : null}

      {activeTab === 'activity' && analytics ? (
        <div className="space-y-4">
          <p className="text-sm text-ash-grey-500">Your coaching performance at a glance.</p>
          <DashboardCharts analytics={analytics} />
        </div>
      ) : null}
    </div>
  );
}
