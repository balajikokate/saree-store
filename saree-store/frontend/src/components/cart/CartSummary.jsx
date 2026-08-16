import { formatINR } from "../common/PriceTag";
import { resolveImageUrl } from "../../utils/image";

const FREE_SHIPPING_THRESHOLD = 1999;
const SHIPPING_FEE = 49;

/**
 * items (optional): [{ productId, name, image, price, quantity }]
 * discountAmount / couponCode (optional): shown as a line item when a
 * coupon has been applied.
 * giftWrapFee (optional): shown as a line item when gift wrap is selected.
 * When provided, renders an itemized product list above the totals — used
 * on the Checkout page so the customer can see exactly what they're paying
 * for, whether that's their full cart or a single "Buy Now" item.
 */
export default function CartSummary({ subtotal, items, discountAmount = 0, couponCode, giftWrapFee = 0, children }) {
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const total = Math.max(subtotal + shippingFee + giftWrapFee - discountAmount, 0);

  return (
    <div className="rounded-sm border border-ink/10 bg-white p-6 shadow-card">
      <h3 className="font-display text-lg text-ink">Order Summary</h3>

      {items && items.length > 0 && (
        <ul className="mt-4 space-y-3 border-b border-ink/10 pb-4">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-3">
              {item.image && (
                <div className="h-14 w-11 flex-shrink-0 overflow-hidden rounded-sm bg-blush">
                  <img
                    src={resolveImageUrl(item.image)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex flex-1 items-start justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-ink/50">Qty {item.quantity}</p>
                </div>
                <span className="whitespace-nowrap font-medium text-ink">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-ink/70">
          <dt>Subtotal</dt>
          <dd>{formatINR(subtotal)}</dd>
        </div>
        <div className="flex justify-between text-ink/70">
          <dt>Shipping</dt>
          <dd>{shippingFee === 0 ? "Free" : formatINR(shippingFee)}</dd>
        </div>
        {giftWrapFee > 0 && (
          <div className="flex justify-between text-ink/70">
            <dt>Gift wrap</dt>
            <dd>{formatINR(giftWrapFee)}</dd>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald">
            <dt>Discount{couponCode ? ` (${couponCode})` : ""}</dt>
            <dd>-{formatINR(discountAmount)}</dd>
          </div>
        )}
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
