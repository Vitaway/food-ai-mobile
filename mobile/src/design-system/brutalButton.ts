import { palette } from './colors';

type BrutalVariantTokens = {
  faceBg: string;
  text: string;
  border: string;
  shadow: string;
  pressedFaceBg?: string;
};

/** Soft normal button tokens (forest / black — no neo-brutal hard corners). */
export const BRUTAL_BUTTON = {
  borderWidth: 1.5,
  borderRadius: 12,
  shadowOffset: 0,
  variants: {
    primary: {
      faceBg: palette['blue-spruce'][600],
      text: '#ffffff',
      border: palette['blue-spruce'][600],
      shadow: 'transparent',
    },
    secondary: {
      faceBg: '#000000',
      text: '#ffffff',
      border: '#000000',
      shadow: 'transparent',
    },
    outline: {
      faceBg: 'transparent',
      text: palette['blue-spruce'][700],
      border: palette['blue-spruce'][400],
      shadow: 'transparent',
    },
    'outline-light': {
      faceBg: 'transparent',
      text: '#ffffff',
      border: 'rgba(255,255,255,0.55)',
      shadow: 'transparent',
      pressedFaceBg: 'rgba(255, 255, 255, 0.15)',
    },
    ghost: {
      faceBg: 'transparent',
      text: palette['blue-spruce'][700],
      border: 'transparent',
      shadow: 'transparent',
    },
    danger: {
      faceBg: '#dc2626',
      text: '#ffffff',
      border: '#dc2626',
      shadow: 'transparent',
    },
  } satisfies Record<string, BrutalVariantTokens>,
  sizes: {
    sm: { minHeight: 40, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
    md: { minHeight: 48, paddingHorizontal: 24, paddingVertical: 12, fontSize: 16 },
    lg: { minHeight: 52, paddingHorizontal: 28, paddingVertical: 14, fontSize: 16 },
  },
} as const;

export type BrutalButtonVariant = keyof typeof BRUTAL_BUTTON.variants;
export type BrutalButtonSize = keyof typeof BRUTAL_BUTTON.sizes;
