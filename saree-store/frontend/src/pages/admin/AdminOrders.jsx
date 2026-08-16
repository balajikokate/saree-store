import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminOrderApi } from "../../services/adminApi";
import { formatINR } from "../../components/common/PriceTag";
import Loader from "../../components/common/Loader";

const STATUSES = ["", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"];

const statusColor = {
  PENDING: "bg-gold-light/40 text-ink",
  PAID: "bg-emerald/10 text-emerald",
  SHIPPED: "bg-blush text-maroon",
  DELIVERED: "bg-emerald/20 text-emerald",
  CANCELLED: "bg-ink/10 text-ink/60",
  FAILED: "bg-maroon/10 text-maroon",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminOrderApi
      .list({ status: status || undefined, limit: 100 })
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`rounded-sm px-3 py-1.5 text-xs font-semibold ${
              status === s ? "bg-maroon text-ivory" : "border border-ink/15 text-ink/60 hover:border-maroon"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader label="Loading orders" />
      ) : orders.length === 0 ? (
        <p className="mt-10 text-sm text-ink/60">No orders found.</p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="mt-6 space-y-3 sm:hidden">
            {orders.map((o) => (
              <div key={o.id} className="rounded-sm border border-ink/10 bg-white p-4">
                <Link to={`/admin/orders/${o.id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-maroon">{o.orderNumber}</p>
                      <p className="mt-0.5 truncate text-sm text-ink/70">{o.customerName}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-sm px-2 py-1 text-xs font-semibold ${statusColor[o.status] || ""}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-ink/60">
                    <span>{o.items.length} item{o.items.length === 1 ? "" : "s"}</span>
                    <span className="font-medium text-ink">{formatINR(o.totalAmount)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink/40">{new Date(o.createdAt).toLocaleDateString("en-IN")}</p>
                </Link>
                <a
                  href={adminOrderApi.invoiceUrl(o.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 inline-block text-xs font-medium text-maroon underline"
                >
                  Download Invoice
                </a>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="mt-6 hidden overflow-x-auto rounded-sm border border-ink/10 bg-white sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-blush/40 text-xs uppercase tracking-wide text-ink/60">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${o.id}`} className="font-medium text-maroon underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink/70">{o.customerName}</td>
                    <td className="px-4 py-3 text-ink/70">{o.items.length}</td>
                    <td className="px-4 py-3 text-ink/70">{formatINR(o.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${statusColor[o.status] || ""}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/50">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <a href={adminOrderApi.invoiceUrl(o.id)} className="text-xs font-medium text-maroon underline">
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
