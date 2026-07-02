import type { UserSex } from '@/types';

export const SEX_OPTION_IMAGES: Record<
  Exclude<UserSex, null>,
  number
> = {
  male: require('../../assets/images/onboarding/sex/sex-option-male.png'),
  female: require('../../assets/images/onboarding/sex/sex-option-female.png'),
  other: require('../../assets/images/onboarding/sex/sex-option-other.png'),
  prefer_not_to_say: require('../../assets/images/onboarding/sex/sex-option-prefer-not.png'),
};
