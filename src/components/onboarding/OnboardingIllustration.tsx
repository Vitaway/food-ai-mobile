import { Image, View } from 'react-native';

import { IconoirIcon } from '@/components/ui/IconoirIcon';
import { Text } from '@/components/ui/Text';
import { ICONOIR_DEFAULTS, ONBOARDING_STEP_ICONS } from '@/constants/onboardingIcons';
import { palette } from '@/design-system/colors';

const FOOD_AI_HERO = require('../../../assets/images/splash-icon.png');

type OnboardingIllustrationProps = {
  variant: 'intro' | 'profile' | 'sex' | 'body' | 'goals' | 'activity' | 'preferences' | 'summary';
};

const VARIANTS = {
  intro: { accent: palette.shamrock[200], ring: palette['blue-spruce'][100] },
  profile: { accent: palette['muted-teal'][200], ring: palette.shamrock[100] },
  sex: { accent: palette['blue-spruce'][100], ring: palette['muted-teal'][200] },
  body: { accent: palette.shamrock[200], ring: palette['blue-spruce'][100] },
  goals: { accent: palette['cinnamon-wood'][100], ring: palette.shamrock[100] },
  activity: { accent: palette['muted-teal'][200], ring: palette['blue-spruce'][100] },
  preferences: { accent: palette.shamrock[200], ring: palette['muted-teal'][200] },
  summary: { accent: palette['blue-spruce'][100], ring: palette.shamrock[200] },
} as const;

export function OnboardingIllustration({ variant }: OnboardingIllustrationProps) {
  const config = VARIANTS[variant];

  if (variant === 'intro') {
    return (
      <View className="mb-4 items-center">
        <View className="mb-4 rounded-full bg-blue-spruce-100 px-4 py-1.5">
          <Text className="font-sans-semibold text-xs uppercase tracking-widest text-blue-spruce-700">AI Powered</Text>
        </View>

        <View
          className="overflow-hidden rounded-[40px]"
          style={{
            width: 280,
            height: 280,
            shadowColor: '#168376',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 12,
          }}>
          <Image source={FOOD_AI_HERO} className="h-full w-full" resizeMode="cover" />
        </View>
      </View>
    );
  }

  const stepIcon = ONBOARDING_STEP_ICONS[variant];

  return (
    <View className="mb-3 items-center">
      <View
        className="h-[120px] w-[120px] items-center justify-center rounded-full"
        style={{ backgroundColor: config.accent }}>
        <View
          className="h-[92px] w-[92px] items-center justify-center rounded-full"
          style={{ backgroundColor: config.ring }}>
          <IconoirIcon icon={stepIcon} size={ICONOIR_DEFAULTS.size} color={ICONOIR_DEFAULTS.color} />
        </View>
      </View>
    </View>
  );
}
