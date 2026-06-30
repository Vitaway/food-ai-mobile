import { Stack } from 'expo-router';

export default function ARMeasureLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="manual" options={{ presentation: 'card' }} />
    </Stack>
  );
}
