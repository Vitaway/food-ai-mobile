import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';

type KeyboardSafeScreenProps = PropsWithChildren<{
  /** iOS-only. Keep small so the top header stays in view. */
  keyboardVerticalOffset?: number;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Shared wrapper to keep text inputs visible above the software keyboard.
 * Use it on any screen that contains focused <TextInput /> elements.
 */
export function KeyboardSafeScreen({
  children,
  keyboardVerticalOffset = 8,
  style,
}: KeyboardSafeScreenProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardVerticalOffset : 0}
      style={[{ flex: 1 }, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}

