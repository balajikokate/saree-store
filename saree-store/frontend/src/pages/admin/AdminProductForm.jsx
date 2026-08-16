import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminProductApi, adminCategoryApi } from "../../services/adminApi";
import { resolveImageUrl } from "../../utils/image";
import { guessHexFromColorName } from "../../utils/colorNames";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

const emptyForm = {
  name: "",
  description: "",
  fabric: "",
  color: "",
  occasion: "Wedding",
  price: "",
  discountPrice: "",
  stock: "",
  featured: false,
  categoryId: "",
  images: [],
  variants: [],
};

const emptyVariant = { color: "", colorHex: "#6E1423", stock: "", images: [] };

const OCCASIONS = ["Wedding", "Festive", "Party", "Casual"];

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = id !== "new" && !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  // Whether this saree comes in multiple colors. When true, the single
  // Color/Stock fields below are hidden entirely (no more re-typing the
  // same info twice) — the color variants list is the only source of
  // truth, and the backend derives color/stock from it automatically.
  const [multiColor, setMultiColor] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminCategoryApi.list().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    adminProductApi
      .get(id)
      .then((res) => {
        const p = res.data;
        const variants = (p.variants || []).map((v) => ({
          color: v.color,
          colorHex: v.colorHex || "#6E1423",
          stock: String(v.stock),
          images: v.images || [],
        }));
        setMultiColor(variants.length > 0);
        setForm({
          name: p.name,
          description: p.description,
          fabric: p.fabric,
          color: variants.length > 0 ? "" : p.color,
          occasion: p.occasion,
          price: String(p.price),
          discountPrice: p.discountPrice ? String(p.discountPrice) : "",
          stock: variants.length > 0 ? "" : String(p.stock),
          featured: p.featured,
          categoryId: p.categoryId,
          images: p.images,
          variants,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!selectedCategory) {
      setError("Choose a category first, so the image is filed in the right folder.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const namePrefix = form.name || "saree";
      const uploaded = [];
      for (const file of files) {
        const res = await adminProductApi.uploadImage(file, selectedCategory.slug, namePrefix);
        uploaded.push(res.data.path);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
    } catch (err) {
      setError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (path) => {
    setForm((f) => ({ ...f, images: f.images.filter((img) => img !== path) }));
  };

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { ...emptyVariant }] }));
  const removeVariant = (idx) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  const updateVariant = (idx, field, value) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => {
        if (i !== idx) return v;
        const next = { ...v, [field]: value };
        // Auto-fill the hex swatch the moment a recognizable color name is
        // typed — e.g. typing "Emerald Green" fills the swatch to match,
        // without the admin having to also manually pick a hex. They can
        // still override the hex afterward; typing in the hex field always
        // wins from that point on.
        if (field === "color") {
          const guess = guessHexFromColorName(value);
          if (guess) next.colorHex = guess;
        }
        return next;
      }),
    }));

  const handleVariantImageUpload = async (idx, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!selectedCategory) {
      setError("Choose a category first, so the image is filed in the right folder.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const variantColor = form.variants[idx]?.color || "color";
      const namePrefix = `${form.name || "saree"}-${variantColor}`;
      const uploaded = [];
      for (const file of files) {
        const res = await adminProductApi.uploadImage(file, selectedCategory.slug, namePrefix);
        uploaded.push(res.data.path);
      }
      setForm((f) => ({
        ...f,
        variants: f.variants.map((v, i) => (i === idx ? { ...v, images: [...(v.images || []), ...uploaded] } : v)),
      }));
    } catch (err) {
      setError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeVariantImage = (idx, path) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === idx ? { ...v, images: (v.images || []).filter((img) => img !== path) } : v)),
    }));
  };

  const handleMultiColorToggle = (checked) => {
    setMultiColor(checked);
    if (checked && form.variants.length === 0) {
      // Seed one row so the admin isn't staring at an empty section
      setForm((f) => ({ ...f, variants: [{ ...emptyVariant }] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.images.length === 0) {
      setError("Add at least one product image before saving.");
      return;
    }
    if (!form.categoryId) {
      setError("Choose a category.");
      return;
    }

    let cleanedVariants = [];
    if (multiColor) {
      cleanedVariants = form.variants
        .filter((v) => v.color.trim())
        .map((v) => ({
          color: v.color.trim(),
          colorHex: v.colorHex || undefined,
          stock: Number(v.stock) || 0,
          images: v.images && v.images.length > 0 ? v.images : undefined,
        }));
      if (cleanedVariants.length === 0) {
        setError("Add at least one color, or switch off \"Multiple colors\" and use the single Color/Stock fields instead.");
        return;
      }
      const colorNames = cleanedVariants.map((v) => v.color.toLowerCase());
      if (new Set(colorNames).size !== colorNames.length) {
        setError("Color variant names must be unique.");
        return;
      }
    } else {
      if (!form.color.trim()) {
        setError("Enter a color.");
        return;
      }
      if (form.stock === "") {
        setError("Enter a stock quantity.");
        return;
      }
    }

    const payload = {
      name: form.name,
      description: form.description,
      fabric: form.fabric,
      occasion: form.occasion,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      featured: form.featured,
      categoryId: form.categoryId,
      images: form.images,
      variants: cleanedVariants,
      ...(multiColor ? {} : { color: form.color.trim(), stock: Number(form.stock) }),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await adminProductApi.update(id, payload);
      } else {
        await adminProductApi.create(payload);
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading product" />;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-ink">{isEdit ? "Edit Saree" : "Add New Saree"}</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field label="Name" name="name" value={form.name} onChange={handleChange} required />

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="input-field"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fabric" name="fabric" value={form.fabric} onChange={handleChange} required />
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/80">Occasion</label>
            <select name="occasion" value={form.occasion} onChange={handleChange} className="input-field">
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Category</label>
          <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field" required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="MRP (₹)" name="price" type="number" min="1" value={form.price} onChange={handleChange} required />
          <Field label="Selling Price (₹)" name="discountPrice" type="number" min="1" value={form.discountPrice} onChange={handleChange} hint="Optional" />
        </div>

        {/* Single vs multi-color toggle — this is the fix for having to
            enter color/stock twice: pick ONE mode, and only the relevant
            fields show up. */}
        <div className="rounded-sm border border-ink/10 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
            <input
              type="checkbox"
              checked={multiColor}
              onChange={(e) => handleMultiColorToggle(e.target.checked)}
              className="h-4 w-4 accent-maroon"
            />
            This saree comes in multiple colors
          </label>
          <p className="mt-1 text-xs text-ink/50">
            Off: enter one color and one stock number below. On: add each color with its own stock —
            the storefront will show a color picker, and this replaces the single Color/Stock fields entirely.
          </p>

          {!multiColor ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Color" name="color" value={form.color} onChange={handleChange} required={!multiColor} />
              <Field label="Stock" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required={!multiColor} />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {form.variants.map((v, idx) => (
                <div key={idx} className="rounded-sm bg-blush/20 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={v.colorHex}
                      onChange={(e) => updateVariant(idx, "colorHex", e.target.value)}
                      className="h-9 w-9 flex-shrink-0 cursor-pointer rounded-sm border border-ink/15"
                      aria-label="Swatch color"
                      title="Pick exact swatch color"
                    />
                    <input
                      value={v.colorHex}
                      onChange={(e) => updateVariant(idx, "colorHex", e.target.value)}
                      placeholder="#RRGGBB"
                      className="input-field w-24 flex-shrink-0 font-mono text-xs"
                      aria-label="Hex color code"
                      title="Or type a hex code directly"
                    />
                    <input
                      value={v.color}
                      onChange={(e) => updateVariant(idx, "color", e.target.value)}
                      placeholder="Color name, e.g. Emerald Green"
                      className="input-field flex-1"
                    />
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                      placeholder="Stock"
                      className="input-field w-24"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="flex-shrink-0 px-2 text-sm text-maroon"
                      aria-label="Remove variant"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Per-color photos — shown to customers when they pick
                      this color on the product page. Falls back to the
                      product's main photos below if left empty. */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 pl-11">
                    {(v.images || []).map((img) => (
                      <div key={img} className="relative h-14 w-11 overflow-hidden rounded-sm border border-ink/10">
                        <img src={resolveImageUrl(img)} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(idx, img)}
                          className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-sm bg-ink/70 text-[10px] text-ivory"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <label className="flex h-14 w-11 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-ink/30 text-[10px] leading-tight text-ink/50 hover:border-maroon hover:text-maroon">
                      {uploading ? "…" : `+ ${v.color || "color"} photo`}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(e) => handleVariantImageUpload(idx, e)}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    {(!v.images || v.images.length === 0) && (
                      <span className="text-[10px] text-ink/40">No color-specific photos — will use the main photos below</span>
                    )}
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addVariant} className="py-2 text-xs">
                + Add Another Color
              </Button>
              <p className="text-xs text-ink/40">
                Tip: type a common color name (e.g. "Red", "Emerald Green", "Navy Blue") and the
                swatch fills in automatically — or type/pick an exact hex code if you want a precise shade.
              </p>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="accent-maroon" />
          Show in "Featured" section on the homepage
        </label>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink/80">
            {multiColor ? "Default Photos (used when a color has no photos of its own)" : "Product Images"}
          </label>
          <div className="flex flex-wrap gap-3">
            {form.images.map((img) => (
              <div key={img} className="relative h-24 w-20 overflow-hidden rounded-sm border border-ink/10">
                <img src={resolveImageUrl(img)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-ivory"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-ink/30 text-xs text-ink/50 hover:border-maroon hover:text-maroon">
              {uploading ? "Uploading…" : "+ Add"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-ink/50">
            JPEG/PNG/WEBP, up to 5MB each. Photos save into the category's image folder automatically.
          </p>
        </div>

        {error && <p className="rounded-sm bg-maroon/10 px-4 py-3 text-sm text-maroon">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" isLoading={saving}>
            {isEdit ? "Save Changes" : "Add Saree"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/admin/products")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", required, hint, ...rest }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-ink/80">
        {label} {hint && <span className="text-ink/40">({hint})</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="input-field"
        required={required}
        {...rest}
      />
    </div>
  );
}
