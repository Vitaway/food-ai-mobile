import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useSinglePress } from '@/hooks/useSinglePress';
import { cn } from '@/utils/cn';

type ProfileMenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
};

export function ProfileMenuRow({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
  destructive,
  className,
}: ProfileMenuRowProps) {
  const handlePress = useSinglePress(onPress);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || !onPress}
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5',
        disabled ? 'opacity-50' : '',
        className,
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}>
      <View
        className={cn(
          'h-10 w-10 items-center justify-center rounded-xl',
          destructive ? 'bg-cinnamon-wood-50' : 'bg-blue-spruce-50',
        )}>
        <Ionicons name={icon} size={20} color={destructive ? '#E85A2A' : '#023459'} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className={cn(
            'font-sans-semibold text-base',
            destructive ? 'text-cinnamon-wood-600' : 'text-neutral-900',
          )}>
          {title}
        </Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-neutral-500">{subtitle}</Text> : null}
      </View>
      {!disabled && onPress ? <Ionicons name="chevron-forward" size={18} color="#c4c8bc" /> : null}
    </Pressable>
  );
}
