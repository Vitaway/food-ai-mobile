import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';
import {
  Community,
  EyeClosed,
  Female,
  GraphUp,
  Group,
  Leaf,
  Male,
  MinusCircle,
  Ruler,
  Running,
  Sparks,
  UserCircle,
} from 'iconoir-react-native';

export type IconoirIcon = ComponentType<SvgProps>;

export const ONBOARDING_STEP_ICONS: Record<
  'profile' | 'sex' | 'body' | 'goals' | 'activity' | 'preferences' | 'summary',
  IconoirIcon
> = {
  profile: UserCircle,
  sex: Community,
  body: Ruler,
  goals: GraphUp,
  activity: Running,
  preferences: Leaf,
  summary: Sparks,
};

export const SEX_OPTION_ICONS: Record<'optional' | 'male' | 'female' | 'other' | 'prefer_not_to_say', IconoirIcon> = {
  optional: MinusCircle,
  male: Male,
  female: Female,
  other: Group,
  prefer_not_to_say: EyeClosed,
};

export const ICONOIR_DEFAULTS = {
  size: 36,
  strokeWidth: 1.5,
  color: '#168376',
  colorOnDark: '#ffffff',
} as const;
