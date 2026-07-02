import { palette } from './colors';

type BrutalVariantTokens = {
  faceBg: string;
  text: string;
  border: string;
  shadow: string;
  pressedFaceBg?: string;
};

/** Neo-brutalist button tokens — mirrors web/src/index.css .brutal-btn rules */
export const BRUTAL_BUTTON = {
  borderWidth: 2,
  borderRadius: 2,
  shadowOffset: 4,
  variants: {
    primary: {
      faceBg: palette['cinnamon-wood'][400],
      text: '#ffffff',
      border: palette['blue-spruce'][900],
      shadow: palette['blue-spruce'][900],
    },
    secondary: {
      faceBg: palette.shamrock[500],
      text: '#ffffff',
      border: palette['blue-spruce'][900],
      shadow: palette['blue-spruce'][900],
    },
    outline: {
      faceBg: '#ffffff',
      text: palette['blue-spruce'][700],
      border: palette['blue-spruce'][900],
      shadow: palette['blue-spruce'][900],
    },
    'outline-light': {
      faceBg: 'transparent',
      text: '#ffffff',
      border: '#ffffff',
      shadow: 'rgba(255, 255, 255, 0.35)',
      pressedFaceBg: 'rgba(255, 255, 255, 0.15)',
    },
    ghost: {
      faceBg: palette['ash-grey'][100],
      text: palette['blue-spruce'][700],
      border: palette['blue-spruce'][900],
      shadow: palette['blue-spruce'][900],
    },
    danger: {
      faceBg: '#dc2626',
      text: '#ffffff',
      border: palette['blue-spruce'][900],
      shadow: palette['blue-spruce'][900],
    },
  } satisfies Record<string, BrutalVariantTokens>,
  sizes: {
    sm: { minHeight: 40, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
    md: { minHeight: 48, paddingHorizontal: 24, paddingVertical: 12, fontSize: 16 },
    lg: { minHeight: 56, paddingHorizontal: 32, paddingVertical: 14, fontSize: 18 },
  },
} as const;

export type BrutalButtonVariant = keyof typeof BRUTAL_BUTTON.variants;
export type BrutalButtonSize = keyof typeof BRUTAL_BUTTON.sizes;
