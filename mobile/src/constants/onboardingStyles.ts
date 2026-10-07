/** Soft option accents on mint — forest / leaf / amber (estimates only). */
export type OnboardingAccent = 'blue' | 'green' | 'orange';

const accent = {
  blue: {
    card: 'border-blue-spruce-600 bg-blue-spruce-600/12',
    title: 'text-blue-spruce-800',
    subtitle: 'text-blue-spruce-700',
    chip: 'text-blue-spruce-800',
  },
  green: {
    card: 'border-shamrock-500 bg-shamrock-500/12',
    title: 'text-shamrock-800',
    subtitle: 'text-shamrock-700',
    chip: 'text-shamrock-800',
  },
  orange: {
    card: 'border-cinnamon-wood-400 bg-cinnamon-wood-400/15',
    title: 'text-cinnamon-wood-800',
    subtitle: 'text-cinnamon-wood-700',
    chip: 'text-cinnamon-wood-800',
  },
} as const;

const idleCard = 'border-blue-spruce-300/60 bg-blue-spruce-600/5';
const idleChip = 'border-blue-spruce-300/60 bg-blue-spruce-600/5';

export function onboardingOptionCard(selected: boolean, tone: OnboardingAccent = 'green') {
  const colors = accent[tone];
  return selected
    ? `rounded-2xl border-2 px-5 py-4 ${colors.card}`
    : `rounded-2xl border px-5 py-4 ${idleCard}`;
}

export function onboardingOptionChip(selected: boolean, tone: OnboardingAccent = 'orange') {
  const colors = accent[tone];
  return selected
    ? `rounded-full border-2 px-4 py-2.5 ${colors.card}`
    : `rounded-full border px-4 py-2.5 ${idleChip}`;
}

export function onboardingOptionTitle(selected: boolean, tone: OnboardingAccent = 'green') {
  return selected ? accent[tone].title : 'text-blue-spruce-900';
}

export function onboardingOptionSubtitle(selected: boolean, tone: OnboardingAccent = 'green') {
  return selected ? accent[tone].subtitle : 'text-blue-spruce-700/70';
}

export function onboardingOptionChipText(selected: boolean, tone: OnboardingAccent = 'orange') {
  return selected ? accent[tone].chip : 'text-blue-spruce-800';
}
