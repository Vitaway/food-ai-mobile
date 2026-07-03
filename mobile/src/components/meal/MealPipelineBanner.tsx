import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MEAL_STATUS_MESSAGES } from '@/constants/mealStatus';
import { MealStatusBadge } from '@/components/meal/MealStatusBadge';
import { Text } from '@/components/ui/Text';
import type { MealSubmissionStatus } from '@/types';

type MealPipelineBannerProps = {
  status: MealSubmissionStatus;
};

export function MealPipelineBanner({ status }: MealPipelineBannerProps) {
  const isRejected = status === 'rejected';
  const isAutomatedStep = status === 'pending' || status === 'analyzing';
  const isAwaitingCoach = status === 'in_review';

  if (!isAutomatedStep && !isAwaitingCoach && !isRejected) return null;

  return (
    <View
      className={`rounded-2xl px-4 py-4 ${isRejected ? 'bg-red-50' : 'bg-blue-spruce-50'}`}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          {isAutomatedStep ? <ActivityIndicator size="small" color="#023459" /> : null}
          {isAwaitingCoach ? <Ionicons name="time-outline" size={20} color="#023459" /> : null}
          {isRejected ? <Ionicons name="alert-circle" size={20} color="#b91c1c" /> : null}
          <MealStatusBadge status={status} size="md" />
        </View>
      </View>
      <Text className={`mt-2 text-sm leading-5 ${isRejected ? 'text-red-800' : 'text-blue-spruce-900'}`}>
        {MEAL_STATUS_MESSAGES[status]}
      </Text>
    </View>
  );
}
