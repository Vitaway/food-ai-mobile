const palette = require('./src/design-system/palette.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ...palette,
        primary: palette['blue-spruce'],
        secondary: palette.shamrock,
        muted: palette['muted-teal'],
        neutral: palette['ash-grey'],
        accent: palette['cinnamon-wood'],
      },
      fontFamily: {
        // Single family everywhere (matches web Plus Jakarta Sans)
        sans: ['PlusJakartaSans_400Regular', 'System'],
        'sans-medium': ['PlusJakartaSans_500Medium', 'System'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold', 'System'],
        'sans-bold': ['PlusJakartaSans_700Bold', 'System'],
        'sans-extrabold': ['PlusJakartaSans_800ExtraBold', 'System'],
        display: ['PlusJakartaSans_600SemiBold', 'System'],
        'display-bold': ['PlusJakartaSans_700Bold', 'System'],
      },
    },
  },
  plugins: [],
};
