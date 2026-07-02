import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Share, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import { useToast } from '@/context/ToastContext';
import { fetchReferralInfo, type ReferralInfo } from '@/services/remote/consumerApi';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { copyToClipboard } from '@/utils/clipboard';

export default function ReferralScreen() {
  const router = useRouter();
  const toast = useToast();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/profile');
  }, [router]);

  useEffect(() => {
    fetchReferralInfo()
      .then(setInfo)
      .catch((err) => toast.error(getApiErrorMessage(err, 'Could not load referral info')))
      .finally(() => setLoading(false));
  }, [toast]);

  const shareMessage = info
    ? `Join me on MiraFood for personalized nutrition coaching. Use my referral code ${info.referralCode} when you sign up.`
    : '';

  const copyCode = useCallback(async () => {
    if (!info?.referralCode) return;
    const result = await copyToClipboard(info.referralCode);
    if (result === 'copied') {
      toast.success('Referral code copied', 'Invite friends');
    } else if (result === 'shared') {
      toast.success('Referral code shared', 'Invite friends');
    }
  }, [info?.referralCode, toast]);

  const shareCode = useCallback(async () => {
    if (!shareMessage) return;
    try {
      await Share.share({ message: shareMessage });
    } catch {
      /* user dismissed */
    }
  }, [shareMessage]);

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Invite friends" onBack={handleBack} />

      <StackScreenBody>
        <View className="gap-5 px-5 pb-10 pt-4">
          <View className="rounded-3xl bg-cinnamon-wood-50 px-5 py-6">
            <Text className="text-sm text-neutral-600">Your referral code</Text>
            <Text className="mt-2 font-sans-bold text-3xl tracking-wide text-blue-spruce-900">
              {loading ? '…' : info?.referralCode ?? '—'}
            </Text>
            <Text className="mt-3 text-sm leading-5 text-neutral-600">
              Share this code with friends when they create an account. You will get a notification when someone joins
              using your code.
            </Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl border border-ash-grey-100 bg-white px-4 py-4">
              <Text className="text-xs uppercase text-neutral-400">Referrals</Text>
              <Text className="mt-1 font-sans-bold text-2xl" style={{ color: semanticColors.accentOrange }}>
                {info?.referralCount ?? 0}
              </Text>
            </View>
            {info?.referredBy ? (
              <View className="flex-1 rounded-2xl border border-ash-grey-100 bg-white px-4 py-4">
                <Text className="text-xs uppercase text-neutral-400">Invited by</Text>
                <Text className="mt-1 font-sans-semibold text-neutral-900">{info.referredBy.displayName}</Text>
              </View>
            ) : null}
          </View>

          <Button label="Copy code" onPress={() => void copyCode()} disabled={!info?.referralCode} fullWidth />
          <Button
            label="Share invite"
            onPress={() => void shareCode()}
            disabled={!info?.referralCode}
            fullWidth
            variant="secondary"
          />
        </View>
      </StackScreenBody>
    </View>
  );
}
