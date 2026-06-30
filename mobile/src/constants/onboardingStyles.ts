/** Accent palettes for onboarding — navy structure + green/orange highlights. */
export type OnboardingAccent = 'blue' | 'green' | 'orange';

const accent = {
  blue: {
    card: 'border-blue-spruce-500 bg-blue-spruce-50',
    title: 'text-blue-spruce-800',
    subtitle: 'text-blue-spruce-700',
    chip: 'text-blue-spruce-800',
  },
  green: {
    card: 'border-shamrock-500 bg-shamrock-50',
    title: 'text-shamrock-800',
    subtitle: 'text-shamrock-700',
    chip: 'text-shamrock-800',
  },
  orange: {
    card: 'border-cinnamon-wood-400 bg-cinnamon-wood-50',
    title: 'text-cinnamon-wood-800',
    subtitle: 'text-cinnamon-wood-700',
    chip: 'text-cinnamon-wood-800',
  },
} as const;

export function onboardingOptionCard(selected: boolean, tone: OnboardingAccent = 'green') {
  const colors = accent[tone];
  return selected
    ? `rounded-3xl border px-5 py-4 ${colors.card}`
    : 'rounded-3xl border border-ash-grey-200 bg-white px-5 py-4';
}

export function onboardingOptionChip(selected: boolean, tone: OnboardingAccent = 'orange') {
  const colors = accent[tone];
  return selected
    ? `rounded-full border px-4 py-2.5 ${colors.card}`
    : 'rounded-full border border-ash-grey-200 bg-white px-4 py-2.5';
}

export function onboardingOptionTitle(selected: boolean, tone: OnboardingAccent = 'green') {
  return selected ? accent[tone].title : 'text-neutral-900';
}

export function onboardingOptionSubtitle(selected: boolean, tone: OnboardingAccent = 'green') {
  return selected ? accent[tone].subtitle : 'text-neutral-500';
}

export function onboardingOptionChipText(selected: boolean, tone: OnboardingAccent = 'orange') {
  return selected ? accent[tone].chip : 'text-neutral-700';
}
