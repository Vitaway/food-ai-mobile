import paletteData from './palette.js';

export const palette = paletteData;

export const semanticColors = {
  primary: palette['blue-spruce'][600],
  primaryLight: palette['blue-spruce'][100],
  secondary: palette.shamrock[500],
  accent: palette['cinnamon-wood'][500],
  background: palette['ash-grey'][50],
  surface: '#ffffff',
  text: palette['ash-grey'][900],
  textMuted: palette['ash-grey'][500],
  border: palette['ash-grey'][200],
  success: palette.shamrock[600],
  warning: palette['cinnamon-wood'][400],
  error: palette['cinnamon-wood'][600],
  healthGreen: palette.shamrock[500],
  healthYellow: palette['cinnamon-wood'][300],
  healthOrange: palette['cinnamon-wood'][400],
  healthRed: palette['cinnamon-wood'][600],
} as const;

export type PaletteColor = keyof typeof palette;
export type SemanticColor = keyof typeof semanticColors;
