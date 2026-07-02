import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View, type TextInputProps } from 'react-native';

import { AppTextInput } from '@/components/ui/AppTextInput';
import { Text } from '@/components/ui/Text';

type PasswordFieldProps = TextInputProps & {
  label: string;
  hint?: string;
};

export function PasswordField({ label, hint, className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <Text className="font-sans-medium text-sm text-neutral-700">{label}</Text>
      {hint ? <Text className="mt-0.5 text-xs text-neutral-500">{hint}</Text> : null}
      <View className="relative mt-2">
        <AppTextInput
          {...props}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          className={`rounded-2xl border border-ash-grey-200 bg-ash-grey-50 px-4 pr-12 ${className ?? ''}`}
          placeholderTextColor="#9ca3af"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          onPress={() => setVisible((v) => !v)}
          className="absolute bottom-0 right-0 top-0 items-center justify-center px-4">
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
        </Pressable>
      </View>
    </View>
  );
}
