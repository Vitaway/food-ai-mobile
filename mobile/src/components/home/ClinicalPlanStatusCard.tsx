import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { UserProfile } from '@/types';

export function ClinicalPlanStatusCard({ profile }: { profile: UserProfile }) {
  if (profile.clinicalAssessmentStatus === 'confirmed' && profile.targetStatus === 'confirmed') {
    return (
      <View className="rounded-2xl border border-shamrock-200 bg-shamrock-50 p-4">
        <View className="flex-row items-start gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-shamrock-100">
            <Ionicons name="shield-checkmark" size={19} color="#2E7D4F" />
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-sm text-neutral-900">
              Your nutrition plan is coach-confirmed
            </Text>
            <Text className="mt-1 text-xs leading-5 text-neutral-600">
              Your calorie, macro, and hydration targets use your verified health profile.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-cinnamon-wood-200 bg-cinnamon-wood-50 p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-cinnamon-wood-100">
          <Ionicons name="person-add-outline" size={19} color="#9A572D" />
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-sm text-neutral-900">
            Your coach is personalizing your plan
          </Text>
          <Text className="mt-1 text-xs leading-5 text-neutral-600">
            Current targets are provisional and maintenance-safe. Your coach will verify a few
            health details before MiraFood applies goal-based adjustments.
          </Text>
        </View>
      </View>
    </View>
  );
}
