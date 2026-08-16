import { useEffect, useState } from "react";
import { adminCategoryApi } from "../../services/adminApi";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = () => {
    setLoading(true);
    adminCategoryApi
      .list()
      .then((res) => setCategories(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Enter a category name (at least 2 characters).");
      return;
    }
    setSaving(true);
    try {
      await adminCategoryApi.create(name.trim());
      setName("");
      fetchCategories();
    } catch (err) {
      setError(err.message || "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-ink">Categories</h1>
      <p className="mt-1 text-sm text-ink/60">
        Categories organize sarees on the storefront and determine which image folder uploads go into.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="categoryName" className="mb-1 block text-sm font-medium text-ink/80">
            New category name
          </label>
          <input
            id="categoryName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tussar Silk"
            className="input-field"
          />
        </div>
        <Button type="submit" isLoading={saving}>
          Add Category
        </Button>
      </form>

      {error && <p className="mt-3 rounded-sm bg-maroon/10 px-4 py-3 text-sm text-maroon">{error}</p>}

      {loading ? (
        <Loader label="Loading categories" />
      ) : (
        <div className="mt-6 overflow-hidden rounded-sm border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-blush/40 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-ink/50">{c.slug}</td>
                  <td className="px-4 py-3 text-ink/70">{c._count?.products ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
