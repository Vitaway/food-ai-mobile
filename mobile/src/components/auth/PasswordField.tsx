import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, View, type TextInputProps } from 'react-native';

import { AppTextInput } from '@/components/ui/AppTextInput';
import { FieldWell } from '@/components/ui/FieldInput';
import { Text } from '@/components/ui/Text';
import { fonts } from '@/constants/fonts';

type PasswordFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  /**
   * When true (sign-up / reset), skip iOS Automatic Strong Password.
   * That overlay shows as a yellow “Automatic Strong Password cover view”.
   */
  disableStrongPassword?: boolean;
};

/** iOS often ignores custom fonts on secure fields unless style is forced. */
const PASSWORD_TEXT_STYLE = {
  color: '#0d1a14',
  fontFamily: fonts.sans,
  ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
} as const;

/** Soft-well password field — matches FieldInput contrast on mint. */
export function PasswordField({
  label,
  hint,
  className,
  style,
  disableStrongPassword = false,
  textContentType,
  autoComplete,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  // Avoid `newPassword` — it triggers iOS Strong Password UI that covers the field.
  const resolvedContentType =
    textContentType ?? (disableStrongPassword ? (Platform.OS === 'ios' ? 'none' : 'password') : 'password');
  const resolvedAutoComplete =
    autoComplete ?? (disableStrongPassword ? 'off' : 'password');

  return (
    <View>
      <Text className="font-sans-semibold text-sm text-blue-spruce-800">{label}</Text>
      {hint ? <Text className="mt-0.5 text-xs text-blue-spruce-700/75">{hint}</Text> : null}
      <FieldWell className="relative pr-12">
        <AppTextInput
          {...props}
          // Do not remount on show/hide — remounting with newPassword leaves the iOS cover stuck.
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textContentType={resolvedContentType}
          autoComplete={resolvedAutoComplete}
          importantForAutofill={disableStrongPassword ? 'no' : 'yes'}
          clearButtonMode="never"
          className={`border-0 bg-transparent py-3 text-blue-spruce-900 ${className ?? ''}`}
          placeholderTextColor="#6b7a52"
          style={[
            PASSWORD_TEXT_STYLE,
            {
              zIndex: 1,
              backgroundColor: 'transparent',
            },
            style,
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          style={{ zIndex: 2 }}
          className="absolute bottom-0 right-3 top-0 items-center justify-center">
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#2f4536" />
        </Pressable>
      </FieldWell>
    </View>
  );
}
