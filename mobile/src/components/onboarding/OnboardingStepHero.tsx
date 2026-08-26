import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import { Image } from 'react-native';

type OnboardingStepHeroProps = {
  source: ImageSourcePropType;
  /** Place below compact controls (chips) and use extra height. */
  placement?: 'above' | 'below';
  style?: StyleProp<ImageStyle>;
};

export function OnboardingStepHero({ source, placement = 'above', style }: OnboardingStepHeroProps) {
  const below = placement === 'below';

  return (
    <Image
      source={source}
      style={[
        {
          width: '100%',
          height: below ? 220 : 168,
          marginBottom: below ? 0 : 16,
          marginTop: below ? 20 : 0,
        },
        style,
      ]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
