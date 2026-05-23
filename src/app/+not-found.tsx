import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen className="items-center justify-center px-5">
        <Text className="font-sans-bold text-2xl text-neutral-900">Screen not found</Text>
        <Link href="/" asChild>
          <View className="mt-4 rounded-2xl bg-blue-spruce-600 px-5 py-3">
            <Text className="font-sans-semibold text-white">Go home</Text>
          </View>
        </Link>
      </Screen>
    </>
  );
}
