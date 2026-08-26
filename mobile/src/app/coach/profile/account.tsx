import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ProfileAvatarPicker } from '@/components/profile/ProfileAvatarPicker';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { KeyboardSafeScreen } from '@/components/ui/KeyboardSafeScreen';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';
import { useToast } from '@/context/ToastContext';
import { useCoachProfileBack } from '@/hooks/useCoachProfileBack';
import { fetchCoachProfile, updateCoachProfile, uploadCoachAvatar } from '@/services/remote/coachApi';
import type { CoachProfileUpdatePayload } from '@/types/coach';

export default function CoachAccountScreen() {
  const handleBack = useCoachProfileBack();
  const toast = useToast();
  const { alert } = useConfirmDialog();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const profile = await fetchCoachProfile();
        setDisplayName(profile.displayName ?? session?.user.displayName?.trim() ?? 'Coach');
        setTitle(profile.jobTitle ?? 'Nutrition Coach');
        setOrganization(profile.organization ?? null);
        setBio(profile.bio ?? null);
        setPhone(profile.phone ?? null);
        setTimezone(profile.timezone ?? null);
        setAvatarUrl(profile.avatarUrl ?? undefined);
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user.displayName]);

  const handleAvatarPick = async (localUri: string) => {
    if (avatarBusy) return;
    setAvatarBusy(true);
    try {
      const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const name = `coach-avatar.${ext === 'jpeg' ? 'jpg' : ext}`;
      const next = await uploadCoachAvatar({ uri: localUri, name, type: mimeType });
      setAvatarUrl(next.avatarUrl ?? undefined);
      toast.success('Profile photo updated.', 'Saved');
    } catch (error) {
      toast.error(String(error));
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleSaveProfile = async () => {
    if (profileBusy) return;
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      await alert({ title: 'Name required', message: 'Enter a display name.' });
      return;
    }

    const payload: CoachProfileUpdatePayload = {
      displayName: trimmedName,
      title: title.trim() || null,
      organization: organization ?? null,
      bio: bio ?? null,
      phone: phone ?? null,
      timezone: timezone ?? null,
    };

    setProfileBusy(true);
    try {
      const next = await updateCoachProfile(payload);
      setTitle(next.jobTitle);
      setOrganization(next.organization ?? null);
      setBio(next.bio ?? null);
      setPhone(next.phone ?? null);
      setTimezone(next.timezone ?? null);
      setAvatarUrl(next.avatarUrl ?? undefined);
      toast.success('Profile updated.', 'Saved');
      handleBack();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setProfileBusy(false);
    }
  };

  return (
    <KeyboardSafeScreen keyboardVerticalOffset={8}>
      <View className="flex-1 bg-white">
        <ScreenTopBar title="Edit profile" onBack={handleBack} />

        <StackScreenBody>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 px-5 pb-10 pt-5">
            {loading ? (
              <Text className="py-10 text-center text-sm text-neutral-500">Loading profile…</Text>
            ) : (
              <>
                <View className="items-center">
                  <ProfileAvatarPicker
                    displayName={displayName}
                    avatarUrl={avatarUrl ?? session?.user.avatarUrl ?? undefined}
                    uploading={avatarBusy}
                    onPick={(localUri) => void handleAvatarPick(localUri)}
                  />
                </View>

                <FieldInput
                  label="Display name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                />
                <FieldInput label="Job title" value={title} onChangeText={setTitle} placeholder="Nutrition Coach" />
                <FieldInput
                  label="Organization"
                  value={organization ?? ''}
                  onChangeText={(v) => setOrganization(v.trim() ? v : null)}
                  placeholder="Organization"
                />
                <AppTextInput
                  value={bio ?? ''}
                  onChangeText={(v) => setBio(v.trim() ? v : null)}
                  placeholder="Bio (optional)"
                  multiline
                  textAlignVertical="top"
                  className="min-h-[96px] rounded-3xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
                />
                <FieldInput
                  label="Phone (optional)"
                  value={phone ?? ''}
                  onChangeText={(v) => setPhone(v.trim() ? v : null)}
                  placeholder="+1…"
                  keyboardType="phone-pad"
                />
                <FieldInput
                  label="Timezone (optional)"
                  value={timezone ?? ''}
                  onChangeText={(v) => setTimezone(v.trim() ? v : null)}
                  placeholder="e.g. Europe/London"
                />
                <Button
                  label={profileBusy ? 'Saving…' : 'Save changes'}
                  onPress={() => void handleSaveProfile()}
                  disabled={profileBusy}
                  fullWidth
                />
              </>
            )}
          </ScrollView>
        </StackScreenBody>
      </View>
    </KeyboardSafeScreen>
  );
}
