import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminProductApi } from "../../services/adminApi";
import { resolveImageUrl } from "../../utils/image";
import { formatINR } from "../../components/common/PriceTag";
import Loader from "../../components/common/Loader";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState("");

  const fetchProducts = (searchTerm = "") => {
    setLoading(true);
    adminProductApi
      .list({ search: searchTerm, limit: 100 })
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone (unless it has past orders, in which case it'll just be marked out of stock).`)) {
      return;
    }
    setDeletingId(product.id);
    setNotice("");
    try {
      const res = await adminProductApi.remove(product.id);
      if (res.data.softDeleted) {
        setNotice(res.data.message);
        fetchProducts(search);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
      }
    } catch (err) {
      setNotice(err.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Products</h1>
        <Link to="/admin/products/new" className="btn-primary">
          + Add New Saree
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or fabric…"
          className="input-field max-w-xs"
        />
        <button type="submit" className="btn-secondary">
          Search
        </button>
      </form>

      {notice && <p className="mt-4 rounded-sm bg-blush px-4 py-3 text-sm text-ink">{notice}</p>}

      {loading ? (
        <Loader label="Loading products" />
      ) : products.length === 0 ? (
        <p className="mt-10 text-sm text-ink/60">No products found.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-sm border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-blush/40 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="flex items-center gap-3 px-4 py-3">
                    <img
                      src={resolveImageUrl(p.images?.[0])}
                      alt=""
                      className="h-12 w-10 rounded-sm object-cover"
                    />
                    <span className="font-medium text-ink">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{p.category?.name}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {formatINR(p.discountPrice ?? p.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.stock === 0 ? "font-semibold text-maroon" : p.stock <= 5 ? "font-semibold text-gold-dark" : "text-ink/70"}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link to={`/admin/products/${p.id}`} className="text-maroon underline">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                        className="text-ink/60 underline hover:text-maroon disabled:opacity-50"
                      >
                        {deletingId === p.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
