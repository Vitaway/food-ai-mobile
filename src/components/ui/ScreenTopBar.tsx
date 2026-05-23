import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/utils/cn';
import { Text } from './Text';

type ScreenTopBarProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
};

export function ScreenTopBar({ title, subtitle, onBack, rightAction, className }: ScreenTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn('border-b border-ash-grey-200 bg-white px-5 pb-4', className)}
      style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-full bg-ash-grey-100">
              <Text className="text-lg text-neutral-700">←</Text>
            </Pressable>
          ) : null}
          <View className="flex-1">
            <Text className="font-sans-bold text-xl text-neutral-900">{title}</Text>
            {subtitle ? <Text className="mt-0.5 text-sm text-neutral-500">{subtitle}</Text> : null}
          </View>
        </View>
        {rightAction}
      </View>
    </View>
  );
}
