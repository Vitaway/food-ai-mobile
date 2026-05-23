import { IconoirProvider } from 'iconoir-react-native';
import type { ComponentType, PropsWithChildren } from 'react';
import type { SvgProps } from 'react-native-svg';

import { ICONOIR_DEFAULTS } from '@/constants/onboardingIcons';

type IconoirIconProps = SvgProps & {
  icon: ComponentType<SvgProps>;
  size?: number;
  color?: string;
};

export function IconoirProviderRoot({ children }: PropsWithChildren) {
  return (
    <IconoirProvider
      iconProps={{
        color: ICONOIR_DEFAULTS.color,
        strokeWidth: ICONOIR_DEFAULTS.strokeWidth,
        width: ICONOIR_DEFAULTS.size,
        height: ICONOIR_DEFAULTS.size,
        fill: 'none',
      }}>
      {children}
    </IconoirProvider>
  );
}

export function IconoirIcon({
  icon: Icon,
  size = 24,
  color = ICONOIR_DEFAULTS.color,
  strokeWidth = ICONOIR_DEFAULTS.strokeWidth,
  ...props
}: IconoirIconProps) {
  return (
    <Icon
      width={size}
      height={size}
      color={color}
      strokeWidth={strokeWidth}
      fill="none"
      {...props}
    />
  );
}
