import type { ImageSourcePropType } from 'react-native';

import type { UserSex } from '@/types';

type SexHeroVariant = 'male' | 'female' | 'neutral';

type OnboardingHeroStep = 'summary' | 'preferences' | 'allergies' | 'habits';

const STEP_HERO_IMAGES: Record<OnboardingHeroStep, Record<SexHeroVariant, number>> = {
  summary: {
    male: require('../../assets/images/onboarding/steps/onboarding-plan-ready-male.png'),
    female: require('../../assets/images/onboarding/steps/onboarding-plan-ready.png'),
    neutral: require('../../assets/images/onboarding/steps/onboarding-eating-rhythm.png'),
  },
  preferences: {
    male: require('../../assets/images/onboarding/steps/onboarding-dietary-preferences-male.png'),
    female: require('../../assets/images/onboarding/steps/onboarding-dietary-preferences.png'),
    neutral: require('../../assets/images/onboarding/steps/onboarding-eating-rhythm.png'),
  },
  allergies: {
    male: require('../../assets/images/onboarding/steps/onboarding-allergies-male.png'),
    female: require('../../assets/images/onboarding/steps/onboarding-allergies.png'),
    neutral: require('../../assets/images/onboarding/steps/onboarding-eating-rhythm.png'),
  },
  habits: {
    male: require('../../assets/images/onboarding/steps/onboarding-eating-rhythm-male.png'),
    female: require('../../assets/images/onboarding/steps/onboarding-eating-rhythm.png'),
    neutral: require('../../assets/images/onboarding/steps/onboarding-eating-rhythm.png'),
  },
};

function sexHeroVariant(sex: UserSex): SexHeroVariant {
  if (sex === 'male') return 'male';
  if (sex === 'female') return 'female';
  return 'neutral';
}

export function getOnboardingStepHero(step: OnboardingHeroStep, sex: UserSex): ImageSourcePropType {
  return STEP_HERO_IMAGES[step][sexHeroVariant(sex)];
}
