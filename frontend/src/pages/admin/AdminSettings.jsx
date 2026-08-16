import { useState } from "react";
import { useTheme, THEMES } from "../../context/ThemeContext";
import { adminSettingsApi } from "../../services/adminApi";
import Button from "../../components/common/Button";

export default function AdminSettings() {
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingTheme, setPendingTheme] = useState(theme);

  const handlePreview = (themeId) => {
    setPendingTheme(themeId);
    setTheme(themeId); // instant live preview across the whole app
    setMessage("");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await adminSettingsApi.update(pendingTheme);
      setMessage("Theme saved — this is now live for every visitor.");
    } catch (err) {
      setError(err.message || "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-ink">Store Settings</h1>
      <p className="mt-1 text-sm text-ink/60">
        Changing the theme previews instantly across the site — click Save to make it live for every visitor.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => handlePreview(t.id)}
            className={`rounded-sm border-2 p-4 text-left transition-colors ${
              pendingTheme === t.id ? "border-maroon" : "border-ink/10 hover:border-ink/30"
            }`}
          >
            <div className="flex gap-2">
              {t.swatches.map((c) => (
                <span key={c} className="h-10 w-10 rounded-full border border-ink/10" style={{ backgroundColor: c }} />
              ))}
            </div>
            <p className="mt-3 text-sm font-medium text-ink">{t.label}</p>
            {pendingTheme === t.id && <p className="mt-1 text-xs text-maroon">Previewing</p>}
          </button>
        ))}
      </div>

      {message && <p className="mt-6 text-sm text-emerald">{message}</p>}
      {error && <p className="mt-6 text-sm text-maroon">{error}</p>}

      <Button onClick={handleSave} isLoading={saving} className="mt-6">
        Save Theme
      </Button>
    </div>
  );
}
