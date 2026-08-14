const FABRICS = ["Kalanjali Paithani", "Maheshwari Cotton", "Georgette", "Chiffon", "Handloom Cotton"];
const OCCASIONS = ["Wedding", "Festive", "Party", "Casual"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function ProductFilters({ filters, categories, onChange, onClear }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <aside className="space-y-8">
      <div>
        <h4 className="mb-3 font-display text-lg text-ink">Category</h4>
        <div className="space-y-2">
          {categories.map((c) => (
            <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm text-ink/80">
              <input
                type="radio"
                name="category"
                checked={filters.category === c.slug}
                onChange={() => set("category", c.slug)}
                className="accent-maroon"
              />
              {c.name}
            </label>
          ))}
          {filters.category && (
            <button onClick={() => set("category", "")} className="text-xs text-maroon underline">
              Clear category
            </button>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-display text-lg text-ink">Fabric</h4>
        <div className="space-y-2">
          {FABRICS.map((f) => (
            <label key={f} className="flex cursor-pointer items-center gap-2 text-sm text-ink/80">
              <input
                type="radio"
                name="fabric"
                checked={filters.fabric === f}
                onChange={() => set("fabric", f)}
                className="accent-maroon"
              />
              {f}
            </label>
          ))}
          {filters.fabric && (
            <button onClick={() => set("fabric", "")} className="text-xs text-maroon underline">
              Clear fabric
            </button>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-display text-lg text-ink">Occasion</h4>
        <div className="space-y-2">
          {OCCASIONS.map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 text-sm text-ink/80">
              <input
                type="radio"
                name="occasion"
                checked={filters.occasion === o}
                onChange={() => set("occasion", o)}
                className="accent-maroon"
              />
              {o}
            </label>
          ))}
          {filters.occasion && (
            <button onClick={() => set("occasion", "")} className="text-xs text-maroon underline">
              Clear occasion
            </button>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-display text-lg text-ink">Sort by</h4>
        <select
          value={filters.sort}
          onChange={(e) => set("sort", e.target.value)}
          className="input-field"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <button onClick={onClear} className="text-sm font-medium text-maroon underline">
        Clear all filters
      </button>
    </aside>
  );
}
