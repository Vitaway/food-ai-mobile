import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';

type CalorieRingProps = {
  consumed: number;
  target: number;
  size?: number;
  compact?: boolean;
  /** White ring for use on dark hero cards */
  tone?: 'default' | 'light';
};

export function CalorieRing({
  consumed,
  target,
  size = 132,
  compact = false,
  tone = 'default',
}: CalorieRingProps) {
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const over = consumed > target;
  const stroke = compact ? 8 : 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const isLight = tone === 'light';
  const trackColor = isLight ? 'rgba(255,255,255,0.25)' : '#E8EAE4';
  const ringColor = over ? semanticColors.accentOrange : isLight ? '#ffffff' : '#1D9E75';
  const valueClass = isLight ? 'text-white' : 'text-neutral-900';
  const metaClass = isLight ? 'text-white/75' : 'text-neutral-500';
  const labelClass = isLight ? 'text-white/60' : 'text-neutral-400';

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View className="items-center px-2">
        <Text className={`font-sans-bold ${valueClass} ${compact ? 'text-2xl' : 'text-3xl'}`}>
          {consumed}
        </Text>
        <Text className={`text-xs ${metaClass}`}>/ {target}</Text>
        <Text className={`mt-0.5 text-[10px] font-sans-medium tracking-wide ${labelClass}`}>kcal</Text>
      </View>
    </View>
  );
}

export function CalorieRingCaption({ consumed, target }: { consumed: number; target: number }) {
  const remaining = Math.max(target - consumed, 0);
  const over = consumed > target;

  return (
    <Text className="text-center text-sm text-neutral-600">
      {over ? (
        <Text className="font-sans-semibold text-cinnamon-wood-600">
          {consumed - target} kcal over target
        </Text>
      ) : (
        <Text>
          <Text className="font-sans-semibold text-neutral-800">{remaining}</Text> kcal remaining
        </Text>
      )}
    </Text>
  );
}
