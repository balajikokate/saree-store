// Common color names (including saree-specific ones) mapped to a
// reasonable default hex — used to auto-fill the swatch color the moment
// an admin types a recognizable name, so they don't have to also manually
// pick a hex for every color. They can still override it afterward.
export const COLOR_NAME_TO_HEX = {
  red: "#C62828",
  maroon: "#6E1423",
  wine: "#722F37",
  pink: "#D6336C",
  "blush pink": "#E8A0BF",
  rose: "#B76E79",
  magenta: "#C2185B",
  purple: "#6B2D8C",
  lavender: "#B08BC9",
  violet: "#7B4397",
  blue: "#1B3A6B",
  navy: "#1E2E4A",
  "navy blue": "#1E2E4A",
  "sky blue": "#4A90D9",
  teal: "#0F6B6B",
  turquoise: "#1BA8A8",
  green: "#1F4032",
  emerald: "#1F4032",
  "emerald green": "#1F4032",
  olive: "#5C6B2F",
  mint: "#8FD9C4",
  yellow: "#D9A82B",
  mustard: "#C89B3C",
  gold: "#C89B3C",
  orange: "#E8785A",
  peach: "#F2B285",
  coral: "#E8785A",
  rust: "#A0522D",
  brown: "#5A3825",
  beige: "#E8DFC8",
  cream: "#F4E3D7",
  ivory: "#FBF6EE",
  white: "#FFFFFF",
  black: "#1A1A1A",
  grey: "#8A7D78",
  gray: "#8A7D78",
  silver: "#C0C0C0",
  mauve: "#B784A7",
  peacock: "#1F4032",
  "peacock blue": "#0B5D65",
  copper: "#B87333",
  bronze: "#8C6E3D",
};

export function guessHexFromColorName(name) {
  const key = name.trim().toLowerCase();
  return COLOR_NAME_TO_HEX[key] || null;
}
