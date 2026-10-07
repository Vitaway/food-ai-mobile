import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

/** Pass-through group on the mint canvas — no nested white card. */
export function OnboardingCard({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <View className={className}>{children}</View>;
}
