import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { ProfileAvatarPicker } from '@/components/profile/ProfileAvatarPicker';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/utils/apiErrors';

export default function AccountScreen() {
  const router = useRouter();
  const toast = useToast();
  const { profile, updateAccount, uploadAvatar } = useProfile();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
    setAvatarUrl(profile?.avatarUrl);
  }, [profile?.displayName, profile?.avatarUrl]);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const handleAvatarPick = async (localUri: string) => {
    setAvatarUrl(localUri);
    setUploadingAvatar(true);
    try {
      const updated = await uploadAvatar(localUri);
      if (updated?.avatarUrl) {
        setAvatarUrl(updated.avatarUrl);
        toast.success('Profile photo updated');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not upload profile photo.'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Enter a display name.');
      return;
    }

    setSaving(true);
    try {
      await updateAccount({
        displayName: trimmedName,
      });
      toast.success('Account updated');
      router.back();
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Account" onBack={() => router.back()} />

      <StackScreenBody>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 px-5 pb-10 pt-5">
          <View className="rounded-2xl border border-ash-grey-100 bg-white p-4">
            <ProfileAvatarPicker
              displayName={displayName || 'User'}
              avatarUrl={avatarUrl}
              uploading={uploadingAvatar}
              onPick={handleAvatarPick}
            />
          </View>

          <View className="gap-4 rounded-2xl border border-ash-grey-100 bg-white p-4">
            <FieldInput
              label="Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {profile?.email ? (
              <View>
                <Text className="mb-2 text-sm font-sans-medium text-neutral-700">Email</Text>
                <View className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3">
                  <Text className="text-base text-neutral-700">{profile.email}</Text>
                </View>
                <Text className="mt-1.5 text-xs text-neutral-500">Email is tied to your sign-in and cannot be changed here.</Text>
              </View>
            ) : null}
          </View>

          {memberSince ? (
            <View className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3">
              <Text className="text-sm text-neutral-500">Member since {memberSince}</Text>
            </View>
          ) : null}

          <Button label={saving ? 'Saving…' : 'Save'} onPress={handleSave} disabled={saving || uploadingAvatar} />
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
