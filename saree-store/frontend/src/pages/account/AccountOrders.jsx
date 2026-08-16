import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { accountApi } from "../../services/api";
import { formatINR } from "../../components/common/PriceTag";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";

const STATUS_STYLES = {
  PENDING: "bg-blush text-ink/70",
  PAID: "bg-emerald/10 text-emerald",
  FAILED: "bg-maroon/10 text-maroon",
  SHIPPED: "bg-gold/20 text-gold-dark",
  DELIVERED: "bg-emerald/10 text-emerald",
  CANCELLED: "bg-ink/10 text-ink/60",
};

export default function AccountOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountApi.orders
      .list()
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading your orders" />;

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Once you place an order, it'll show up here."
        actionLabel="Start Shopping"
        actionTo="/shop"
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="rounded-sm border border-ink/10 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-ink">{order.orderNumber}</p>
              <p className="text-xs text-ink/50">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status] || "bg-ink/10 text-ink/60"}`}>
              {order.status}
            </span>
          </div>

          <ul className="mt-4 space-y-1 border-t border-ink/10 pt-3 text-sm text-ink/70">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.productName} × {item.quantity}</span>
                <span>{formatINR(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3">
            <span className="text-sm font-semibold text-ink">Total: {formatINR(order.totalAmount)}</span>
            <div className="flex items-center gap-3">
              {(order.status === "PAID" || order.status === "SHIPPED" || order.status === "DELIVERED") && (
                <>
                  <a
                    href={accountApi.orders.invoiceUrl(order.orderNumber)}
                    className="text-sm font-medium text-maroon underline"
                  >
                    Invoice (PDF)
                  </a>
                  <Link to={`/order-success/${order.orderNumber}`} className="text-sm font-medium text-maroon underline">
                    View details
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
