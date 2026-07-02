import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'react-native';

import { palette } from '@/design-system/colors';

type OnboardingStepHeroProps = {
  source: ImageSourcePropType;
  /** Place below compact controls (chips) and use extra height. */
  placement?: 'above' | 'below';
  style?: StyleProp<ViewStyle>;
};

export function OnboardingStepHero({ source, placement = 'above', style }: OnboardingStepHeroProps) {
  const below = placement === 'below';

  return (
    <Image
      source={source}
      style={[
        {
          width: '100%',
          height: below ? 248 : 176,
          borderRadius: 24,
          backgroundColor: palette['ash-grey'][100],
          marginBottom: below ? 0 : 20,
          marginTop: below ? 24 : 0,
        },
        style,
      ]}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );
}
