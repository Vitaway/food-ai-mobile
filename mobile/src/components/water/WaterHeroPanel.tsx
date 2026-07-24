import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { palette, semanticColors } from '@/design-system/colors';
import { formatCups, WATER_CUP_ML } from '@/utils/waterUnits';

type WaterHeroPanelProps = {
  cupsLogged: number;
  cupsTarget: number;
  waterMl: number;
  progress: number;
  remainingCups: number;
};

function WaterGlass({ progress }: { progress: number }) {
  const height = 96;
  const width = 52;
  const fillHeight = Math.max(progress > 0 ? 10 : 0, progress * (height - 14));

  return (
    <View
      className="justify-end overflow-hidden rounded-2xl"
      style={{
        width,
        height,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.28)',
        backgroundColor: 'rgba(255,255,255,0.1)',
      }}>
      <View
        style={{
          height: fillHeight,
          backgroundColor: semanticColors.accentOrange,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          opacity: progress > 0 ? 0.95 : 0,
        }}
      />
    </View>
  );
}

export function WaterHeroPanel({
  cupsLogged,
  cupsTarget,
  waterMl,
  progress,
  remainingCups,
}: WaterHeroPanelProps) {
  const progressPct = Math.round(progress * 100);

  return (
    <View
      className="overflow-hidden rounded-[28px] p-5"
      style={{
        backgroundColor: palette['blue-spruce'][600],
        shadowColor: palette['blue-spruce'][900],
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 6,
      }}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-sans-medium text-white/70">Today&apos;s hydration</Text>
          <View className="mt-2 flex-row items-end gap-1.5">
            <Text className="font-sans-bold text-5xl leading-none text-white">{formatCups(cupsLogged)}</Text>
            <Text className="mb-1.5 font-sans-medium text-lg text-white/75">
              / {formatCups(cupsTarget)} glasses
            </Text>
          </View>

          <View className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/20">
            <View
              className="h-full rounded-full bg-cinnamon-wood-400"
              style={{ width: `${progressPct}%` }}
            />
          </View>

          <Text className="mt-3 text-sm text-white/85">
            {remainingCups > 0
              ? `${formatCups(remainingCups)} glasses to go · ${progressPct}% of goal`
              : 'Daily goal reached — nice work!'}
          </Text>
          <Text className="mt-1 text-xs text-white/55">
            {waterMl} ml logged · 1 glass = {WATER_CUP_ML} ml
          </Text>
        </View>

        <View className="items-center pt-1">
          <WaterGlass progress={progress} />
          <Ionicons
            name="water"
            size={18}
            color={semanticColors.accentOrange}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </View>
  );
}
