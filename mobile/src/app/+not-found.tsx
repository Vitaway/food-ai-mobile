import { useRouter, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen className="items-center justify-center px-5">
      <Text className="font-sans-bold text-2xl text-neutral-900">Screen not found</Text>
      <Text className="mt-2 text-center text-sm text-neutral-500">
        This page does not exist or may have moved.
      </Text>
      <Pressable
        onPress={() => router.replace('/(tabs)' as Href)}
        className="mt-6 rounded-2xl bg-blue-spruce-600 px-6 py-3 active:opacity-90">
        <Text className="font-sans-semibold text-white">Back to home</Text>
      </Pressable>
    </Screen>
  );
}
