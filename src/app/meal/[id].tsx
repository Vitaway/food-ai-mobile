import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';

export default function MealResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen edges={[]}>
      <ScreenTopBar title="Meal results" subtitle={`Submission ${id ?? '—'}`} onBack={() => router.back()} />
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-6">
        <View className="rounded-2xl bg-shamrock-100 px-4 py-3">
          <Text className="font-sans-semibold text-shamrock-800">Well-balanced meal — great choice!</Text>
        </View>

        <View className="rounded-3xl bg-white p-5 shadow-sm">
          <Text className="font-sans-bold text-3xl text-neutral-900">520 kcal</Text>
          <Text className="mt-1 text-neutral-500">Grilled chicken with rice and salad</Text>
        </View>

        <View className="gap-3">
          <Button label="Edit items" variant="outline" />
          <Button label="Flag for re-review" variant="ghost" />
        </View>
      </ScrollView>
    </Screen>
  );
}
