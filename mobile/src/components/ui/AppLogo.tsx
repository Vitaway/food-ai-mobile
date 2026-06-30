import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { APP_LOGO } from '@/constants/brand';
import { cn } from '@/utils/cn';

type AppLogoProps = {
  size?: number;
  className?: string;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function AppLogo({
  size = 48,
  className,
  style,
  accessibilityLabel = 'MiraFood logo',
}: AppLogoProps) {
  return (
    <Image
      source={APP_LOGO}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      className={cn(className)}
      style={[{ width: size, height: size }, style]}
    />
  );
}
