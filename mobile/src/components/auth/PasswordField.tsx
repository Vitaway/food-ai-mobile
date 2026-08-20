import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, View, type TextInputProps } from 'react-native';

import { AppTextInput } from '@/components/ui/AppTextInput';
import { Text } from '@/components/ui/Text';
import { fonts } from '@/constants/fonts';

type PasswordFieldProps = TextInputProps & {
  label: string;
  hint?: string;
};

/** iOS often ignores custom fonts on secure fields unless style is forced. */
const PASSWORD_TEXT_STYLE = {
  color: '#171717',
  fontFamily: fonts.sans,
  ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
} as const;

export function PasswordField({ label, hint, className, style, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <Text className="font-sans-medium text-sm text-neutral-700">{label}</Text>
      {hint ? <Text className="mt-0.5 text-xs text-neutral-500">{hint}</Text> : null}
      <View className="relative mt-2">
        <AppTextInput
          {...props}
          // Remount when visibility toggles so iOS reapplies Sniglet to the glyphs.
          key={visible ? 'password-visible' : 'password-hidden'}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={props.textContentType ?? 'password'}
          autoComplete={props.autoComplete ?? 'password'}
          className={`rounded-2xl border border-ash-grey-200 bg-ash-grey-50 px-4 pr-12 text-neutral-900 ${className ?? ''}`}
          placeholderTextColor="#9ca3af"
          style={[PASSWORD_TEXT_STYLE, style]}
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
