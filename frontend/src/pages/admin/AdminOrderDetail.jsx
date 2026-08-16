import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminOrderApi } from "../../services/adminApi";
import { formatINR } from "../../components/common/PriceTag";
import Loader from "../../components/common/Loader";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminOrderApi
      .get(id)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    setUpdating(true);
    setError("");
    try {
      const res = await adminOrderApi.updateStatus(id, status);
      setOrder((o) => ({ ...o, status: res.data.status }));
    } catch (err) {
      setError(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loader label="Loading order" />;
  if (!order) return <p className="text-sm text-maroon">{error || "Order not found"}</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/admin/orders" className="text-sm text-maroon underline">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="break-all font-display text-xl text-ink sm:text-3xl">{order.orderNumber}</h1>
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={updating}
          className="input-field w-full sm:w-40"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-3 rounded-sm bg-maroon/10 px-4 py-3 text-sm text-maroon">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-sm border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Customer</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="Name" value={order.customerName} />
            <Row label="Email" value={order.email} />
            <Row label="Phone" value={order.phone} />
          </dl>
        </div>
        <div className="rounded-sm border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Shipping Address</h2>
          <p className="mt-3 text-sm text-ink/70">
            {order.addressLine}, {order.city}, {order.state} — {order.pincode}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Items</h2>
        <div className="mt-3 divide-y divide-ink/10">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
          <div className="flex justify-between text-ink/70">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink/70">
            <span>Shipping</span>
            <span>{Number(order.shippingFee) === 0 ? "Free" : formatINR(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between font-semibold text-ink">
            <span>Total</span>
            <span>{formatINR(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {order.razorpayPaymentId && (
        <p className="mt-4 text-xs text-ink/40">Razorpay Payment ID: {order.razorpayPaymentId}</p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="flex-shrink-0 text-ink/50">{label}</dt>
      <dd className="break-all text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
