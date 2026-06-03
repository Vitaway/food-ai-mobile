import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';

type LogFlowHeaderProps = {
  title: string;
  onBack?: () => void;
};

export function LogFlowHeader({ title, onBack }: LogFlowHeaderProps) {
  return (
    <GradientHeader>
      <View className="flex-row items-center gap-3">
        {onBack ? (
          <Pressable
            onPress={onBack}
            className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 active:opacity-90">
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </Pressable>
        ) : null}
        <GradientHeaderTitle className="flex-1">{title}</GradientHeaderTitle>
      </View>
    </GradientHeader>
  );
}
