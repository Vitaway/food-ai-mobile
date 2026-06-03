/** Shared palette tokens — imported by tailwind.config.js and colors.ts */
function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mix(aHex, bHex, t) {
  const a = hexToRgb(aHex);
  const b = hexToRgb(bHex);
  const mixChannel = (x, y) => Math.round(x + (y - x) * t);
  return rgbToHex({ r: mixChannel(a.r, b.r), g: mixChannel(a.g, b.g), b: mixChannel(a.b, b.b) });
}

function buildScale({ base, baseShade, whiteT, blackT }) {
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  return shades.reduce((acc, shade) => {
    if (shade === baseShade) {
      acc[shade] = base;
      return acc;
    }

    const isLighter = shade < baseShade;
    const t = isLighter ? whiteT[shade] : blackT[shade];
    acc[shade] = t == null ? base : mix(base, isLighter ? '#ffffff' : '#000000', t);
    return acc;
  }, {});
}

const NAVY = '#023459';
const ORANGE = '#FF6F32';
const GREEN = '#1D9E75';

module.exports = {
  'blue-spruce': buildScale({
    base: NAVY,
    baseShade: 600,
    whiteT: { 50: 0.92, 100: 0.85, 200: 0.7, 300: 0.52, 400: 0.34, 500: 0.15 },
    blackT: { 700: 0.18, 800: 0.32, 900: 0.52, 950: 0.66 },
  }),
  shamrock: buildScale({
    base: GREEN,
    baseShade: 500,
    whiteT: { 50: 0.9, 100: 0.8, 200: 0.65, 300: 0.48, 400: 0.25 },
    blackT: { 600: 0.18, 700: 0.3, 800: 0.45, 900: 0.62, 950: 0.74 },
  }),
  'cinnamon-wood': buildScale({
    base: ORANGE,
    baseShade: 400,
    whiteT: { 50: 0.9, 100: 0.8, 200: 0.65, 300: 0.45 },
    blackT: { 500: 0.12, 600: 0.25, 700: 0.42, 800: 0.6, 900: 0.78, 950: 0.88 },
  }),
  'muted-teal': {
    50: '#eff6f1',
    100: '#deede3',
    200: '#bedac8',
    300: '#9dc8ac',
    400: '#7cb690',
    500: '#5ca375',
    600: '#49835d',
    700: '#376246',
    800: '#25412f',
    900: '#122117',
    950: '#0d1710',
  },
  'ash-grey': {
    50: '#f3f3f1',
    100: '#e6e8e3',
    200: '#ced0c8',
    300: '#b5b9ac',
    400: '#9ca191',
    500: '#848a75',
    600: '#696e5e',
    700: '#4f5346',
    800: '#35372f',
    900: '#1a1c17',
    950: '#121310',
  },
};
