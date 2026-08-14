/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: "#6E1423",
          dark: "#4A0D18",
          light: "#8C2233",
        },
        gold: {
          DEFAULT: "#C89B3C",
          light: "#E4C77A",
          dark: "#9C7526",
        },
        ivory: "#FBF6EE",
        ink: "#2A1E1B",
        emerald: {
          DEFAULT: "#1F4032",
          light: "#2E5A46",
        },
        blush: "#F4E3D7",
      },
      fontFamily: {
        display: ["Marcellus", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "zari-border":
          "repeating-linear-gradient(45deg, #C89B3C 0, #C89B3C 2px, transparent 2px, transparent 10px)",
      },
      boxShadow: {
        card: "0 4px 24px -8px rgba(42, 30, 27, 0.18)",
      },
    },
  },
  plugins: [],
};
