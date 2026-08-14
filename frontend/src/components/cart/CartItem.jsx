import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { formatINR } from "../common/PriceTag";
import { resolveImageUrl } from "../../utils/image";

export default function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 border-b border-ink/10 py-5">
      <Link to={`/product/${item.slug}`} className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-sm bg-blush">
        <img src={resolveImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/product/${item.slug}`} className="font-display text-base text-ink hover:text-maroon">
            {item.name}
          </Link>
          <button
            onClick={() => removeItem(item.productId)}
            className="text-xs text-ink/50 hover:text-maroon"
            aria-label={`Remove ${item.name} from cart`}
          >
            Remove
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-sm border border-ink/15">
            <button
              className="px-3 py-1 text-ink/70 hover:text-maroon"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              className="px-3 py-1 text-ink/70 hover:text-maroon"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span className="font-semibold text-ink">{formatINR(item.price * item.quantity)}</span>
        </div>
      </div>
    </div>
  );
}
