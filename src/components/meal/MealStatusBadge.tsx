import { View } from 'react-native';

import { MEAL_STATUS_LABELS } from '@/constants/mealStatus';
import { Text } from '@/components/ui/Text';
import type { MealSubmissionStatus } from '@/types';

const BADGE_STYLES: Record<
  MealSubmissionStatus,
  { container: string; text: string }
> = {
  pending: { container: 'bg-ash-grey-200', text: 'text-neutral-700' },
  analyzing: { container: 'bg-blue-spruce-100', text: 'text-blue-spruce-800' },
  in_review: { container: 'bg-cinnamon-wood-100', text: 'text-cinnamon-wood-700' },
  approved: { container: 'bg-shamrock-100', text: 'text-shamrock-800' },
  rejected: { container: 'bg-red-100', text: 'text-red-800' },
};

type MealStatusBadgeProps = {
  status: MealSubmissionStatus;
  size?: 'sm' | 'md';
};

export function MealStatusBadge({ status, size = 'sm' }: MealStatusBadgeProps) {
  const styles = BADGE_STYLES[status];
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <View className={`rounded-full px-2.5 py-1 ${styles.container}`}>
      <Text className={`font-sans-semibold uppercase tracking-wide ${textSize} ${styles.text}`}>
        {MEAL_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}
