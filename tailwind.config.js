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
        blue: "#1F2937",
        lightGray: "#D8D8D8",
        gray: "#7D7D7D",
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
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
