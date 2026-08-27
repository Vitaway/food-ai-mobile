import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { tf, useI18n } from '@/context/LocaleContext';
import { semanticColors } from '@/design-system/colors';
import { formatGlassesShortFromT, glassNounFromT } from '@/utils/i18nLabels';
import { formatGlassesWhole, mlToGlasses } from '@/utils/waterUnits';

type HomeWaterCardProps = {
  waterMl: number;
  waterTargetMl: number;
  onPress: () => void;
};

export function HomeWaterCard({ waterMl, waterTargetMl, onPress }: HomeWaterCardProps) {
  const { t } = useI18n();
  const progress = waterTargetMl > 0 ? Math.min(1, waterMl / waterTargetMl) : 0;
  const glassesLogged = mlToGlasses(waterMl);
  const glassesTarget = mlToGlasses(waterTargetMl);
  const remainingGlasses = Math.max(0, glassesTarget - glassesLogged);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-2xl bg-white px-4 py-3.5 active:opacity-90"
      style={{
        shadowColor: '#1a1c17',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      }}>
      <View className="h-11 w-11 items-center justify-center rounded-full bg-cinnamon-wood-50">
        <Ionicons name="water" size={22} color={semanticColors.accentOrange} />
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-semibold text-neutral-900">{t.home.waterToday}</Text>
          <Text className="font-sans-semibold text-sm text-cinnamon-wood-400">
            {formatGlassesWhole(glassesLogged)}/{formatGlassesWhole(glassesTarget)}{' '}
            {glassNounFromT(t, glassesTarget)}
          </Text>
        </View>
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-ash-grey-100">
          <View
            className="h-full rounded-full bg-cinnamon-wood-400"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
        <Text className="mt-1.5 text-xs text-neutral-500">
          {remainingGlasses > 0
            ? tf(t.home.waterToGo, { amount: formatGlassesShortFromT(t, remainingGlasses) })
            : t.home.waterGoalReached}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#848a75" />
    </Pressable>
  );
}
