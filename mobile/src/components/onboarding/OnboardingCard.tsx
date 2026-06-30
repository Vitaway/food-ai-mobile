import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { logCardClassName } from '@/components/log/LogScreenShell';

const cardShadow = {
  shadowColor: '#1a1c17',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
} as const;

export function OnboardingCard({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <View className={logCardClassName(className)} style={cardShadow}>
      {children}
    </View>
  );
}
