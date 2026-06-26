/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        alotech: { DEFAULT: "#3B82F6", light: "#EFF6FF", dark: "#1D4ED8" },
        ccs:     { DEFAULT: "#8B5CF6", light: "#F5F3FF", dark: "#6D28D9" },
      },
    },
  },
  plugins: [],
};
