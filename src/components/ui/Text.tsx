import { cn } from '@/utils/cn';
import { Text as RNText, type TextProps } from 'react-native';

type AppTextProps = TextProps & {
  className?: string;
};

export function Text({ className, ...props }: AppTextProps) {
  return <RNText className={cn('font-sans text-base text-neutral-900', className)} {...props} />;
}
