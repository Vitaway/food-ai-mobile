import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useProfile } from '@/context/ProfileContext';

export default function AccountScreen() {
  const router = useRouter();
  const { profile, updateAccount } = useProfile();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
    setEmail(profile?.email ?? '');
  }, [profile?.displayName, profile?.email]);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

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
        email: email.trim() || undefined,
      });
      router.back();
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
          <View className="gap-4 rounded-2xl border border-ash-grey-100 bg-white p-4">
            <FieldInput label="Name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" autoCorrect={false} />
            <FieldInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {memberSince ? (
            <View className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3">
              <Text className="text-sm text-neutral-500">Member since {memberSince}</Text>
            </View>
          ) : null}

          <Button label={saving ? 'Saving…' : 'Save'} onPress={handleSave} disabled={saving} />
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
