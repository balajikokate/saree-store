import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { orderApi } from "../services/api";
import { formatINR } from "../components/common/PriceTag";
import Loader from "../components/common/Loader";

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    orderApi
      .getByNumber(orderNumber)
      .then((res) => active && setOrder(res.data))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [orderNumber]);

  if (loading) return <Loader label="Fetching your order" />;

  if (!order) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-display text-2xl">We couldn't find that order</p>
        <Link to="/shop" className="mt-4 inline-block text-maroon underline">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10 text-emerald">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-6 font-display text-3xl text-ink">
        {order.status === "PAID" ? "Order confirmed!" : "Order received"}
      </h1>
      <p className="mt-2 text-ink/60">
        Thank you, {order.customerName}. A confirmation has been sent to {order.email}.
      </p>

      <div className="mt-8 rounded-sm border border-ink/10 bg-white p-6 text-left shadow-card">
        <div className="flex justify-between text-sm">
          <span className="text-ink/50">Order Number</span>
          <span className="font-semibold text-ink">{order.orderNumber}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-ink/50">Status</span>
          <span className="font-semibold text-emerald">{order.status}</span>
        </div>
        <div className="mt-4 divide-y divide-ink/10 border-t border-ink/10">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-3 text-sm">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-t border-ink/10 pt-3 font-semibold text-ink">
          <span>Total Paid</span>
          <span>{formatINR(order.totalAmount)}</span>
        </div>
      </div>

      <Link to="/shop" className="btn-primary mt-8 inline-flex">
        Continue Shopping
      </Link>
      {(order.status === "PAID" || order.status === "SHIPPED" || order.status === "DELIVERED") && (
        <a
          href={orderApi.invoiceUrl(order.orderNumber)}
          className="btn-secondary mt-8 ml-3 inline-flex"
        >
          Download Invoice (PDF)
        </a>
      )}
    </div>
  );
}
