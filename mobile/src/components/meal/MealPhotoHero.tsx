import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { MealStatusBadge } from '@/components/meal/MealStatusBadge';
import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { Text } from '@/components/ui/Text';
import { isAwaitingCoachReview } from '@/constants/mealStatus';
import { MEAL_TYPE_OPTIONS } from '@/constants/mealTypes';
import type { MealSubmission } from '@/types';
import { mealDisplayTitle } from '@/utils/mealDisplay';

function mealTypeMeta(mealType: MealSubmission['mealType']) {
  return MEAL_TYPE_OPTIONS.find((option) => option.id === mealType) ?? MEAL_TYPE_OPTIONS[1];
}

function formatHeroTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function MealPhotoHero({ meal }: { meal: MealSubmission }) {
  const mealType = mealTypeMeta(meal.mealType);
  const awaitingCoach = isAwaitingCoachReview(meal.status);
  const verified = meal.status === 'approved';

  return (
    <View className="relative h-[300px] w-full overflow-hidden bg-blue-spruce-900">
      <ResolvedImage
        uri={meal.imageUrl}
        className="h-full w-full"
        resizeMode="cover"
        fallback={
          <View className="h-full w-full items-center justify-center bg-blue-spruce-900">
            <Ionicons name={mealType.icon} size={56} color="rgba(255,255,255,0.35)" />
          </View>
        }
      />
      <LinearGradient
        colors={['rgba(1,16,35,0.15)', 'rgba(1,16,35,0.35)', 'rgba(1,16,35,0.92)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-20">
        <View className="mb-3 flex-row flex-wrap items-center gap-2">
          <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
            <Ionicons name={mealType.icon} size={13} color="#ffffff" />
            <Text className="text-[11px] font-sans-semibold text-white">{mealType.label}</Text>
          </View>
          {verified ? (
            <View className="flex-row items-center gap-1 rounded-full bg-shamrock-500/90 px-2.5 py-1">
              <Ionicons name="shield-checkmark" size={12} color="#ffffff" />
              <Text className="text-[11px] font-sans-semibold text-white">Coach verified</Text>
            </View>
          ) : !awaitingCoach ? (
            <MealStatusBadge status={meal.status} size="md" />
          ) : (
            <View className="rounded-full bg-cinnamon-wood-500/90 px-2.5 py-1">
              <Text className="text-[11px] font-sans-semibold text-white">In review</Text>
            </View>
          )}
        </View>

        <Text className="font-display text-[32px] leading-9 text-white" numberOfLines={2}>
          {mealDisplayTitle(meal)}
        </Text>
        <Text className="mt-2 text-sm text-white/70">Logged {formatHeroTime(meal.submittedAt)}</Text>
      </View>
    </View>
  );
}
