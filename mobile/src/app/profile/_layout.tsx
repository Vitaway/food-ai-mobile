import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' },
      }}>
      <Stack.Screen name="account" />
      <Stack.Screen name="edit-health" />
      <Stack.Screen name="health" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="data" />
    </Stack>
  );
}
