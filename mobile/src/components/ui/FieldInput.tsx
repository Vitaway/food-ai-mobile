import type { ReactNode } from 'react';
import { View, type TextInputProps } from 'react-native';

import { AppTextInput } from '@/components/ui/AppTextInput';
import { Text } from '@/components/ui/Text';
import { cn } from '@/utils/cn';

type FieldInputProps = TextInputProps & {
  label: string;
  hint?: string;
};

/** Soft filled well — readable on mint canvas and light auth sheets. */
export function FieldWell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'mt-1.5 min-h-[52px] justify-center rounded-2xl border-2 border-blue-spruce-500/25 bg-white/92 px-4',
        className,
      )}>
      {children}
    </View>
  );
}

const PLACEHOLDER = '#6b7a52';

/** Labeled text field in a soft well for clear tap targets and contrast. */
export function FieldInput({ label, hint, className, style, ...props }: FieldInputProps) {
  return (
    <View>
      <Text className="font-sans-semibold text-sm text-blue-spruce-800">{label}</Text>
      {hint ? <Text className="mt-0.5 text-xs text-blue-spruce-700/75">{hint}</Text> : null}
      <FieldWell>
        <AppTextInput
          {...props}
          className={cn('bg-transparent px-0 py-3 text-blue-spruce-900', className)}
          style={style}
          placeholderTextColor={PLACEHOLDER}
        />
      </FieldWell>
    </View>
  );
}
