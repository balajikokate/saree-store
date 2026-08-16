import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { adminStatsApi } from "../../services/adminApi";
import { formatINR } from "../../components/common/PriceTag";
import Loader from "../../components/common/Loader";

const STATUS_COLORS = {
  PENDING: "#C89B3C",
  PAID: "#1F4032",
  SHIPPED: "#6E1423",
  DELIVERED: "#2E5A46",
  CANCELLED: "#9CA3AF",
  FAILED: "#8C2233",
};

const STATUS_BADGE = {
  PENDING: "bg-gold-light/40 text-ink",
  PAID: "bg-emerald/10 text-emerald",
  SHIPPED: "bg-blush text-maroon",
  DELIVERED: "bg-emerald/20 text-emerald",
  CANCELLED: "bg-ink/10 text-ink/60",
  FAILED: "bg-maroon/10 text-maroon",
};

function shortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

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
    { label: "Total Products", value: stats.productCount, to: "/admin/products", icon: "box" },
    { label: "Paid Orders", value: stats.orderCount, to: "/admin/orders", icon: "cart" },
    { label: "Revenue (Paid)", value: formatINR(stats.totalRevenue), to: "/admin/orders", icon: "rupee" },
    {
      label: "Low Stock (≤5)",
      value: stats.lowStockCount,
      to: "/admin/products",
      warn: stats.lowStockCount > 0,
      icon: "alert",
    },
  ];

  const chartData = stats.revenueTrend.map((d) => ({ ...d, label: shortDate(d.date) }));
  const hasRevenueData = chartData.some((d) => d.total > 0);
  const hasStatusData = stats.statusBreakdown.length > 0;
  const hasTopProducts = stats.topProducts.length > 0;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/60">A quick look at how the store is doing.</p>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="group flex items-start gap-4 rounded-sm border border-ink/10 bg-white p-5 shadow-card transition-colors hover:border-maroon"
          >
            <span
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${
                c.warn ? "bg-maroon/10 text-maroon" : "bg-blush text-maroon"
              }`}
            >
              <StatIcon name={c.icon} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50">{c.label}</p>
              <p className={`mt-1 font-display text-2xl ${c.warn ? "text-maroon" : "text-ink"}`}>{c.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Revenue trend */}
        <div className="rounded-sm border border-ink/10 bg-white p-5 shadow-card lg:col-span-2">
          <h2 className="font-display text-base text-ink">Revenue — last 14 days</h2>
          {hasRevenueData ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6E1423" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6E1423" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8a7d78" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#8a7d78" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip
                    formatter={(value) => [formatINR(value), "Revenue"]}
                    contentStyle={{ borderRadius: 4, borderColor: "#e5ddd6", fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#6E1423" strokeWidth={2} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState label="No paid orders in the last 14 days yet." />
          )}
        </div>

        {/* Order status breakdown */}
        <div className="rounded-sm border border-ink/10 bg-white p-5 shadow-card">
          <h2 className="font-display text-base text-ink">Orders by status</h2>
          {hasStatusData ? (
            <>
              <div className="mt-2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {stats.statusBreakdown.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#ccc"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 4, borderColor: "#e5ddd6", fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {stats.statusBreakdown.map((s) => (
                  <span key={s.status} className="flex items-center gap-1.5 text-xs text-ink/60">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[s.status] || "#ccc" }}
                    />
                    {s.status} ({s.count})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <EmptyChartState label="No orders yet." />
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Top products */}
        <div className="rounded-sm border border-ink/10 bg-white p-5 shadow-card lg:col-span-2">
          <h2 className="font-display text-base text-ink">Best-selling sarees</h2>
          {hasTopProducts ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#8a7d78" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 11, fill: "#2A1E1B" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v.length > 20 ? v.slice(0, 20) + "…" : v)}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Units sold"]}
                    contentStyle={{ borderRadius: 4, borderColor: "#e5ddd6", fontSize: 13 }}
                  />
                  <Bar dataKey="quantitySold" fill="#C89B3C" radius={[0, 3, 3, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState label="No paid orders yet — sell your first saree to see this chart fill in." />
          )}
        </div>

        {/* Recent orders */}
        <div className="rounded-sm border border-ink/10 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base text-ink">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-medium text-maroon underline">
              View all
            </Link>
          </div>
          {stats.recentOrders.length > 0 ? (
            <ul className="mt-3 divide-y divide-ink/10">
              {stats.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-2 py-2.5 text-sm hover:text-maroon"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{o.customerName}</p>
                      <p className="text-xs text-ink/50">{shortDate(o.createdAt)}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="text-xs text-ink/70">{formatINR(o.totalAmount)}</span>
                      <span className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[o.status] || ""}`}>
                        {o.status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyChartState label="No orders yet." />
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
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

function EmptyChartState({ label }) {
  return (
    <div className="flex h-40 items-center justify-center text-center text-sm text-ink/40">
      {label}
    </div>
  );
}

function StatIcon({ name }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (name) {
    case "box":
      return (
        <svg {...common}>
          <path d="M21 8l-9-5-9 5 9 5 9-5z" strokeLinejoin="round" />
          <path d="M3 8v8l9 5 9-5V8M12 13v8" strokeLinejoin="round" />
        </svg>
      );
    case "cart":
      return (
        <svg {...common}>
          <path d="M3 3h2l2.4 12.2a2 2 0 002 1.8h8.2a2 2 0 002-1.7L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="21" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="18" cy="21" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "rupee":
      return (
        <svg {...common}>
          <path d="M7 4h10M7 9h10M7 4c4 0 6 2 6 4.5S11 13 7 13l7 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <path d="M12 3l9 16H3l9-16z" strokeLinejoin="round" />
          <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
