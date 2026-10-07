import { type PropsWithChildren } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type ProfileSectionProps = PropsWithChildren<{
  title: string;
}>;

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View>
      <Text className="mb-3 px-1 text-[11px] font-sans-bold uppercase tracking-[0.12em] text-ash-grey-400">
        {title}
      </Text>
      <View
        className="overflow-hidden rounded-[24px] border border-ash-grey-100 bg-white"
        style={{
          shadowColor: '#1a3a2a',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 1,
        }}>
        {children}
      </View>
    </View>
  );
}
