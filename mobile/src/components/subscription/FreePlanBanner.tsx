import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useSubscriptionAccess } from '@/context/SubscriptionAccessContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/LocaleContext';
import { isApiConfigured } from '@/constants/api';
import { palette } from '@/design-system/colors';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';

type FreePlanBannerProps = {
  compact?: boolean;
};

/** Persistent reminder for freemium users. Hidden when subscribed / coach / offline. */
export function FreePlanBanner({ compact = false }: FreePlanBannerProps) {
  const { push } = useNavigateOnce();
  const { t } = useI18n();
  const { isCoach } = useAuth();
  const { hasActiveSubscription, isSubscriptionReady } = useSubscriptionAccess();

  if (!isApiConfigured() || isCoach || !isSubscriptionReady || hasActiveSubscription) {
    return null;
  }

  return (
    <Pressable
      onPress={() => push('/paywall')}
      accessibilityRole="button"
      accessibilityLabel={t.freePlan.a11yUpgrade}
      className={`flex-row items-center gap-3 rounded-2xl border border-cinnamon-wood-200 bg-cinnamon-wood-50 ${
        compact ? 'px-3 py-2.5' : 'px-4 py-3.5'
      }`}
      style={{
        shadowColor: palette['cinnamon-wood'][900],
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}>
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: palette['cinnamon-wood'][400] }}>
        <Ionicons name="lock-closed" size={16} color="#ffffff" />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="text-[13px] font-sans-bold uppercase tracking-wide"
          style={{ color: palette['cinnamon-wood'][600] }}>
          {t.freePlan.badge}
        </Text>
        <Text className="mt-0.5 text-xs leading-4 text-ash-grey-700">{t.freePlan.body}</Text>
      </View>
      <Text
        className="text-xs font-sans-bold"
        style={{ color: palette['cinnamon-wood'][600] }}>
        {t.freePlan.upgrade}
      </Text>
    </Pressable>
  );
}
