import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  getPasswordStrength,
  passwordRequirementStatus,
  type PasswordStrength,
} from '@/utils/passwordStrength';

const BAR_COLORS: Record<PasswordStrength, string> = {
  weak: 'bg-red-500',
  fair: 'bg-cinnamon-wood-400',
  good: 'bg-shamrock-500',
  strong: 'bg-blue-spruce-600',
};

const BAR_WIDTH: Record<PasswordStrength, string> = {
  weak: 'w-1/4',
  fair: 'w-2/4',
  good: 'w-3/4',
  strong: 'w-full',
};

const LABEL_COLORS: Record<PasswordStrength, string> = {
  weak: 'text-red-600',
  fair: 'text-cinnamon-wood-700',
  good: 'text-shamrock-700',
  strong: 'text-blue-spruce-700',
};

type PasswordStrengthMeterProps = {
  password: string;
};

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const reqs = passwordRequirementStatus(password);

  return (
    <View className="mt-3 gap-2">
      <View className="h-1.5 overflow-hidden rounded-full bg-ash-grey-100">
        <View className={`h-full rounded-full ${BAR_COLORS[strength]} ${BAR_WIDTH[strength]}`} />
      </View>
      <Text className={`text-xs font-sans-medium capitalize ${LABEL_COLORS[strength]}`}>
        Password strength: {strength}
      </Text>
      <View className="gap-1">
        <Requirement met={reqs.length} label="At least 8 characters" />
        <Requirement met={reqs.mixedCase} label="Upper and lower case letters" />
        <Requirement met={reqs.number} label="At least one number" />
      </View>
    </View>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <Text className={`text-xs ${met ? 'text-shamrock-700' : 'text-neutral-400'}`}>
      {met ? '✓' : '○'} {label}
    </Text>
  );
}
