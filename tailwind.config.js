const defaultColors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Default Tailwind breakpoints, but `lg` (the app's mobile↔desktop divider) is
    // nudged 1024px → 1100px so iPad Pro 12.9" portrait (exactly 1024px wide) stays
    // in the mobile/tablet layout instead of flipping to the desktop layout.
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1100px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#541D7A",
        secondary: "#71717B",
        tertiary: "#D8E0EE",
        // Keep the app's custom `blue`/`gray` shades as the bare token (DEFAULT)
        // while RESTORING Tailwind's full numbered scales. Flattening these to a
        // single string previously deleted the default blue-*/gray-* scales, so
        // ~600 `gray-500`/`blue-600`-style classes across the app produced no CSS.
        blue: { ...defaultColors.blue, DEFAULT: "#1F2937" },
        ink: "#1F2937",
        lightGray: "#D8D8D8",
        gray: { ...defaultColors.gray, DEFAULT: "#7D7D7D" },
        brandGray: "#7D7D7D",
        pageBackground: "#F2F2F2",
        borderColor: "#E6E6E8",
        stepIndicator: "#717178",
        dataBarBg: "#71717833",
        saleBadgeBg: "#541D7A1A",
        biomarkerOptimal: "#05BC7E",
        biomarkerNormal: "#D7D82E",
        biomarkerOutOfRange: "#F865DD",
        // Landing-page brand tokens (ported from cyborgmen-rebuild)
        cyborg: {
          purple: "#5b2487",
          "purple-light": "#a14ff1",
          ink: "#0f1013",
          gray: "#ececec",
          muted: "#71717a",
          muted2: "#8a8a92",
          border: "#e6e6e8",
        },
        // ── Protocol mockup (Material 3) tokens — used ONLY by the Protocol section.
        // The colliding names primary/secondary/tertiary/background are intentionally
        // NOT redefined (they'd change the whole app). The mockup's dark-red `primary`
        // (#a53a33) is available here as `surface-tint`.
        "primary-container": "#f07167",
        "on-primary-container": "#65080b",
        "primary-fixed": "#ffdad6",
        "primary-fixed-dim": "#ffb4ac",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#410003",
        "on-primary-fixed-variant": "#85221f",
        "inverse-primary": "#ffb4ac",
        "secondary-container": "#79d4fe",
        "on-secondary-container": "#005b77",
        "on-secondary": "#ffffff",
        "secondary-fixed": "#bfe9ff",
        "secondary-fixed-dim": "#76d2fb",
        "on-secondary-fixed": "#001f2a",
        "on-secondary-fixed-variant": "#004d65",
        "tertiary-container": "#9a9a7e",
        "on-tertiary-container": "#31321d",
        "on-tertiary": "#ffffff",
        "tertiary-fixed": "#e5e4c5",
        "tertiary-fixed-dim": "#c9c8aa",
        "on-tertiary-fixed": "#1c1d09",
        "on-tertiary-fixed-variant": "#474831",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        surface: "#f9f9ff",
        "surface-bright": "#f9f9ff",
        "surface-dim": "#d3daea",
        "surface-tint": "#a53a33",
        "surface-variant": "#dce2f3",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f3ff",
        "surface-container": "#e7eefe",
        "surface-container-high": "#e2e8f8",
        "surface-container-highest": "#dce2f3",
        "on-surface": "#151c27",
        "on-surface-variant": "#57423f",
        "on-background": "#151c27",
        "inverse-surface": "#2a313d",
        "inverse-on-surface": "#ebf1ff",
        outline: "#8a716e",
        "outline-variant": "#dec0bc",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "mk-card": "0px 4px 20px rgba(0, 0, 0, 0.04)",
        "mk-pill": "0px 10px 30px rgba(0, 0, 0, 0.15)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
        // Protocol mockup type — Plus Jakarta Sans (loaded in layout.js).
        "headline-lg": ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        "headline-lg-mobile": ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        "display-lg": ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        "title-md": ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        "body-lg": ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        "body-md": ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        "label-caps": ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        "step-number": ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        "headline-lg": ["28px", { lineHeight: "36px", fontWeight: "600" }],
        "headline-lg-mobile": ["22px", { lineHeight: "28px", fontWeight: "600" }],
        "display-lg": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "title-md": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "26px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "22px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "700" }],
        "step-number": ["48px", { lineHeight: "1", letterSpacing: "-0.04em", fontWeight: "300" }],
      },
      spacing: {
        "section-gap": "40px",
        "container-padding": "24px",
        "stack-lg": "24px",
        "stack-md": "12px",
        "stack-sm": "4px",
        gutter: "16px",
        base: "8px",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ticker: {
          to: { transform: 'translate3d(-50%, 0, 0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        ticker: 'ticker 45s linear infinite',
      },
    },
  },
  plugins: [],
};
