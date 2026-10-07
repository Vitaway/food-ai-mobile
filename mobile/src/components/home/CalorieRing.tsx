import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { tf, useI18n } from '@/context/LocaleContext';
import { semanticColors } from '@/design-system/colors';

type CalorieRingProps = {
  consumed: number;
  target: number;
  /** Grace-confirmed kcal (green arc). Defaults to full consumed. */
  confirmed?: number;
  /** Estimate kcal (amber arc). */
  estimate?: number;
  size?: number;
  compact?: boolean;
  /** White ring for use on dark hero cards */
  tone?: 'default' | 'light';
};

export function CalorieRing({
  consumed,
  target,
  confirmed,
  estimate,
  size = 132,
  compact = false,
  tone = 'default',
}: CalorieRingProps) {
  const { t } = useI18n();
  const confirmedKcal = confirmed ?? (estimate != null ? Math.max(consumed - estimate, 0) : consumed);
  const estimateKcal = estimate ?? Math.max(consumed - confirmedKcal, 0);
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const confirmedProgress = target > 0 ? Math.min(confirmedKcal / target, 1) : 0;
  const over = consumed > target;
  const stroke = compact ? 8 : 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const isLight = tone === 'light';
  const trackColor = isLight ? 'rgba(255,255,255,0.25)' : '#E8EAE4';
  const confirmedColor = over
    ? semanticColors.accentOrange
    : isLight
      ? semanticColors.healthGreen
      : semanticColors.healthGreen;
  const estimateColor = isLight ? '#efa436' : semanticColors.accent;
  const valueClass = isLight ? 'text-white' : 'text-neutral-900';
  const metaClass = isLight ? 'text-white/75' : 'text-neutral-500';
  const labelClass = isLight ? 'text-white/60' : 'text-neutral-400';

  const confirmedLen = circumference * confirmedProgress;
  const estimateLen = circumference * Math.max(progress - confirmedProgress, 0);

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
        {/* Estimate arc sits under confirmed visually as the outer portion of progress */}
        {estimateLen > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={estimateColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${confirmedLen + estimateLen} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        ) : null}
        {confirmedLen > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={confirmedColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${confirmedLen} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        ) : null}
      </Svg>
      <View className="items-center px-2">
        <Text className={`font-sans-bold ${valueClass} ${compact ? 'text-2xl' : 'text-3xl'}`}>
          {consumed}
        </Text>
        <Text className={`text-xs ${metaClass}`}>/ {target}</Text>
        <Text className={`mt-0.5 text-[10px] font-sans-medium tracking-wide ${labelClass}`}>
          {t.common.kcal}
        </Text>
      </View>
    </View>
  );
}

export function CalorieRingCaption({ consumed, target }: { consumed: number; target: number }) {
  const { t } = useI18n();
  const remaining = Math.max(target - consumed, 0);
  const over = consumed > target;

  return (
    <Text className="text-center text-sm text-neutral-600">
      {over ? (
        <Text className="font-sans-semibold text-cinnamon-wood-600">
          {tf(t.home.kcalOverTarget, { n: consumed - target })}
        </Text>
      ) : (
        <Text className="font-sans-semibold text-neutral-800">
          {tf(t.home.kcalRemaining, { n: remaining })}
        </Text>
      )}
    </Text>
  );
}
