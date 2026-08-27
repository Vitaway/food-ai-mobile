import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Share, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FreePlanBanner } from '@/components/subscription/FreePlanBanner';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import { tf, useI18n } from '@/context/LocaleContext';
import { useToast } from '@/context/ToastContext';
import { fetchReferralInfo, type ReferralInfo } from '@/services/remote/consumerApi';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { copyToClipboard } from '@/utils/clipboard';

export default function ReferralScreen() {
  const { t } = useI18n();
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
      .catch((err) => toast.error(getApiErrorMessage(err, t.common.tryAgain)))
      .finally(() => setLoading(false));
  }, [t.common.tryAgain, toast]);

  const shareMessage = info
    ? tf(t.referral.shareMessage, { code: info.referralCode })
    : '';

  const copyCode = useCallback(async () => {
    if (!info?.referralCode) return;
    const result = await copyToClipboard(info.referralCode);
    if (result === 'copied' || result === 'shared') {
      toast.success(t.referral.copied, t.profile.inviteFriends);
    }
  }, [info?.referralCode, t.profile.inviteFriends, t.referral.copied, toast]);

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
      <ScreenTopBar title={t.referral.title} onBack={handleBack} />

      <StackScreenBody>
        <View className="gap-5 px-5 pb-10 pt-4">
          <FreePlanBanner compact />

          <View className="rounded-3xl bg-cinnamon-wood-50 px-5 py-6">
            <Text className="text-sm text-neutral-600">{t.referral.yourCode}</Text>
            <Text className="mt-2 font-sans-bold text-3xl tracking-wide text-blue-spruce-900">
              {loading ? '…' : info?.referralCode ?? '—'}
            </Text>
            <Text className="mt-3 text-sm leading-5 text-neutral-600">{t.referral.body}</Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl border border-ash-grey-100 bg-white px-4 py-4">
              <Text className="text-xs uppercase text-neutral-400">{t.profile.inviteFriends}</Text>
              <Text className="mt-1 font-sans-bold text-2xl" style={{ color: semanticColors.accentOrange }}>
                {info?.referralCount ?? 0}
              </Text>
            </View>
            {info?.referredBy ? (
              <View className="flex-1 rounded-2xl border border-ash-grey-100 bg-white px-4 py-4">
                <Text className="mt-1 font-sans-semibold text-neutral-900">{info.referredBy.displayName}</Text>
              </View>
            ) : null}
          </View>

          <Button label={t.referral.copy} onPress={() => void copyCode()} disabled={!info?.referralCode} fullWidth />
          <Button
            label={t.referral.share}
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
