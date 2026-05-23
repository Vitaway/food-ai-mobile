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
        sans: ['Inter_400Regular', 'System'],
        'sans-medium': ['Inter_500Medium', 'System'],
        'sans-semibold': ['Inter_600SemiBold', 'System'],
        'sans-bold': ['Inter_700Bold', 'System'],
      },
    },
  },
  plugins: [],
};
