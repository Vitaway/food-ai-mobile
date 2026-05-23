import { cn } from '@/utils/cn';
import { Pressable, type PressableProps } from 'react-native';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  className?: string;
  textClassName?: string;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-spruce-600 active:bg-blue-spruce-700',
  secondary: 'bg-shamrock-600 active:bg-shamrock-700',
  outline: 'border border-blue-spruce-600 bg-transparent active:bg-blue-spruce-50',
  ghost: 'bg-transparent active:bg-ash-grey-100',
};

const textVariantStyles: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-blue-spruce-700',
  ghost: 'text-blue-spruce-700',
};

export function Button({
  label,
  variant = 'primary',
  className,
  textClassName,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn(
        'min-h-12 items-center justify-center rounded-2xl px-5',
        variantStyles[variant],
        disabled && 'opacity-50',
        className,
      )}
      {...props}>
      {({ pressed }) => (
        <Text
          className={cn(
            'font-sans-semibold text-base',
            textVariantStyles[variant],
            pressed && 'opacity-90',
            textClassName,
          )}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
