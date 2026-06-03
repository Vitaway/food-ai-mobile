import { View, type TextInputProps } from 'react-native';

import { AppTextInput } from '@/components/ui/AppTextInput';
import { Text } from '@/components/ui/Text';

type FieldInputProps = TextInputProps & {
  label: string;
  hint?: string;
};

export function FieldInput({ label, hint, className, ...props }: FieldInputProps) {
  return (
    <View>
      <Text className="font-sans-medium text-sm text-neutral-700">{label}</Text>
      {hint ? <Text className="mt-0.5 text-xs text-neutral-500">{hint}</Text> : null}
      <AppTextInput
        {...props}
        className={`mt-2 rounded-2xl border border-ash-grey-200 bg-ash-grey-50 px-4 ${className ?? ''}`}
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}
