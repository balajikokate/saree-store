import { formatINR } from "../common/PriceTag";

const FREE_SHIPPING_THRESHOLD = 1999;
const SHIPPING_FEE = 49;

export default function CartSummary({ subtotal, children }) {
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  return (
    <div className="rounded-sm border border-ink/10 bg-white p-6 shadow-card">
      <h3 className="font-display text-lg text-ink">Order Summary</h3>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-ink/70">
          <dt>Subtotal</dt>
          <dd>{formatINR(subtotal)}</dd>
        </div>
        <div className="flex justify-between text-ink/70">
          <dt>Shipping</dt>
          <dd>{shippingFee === 0 ? "Free" : formatINR(shippingFee)}</dd>
        </div>
        {shippingFee > 0 && (
          <p className="text-xs text-emerald">
            Add {formatINR(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
          </p>
        )}
        <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-semibold text-ink">
          <dt>Total</dt>
          <dd>{formatINR(total)}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
