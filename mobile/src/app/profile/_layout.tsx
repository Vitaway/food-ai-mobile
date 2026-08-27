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
      <Stack.Screen name="day/[date]" />
      <Stack.Screen name="language" />
      <Stack.Screen name="report-view" />
      <Stack.Screen
        name="subscription"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          animationDuration: 180,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="invoice/[id]" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="data" />
    </Stack>
  );
}
