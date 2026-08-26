import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ProfileAvatarPicker } from '@/components/profile/ProfileAvatarPicker';
import { FreePlanBanner } from '@/components/subscription/FreePlanBanner';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { PhoneField } from '@/components/ui/PhoneField';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';
import { useI18n } from '@/context/LocaleContext';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/context/ToastContext';
import { useProfileBack } from '@/hooks/useProfileBack';
import { getApiErrorMessage } from '@/utils/apiErrors';
import {
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricKind,
  getStoredBiometricCreds,
  isBiometricsEnabled,
} from '@/utils/biometrics';

export default function AccountScreen() {
  const handleBack = useProfileBack();
  const toast = useToast();
  const { alert, confirm } = useConfirmDialog();
  const { t } = useI18n();
  const { profile, updateAccount, uploadAvatar } = useProfile();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [bioReady, setBioReady] = useState(false);

  const refreshBio = useCallback(async () => {
    const [enabled, kind] = await Promise.all([isBiometricsEnabled(), getBiometricKind()]);
    setBioOn(enabled && kind !== 'none');
    setBioReady(true);
  }, []);

  useEffect(() => {
    void refreshBio();
  }, [refreshBio]);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
    setPhone(profile?.phone ?? '');
    setAvatarUrl(profile?.avatarUrl);
  }, [profile?.displayName, profile?.phone, profile?.avatarUrl]);

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

  const toggleBiometrics = async () => {
    if (bioOn) {
      await disableBiometricLogin();
      setBioOn(false);
      toast.success(t.profile.biometricsDisabled);
      return;
    }
    const creds = await getStoredBiometricCreds();
    if (!creds) {
      toast.error(t.profile.biometricsOff);
      return;
    }
    const ok = await confirm({
      title: t.auth.enableBiometricsTitle,
      message: t.auth.enableBiometricsBody,
      confirmLabel: t.auth.enableBiometricsConfirm,
    });
    if (!ok) return;
    const enabled = await enableBiometricLogin(creds);
    if (!enabled) {
      toast.error(t.auth.biometricsUnavailable);
      return;
    }
    setBioOn(true);
    toast.success(t.profile.biometricsEnabled);
  };

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      await alert({ title: 'Name required', message: 'Enter a display name.' });
      return;
    }

    setSaving(true);
    try {
      await updateAccount({
        displayName: trimmedName,
        phone: phone.trim() || null,
      });
      toast.success('Account updated');
      handleBack();
    } catch (error) {
      await alert({
        title: 'Could not save',
        message: getApiErrorMessage(error, 'Please try again.'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Account" onBack={handleBack} />

      <StackScreenBody>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 px-5 pb-10 pt-5">
          <FreePlanBanner compact />

          <View className="rounded-2xl border border-ash-grey-100 bg-white p-4">
            <ProfileAvatarPicker
              displayName={displayName || 'User'}
              avatarUrl={avatarUrl}
              uploading={uploadingAvatar}
              onPick={handleAvatarPick}
            />
          </View>

          <View className="gap-4 rounded-2xl border border-ash-grey-100 bg-white p-4">
            <Text className="text-sm font-sans-semibold text-neutral-900">Account details</Text>
            <Text className="-mt-2 text-xs leading-5 text-neutral-500">
              Sign-in email stays fixed here. Health info (date of birth, weight, goals, allergies) lives under
              Health profile.
            </Text>

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
                <Text className="mt-1.5 text-xs text-neutral-500">
                  Used to sign in. Contact support to change it.
                </Text>
              </View>
            ) : null}

            <PhoneField
              label="Phone (optional)"
              value={phone}
              onChange={setPhone}
              hint="For coach follow-ups and account recovery. Include country code."
            />
          </View>

          {bioReady ? (
            <Pressable
              onPress={() => void toggleBiometrics()}
              className="rounded-2xl border border-ash-grey-100 bg-white px-5 py-4">
              <Text className="font-sans-semibold text-neutral-900">{t.profile.biometrics}</Text>
              <Text className="mt-1 text-sm text-neutral-500">
                {bioOn ? t.profile.biometricsOn : t.profile.biometricsOff}
              </Text>
            </Pressable>
          ) : null}

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
