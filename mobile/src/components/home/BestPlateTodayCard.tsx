import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import {
  mealTypeSupportsBalancedPlate,
  type BalancedPlateScore,
  type PlateGroup,
} from '@/types/balancedPlate';
import { semanticColors } from '@/design-system/colors';

export type BestPlateCandidate = {
  id: string;
  mealType: string;
  mealName?: string;
  score: BalancedPlateScore;
};

type BestPlateMealInput = {
  id: string;
  mealType: string;
  mealName?: string;
  status: string;
  balancedPlate?: BalancedPlateScore | null;
  items?: Array<{ label: string; estimatedWeightG: number; plateGroup?: PlateGroup | null }>;
};

type BestPlateTodayCardProps = {
  plate: BestPlateCandidate | null;
  onPress: (mealId: string) => void;
};

export function BestPlateTodayCard({ plate, onPress }: BestPlateTodayCardProps) {
  if (!plate || !mealTypeSupportsBalancedPlate(plate.mealType)) return null;

  return (
    <Pressable
      onPress={() => onPress(plate.id)}
      className="mb-4 flex-row items-center gap-4 rounded-3xl bg-white px-4 py-4 active:opacity-90"
      style={{
        shadowColor: '#1a1c17',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
      }}>
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-blue-spruce-600">
        <Text className="font-sans-bold text-2xl text-white">{plate.score.score}</Text>
        <Text className="text-[9px] font-sans-bold uppercase tracking-wide text-white/80">Plate</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-blue-spruce-600">
          Best plate today
        </Text>
        <Text className="mt-0.5 font-sans-bold text-lg text-blue-spruce-900" numberOfLines={1}>
          {plate.mealName || plate.mealType} · {plate.score.label}
        </Text>
        <Text className="mt-0.5 text-sm text-blue-spruce-700/80" numberOfLines={2}>
          {plate.score.tip}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={semanticColors.primary} />
    </Pressable>
  );
}

export function pickBestPlateToday(
  meals: BestPlateMealInput[],
  resolveScore: (meal: BestPlateMealInput) => BalancedPlateScore | null,
): BestPlateCandidate | null {
  let best: BestPlateCandidate | null = null;
  for (const meal of meals) {
    if (meal.status === 'rejected') continue;
    if (!mealTypeSupportsBalancedPlate(meal.mealType)) continue;
    const score = resolveScore(meal);
    if (!score) continue;
    if (!best || score.score > best.score.score) {
      best = {
        id: meal.id,
        mealType: meal.mealType,
        mealName: meal.mealName,
        score,
      };
    }
  }
  return best;
}
