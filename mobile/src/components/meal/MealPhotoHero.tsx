import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

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

export function MealPhotoHero({ meal }: { meal: MealSubmission }) {
  const mealType = mealTypeMeta(meal.mealType);
  const awaitingCoach = isAwaitingCoachReview(meal.status);

  return (
    <View className="relative h-[240px] w-full overflow-hidden bg-ash-grey-200">
      <ResolvedImage
        uri={meal.imageUrl}
        className="h-full w-full"
        resizeMode="cover"
        fallback={
          <View className="h-full w-full items-center justify-center bg-blue-spruce-900">
            <Ionicons name={mealType.icon} size={48} color="rgba(255,255,255,0.45)" />
          </View>
        }
      />
      <View className="absolute inset-0 bg-black/30" />
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-16">
        <View className="flex-row items-end justify-between gap-3">
          <View className="min-w-0 flex-1">
            <View className="mb-2 flex-row items-center gap-1.5 self-start rounded-full bg-white/20 px-2.5 py-1">
              <Ionicons name={mealType.icon} size={14} color="#ffffff" />
              <Text className="text-xs font-sans-semibold text-white">{mealType.label}</Text>
            </View>
            <Text className="font-sans-bold text-2xl leading-8 text-white" numberOfLines={2}>
              {mealDisplayTitle(meal)}
            </Text>
          </View>
          {/* Avoid duplicating “In review” when the waiting card is shown below */}
          {!awaitingCoach ? <MealStatusBadge status={meal.status} size="md" /> : null}
        </View>
      </View>
    </View>
  );
}
