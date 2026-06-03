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
  Ruler,
  Running,
  Sparks,
  UserCircle,
} from 'iconoir-react-native';

export type IconoirIcon = ComponentType<SvgProps>;

export const ONBOARDING_STEP_ICONS: Record<
  | 'profile'
  | 'sex'
  | 'body'
  | 'goals'
  | 'target'
  | 'activity'
  | 'habits'
  | 'preferences'
  | 'allergies'
  | 'summary',
  IconoirIcon
> = {
  profile: UserCircle,
  sex: Community,
  body: Ruler,
  goals: GraphUp,
  target: Ruler,
  activity: Running,
  habits: GraphUp,
  preferences: Leaf,
  allergies: Leaf,
  summary: Sparks,
};

export const SEX_OPTION_ICONS: Record<'male' | 'female' | 'other' | 'prefer_not_to_say', IconoirIcon> = {
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
