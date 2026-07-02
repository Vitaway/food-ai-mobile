import { Platform, TextInput, type TextInputProps, type TextStyle } from 'react-native';

import { fonts } from '@/constants/fonts';
import { cn } from '@/utils/cn';

export type AppTextInputSize = 'base' | 'lg' | 'display';

const SIZE_CONFIG: Record<AppTextInputSize, { fontSize: number; lineHeight: number; paddingVertical: number }> = {
  base: { fontSize: 16, lineHeight: 22, paddingVertical: 11 },
  lg: { fontSize: 18, lineHeight: 26, paddingVertical: 12 },
  display: { fontSize: 36, lineHeight: 44, paddingVertical: 8 },
};

/** Avoids clipped descenders with Sniglet on iOS/Android. */
export function appTextInputStyle(
  size: AppTextInputSize = 'base',
  options?: { weight?: 'regular' | 'bold'; multiline?: boolean },
): TextStyle {
  const { fontSize, lineHeight, paddingVertical } = SIZE_CONFIG[size];
  const weight = options?.weight ?? 'regular';
  const multiline = options?.multiline ?? false;

  return {
    fontFamily: weight === 'bold' ? fonts.sansExtraBold : fonts.sans,
    fontSize,
    lineHeight,
    paddingVertical: multiline ? 12 : paddingVertical,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: multiline ? 'top' : 'center',
    }),
    ...(Platform.OS === 'ios' && multiline ? { textAlignVertical: 'top' as const } : {}),
  };
}

type AppTextInputProps = TextInputProps & {
  size?: AppTextInputSize;
  weight?: 'regular' | 'bold';
  className?: string;
};

export function AppTextInput({
  size = 'base',
  weight = 'regular',
  className,
  style,
  multiline,
  placeholderTextColor = '#848a75',
  ...props
}: AppTextInputProps) {
  return (
    <TextInput
      multiline={multiline}
      placeholderTextColor={placeholderTextColor}
      className={cn('text-neutral-900', className)}
      style={[appTextInputStyle(size, { weight, multiline }), style]}
      {...props}
    />
  );
}
