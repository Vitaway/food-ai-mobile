import { cn } from '@/utils/cn';
import { Text as RNText, type TextProps } from 'react-native';

import { DISPLAY_TITLE_CLASS } from '@/constants/fonts';

type AppTextProps = TextProps & {
  className?: string;
  /** Cabin Sketch display headings — matches web h1–h6 */
  display?: boolean;
};

export function Text({ className, display = false, ...props }: AppTextProps) {
  return (
    <RNText
      className={cn(
        display ? DISPLAY_TITLE_CLASS : 'font-sans',
        'text-base text-neutral-900',
        className,
      )}
      {...props}
    />
  );
}

export function DisplayText({ className, ...props }: Omit<AppTextProps, 'display'>) {
  return <Text display className={className} {...props} />;
}
