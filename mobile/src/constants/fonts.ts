/** Matches web Plus Jakarta Sans (index.html + index.css --font-sans / --font-display). */
export const fonts = {
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  sansExtraBold: 'PlusJakartaSans_800ExtraBold',
  /** Same family as sans — web maps display → Plus Jakarta Sans 600. */
  display: 'PlusJakartaSans_600SemiBold',
  displayBold: 'PlusJakartaSans_700Bold',
} as const;

/** Web h1–h6 / .font-display (one face, semibold + tight tracking). */
export const DISPLAY_TITLE_CLASS = 'font-display tracking-[-0.03em]';
