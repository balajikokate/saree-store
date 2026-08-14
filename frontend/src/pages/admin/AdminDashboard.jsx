import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminStatsApi } from "../../services/adminApi";
import { formatINR } from "../../components/common/PriceTag";
import Loader from "../../components/common/Loader";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminStatsApi
      .get()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message || "Failed to load dashboard stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading dashboard" />;

  if (error || !stats) {
    return (
      <div>
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
        <p className="mt-4 rounded-sm bg-maroon/10 px-4 py-3 text-sm text-maroon">
          {error || "Couldn't load dashboard stats."}
        </p>
      </div>
    );
  }

  const cards = [
    { label: "Total Products", value: stats.productCount, to: "/admin/products" },
    { label: "Paid Orders", value: stats.orderCount, to: "/admin/orders" },
    { label: "Revenue (Paid Orders)", value: formatINR(stats.totalRevenue), to: "/admin/orders" },
    { label: "Low Stock (≤5 units)", value: stats.lowStockCount, to: "/admin/products", warn: stats.lowStockCount > 0 },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/60">A quick look at how the store is doing.</p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-sm border border-ink/10 bg-white p-5 shadow-card transition-colors hover:border-maroon"
          >
            <p className="text-xs uppercase tracking-wide text-ink/50">{c.label}</p>
            <p className={`mt-2 font-display text-3xl ${c.warn ? "text-maroon" : "text-ink"}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex gap-4">
        <Link to="/admin/products/new" className="btn-primary">
          + Add New Saree
        </Link>
        <Link to="/admin/orders" className="btn-secondary">
          View Orders
        </Link>
      </div>
    </div>
  );
}
