import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AvatarUpload, type AvatarUploadHandle } from '@/components/ui/AvatarUpload';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { PhoneField } from '@/components/ui/PhoneField';
import { DashboardCharts } from '@/components/coach/DashboardCharts';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { useCoachAnalytics } from '@/hooks/useCoachAnalytics';
import {
  useCoachProfile,
  useUpdateCoachPassword,
  useUpdateCoachProfile,
  useUploadCoachAvatar,
} from '@/hooks/useCoachProfile';
import { useAuth } from '@/features/auth';
import { useToast } from '@/context/ToastContext';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
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
  { id: 'profile', label: 'Personal Info' },
  { id: 'activity', label: 'Activity' },
  { id: 'security', label: 'Settings' },
] as const;

type ProfileTabId = (typeof PROFILE_TABS)[number]['id'];

function isProfileTab(value: string | null): value is ProfileTabId {
  return value === 'profile' || value === 'security' || value === 'activity';
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7.5 5l5 5-5 5" />
    </svg>
  );
}

function ProfileCoverBanner() {
  return (
    <div className="relative h-36 overflow-hidden rounded-2xl sm:h-44">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 220" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="profileCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#023459" />
            <stop offset="45%" stopColor="#0d6b6b" />
            <stop offset="100%" stopColor="#7ec8c8" />
          </linearGradient>
        </defs>
        <rect width="800" height="220" fill="url(#profileCoverGrad)" />
        <path
          d="M0 140 C120 90 200 180 320 130 C440 80 520 160 640 110 C720 80 760 120 800 100 L800 220 L0 220 Z"
          fill="#023459"
          opacity="0.55"
        />
        <path
          d="M0 160 C140 120 240 190 380 150 C520 110 600 180 720 140 C760 125 780 145 800 135 L800 220 L0 220 Z"
          fill="#0a4a5c"
          opacity="0.7"
        />
        <path
          d="M0 185 C100 165 180 200 300 175 C420 150 500 195 620 170 C700 155 760 180 800 165 L800 220 L0 220 Z"
          fill="#5bb5b5"
          opacity="0.45"
        />
      </svg>
    </div>
  );
}

function SettingsMenuCard({
  label,
  icon,
  onClick,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border border-ash-grey-100 bg-white px-4 py-3.5 text-left shadow-[0_8px_24px_rgba(2,52,89,0.06)] transition hover:border-ash-grey-200 hover:shadow-[0_10px_28px_rgba(2,52,89,0.1)]',
        danger && 'hover:border-red-200',
      )}>
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          danger ? 'bg-red-50 text-red-600' : 'bg-ash-grey-100 text-ash-grey-800',
        )}>
        {icon}
      </span>
      <span className={cn('flex-1 text-sm font-semibold', danger ? 'text-red-600' : 'text-ash-grey-900')}>
        {label}
      </span>
      <ArrowIcon className={cn('h-4 w-4', danger ? 'text-red-400' : 'text-ash-grey-400')} />
    </button>
  );
}

export function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { data: profile, isLoading } = useCoachProfile();
  const { data: analytics } = useCoachAnalytics();
  const updateProfile = useUpdateCoachProfile();
  const uploadAvatar = useUploadCoachAvatar();
  const updatePassword = useUpdateCoachPassword();
  const toast = useToast();
  const avatarRef = useRef<AvatarUploadHandle>(null);

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<ProfileTabId>(() =>
    isProfileTab(tabParam) ? tabParam : 'profile',
  );
  const [settingsView, setSettingsView] = useState<'menu' | 'password'>('menu');
  const [profileForm, setProfileForm] = useState<UpdateCoachProfilePayload | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const homePath = location.pathname.startsWith('/admin') ? '/admin' : '/coach';

  useEffect(() => {
    if (isProfileTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  useEffect(() => {
    if (activeTab === 'security') setSettingsView('menu');
  }, [activeTab]);

  function handleTabChange(next: ProfileTabId) {
    setActiveTab(next);
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'profile') nextParams.delete('tab');
    else nextParams.set('tab', next);
    setSearchParams(nextParams, { replace: true });
  }

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
      await updateProfile.mutateAsync(profileForm);
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
      setSettingsView('menu');
      toast.success('Your password was updated.', 'Password updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update password'), 'Update failed');
    }
  }

  async function handleAvatarFile(file: File) {
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
    try {
      const updated = await uploadAvatar.mutateAsync(file);
      setAvatarUrl(updated.avatarUrl);
      toast.success('Your profile photo was updated.', 'Photo saved');
    } catch (err) {
      setAvatarUrl(profile?.avatarUrl);
      toast.error(getApiErrorMessage(err, 'Could not upload photo'), 'Upload failed');
    } finally {
      URL.revokeObjectURL(preview);
    }
  }

  async function handleAvatarRemove() {
    if (!profileForm) return;
    const ok = await confirm({
      title: 'Remove photo?',
      description: 'Your profile will show your initials until you upload a new photo.',
      confirmLabel: 'Remove photo',
      cancelLabel: 'Keep photo',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const updated = await updateProfile.mutateAsync({ ...profileForm, avatarUrl: undefined });
      setAvatarUrl(updated.avatarUrl);
      toast.success('Your profile photo was removed.', 'Photo removed');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not remove photo'), 'Remove failed');
    }
  }

  async function handleSignOut() {
    const ok = await confirm({
      title: 'Sign out?',
      description: 'You will need to sign in again to access the dashboard.',
      confirmLabel: 'Sign out',
      cancelLabel: 'Stay signed in',
      tone: 'danger',
    });
    if (ok) await logout();
  }

  if (isLoading || !profile || !profileForm) {
    return <p className="text-ash-grey-500">Loading profile…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {confirmDialog}
      <div className="overflow-hidden rounded-[1.75rem] border border-ash-grey-100 bg-white shadow-[0_16px_48px_rgba(2,52,89,0.08)]">
        <div className="relative px-5 pb-2 pt-5 sm:px-8 sm:pt-6">
          <h1 className="text-center font-sans text-2xl font-bold tracking-tight text-ash-grey-900">
            Profile
          </h1>
          <button
            type="button"
            aria-label="Close profile"
            onClick={() => navigate(homePath)}
            className="absolute right-5 top-5 rounded-full p-1.5 text-ash-grey-500 transition hover:bg-ash-grey-100 hover:text-ash-grey-800 sm:right-8 sm:top-6">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 sm:px-8">
          <div className="relative pb-2 pt-2">
            <ProfileCoverBanner />
            <div className="relative z-10 -mt-14 flex flex-col items-center sm:-mt-16">
              <div className="relative">
                <AvatarUpload
                  ref={avatarRef}
                  name={profileForm.displayName}
                  imageUrl={avatarUrl}
                  onFileSelect={(file) => void handleAvatarFile(file)}
                  clickable={false}
                />
                <button
                  type="button"
                  aria-label="Change photo"
                  disabled={uploadAvatar.isPending}
                  onClick={() => avatarRef.current?.openPicker()}
                  className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-ash-grey-900 text-white shadow-md transition hover:bg-ash-grey-800 disabled:opacity-60">
                  <CameraIcon className="h-4 w-4" />
                </button>
              </div>
              <h2 className="mt-3 font-sans text-xl font-bold tracking-tight text-ash-grey-900 sm:text-2xl">
                {profileForm.displayName}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-ash-grey-500">{profileForm.jobTitle}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2 pb-1">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition',
                  activeTab === tab.id
                    ? 'border-ash-grey-900 bg-ash-grey-900 text-white'
                    : 'border-ash-grey-900/80 bg-white text-ash-grey-900 hover:bg-ash-grey-50',
                )}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:pb-8">
          {activeTab === 'profile' ? (
            <form onSubmit={(e) => void handleProfileSave(e)} className="space-y-5">
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
                <PhoneField
                  label="Phone"
                  value={profileForm.phone ?? ''}
                  onChange={(phone) => setProfileForm({ ...profileForm, phone })}
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
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          ) : null}

          {activeTab === 'activity' ? (
            <div className="space-y-5">
              {analytics ? (
                <>
                  <KpiStrip
                    columns={4}
                    className="sm:grid-cols-2 xl:grid-cols-4"
                    items={[
                      {
                        label: 'Total reviews',
                        value: analytics.coachStats.totalReviews,
                        tone: 'info',
                      },
                      {
                        label: 'Active clients',
                        value: analytics.coachStats.activeClients,
                        tone: 'success',
                      },
                      {
                        label: 'Approval rate',
                        value: `${analytics.coachStats.approvalRate}%`,
                        tone: 'accent',
                      },
                      {
                        label: 'Avg review',
                        value: `${analytics.coachStats.avgReviewMinutes}m`,
                        tone: 'default',
                      },
                    ]}
                  />
                  <DashboardCharts analytics={analytics} />
                </>
              ) : (
                <p className="text-sm text-ash-grey-500">Loading activity…</p>
              )}
            </div>
          ) : null}

          {activeTab === 'security' ? (
            settingsView === 'password' ? (
              <form onSubmit={(e) => void handlePasswordSave(e)} className="space-y-5">
                <button
                  type="button"
                  onClick={() => setSettingsView('menu')}
                  className="text-sm font-semibold text-ash-grey-600 hover:text-ash-grey-900">
                  ← Back to settings
                </button>
                <div>
                  <h3 className="font-sans text-lg font-semibold text-ash-grey-900">Password</h3>
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
                <Button type="submit" variant="secondary" disabled={updatePassword.isPending}>
                  {updatePassword.isPending ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <SettingsMenuCard
                  label="Password"
                  onClick={() => setSettingsView('password')}
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
                <SettingsMenuCard
                  label="Change photo"
                  onClick={() => avatarRef.current?.openPicker()}
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
                {avatarUrl ? (
                  <SettingsMenuCard
                    label="Remove photo"
                    onClick={() => void handleAvatarRemove()}
                    icon={
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    }
                  />
                ) : null}
                <SettingsMenuCard
                  label="Log Out"
                  danger
                  onClick={() => void handleSignOut()}
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h6a1 1 0 100-2H4V5h5a1 1 0 100-2H3zm10.293 2.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L14.586 11H8a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
