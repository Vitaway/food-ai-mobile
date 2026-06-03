import { type PropsWithChildren } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type ProfileSectionProps = PropsWithChildren<{
  title: string;
}>;

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View className="mt-5">
      <Text className="mb-2 px-1 text-xs font-sans-semibold uppercase tracking-wider text-neutral-400">{title}</Text>
      <View className="overflow-hidden rounded-2xl border border-ash-grey-100 bg-white">{children}</View>
    </View>
  );
}
