import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminProductApi, adminCategoryApi } from "../../services/adminApi";
import { resolveImageUrl } from "../../utils/image";
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
};

const OCCASIONS = ["Wedding", "Festive", "Party", "Casual"];

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = id !== "new" && !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
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
        setForm({
          name: p.name,
          description: p.description,
          fabric: p.fabric,
          color: p.color,
          occasion: p.occasion,
          price: String(p.price),
          discountPrice: p.discountPrice ? String(p.discountPrice) : "",
          stock: String(p.stock),
          featured: p.featured,
          categoryId: p.categoryId,
          images: p.images,
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

    const payload = {
      name: form.name,
      description: form.description,
      fabric: form.fabric,
      color: form.color,
      occasion: form.occasion,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      stock: Number(form.stock),
      featured: form.featured,
      categoryId: form.categoryId,
      images: form.images,
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fabric" name="fabric" value={form.fabric} onChange={handleChange} required />
          <Field label="Color" name="color" value={form.color} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="MRP (₹)" name="price" type="number" min="1" value={form.price} onChange={handleChange} required />
          <Field label="Selling Price (₹)" name="discountPrice" type="number" min="1" value={form.discountPrice} onChange={handleChange} hint="Optional" />
          <Field label="Stock" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="accent-maroon" />
          Show in "Featured" section on the homepage
        </label>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink/80">Product Images</label>
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
