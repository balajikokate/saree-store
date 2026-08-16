import { createContext, useContext, useEffect, useState } from "react";
import { settingsApi } from "../services/api";

const ThemeContext = createContext(null);

export const THEMES = [
  { id: "royal", label: "Royal (Maroon & Gold)", swatches: ["#6E1423", "#C89B3C"] },
  { id: "purple", label: "Purple & White", swatches: ["#5B2A86", "#B08BC9"] },
  { id: "pink", label: "Pink & White", swatches: ["#C2185B", "#F0B0C8"] },
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("royal");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let active = true;
    settingsApi
      .get()
      .then((res) => {
        if (active && res.data?.theme) setThemeState(res.data.theme);
      })
      .catch(() => {
        // If settings can't be fetched, the CSS default ("royal") already
        // applied via :root — the site still looks correct, just not
        // customized. No need to surface an error for this.
      })
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  // setTheme updates local state immediately (for instant preview in the
  // admin panel) — persisting it server-side is a separate, explicit call
  // the admin settings page makes via settingsApi.update().
  const value = { theme, setTheme: setThemeState, loaded };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
