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
        sans: ['Sniglet_400Regular', 'System'],
        'sans-medium': ['Sniglet_400Regular', 'System'],
        'sans-semibold': ['Sniglet_400Regular', 'System'],
        'sans-bold': ['Sniglet_400Regular', 'System'],
        'sans-extrabold': ['Sniglet_800ExtraBold', 'System'],
        display: ['CabinSketch_400Regular', 'System'],
        'display-bold': ['CabinSketch_700Bold', 'System'],
      },
    },
  },
  plugins: [],
};
