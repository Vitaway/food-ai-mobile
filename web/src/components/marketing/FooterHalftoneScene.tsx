/** Halftone landscape — rolling hills, plate-sun, and clouds in dot pattern */
export function FooterHalftoneScene() {
  return (
    <div className="pointer-events-none -mt-2 w-full" aria-hidden>
      <svg
        viewBox="0 0 1440 360"
        className="block w-full text-ash-grey-800"
        preserveAspectRatio="xMidYMax slice"
        role="presentation">
        <defs>
          <pattern id="hf-dot-sm" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1" fill="currentColor" />
          </pattern>
          <pattern id="hf-dot-md" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="3.5" cy="3.5" r="1.4" fill="currentColor" />
          </pattern>
          <pattern id="hf-dot-lg" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="4.5" cy="4.5" r="1.8" fill="currentColor" />
          </pattern>
          <linearGradient id="hf-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7f6f2" stopOpacity="0" />
            <stop offset="28%" stopColor="#f7f6f2" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f7f6f2" stopOpacity="1" />
          </linearGradient>
          <mask id="hf-top-fade">
            <rect width="1440" height="360" fill="url(#hf-fade)" />
          </mask>
        </defs>

        <g mask="url(#hf-top-fade)">
          {/* Sun / plate */}
          <circle cx="1120" cy="108" r="88" fill="url(#hf-dot-sm)" opacity="0.7" />
          <circle cx="1120" cy="108" r="64" fill="url(#hf-dot-md)" opacity="0.55" />
          <circle cx="1120" cy="108" r="40" fill="url(#hf-dot-lg)" opacity="0.4" />

          {/* Clouds */}
          <ellipse cx="220" cy="72" rx="100" ry="38" fill="url(#hf-dot-sm)" opacity="0.65" />
          <ellipse cx="300" cy="58" rx="72" ry="28" fill="url(#hf-dot-sm)" opacity="0.45" />
          <ellipse cx="560" cy="48" rx="120" ry="42" fill="url(#hf-dot-sm)" opacity="0.55" />
          <ellipse cx="660" cy="38" rx="86" ry="32" fill="url(#hf-dot-sm)" opacity="0.38" />

          {/* Distant hills */}
          <path
            d="M-60 230 C 160 140, 340 190, 540 200 C 760 212, 940 130, 1160 175 C 1310 205, 1400 185, 1520 215 L 1520 360 L -60 360 Z"
            fill="url(#hf-dot-lg)"
            opacity="0.5"
          />

          {/* Mid hills */}
          <path
            d="M-80 265 C 140 195, 300 240, 480 232 C 680 224, 860 175, 1040 218 C 1220 260, 1360 215, 1540 255 L 1540 360 L -80 360 Z"
            fill="url(#hf-dot-md)"
            opacity="0.65"
          />

          {/* Bowl / valley */}
          <path
            d="M380 295 C 500 258, 680 258, 800 295 C 900 325, 1020 338, 1140 315 C 1240 295, 1320 305, 1400 322 L 1400 360 L 380 360 Z"
            fill="url(#hf-dot-sm)"
            opacity="0.85"
          />

          {/* Foreground ridge */}
          <path
            d="M-100 310 C 180 288, 400 322, 620 305 C 840 288, 1060 328, 1300 300 C 1400 290, 1500 308, 1560 318 L 1560 360 L -100 360 Z"
            fill="currentColor"
            opacity="0.14"
          />

          {/* Accent garnish dots */}
          {[
            [150, 288],
            [290, 268],
            [870, 255],
            [1000, 278],
            [1290, 292],
            [1380, 270],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={2.2} fill="currentColor" opacity={0.22 + (i % 3) * 0.1} />
          ))}
        </g>
      </svg>
    </div>
  );
}
