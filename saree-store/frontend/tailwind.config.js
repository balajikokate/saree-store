/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: "rgb(var(--color-maroon) / <alpha-value>)",
          dark: "rgb(var(--color-maroon-dark) / <alpha-value>)",
          light: "rgb(var(--color-maroon-light) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--color-gold) / <alpha-value>)",
          light: "rgb(var(--color-gold-light) / <alpha-value>)",
          dark: "rgb(var(--color-gold-dark) / <alpha-value>)",
        },
        ivory: "rgb(var(--color-ivory) / <alpha-value>)",
        ink: "#2A1E1B",
        emerald: {
          DEFAULT: "#1F4032",
          light: "#2E5A46",
        },
        blush: "rgb(var(--color-blush) / <alpha-value>)",
        rose: {
          DEFAULT: "rgb(var(--color-rose) / <alpha-value>)",
          light: "rgb(var(--color-rose-light) / <alpha-value>)",
          dark: "rgb(var(--color-rose-dark) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "zari-border":
          "repeating-linear-gradient(45deg, #C89B3C 0, #C89B3C 2px, transparent 2px, transparent 10px)",
      },
      boxShadow: {
        card: "0 4px 24px -8px rgba(42, 30, 27, 0.18)",
        lift: "0 12px 32px -8px rgba(110, 20, 35, 0.28)",
      },
    },
  },
  plugins: [],
};
