/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
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
        dataBarBg: "#71717833"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
