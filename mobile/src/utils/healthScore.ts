import { palette } from '@/design-system/colors';

export type HealthScoreBand = 'needs_attention' | 'fair' | 'good' | 'great';

export type HealthScoreMeta = {
  band: HealthScoreBand;
  label: string;
  /** Tailwind-friendly text class for light backgrounds */
  textClass: string;
  /** Tailwind-friendly bg class for chips/pills */
  bgClass: string;
  /** Hex for icons / rings on dark backgrounds */
  accentHex: string;
};

/** Map 0–100 health score to color + short label. */
export function healthScoreMeta(score: number): HealthScoreMeta {
  const value = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;

  if (value < 50) {
    return {
      band: 'needs_attention',
      label: 'Needs attention',
      textClass: 'text-cinnamon-wood-800',
      bgClass: 'bg-cinnamon-wood-200',
      accentHex: '#dc2626',
    };
  }
  if (value < 70) {
    return {
      band: 'fair',
      label: 'Fair',
      textClass: 'text-cinnamon-wood-800',
      bgClass: 'bg-cinnamon-wood-100',
      accentHex: palette['cinnamon-wood'][400],
    };
  }
  if (value < 85) {
    return {
      band: 'good',
      label: 'Good',
      textClass: 'text-shamrock-800',
      bgClass: 'bg-shamrock-100',
      accentHex: palette.shamrock[500],
    };
  }
  return {
    band: 'great',
    label: 'Great',
    textClass: 'text-shamrock-800',
    bgClass: 'bg-shamrock-100',
    accentHex: palette.shamrock[600],
  };
}
