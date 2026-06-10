import { View } from 'react-native';

import { AppLogo } from '@/components/ui/AppLogo';
import { IconoirIcon } from '@/components/ui/IconoirIcon';
import { ICONOIR_DEFAULTS, ONBOARDING_STEP_ICONS } from '@/constants/onboardingIcons';
import { palette } from '@/design-system/colors';

type OnboardingIllustrationProps = {
  variant:
    | 'intro'
    | 'profile'
    | 'sex'
    | 'body'
    | 'goals'
    | 'target'
    | 'activity'
    | 'habits'
    | 'preferences'
    | 'allergies'
    | 'summary';
};

const VARIANTS = {
  intro: { accent: palette.shamrock[200], ring: palette['blue-spruce'][100] },
  profile: { accent: palette['blue-spruce'][100], ring: palette.shamrock[100] },
  sex: { accent: palette['blue-spruce'][100], ring: palette.shamrock[200] },
  body: { accent: palette.shamrock[200], ring: palette['blue-spruce'][100] },
  goals: { accent: palette['cinnamon-wood'][100], ring: palette.shamrock[100] },
  target: { accent: palette['blue-spruce'][100], ring: palette.shamrock[200] },
  activity: { accent: palette['cinnamon-wood'][100], ring: palette['blue-spruce'][100] },
  habits: { accent: palette.shamrock[200], ring: palette['cinnamon-wood'][100] },
  preferences: { accent: palette.shamrock[200], ring: palette['blue-spruce'][100] },
  allergies: { accent: palette['cinnamon-wood'][100], ring: palette.shamrock[100] },
  summary: { accent: palette['blue-spruce'][100], ring: palette.shamrock[200] },
} as const;

export function OnboardingIllustration({ variant }: OnboardingIllustrationProps) {
  const config = VARIANTS[variant];

  if (variant === 'intro') {
    return (
      <View className="mb-4 items-center">
        <View
          className="items-center justify-center overflow-hidden rounded-[40px]"
          style={{
            width: 280,
            height: 280,
            shadowColor: palette['cinnamon-wood'][400],
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 12,
          }}>
          <AppLogo size={280} />
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
