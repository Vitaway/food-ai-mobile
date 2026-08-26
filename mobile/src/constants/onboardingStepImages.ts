import type { ImageSourcePropType } from 'react-native';

import type { UserSex } from '@/types';
import type { OnboardingStep } from '@/utils/onboardingResume';

/** Flat / welcome-style art only — no photo portraits for step heroes. */
const ART = {
  eat: require('../../assets/images/welcome/eat-healthy.png'),
  coach: require('../../assets/images/welcome/coach.png'),
  progress: require('../../assets/images/welcome/progress.png'),
  goals: require('../../assets/images/onboarding/steps/onboarding-goals-hero.png'),
  target: require('../../assets/images/onboarding/steps/onboarding-target-hero.png'),
  rhythm: require('../../assets/images/onboarding/steps/onboarding-eating-rhythm.png'),
  allergies: require('../../assets/images/onboarding/steps/onboarding-allergies-hero.png'),
  plan: require('../../assets/images/onboarding/steps/onboarding-plan-ready.png'),
};

/** Illustration for every onboarding step (summary uses the user avatar instead). */
export function getOnboardingStepHero(step: OnboardingStep, _sex: UserSex = null): ImageSourcePropType {
  switch (step) {
    case 'intro':
      return ART.progress;
    case 'photo':
      return ART.eat;
    case 'profile':
      return ART.coach;
    case 'sex':
      return ART.coach;
    case 'body':
      return ART.progress;
    case 'goals':
      return ART.goals;
    case 'target':
      return ART.target;
    case 'activity':
      return ART.progress;
    case 'habits':
      return ART.rhythm;
    case 'preferences':
      return ART.eat;
    case 'allergies':
      return ART.allergies;
    case 'summary':
      return ART.plan;
    default:
      return ART.eat;
  }
}
