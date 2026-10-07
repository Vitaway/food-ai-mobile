import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import {
  PLATE_GROUP_AIM,
  PLATE_GROUP_LABELS,
  mealTypeSupportsBalancedPlate,
  type BalancedPlateScore,
} from '@/types/balancedPlate';

const GROUP_COLORS = {
  vf: '#3F8F4A',
  pr: '#1a3a2a',
  st: '#EFA436',
} as const;

type BalancedPlateCardProps = {
  score: BalancedPlateScore | null | undefined;
  mealType?: string | null;
  compact?: boolean;
};

function PlateScoreRing({ score, size = 88 }: { score: BalancedPlateScore; size?: number }) {
  const r1 = 34;
  const r2 = 26;
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const cx = 54;
  const cy = 54;
  let aIdeal = 0;
  let aAct = 0;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} viewBox="0 0 108 108">
        {(['vf', 'pr', 'st'] as const).map((g) => {
          const v = PLATE_GROUP_AIM[g];
          const dash = Math.max(0, v * c1 - 2);
          const offset = -aIdeal * c1;
          aIdeal += v;
          return (
            <Circle
              key={`ideal-${g}`}
              cx={cx}
              cy={cy}
              r={r1}
              fill="none"
              stroke={GROUP_COLORS[g]}
              strokeOpacity={0.28}
              strokeWidth={5}
              strokeDasharray={`${dash} ${c1}`}
              strokeDashoffset={offset}
              rotation={-90}
              origin={`${cx}, ${cy}`}
            />
          );
        })}
        {(['vf', 'pr', 'st'] as const).map((g) => {
          const v = score.shares[g];
          if (v <= 0) return null;
          const dash = Math.max(0, v * c2 - 2);
          const offset = -aAct * c2;
          aAct += v;
          return (
            <Circle
              key={`act-${g}`}
              cx={cx}
              cy={cy}
              r={r2}
              fill="none"
              stroke={GROUP_COLORS[g]}
              strokeWidth={11}
              strokeDasharray={`${dash} ${c2}`}
              strokeDashoffset={offset}
              rotation={-90}
              origin={`${cx}, ${cy}`}
              strokeLinecap="butt"
            />
          );
        })}
      </Svg>
      <View className="absolute items-center">
        <Text className="font-sans-bold text-xl text-blue-spruce-900">{score.score}</Text>
        <Text className="text-[10px] font-sans-semibold uppercase tracking-wide text-blue-spruce-600">
          Plate
        </Text>
      </View>
    </View>
  );
}

export function BalancedPlateCard({ score, mealType, compact }: BalancedPlateCardProps) {
  if (!mealTypeSupportsBalancedPlate(mealType)) {
    return (
      <View className="rounded-[24px] border border-blue-spruce-200/50 bg-white/90 px-4 py-4">
        <Text className="text-sm leading-5 text-blue-spruce-700">
          The Balanced Plate score is for lunch and dinner. Breakfasts and snacks count toward your
          day.
        </Text>
      </View>
    );
  }

  if (!score) return null;

  return (
    <View className="rounded-[24px] border border-blue-spruce-200/50 bg-white px-4 py-4">
      <View className="flex-row items-center gap-4">
        <PlateScoreRing score={score} size={compact ? 76 : 88} />
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-blue-spruce-600">
            Balanced Plate
          </Text>
          <Text className="mt-1 font-sans-bold text-[22px] leading-7 text-blue-spruce-900">
            {score.label}
          </Text>
          {!compact
            ? (['vf', 'pr', 'st'] as const).map((g) => (
                <View key={g} className="mt-1.5 flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GROUP_COLORS[g] }} />
                  <Text className="flex-1 text-xs text-blue-spruce-800">{PLATE_GROUP_LABELS[g]}</Text>
                  <Text className="text-xs font-sans-semibold text-blue-spruce-700">
                    {Math.round(score.shares[g] * 100)}% · aim {g === 'vf' ? 50 : 25}%
                  </Text>
                </View>
              ))
            : null}
        </View>
      </View>
      <View
        className={`mt-3 rounded-2xl px-3 py-2.5 ${
          score.score >= 80 ? 'bg-shamrock-50' : 'bg-cinnamon-wood-50'
        }`}>
        <Text
          className={`text-sm leading-5 ${
            score.score >= 80 ? 'text-shamrock-800' : 'text-cinnamon-wood-800'
          }`}>
          {score.tip}
        </Text>
      </View>
    </View>
  );
}

type EstimateHonestyBannerProps = {
  midKcal: number;
  lowKcal?: number;
  highKcal?: number;
  pct?: number;
};

export function EstimateHonestyBanner({ midKcal, lowKcal, highKcal, pct }: EstimateHonestyBannerProps) {
  const hasRange =
    typeof lowKcal === 'number' &&
    typeof highKcal === 'number' &&
    typeof pct === 'number' &&
    pct > 0;

  return (
    <View className="rounded-2xl border border-cinnamon-wood-200 bg-cinnamon-wood-50 px-4 py-3">
      <Text className="font-sans-semibold text-sm text-cinnamon-wood-900">
        {hasRange
          ? `Estimate · ±${Math.round(pct * 100)}%`
          : 'Estimate until Grace confirms'}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-cinnamon-wood-800">
        {hasRange
          ? `Likely ${lowKcal}–${highKcal} kcal (mid ${midKcal}). Counts toward today until Grace confirms.`
          : `${midKcal} kcal · exact from labels.`}
      </Text>
    </View>
  );
}
